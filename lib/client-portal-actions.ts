'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { ReferralRow, ReferralSettings, getMarketingDataAction } from './marketing-actions';

const getFilePath = () => path.join(process.cwd(), 'lib', 'client-portal-data.json');

export interface ClientProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface ClientProject {
  id: string;
  client_id: string;
  name: string;
  status: string;
  start_date: string;
  completion_date: string;
}

export interface ClientInvoice {
  id: string;
  client_id: string;
  amount: string;
  status: 'paid' | 'pending';
  invoice_date: string;
  due_date: string;
  download_url: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  name: string;
  type: string;
  url: string;
  size: string;
}

export interface ClientProgress {
  id: string;
  client_id: string;
  phase_name: string;
  status: 'completed' | 'in_progress' | 'pending';
  updated_at: string;
}

export interface ClientMessage {
  id: string;
  client_id: string;
  sender: 'client' | 'admin';
  message: string;
  timestamp: string;
}

export interface ClientMeetingNote {
  id: string;
  client_id: string;
  title: string;
  date: string;
  notes: string;
}

export interface ProjectStages {
  design_status: 'completed' | 'in_progress' | 'pending';
  design_notes: string;
  construction_status: 'completed' | 'in_progress' | 'pending';
  construction_notes: string;
  updated_at: string;
}

export interface ChecklistTask {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface TimelineMilestone {
  date: string;
  title: string;
  notes: string;
}

export interface ProgressImage {
  id: string;
  title: string;
  url: string;
  date: string;
}

export interface ClientPortalData {
  profile: ClientProfile;
  projects: ClientProject[];
  invoices: ClientInvoice[];
  documents: ClientDocument[];
  progress: ClientProgress[];
  messages: ClientMessage[];
  meetingNotes: ClientMeetingNote[];
  progressPercent: number;
  stages: ProjectStages;
  checklistTasks: ChecklistTask[];
  timelineMilestones: TimelineMilestone[];
  progressImages: ProgressImage[];
  referrals: ReferralRow[];
  referralSettings: ReferralSettings;
}

export interface ClientStore {
  clients: (ClientProfile & { password: string })[];
  projects: ClientProject[];
  invoices: ClientInvoice[];
  documents: ClientDocument[];
  progress: ClientProgress[];
  messages: ClientMessage[];
  meeting_notes: ClientMeetingNote[];
  tracker_progress_percent: number;
  stages: ProjectStages;
  checklist_tasks: ChecklistTask[];
  timeline_milestones: TimelineMilestone[];
  progress_images: ProgressImage[];
}

// Read database
async function readStore(): Promise<ClientStore> {
  const file = await fs.readFile(getFilePath(), 'utf8');
  return JSON.parse(file);
}

// Write database
async function writeStore(data: ClientStore): Promise<void> {
  await fs.writeFile(getFilePath(), JSON.stringify(data, null, 2), 'utf8');
}

// 1. Client login authentication action
export async function clientPortalLoginAction(email: string, password: string): Promise<{ success: boolean; client?: ClientProfile; error?: string }> {
  try {
    const db = await readStore();
    const client = db.clients.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
    );

    if (!client) {
      return { success: false, error: 'Invalid email address or passcode credentials.' };
    }

    return {
      success: true,
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        phone: client.phone,
      }
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: msg };
  }
}

// 2. Fetch all client metadata
export async function getClientPortalDataAction(clientId: string): Promise<ClientPortalData | null> {
  try {
    const db = await readStore();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return null;

    const profile: ClientProfile = {
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
    };

    const projects = db.projects.filter((p) => p.client_id === clientId);
    const invoices = db.invoices.filter((i) => i.client_id === clientId);
    const documents = db.documents.filter((d) => d.client_id === clientId);
    const progress = db.progress.filter((p) => p.client_id === clientId);
    const messages = db.messages.filter((m) => m.client_id === clientId);
    const meetingNotes = db.meeting_notes.filter((m) => m.client_id === clientId);
    const marketingDb = await getMarketingDataAction();

    return {
      profile,
      projects,
      invoices,
      documents,
      progress,
      messages,
      meetingNotes,
      progressPercent: db.tracker_progress_percent || 0,
      stages: db.stages,
      checklistTasks: db.checklist_tasks || [],
      timelineMilestones: db.timeline_milestones || [],
      progressImages: db.progress_images || [],
      referrals: marketingDb.referrals.filter(r => r.referrerEmail.toLowerCase() === client.email.toLowerCase()),
      referralSettings: marketingDb.referralSettings,
    };
  } catch {
    return null;
  }
}

// 3. Client: Send message in-portal
export async function sendPortalMessageAction(clientId: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!text.trim()) return { success: false, error: 'Message content cannot be blank.' };

    const db = await readStore();
    const newMsg: ClientMessage = {
      id: `msg-${Date.now()}`,
      client_id: clientId,
      sender: 'client',
      message: text.trim(),
      timestamp: new Date().toISOString(),
    };

    db.messages.push(newMsg);
    await writeStore(db);
    
    revalidatePath('/portal');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Message transmission failed';
    return { success: false, error: msg };
  }
}
