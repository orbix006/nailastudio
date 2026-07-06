'use server';

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendEmailNotification } from './supabase/email-actions';

const getFilePath = () => path.join(process.cwd(), 'lib', 'newsletter-data.json');

export interface Subscriber {
  id: string;
  email: string;
  status: 'pending' | 'active';
  token: string;
  createdAt: string;
  verifiedAt: string | null;
}

export interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent';
  sentAt: string | null;
  recipientsCount: number;
  clicks: number;
  opens: number;
}

export interface NewsletterData {
  subscribers: Subscriber[];
  campaigns: Campaign[];
}

// Read data store
async function readData(): Promise<NewsletterData> {
  try {
    const file = await fs.readFile(getFilePath(), 'utf8');
    return JSON.parse(file);
  } catch {
    const initial: NewsletterData = { subscribers: [], campaigns: [] };
    await fs.writeFile(getFilePath(), JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

// Write data store
async function writeData(data: NewsletterData): Promise<void> {
  await fs.writeFile(getFilePath(), JSON.stringify(data, null, 2), 'utf8');
}

// Trigger Opt-In verification email
async function triggerVerificationEmail(sub: Subscriber) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/newsletter/verify?token=${sub.token}`;
  
  console.log(`[NEWSLETTER DOUBLE OPT-IN] Dispatching activation link: ${verifyUrl}`);
  
  await sendEmailNotification('admin_notification', sub.email, {
    CLIENT_EMAIL: sub.email,
    CLIENT_NAME: 'Subscriber',
    MESSAGE: `Thank you for subscribing to The Nailaa Studio newsletter! To complete your activation and confirm your double opt-in registration, please click this link: ${verifyUrl}`
  });
}

// 1. Subscribe public intake action (Double Opt-In flow)
export async function subscribeNewsletterAction(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const data = await readData();
    const existing = data.subscribers.find(s => s.email === trimmedEmail);

    if (existing) {
      if (existing.status === 'active') {
        return { success: false, error: 'You are already subscribed to our newsletter.' };
      }
      // Re-trigger verification email
      await triggerVerificationEmail(existing);
      return { success: true };
    }

    const token = crypto.randomUUID();
    const newSub: Subscriber = {
      id: `sub-${Date.now()}`,
      email: trimmedEmail,
      status: 'pending',
      token,
      createdAt: new Date().toISOString(),
      verifiedAt: null
    };

    data.subscribers.push(newSub);
    await writeData(data);

    // Send opt-in email
    await triggerVerificationEmail(newSub);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Subscription request failed';
    return { success: false, error: msg };
  }
}

// 2. Token activation callback
export async function verifySubscriberTokenAction(token: string): Promise<{ success: boolean; email?: string }> {
  try {
    const data = await readData();
    const sub = data.subscribers.find(s => s.token === token);
    
    if (!sub) {
      return { success: false };
    }

    if (sub.status === 'active') {
      return { success: true, email: sub.email };
    }

    sub.status = 'active';
    sub.verifiedAt = new Date().toISOString();
    await writeData(data);
    
    return { success: true, email: sub.email };
  } catch {
    return { success: false };
  }
}

// 3. Admin: fetch subscribers
export async function getSubscribersAction(): Promise<Subscriber[]> {
  try {
    const data = await readData();
    return data.subscribers;
  } catch {
    return [];
  }
}

// 4. Admin: fetch campaigns
export async function getCampaignsAction(): Promise<Campaign[]> {
  try {
    const data = await readData();
    return data.campaigns;
  } catch {
    return [];
  }
}

// 5. Admin: save campaign parameters (Create/Update)
export async function saveCampaignAction(campaign: Campaign): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await readData();
    const idx = data.campaigns.findIndex(c => c.id === campaign.id);
    
    if (idx >= 0) {
      data.campaigns[idx] = campaign;
    } else {
      data.campaigns.push(campaign);
    }
    
    await writeData(data);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Save campaign operation failed';
    return { success: false, error: msg };
  }
}

// 6. Admin: dispatch campaign simulation
export async function sendCampaignAction(id: string): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  try {
    const data = await readData();
    const campaign = data.campaigns.find(c => c.id === id);
    if (!campaign) return { success: false, error: 'Campaign not found.' };

    const activeRecipients = data.subscribers.filter(s => s.status === 'active');
    if (activeRecipients.length === 0) {
      return { success: false, error: 'There are no active, verified subscribers in the database.' };
    }

    // Process dispatches
    for (const sub of activeRecipients) {
      await sendEmailNotification('admin_notification', sub.email, {
        CLIENT_EMAIL: sub.email,
        CLIENT_NAME: 'Nailaa Studio Subscriber',
        MESSAGE: `Subject: ${campaign.subject}\n\n${campaign.body}`
      });
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date().toISOString();
    campaign.recipientsCount = activeRecipients.length;
    // Simulate analytics conversion metrics
    campaign.opens = Math.round(activeRecipients.length * 0.45); // 45% opens
    campaign.clicks = Math.round(activeRecipients.length * 0.18); // 18% clicks
    
    await writeData(data);
    return { success: true, sentCount: activeRecipients.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Send campaign operation failed';
    return { success: false, error: msg };
  }
}
