import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PremiumDashboardClient } from './PremiumDashboardClient';

export const dynamic = 'force-dynamic';

interface ProfileInfo {
  full_name: string;
  role: string;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = (await adminClient
    .from('admin_profiles')
    .select('full_name, role')
    .eq('id', user?.id || '')
    .single()) as unknown as {
    data: ProfileInfo | null;
  };

  // Fetch inquiries
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select(`
      *,
      project_types:project_type_id ( title )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch recent audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      table_name,
      created_at,
      admin_profiles:admin_id ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch portfolio project views
  const { data: viewEvents } = await supabase
    .from('analytics_events')
    .select('entity_id')
    .eq('event_type', 'portfolio_view');

  // Fetch portfolio titles
  const { data: portfolioProjects } = await supabase
    .from('portfolio_projects')
    .select('id, title, slug')
    .is('deleted_at', null);

  // Fetch website settings
  const { data: settings } = await supabase
    .from('website_settings')
    .select('company_name')
    .eq('id', true)
    .maybeSingle();

  // Handle array relation joins mappings safely
  const formattedAuditLogs = ((auditLogs || []) as unknown[]).map((row) => {
    const item = row as {
      id: string;
      action: string;
      table_name: string;
      created_at: string;
      admin_profiles: { full_name: string }[] | { full_name: string } | null;
    };
    const p = Array.isArray(item.admin_profiles)
      ? item.admin_profiles[0]
      : item.admin_profiles;
    return {
      id: item.id,
      action: item.action,
      table_name: item.table_name,
      created_at: item.created_at,
      admin_profiles: p ? { full_name: p.full_name } : null,
    };
  });

  // Safe cast variables for Client Component
  const safeInquiries = (inquiries || []).map(inq => {
    const item = inq as Record<string, unknown>;
    return {
      id: String(item.id || ''),
      name: String(item.name || ''),
      email: String(item.email || ''),
      phone_number: String(item.phone_number || ''),
      source: String(item.source || 'contact_form'),
      budget_range: item.budget_range ? String(item.budget_range) : null,
      status: (item.status || 'new') as 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed',
      is_read: Boolean(item.is_read),
      message: String(item.message || ''),
      created_at: String(item.created_at || ''),
      follow_up_date: item.follow_up_date ? String(item.follow_up_date) : null,
      internal_notes: item.internal_notes ? String(item.internal_notes) : null,
    };
  });

  const safeViewEvents = (viewEvents || []).map(e => {
    const item = e as Record<string, unknown>;
    return {
      entity_id: item.entity_id ? String(item.entity_id) : null,
    };
  });

  return (
    <PremiumDashboardClient
      userEmail={user?.email || ''}
      profile={profile}
      inquiries={safeInquiries}
      auditLogs={formattedAuditLogs}
      viewEvents={safeViewEvents}
      portfolioProjects={portfolioProjects || []}
      companyName={settings?.company_name || 'The Nailaa Studio'}
    />
  );
}
