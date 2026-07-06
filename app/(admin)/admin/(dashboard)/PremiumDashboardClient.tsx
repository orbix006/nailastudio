'use client';

import * as React from 'react';
import { 
  Inbox, Shield, Calendar, DollarSign, TrendingUp, 
  BarChart3, Clock, Briefcase, MessageSquare, Eye 
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  admin_profiles?: { full_name: string } | null;
}

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  source: string;
  budget_range: string | null;
  status: 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed';
  is_read: boolean;
  message: string;
  created_at: string;
  follow_up_date: string | null;
  internal_notes: string | null;
}

interface ViewEventItem {
  entity_id: string | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
}

interface PremiumDashboardClientProps {
  userEmail: string;
  profile: { full_name: string; role: string } | null;
  inquiries: InquiryItem[];
  auditLogs: AuditLogItem[];
  viewEvents: ViewEventItem[];
  portfolioProjects: PortfolioItem[];
  companyName: string;
}

const BUDGET_VALUES: Record<string, number> = {
  under_5l: 4000,
  '5l_10l': 7500,
  '10l_25l': 17500,
  '25l_50l': 35000,
  '50l_plus': 65000,
  not_specified: 5000,
};


export function PremiumDashboardClient({
  userEmail,
  profile,
  inquiries,
  auditLogs,
  viewEvents,
  portfolioProjects,
  companyName,
}: PremiumDashboardClientProps) {
  
  // 1. Calculate Estimated Revenue (resolved/Won inquiries)
  const revenueEstimate = React.useMemo(() => {
    return inquiries
      .filter(inq => inq.status === 'resolved')
      .reduce((sum, inq) => {
        const range = inq.budget_range || 'not_specified';
        return sum + (BUDGET_VALUES[range] || 5000);
      }, 0);
  }, [inquiries]);

  // 2. Lead Funnel distribution
  const funnelData = React.useMemo(() => {
    const counts = { new: 0, contacted: 0, read: 0, in_progress: 0, resolved: 0 };
    inquiries.forEach(inq => {
      if (inq.status in counts) {
        counts[inq.status as keyof typeof counts]++;
      }
    });
    
    return [
      { name: 'New Inquiries', count: counts.new, color: 'bg-blue-500' },
      { name: 'Contacted', count: counts.contacted, color: 'bg-yellow-500' },
      { name: 'Qualified (Read)', count: counts.read, color: 'bg-indigo-500' },
      { name: 'Proposal Sent', count: counts.in_progress, color: 'bg-orange-500' },
      { name: 'Won (Resolved)', count: counts.resolved, color: 'bg-emerald-500' },
    ];
  }, [inquiries]);

  // 3. Monthly Growth Calculation (Last 6 Months)
  const growthData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const countsByMonth: Record<string, number> = {};
    
    // Initialize last 5 months
    const today = new Date();
    const monthsList: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      monthsList.push(label);
      countsByMonth[label] = 0;
    }

    inquiries.forEach(inq => {
      const createdDate = new Date(inq.created_at);
      const label = `${months[createdDate.getMonth()]} ${String(createdDate.getFullYear()).slice(-2)}`;
      if (label in countsByMonth) {
        countsByMonth[label]++;
      }
    });

    const counts = monthsList.map(m => countsByMonth[m]);
    const maxVal = Math.max(...counts, 1);

    return {
      labels: monthsList,
      points: counts.map(c => (c / maxVal) * 80), // map to height
      raw: counts,
    };
  }, [inquiries]);

  // 4. Upcoming Meetings (type: booking follow-up dates in future)
  const upcomingMeetings = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return inquiries
      .filter(inq => {
        if (!inq.follow_up_date || inq.follow_up_date < todayStr) return false;
        try {
          if (inq.internal_notes) {
            const parsed = JSON.parse(inq.internal_notes);
            return parsed && parsed.type === 'booking';
          }
        } catch {
          // ignore plain text notes
        }
        return false;
      })
      .map(inq => {
        const parsed = JSON.parse(inq.internal_notes!);
        return {
          id: inq.id,
          name: inq.name,
          date: inq.follow_up_date!,
          time: parsed.time as string,
          email: inq.email,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [inquiries]);

  // 5. Portfolio project view stats
  const popularProjects = React.useMemo(() => {
    const viewCounts: Record<string, number> = {};
    viewEvents.forEach(e => {
      if (e.entity_id) {
        viewCounts[e.entity_id] = (viewCounts[e.entity_id] || 0) + 1;
      }
    });

    return portfolioProjects
      .map(p => ({
        ...p,
        views: viewCounts[p.id] || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [portfolioProjects, viewEvents]);

  // 6. Recent unread messages
  const recentMessages = React.useMemo(() => {
    return inquiries.slice(0, 5);
  }, [inquiries]);

  // Basic counters
  const totalCount = inquiries.length;
  const unreadCount = inquiries.filter(i => !i.is_read).length;

  return (
    <div className="space-y-8 font-sans text-white">
      
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-xl border border-[#C9A86A]/10 bg-[#1A1A1A] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A86A]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] tracking-[0.2em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> System Curator Active
              </p>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
              Welcome back, {profile?.full_name || 'Admin Curator'}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Overviewing styling operations for {companyName}.
            </p>
          </div>
          
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-[10px] text-gray-550 uppercase tracking-widest">Active Account</p>
            <p className="text-sm font-medium text-white mt-0.5">{userEmail}</p>
            <p className="text-xs text-[#C9A86A] mt-0.5 capitalize">{profile?.role} Privilege</p>
          </div>
        </div>
      </div>

      {/* Top Cards metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Estimate card */}
        <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Revenue Estimate</span>
            <div className="p-2 bg-emerald-500/5 text-emerald-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-serif font-bold text-white">${revenueEstimate.toLocaleString()}</h3>
            <span className="text-[10px] text-gray-500 mt-1 block">Accumulated value from Won pipeline stages</span>
          </div>
        </div>

        {/* Lead Funnel rate card */}
        <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Funnel conversion</span>
            <div className="p-2 bg-indigo-500/5 text-indigo-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-serif font-bold text-white">
              {totalCount > 0 
                ? `${Math.round((inquiries.filter(i => i.status === 'resolved').length / totalCount) * 100)}%` 
                : '0%'
              }
            </h3>
            <span className="text-[10px] text-gray-500 mt-1 block">Ratio of won deals against total inquiries</span>
          </div>
        </div>

        {/* Upcoming appointments count */}
        <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Meetings</span>
            <div className="p-2 bg-amber-500/5 text-amber-400 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-serif font-bold text-white">{upcomingMeetings.length}</h3>
            <span className="text-[10px] text-gray-550 mt-1 block">Scheduled consultation slots pending</span>
          </div>
        </div>

        {/* Inbox count card */}
        <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Unread Messages</span>
            <div className="p-2 bg-rose-500/5 text-rose-400 rounded-lg">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-3xl font-serif font-bold text-white">{unreadCount}</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-[10px] text-rose-400 border border-rose-500/15 animate-pulse">
                Action Required
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Funnel Graph & Line Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lead Funnel display */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <BarChart3 className="h-4.5 w-4.5" /> Lead Funnel Pipeline
          </h3>
          <div className="space-y-3.5 pt-2">
            {funnelData.map((stage) => {
              const percentage = totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0;
              return (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-300">{stage.name}</span>
                    <span className="text-gray-400">{stage.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded bg-gray-900 overflow-hidden border border-gray-850">
                    <div
                      className={`h-full ${stage.color} rounded transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly growth inline chart */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5" /> Monthly Inquiries Growth
          </h3>
          
          <div className="h-[200px] flex items-end justify-between px-4 pt-6 border-b border-gray-850">
            {growthData.labels.map((mLabel, idx) => {
              const height = growthData.points[idx] || 0;
              return (
                <div key={mLabel} className="flex flex-col items-center space-y-3 w-1/5">
                  <span className="text-[10px] text-[#C9A86A] font-bold">{growthData.raw[idx]}</span>
                  <div
                    className="w-8 rounded-t bg-gradient-to-t from-[#8A7052] to-[#C9A86A] transition-all duration-700 shadow-[0_0_8px_rgba(201,168,106,0.15)]"
                    style={{ height: `${Math.max(height, 8)}px` }}
                  />
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{mLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Row 3: Activities list & Meetings timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Audit events */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <Clock className="h-4.5 w-4.5" /> Recent Curator Activities
          </h3>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-gray-550 italic py-6 text-center">No system operations tracked yet.</p>
          ) : (
            <div className="relative border-l border-gray-850 ml-3 pl-6 space-y-4 py-1.5 max-h-[300px] overflow-y-auto pr-1">
              {auditLogs.map((log) => {
                const adminUser = log.admin_profiles?.full_name || 'Staff curator';
                return (
                  <div key={log.id} className="relative text-xs">
                    <span className="absolute -left-[30px] top-0 flex h-4 w-4 rounded-full bg-indigo-950 border border-indigo-500 items-center justify-center">
                      <Clock className="h-2.5 w-2.5 text-indigo-400" />
                    </span>
                    <p className="text-white font-semibold capitalize">{log.action} Event</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Target Table: <span className="font-mono">{log.table_name}</span></p>
                    <span className="text-[9px] text-gray-600 block mt-1">By {adminUser} • {new Date(log.created_at).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming appointments list */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <Calendar className="h-4.5 w-4.5" /> Upcoming Styling Meetings
          </h3>

          {upcomingMeetings.length === 0 ? (
            <p className="text-xs text-gray-550 italic py-10 text-center">No upcoming appointments scheduled.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {upcomingMeetings.map((mtg) => (
                <div key={mtg.id} className="p-3 rounded-lg border border-gray-850 bg-[#111111] flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{mtg.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{mtg.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#C9A86A] font-mono block font-bold">{mtg.date}</span>
                    <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{mtg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Row 4: Popular projects views & New messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top projects page views */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <Briefcase className="h-4.5 w-4.5" /> Most Viewed Projects
          </h3>

          {popularProjects.length === 0 ? (
            <p className="text-xs text-gray-550 italic py-6 text-center">No project views logged yet.</p>
          ) : (
            <div className="space-y-3.5">
              {popularProjects.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center text-xs p-1 pb-2 border-b border-gray-850/40">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                    <Eye className="h-3 w-3 text-gray-550" /> {p.views} views
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Inbox previews */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
            <MessageSquare className="h-4.5 w-4.5" /> Recent Messages
          </h3>

          {recentMessages.length === 0 ? (
            <p className="text-xs text-gray-555 italic py-6 text-center">No message logs found.</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg border border-gray-850 bg-[#111111] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">{msg.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate font-light">
                    &ldquo;{msg.message}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
