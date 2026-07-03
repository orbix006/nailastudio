import { createClient } from './client';

export async function logAdminAction(
  action: 'insert' | 'update' | 'delete' | 'login' | 'logout' | 'publish' | 'unpublish' | 'triage',
  tableName: string,
  recordId: string | null = null,
  metadata: Record<string, unknown> | null = null
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}
