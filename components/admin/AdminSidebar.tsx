'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scissors, Briefcase, Image, Sliders, Settings, Inbox, BarChart3, LogOut, Shield, Menu, X, User, Globe, MessageSquare, Mail, Calendar, FileText, Newspaper, FileSpreadsheet, Gift } from 'lucide-react';
import { signOutAction } from '@/lib/supabase/actions';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  admin: {
    fullName: string;
    email: string;
    role: string;
  };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Services Management',
      href: '/admin/services',
      icon: Scissors,
    },
    {
      name: 'Portfolio Management',
      href: '/admin/portfolio',
      icon: Briefcase,
    },
    {
      name: 'Media Library',
      href: '/admin/media',
      icon: Image,
    },
    {
      name: 'Website Content',
      href: '/admin/content',
      icon: Sliders,
    },
    {
      name: 'Website Settings',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      name: 'Leads Inbox',
      href: '/admin/leads',
      icon: Inbox,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      name: 'SEO Management',
      href: '/admin/seo',
      icon: Globe,
    },
    {
      name: 'AI Conversations',
      href: '/admin/chat',
      icon: MessageSquare,
    },
    {
      name: 'Email Templates',
      href: '/admin/emails',
      icon: Mail,
    },
    {
      name: 'Appointments',
      href: '/admin/appointments',
      icon: Calendar,
    },
    {
      name: 'Blog CMS',
      href: '/admin/blog',
      icon: FileText,
    },
    {
      name: 'Newsletter',
      href: '/admin/newsletter',
      icon: Newspaper,
    },
    {
      name: 'PDF Console',
      href: '/admin/pdf',
      icon: FileSpreadsheet,
    },
    {
      name: 'Marketing',
      href: '/admin/marketing',
      icon: Gift,
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-[#C9A86A]/10 bg-[#1A1A1A] px-4 text-white lg:hidden">
        <span className="font-serif text-xl font-bold tracking-wider text-[#C9A86A]">
          The Nailaa Studio
        </span>
        <button
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          aria-expanded={isOpen}
          className="rounded-md p-1.5 hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-[#C9A86A]"
        >
          {isOpen ? <X className="h-6 w-6 text-[#C9A86A]" /> : <Menu className="h-6 w-6 text-[#C9A86A]" />}
        </button>
      </header>

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-[#C9A86A]/10 bg-[#1A1A1A] text-white transition-all duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'
        )}
      >
        <div className="flex flex-col">
          {/* Header/Title */}
          <div className="flex h-20 items-center justify-center border-b border-[#C9A86A]/10 px-6">
            <Link href="/admin" className="text-center group">
              <span className="block font-serif text-2xl font-bold tracking-widest text-[#C9A86A] transition-colors group-hover:text-[#C9A86A]/85">
                The Nailaa Studio
              </span>
              <span className="block text-[10px] tracking-[0.35em] text-gray-500 uppercase mt-0.5 font-sans">
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-6 font-sans">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium tracking-wide transition-all group duration-200',
                    isActive
                      ? 'bg-[#C9A86A]/10 text-[#C9A86A] border-l-2 border-[#C9A86A]'
                      : 'text-gray-400 hover:bg-[#252525] hover:text-white border-l-2 border-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4 transition-transform duration-200 group-hover:scale-105', isActive ? 'text-[#C9A86A]' : 'text-gray-400 group-hover:text-white')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with admin profile info and logout */}
        <div className="border-t border-[#C9A86A]/10 p-4 font-sans bg-[#141414]">
          <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-[#1e1e1e]/60 border border-gray-800/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8A7052]/20 border border-[#8A7052]/40 text-[#C9A86A]">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{admin.fullName}</p>
              <p className="truncate text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#C9A86A]" /> {admin.role}
              </p>
            </div>
          </div>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center justify-center space-x-2 rounded-md bg-[#8A7052] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#8A7052]/90 focus:outline-none focus:ring-1 focus:ring-[#C9A86A] cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Overlay behind sidebar on mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
