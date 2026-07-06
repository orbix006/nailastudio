import { createClient } from '@/lib/supabase/server';
import { ChatLogsClient } from './ChatLogsClient';

export const dynamic = 'force-dynamic';

export interface ChatSession {
  id: string;
  created_at: string;
  session_id: string;
  property_type: string;
  space_size: string;
  budget: string;
  style_preference: string;
  timeline: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  messages: { sender: 'bot' | 'user'; text: string }[];
}

export default async function ChatLogsPage() {
  const supabase = await createClient();
  
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('event_type', 'popup_submit')
    .not('metadata', 'is', null)
    .order('created_at', { ascending: false });

  // Map to group and preserve the latest log update per session
  const sessionMap = new Map<string, ChatSession>();
  (events ?? []).forEach((event) => {
    interface MetadataShape {
      chat_session_id?: string;
      property_type?: string;
      space_size?: string;
      budget?: string;
      style_preference?: string;
      timeline?: string;
      client_name?: string;
      client_email?: string;
      client_phone?: string;
      messages?: { sender: 'bot' | 'user'; text: string }[];
    }
    const meta = event.metadata as MetadataShape | null;
    if (!meta || !meta.chat_session_id) return;
    const sessionId = meta.chat_session_id;
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        id: event.id,
        created_at: event.created_at,
        session_id: sessionId,
        property_type: meta.property_type || 'Unspecified',
        space_size: meta.space_size || 'Unspecified',
        budget: meta.budget || 'Unspecified',
        style_preference: meta.style_preference || 'Unspecified',
        timeline: meta.timeline || 'Unspecified',
        client_name: meta.client_name || 'Anonymous',
        client_email: meta.client_email || 'Unspecified',
        client_phone: meta.client_phone || 'Unspecified',
        messages: meta.messages || [],
      });
    }
  });

  const chatSessions = Array.from(sessionMap.values());

  return <ChatLogsClient initialSessions={chatSessions} />;
}
