// Admin Dashboard Stats Queries

import { createClient } from './server';

export interface AdminDashboardStats {
  total_services: number;
  total_portfolio_projects: number;
  total_testimonials: number;
  total_inquiries: number;
  unread_inquiries: number;
}

/** Fetch overall admin dashboard statistics from the admin_dashboard_stats view */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();
    if (error || !data) {
      console.error('Error fetching admin dashboard stats:', error);
      return null;
    }
    return data as AdminDashboardStats;
  } catch (err) {
    console.error('Unexpected error fetching admin dashboard stats:', err);
    return null;
  }
}

export interface MonthlyStat {
  period: string; // e.g., '2023-07'
  count: number;
}

/**
 * Fetch monthly visitor or lead counts from the analytics_entity_popularity view.
 * entityType should be 'service_view' for visitors or 'contact_form_submit'/'popup_submit' for leads.
 */
export async function getMonthlyStats(entityType: string, months: number = 12): Promise<MonthlyStat[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('analytics_entity_popularity')
      .select('entity_type, entity_id, event_count, last_event_at')
      .eq('entity_type', entityType)
      .order('last_event_at', { ascending: false })
      .limit(months);
    if (error || !data) {
      console.error('Error fetching monthly stats:', error);
      return [];
    }
    interface PopularityRow {
      entity_type: string | null;
      entity_id: string | null;
      event_count: number | string | null;
      last_event_at: string;
    }
    
    // Aggregate counts by month
    const map = new Map<string, number>();
    (data as unknown as PopularityRow[]).forEach((row) => {
      if (!row.last_event_at) return;
      const date = new Date(row.last_event_at);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      map.set(period, (map.get(period) || 0) + Number(row.event_count || 0));
    });
    const result: MonthlyStat[] = [];
    Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([period, count]) => result.push({ period, count }));
    return result;
  } catch (err) {
    console.error('Unexpected error fetching monthly stats:', err);
    return [];
  }
}
