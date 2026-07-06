'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { sendEmailNotification } from './supabase/email-actions';

const getFilePath = () => path.join(process.cwd(), 'lib', 'pdf-templates.json');

export interface DocumentLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface DocumentTemplate {
  id: string;
  type: 'invoice' | 'proposal' | 'quotation';
  clientName: string;
  clientEmail: string;
  docNumber: string;
  docDate: string;
  dueDate: string;
  subject: string;
  items: DocumentLineItem[];
  terms: string;
  brandColor: string;
  layout: 'classic' | 'modern' | 'minimalist';
}

// Read database
export async function getPdfTemplatesAction(): Promise<DocumentTemplate[]> {
  try {
    const file = await fs.readFile(getFilePath(), 'utf8');
    return JSON.parse(file);
  } catch (err) {
    console.error('Error reading PDF templates:', err);
    return [];
  }
}

// Save template
export async function savePdfTemplateAction(template: DocumentTemplate): Promise<{ success: boolean; error?: string }> {
  try {
    const templates = await getPdfTemplatesAction();
    const idx = templates.findIndex(t => t.id === template.id);

    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }

    await fs.writeFile(getFilePath(), JSON.stringify(templates, null, 2), 'utf8');
    revalidatePath('/admin/pdf');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save template';
    return { success: false, error: msg };
  }
}

// Email document notification
export async function sendPdfEmailAction(template: DocumentTemplate, emailAddress: string): Promise<{ success: boolean; error?: string }> {
  try {
    const totalAmount = template.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Construct message body
    const msgText = `Subject: ${template.subject} (${template.type.toUpperCase()})\n` +
      `Document Number: ${template.docNumber}\n` +
      `Date: ${template.docDate}\n` +
      `Recipient: ${template.clientName}\n\n` +
      `This is a notification that your Nailaa Studio ${template.type} has been dispatched. \n` +
      `Total Value: ₹${totalAmount.toLocaleString()}\n` +
      `Terms: ${template.terms}\n\n` +
      `You can preview and download this document from your Client Portal dashboard at any time.`;

    console.log(`[PDF DISPATCH] Simulating email delivery of ${template.type} to ${emailAddress}`);

    await sendEmailNotification('admin_notification', emailAddress, {
      CLIENT_EMAIL: emailAddress,
      CLIENT_NAME: template.clientName,
      MESSAGE: msgText
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Email dispatch failed';
    return { success: false, error: msg };
  }
}
