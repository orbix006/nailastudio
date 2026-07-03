import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDashboardStats } from '@/lib/supabase/admin-dashboard-queries';
import { Scissors, Briefcase, MessageSquare, Inbox, ArrowRight, Shield, Calendar, Sparkles } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: profile } = (await adminClient
    .from('admin_profiles')
    .select('full_name, role')
    .eq('id', user?.id || '')
    .single()) as unknown as {
    data: { full_name: string; role: string } | null;
  };

  const stats = await getAdminDashboardStats();

  const cards = [
    {
      title: 'Active Services',
      value: stats?.total_services ?? 0,
      icon: Scissors,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/5',
      borderColor: 'border-amber-400/10',
      link: '/admin/services',
      actionText: 'Manage Services',
    },
    {
      title: 'Portfolio Projects',
      value: stats?.total_portfolio_projects ?? 0,
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/5',
      borderColor: 'border-blue-400/10',
      link: '/admin/portfolio',
      actionText: 'View Portfolio',
    },
    {
      title: 'Client Reviews',
      value: stats?.total_testimonials ?? 0,
      icon: MessageSquare,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/5',
      borderColor: 'border-emerald-400/10',
      link: '#',
      actionText: 'View Reviews',
    },
    {
      title: 'Total Inquiries',
      value: stats?.total_inquiries ?? 0,
      unread: stats?.unread_inquiries ?? 0,
      icon: Inbox,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/5',
      borderColor: 'border-rose-400/10',
      link: '#',
      actionText: 'View Inquiries',
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-xl border border-[#C9A86A]/10 bg-[#1A1A1A] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A86A]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] tracking-[0.2em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Admin Session Active
              </p>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
              Welcome back, {profile?.full_name || 'Admin'}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Here is an overview of your studio&apos;s status and quick operations.
            </p>
          </div>
          
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Logged in as</p>
            <p className="text-sm font-medium text-white mt-0.5">{user?.email}</p>
            <p className="text-xs text-[#C9A86A] mt-0.5 capitalize">{profile?.role} privilege</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`flex flex-col justify-between p-6 rounded-xl border ${card.borderColor} ${card.bgColor} shadow-lg transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-white">
                    {card.value}
                  </span>
                  {card.unread !== undefined && card.unread > 0 && (
                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
                      {card.unread} unread
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/40">
                {card.link !== '#' ? (
                  <Link
                    href={card.link}
                    className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#C9A86A] transition-colors"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transform transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-600 cursor-not-allowed">
                    <span>{card.actionText}</span>
                    <span className="text-[9px] lowercase bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-gray-500 font-normal">
                      coming soon
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links & Info Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Services Operations */}
        <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl">
          <div className="flex items-center space-x-2.5 mb-4 border-b border-gray-800/60 pb-3">
            <div className="p-1.5 rounded bg-[#C9A86A]/10 text-[#C9A86A]">
              <Scissors className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-white">Services Operations</h3>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 font-light">
            Add new treatments, edit structural details, modify materials used, control client-facing layouts, or adjust client service highlight ordering.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/services/new"
              className="inline-flex items-center space-x-1.5 rounded bg-[#C9A86A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#111111] transition-all hover:bg-[#C9A86A]/90"
            >
              <span>Add New Service</span>
            </Link>
            <Link
              href="/admin/services"
              className="inline-flex items-center space-x-1.5 rounded border border-gray-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-[#252525] hover:text-white"
            >
              <span>Manage Services</span>
            </Link>
          </div>
        </div>

        {/* System Meta Info */}
        <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4 border-b border-gray-800/60 pb-3">
              <div className="p-1.5 rounded bg-[#8A7052]/10 text-[#8A7052]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white">System Information</h3>
            </div>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex justify-between py-1 border-b border-gray-850/30">
                <span>Supabase Connection</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Operational
                </span>
              </li>
              <li className="flex justify-between py-1 border-b border-gray-850/30">
                <span>Row Level Security</span>
                <span className="text-gray-300 font-mono">Enforced (RLS)</span>
              </li>
              <li className="flex justify-between py-1">
                <span>Audit Logs Tracker</span>
                <span className="text-[#C9A86A] font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Trigger Enabled
                </span>
              </li>
            </ul>
          </div>
          <div className="text-[10px] text-gray-500 mt-6 pt-4 border-t border-gray-800/40">
            Nailaa Studio v1.1.0 • Running Next.js 15
          </div>
        </div>
      </div>
    </div>
  );
}
