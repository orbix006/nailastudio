'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea, Label } from '@/components/ui/FormControls';
import { 
  Inbox, Search, Filter, Download, Eye, Loader2, 
  Calendar, User, ArrowLeft, ArrowRight, Clock
} from 'lucide-react';
import { logAdminAction } from '@/lib/supabase/audit';

interface InquiryRow {
  id: string;
  source: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal';
  name: string;
  business_name: string | null;
  phone_number: string;
  email: string;
  project_type_id: string | null;
  budget_range: string | null;
  message: string;
  status: 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed';
  is_read: boolean;
  assigned_to: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  resolved_at: string | null;
  submitted_ip: string | null;
  created_at: string;
  updated_at: string;
  project_types?: { title: string } | null;
  admin_profiles?: { full_name: string } | null;
}

interface AdminProfile {
  id: string;
  full_name: string;
}



const STATUS_OPTIONS = [
  { label: 'New', value: 'new', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { label: 'Contacted', value: 'contacted', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { label: 'Qualified', value: 'read', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { label: 'Proposal Sent', value: 'in_progress', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { label: 'Won', value: 'resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { label: 'Lost', value: 'closed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const SOURCE_LABELS: Record<string, string> = {
  contact_form: 'Contact Form',
  consultation_popup: 'Consultation Popup',
  header_cta: 'Header CTA',
  service_modal: 'Service Modal',
};

const BUDGET_LABELS: Record<string, string> = {
  under_5l: 'Under 5 Lakhs',
  '5l_10l': '5L – 10L',
  '10l_25l': '10L – 25L',
  '25l_50l': '25L – 50L',
  '50l_plus': '50L+',
  not_specified: 'Not Specified',
};

export default function LeadsCRMPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);


  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all'); // all, read, unread

  // Detail Modal view states
  const [selectedLead, setSelectedLead] = useState<InquiryRow | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Edit lead details states
  const [editNotes, setEditNotes] = useState('');
  const [editAssignee, setEditAssignee] = useState<string>('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editStatus, setEditStatus] = useState<InquiryRow['status']>('new');
  
  interface AuditLogHistory {
    created_at: string;
    action: string;
    metadata: Record<string, unknown> | null;
    admin_profiles: { full_name: string } | null;
  }
  
  const [leadHistory, setLeadHistory] = useState<AuditLogHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Notes and Attachments parser
  const parseNotes = useCallback((rawNotes: string | null) => {
    if (!rawNotes) return { notes: '', attachments: [] };
    try {
      const parsed = JSON.parse(rawNotes);
      if (parsed && typeof parsed === 'object' && 'notes' in parsed) {
        return {
          notes: parsed.notes || '',
          attachments: (parsed.attachments || []) as { name: string; url: string }[],
        };
      }
    } catch {
      // Fallback
    }
    return { notes: rawNotes, attachments: [] as { name: string; url: string }[] };
  }, []);

  // Fetch lead audit logs timeline
  const fetchLeadHistory = useCallback(async (leadId: string) => {
    try {
      setLoadingHistory(true);
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          created_at,
          action,
          metadata,
          admin_profiles:admin_id ( full_name )
        `)
        .eq('table_name', 'inquiries')
        .eq('record_id', leadId)
        .order('created_at', { ascending: false });
      
      const formattedHistory: AuditLogHistory[] = ((data || []) as unknown[]).map((row) => {
        const item = row as {
          created_at: string;
          action: string;
          metadata: Record<string, unknown> | null;
          admin_profiles: { full_name: string }[] | { full_name: string } | null;
        };
        const profile = Array.isArray(item.admin_profiles)
          ? item.admin_profiles[0]
          : item.admin_profiles;
        return {
          created_at: item.created_at,
          action: item.action,
          metadata: item.metadata,
          admin_profiles: profile ? { full_name: profile.full_name } : null,
        };
      });
      setLeadHistory(formattedHistory);
    } catch (err) {
      console.error('Failed to fetch lead history timeline:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase]);

  // Handle uploading attachments
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLead) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedLead.id}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `leads/${fileName}`;

      // Upload file to Supabase storage media bucket
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Resolve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Save attachment in JSON inside internal_notes
      const currentData = parseNotes(selectedLead.internal_notes);
      const updatedAttachments = [
        ...currentData.attachments,
        { name: file.name, url: publicUrl },
      ];
      const updatedInternalNotes = JSON.stringify({
        notes: editNotes,
        attachments: updatedAttachments,
      });

      // Update Database
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({
          internal_notes: updatedInternalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast('Attachment uploaded successfully.', 'success');

      // Update selected lead state dynamically
      const newLead = { ...selectedLead, internal_notes: updatedInternalNotes };
      setSelectedLead(newLead);
      setInquiries(prev => prev.map(item => item.id === selectedLead.id ? newLead : item));
      
      await logAdminAction('update', 'inquiries', selectedLead.id, { attachment_added: file.name });
      fetchLeadHistory(selectedLead.id);
    } catch (err) {
      console.error('Failed to upload file attachment:', err);
      toast('Failed to upload file attachment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle deleting attachments
  const handleDeleteAttachment = async (index: number) => {
    if (!selectedLead) return;

    try {
      setSaving(true);
      const currentData = parseNotes(selectedLead.internal_notes);
      const updatedAttachments = currentData.attachments.filter((_: unknown, idx: number) => idx !== index);
      const updatedInternalNotes = JSON.stringify({
        notes: editNotes,
        attachments: updatedAttachments,
      });

      // Update Database
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({
          internal_notes: updatedInternalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast('Attachment deleted successfully.', 'success');

      // Update state
      const newLead = { ...selectedLead, internal_notes: updatedInternalNotes };
      setSelectedLead(newLead);
      setInquiries(prev => prev.map(item => item.id === selectedLead.id ? newLead : item));
      
      await logAdminAction('update', 'inquiries', selectedLead.id, { attachment_deleted: true });
      fetchLeadHistory(selectedLead.id);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      toast('Failed to delete attachment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Load resources
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load Inquiries
      const { data: inquiriesData, error: inquiriesErr } = await supabase
        .from('inquiries')
        .select(`
          *,
          project_types:project_type_id ( title ),
          admin_profiles:assigned_to ( full_name )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (inquiriesErr) throw inquiriesErr;
      setInquiries(inquiriesData || []);

      // Load admin profiles (fallbacks to empty array if table doesn't exist yet)
      const { data: adminsData } = await supabase
        .from('admin_profiles')
        .select('id, full_name')
        .is('deleted_at', null);
      
      setAdmins(adminsData || []);



    } catch (err) {
      console.error('Failed to load inquiries CRM dataset:', err);
      toast('Failed to load leads inbox from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Operations
  const handleOpenLead = (lead: InquiryRow) => {
    setSelectedLead(lead);
    const parsed = parseNotes(lead.internal_notes);
    setEditNotes(parsed.notes);
    setEditAssignee(lead.assigned_to || '');
    setEditFollowUpDate(lead.follow_up_date || '');
    setEditStatus(lead.status || 'new');
    setDetailModalOpen(true);
    
    fetchLeadHistory(lead.id);

    // Auto mark read if unread
    if (!lead.is_read) {
      handleMarkRead(lead.id, false);
    }
  };

  const handleMarkRead = async (leadId: string, alert = true) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          is_read: true,
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      await logAdminAction('update', 'inquiries', leadId, { is_read: true, status: 'read' });
      if (alert) toast('Lead marked as read.', 'success');
      
      // Update local state dynamically
      setInquiries(prev => prev.map(item => 
        item.id === leadId ? { ...item, is_read: true, status: 'read' } : item
      ));

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, is_read: true, status: 'read' } : null);
        setEditStatus('read');
      }

    } catch (err) {
      console.error(err);
      toast('Failed to mark lead as read.', 'error');
    }
  };

  const handleMarkResolved = async (leadId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('inquiries')
        .update({
          status: 'resolved',
          is_read: true,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      await logAdminAction('update', 'inquiries', leadId, { status: 'resolved', resolved_at: new Date().toISOString() });
      toast('Lead resolved successfully.', 'success');
      
      // Update local state
      setInquiries(prev => prev.map(item => 
        item.id === leadId ? { ...item, status: 'resolved', is_read: true, resolved_at: new Date().toISOString() } : item
      ));

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: 'resolved', is_read: true, resolved_at: new Date().toISOString() } : null);
        setEditStatus('resolved');
      }
      
    } catch (err) {
      console.error(err);
      toast('Failed to resolve lead.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      setSaving(true);
      const currentNotesData = parseNotes(selectedLead.internal_notes);
      const finalInternalNotes = JSON.stringify({
        notes: editNotes.trim() || null,
        attachments: currentNotesData.attachments
      });

      const { error } = await supabase
        .from('inquiries')
        .update({
          assigned_to: editAssignee || null,
          follow_up_date: editFollowUpDate || null,
          internal_notes: finalInternalNotes,
          status: editStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (error) throw error;
      await logAdminAction('triage', 'inquiries', selectedLead.id, {
        status: editStatus,
        assigned_to: editAssignee || null,
        follow_up_date: editFollowUpDate || null,
        internal_notes_updated: !!editNotes.trim()
      });
      toast('Lead changes saved successfully.', 'success');
      
      // Reload lists
      loadData();
      setDetailModalOpen(false);
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
      toast('Failed to save lead updates.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const dataToExport = filteredInquiries;
    if (dataToExport.length === 0) {
      toast('No inquiries match current filters to export.', 'error');
      return;
    }

    const headers = [
      'Submitted Date', 'Client Name', 'Business Name', 'Phone', 'Email', 
      'Source', 'Project Type', 'Budget', 'Status', 'Read', 'Assigned To', 'Follow Up', 'Client Message', 'Internal Notes'
    ];

    const rows = dataToExport.map(item => {
      const source = SOURCE_LABELS[item.source] || item.source;
      const type = item.project_types?.title || 'General Styling';
      const budget = BUDGET_LABELS[item.budget_range || ''] || 'Not Specified';
      const assignee = item.admin_profiles?.full_name || 'Unassigned';
      const parsedNotes = parseNotes(item.internal_notes);
      
      return [
        new Date(item.created_at).toLocaleString(),
        item.name,
        item.business_name || '',
        item.phone_number,
        item.email,
        source,
        type,
        budget,
        STATUS_OPTIONS.find(o => o.value === item.status)?.label || item.status,
        item.is_read ? 'Yes' : 'No',
        assignee,
        item.follow_up_date || '',
        item.message.replace(/"/g, '""'), // escape quotes
        parsedNotes.notes.replace(/"/g, '""')
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Lead sheet downloaded successfully.', 'success');
  };

  // Dynamic filter processing
  const filteredInquiries = inquiries.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.phone_number.includes(query) ||
      item.message.toLowerCase().includes(query) ||
      (item.business_name && item.business_name.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
    
    const matchesAssignee = 
      assigneeFilter === 'all' 
        ? true 
        : assigneeFilter === 'unassigned' 
          ? !item.assigned_to 
          : item.assigned_to === assigneeFilter;

    const matchesRead = 
      readFilter === 'all' 
        ? true 
        : readFilter === 'read' 
          ? item.is_read 
          : !item.is_read;

    return matchesSearch && matchesStatus && matchesSource && matchesAssignee && matchesRead;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics counters
  const totalCount = inquiries.length;
  const newCount = inquiries.filter(i => !i.is_read).length;
  const activeCount = inquiries.filter(i => i.status === 'in_progress' || i.status === 'contacted').length;
  const resolvedCount = inquiries.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> CRM Pipeline
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            Leads CRM Inbox
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Manage, assign, update follow-up schedules, and review inquiry timelines.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-gray-800 hover:border-[#C9A86A]/30 text-xs self-start sm:self-center cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV Sheet
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-550">Total Inquiries</span>
          <p className="font-serif text-2xl font-bold mt-1 text-white">{totalCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A] relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Unread / New</span>
          <p className="font-serif text-2xl font-bold mt-1 text-blue-400">{newCount}</p>
          {newCount > 0 && <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />}
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400">Active Pipeline</span>
          <p className="font-serif text-2xl font-bold mt-1 text-orange-400">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Resolved Leads</span>
          <p className="font-serif text-2xl font-bold mt-1 text-emerald-400">{resolvedCount}</p>
        </div>
      </div>

      {/* Search & Filtering Panel */}
      <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A86A]">
          <Filter className="h-4 w-4" /> Filters & Keyword search
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Keyword Search */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              aria-label="Search leads by keyword"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            aria-label="Filter leads by pipeline status"
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2 py-2 rounded border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Pipeline Stages</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            aria-label="Filter leads by lead source"
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2 py-2 rounded border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Lead Sources</option>
            <option value="contact_form">Contact Form</option>
            <option value="consultation_popup">Consultation Popup</option>
            <option value="header_cta">Header CTA</option>
            <option value="service_modal">Service Modal</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            aria-label="Filter leads by assigned admin"
            onChange={(e) => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2 py-2 rounded border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {admins.map(admin => <option key={admin.id} value={admin.id}>{admin.full_name}</option>)}
          </select>

          {/* Read filter */}
          <select
            value={readFilter}
            aria-label="Filter leads by read status"
            onChange={(e) => { setReadFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2 py-2 rounded border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Read Statuses</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* CRM leads listing */}
      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                <th scope="col" className="p-4">Lead Name</th>
                <th scope="col" className="p-4">Contact Info</th>
                <th scope="col" className="p-4">Source</th>
                <th scope="col" className="p-4">Assignee</th>
                <th scope="col" className="p-4">Follow Up</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-500 font-sans">
                    <Loader2 className="h-6 w-6 animate-spin text-[#C9A86A] mx-auto mb-2" />
                    Connecting Leads Pipeline...
                  </td>
                </tr>
              ) : paginatedInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 font-sans italic">
                    No inquiries match current search criteria.
                  </td>
                </tr>
              ) : (
                paginatedInquiries.map((lead) => {
                  const statusOpt = STATUS_OPTIONS.find(o => o.value === lead.status) || STATUS_OPTIONS[0];
                  const sourceLabel = SOURCE_LABELS[lead.source] || lead.source;
                  const assigneeName = lead.admin_profiles?.full_name || 'Unassigned';
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-gray-900/30 transition-colors ${!lead.is_read ? 'bg-blue-500/[0.02]' : ''}`}
                    >
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {!lead.is_read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                          {lead.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300">{lead.email}</p>
                        <p className="text-gray-550 text-[10px] mt-0.5">{lead.phone_number}</p>
                      </td>
                      <td className="p-4 text-gray-400">{sourceLabel}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-gray-400">
                          <User className="h-3 w-3 text-gray-600" /> {assigneeName}
                        </span>
                      </td>
                      <td className="p-4">
                        {lead.follow_up_date ? (
                          <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                            <Calendar className="h-3 w-3" /> {new Date(lead.follow_up_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusOpt.color}`}>
                          {statusOpt.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenLead(lead)}
                          aria-label={`View details and triage lead ${lead.name}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-800 hover:border-[#C9A86A]/30 bg-gray-900/40 text-[10px] text-[#C9A86A] uppercase font-bold tracking-wider hover:bg-gray-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                        >
                          <Eye className="h-3 w-3" aria-hidden="true" /> View Lead
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paging Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-900/10 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[11px] text-gray-500" aria-live="polite">
              Showing page {currentPage} of {totalPages} ({filteredInquiries.length} leads total)
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="p-1.5 rounded border border-gray-800 hover:border-[#C9A86A]/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded border border-gray-800 hover:border-[#C9A86A]/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
              >
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRM Details Modal */}
      {detailModalOpen && selectedLead && (
        <Modal
          isOpen={true}
          onClose={() => { setDetailModalOpen(false); setSelectedLead(null); }}
          title="Lead Information & Triage"
          className="max-w-4xl text-white border-gray-850 font-sans"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-3 max-h-[80vh] overflow-y-auto pr-1">
            
            {/* Left/Center Columns: Client submitted details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Block */}
              <div className="p-5 rounded-lg border border-gray-850 bg-[#111111] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#C9A86A] block">Lead Contact</span>
                  <h4 className="font-serif text-lg font-bold text-white mt-0.5">{selectedLead.name}</h4>
                  {selectedLead.business_name && (
                    <span className="text-[10px] text-gray-400">At {selectedLead.business_name}</span>
                  )}
                  
                  <div className="mt-3 space-y-1.5 text-xs">
                    <p className="text-gray-300"><span className="text-gray-500 font-medium">Email:</span> {selectedLead.email}</p>
                    <p className="text-gray-300"><span className="text-gray-500 font-medium">Phone:</span> {selectedLead.phone_number}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs sm:border-l sm:border-gray-850 sm:pl-4">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#C9A86A] block">Metadata</span>
                  <p className="text-gray-300"><span className="text-gray-500 font-medium">Source:</span> {SOURCE_LABELS[selectedLead.source] || selectedLead.source}</p>
                  <p className="text-gray-300"><span className="text-gray-500 font-medium">Project Type:</span> {selectedLead.project_types?.title || 'General Inquiry'}</p>
                  <p className="text-gray-300"><span className="text-gray-500 font-medium">Budget Range:</span> {BUDGET_LABELS[selectedLead.budget_range || ''] || 'Not Specified'}</p>
                  <p className="text-gray-500 text-[10px] mt-2">Submitted IP: {selectedLead.submitted_ip || 'Unavailable'}</p>
                </div>
              </div>

              {/* Message block */}
              <div className="p-5 rounded-lg border border-gray-850 bg-[#111111] space-y-2">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#C9A86A] block">Client Message</span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.message}
                </p>
              </div>

              {/* Attachments Block */}
              <div className="p-5 rounded-lg border border-gray-850 bg-[#111111] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#C9A86A] block">Lead Attachments</span>
                  <label className="px-2.5 py-1 rounded bg-[#C9A86A]/10 text-[#C9A86A] hover:bg-[#C9A86A]/20 cursor-pointer text-[10px] uppercase font-semibold transition-all">
                    Upload Attachment
                    <input
                      type="file"
                      onChange={handleUploadAttachment}
                      className="hidden"
                    />
                  </label>
                </div>

                {parseNotes(selectedLead.internal_notes).attachments.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No document attachments uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {parseNotes(selectedLead.internal_notes).attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded bg-[#161616] border border-gray-850 text-xs animate-fade-in">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C9A86A] hover:text-[#C9A86A]/80 underline truncate pr-4 font-medium"
                        >
                          {file.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(i)}
                          className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CRM Dynamic Timeline */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] block">Lead History Timeline</span>
                
                {loadingHistory ? (
                  <div className="flex items-center space-x-2 py-4 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C9A86A]" />
                    <span>Loading logs trail...</span>
                  </div>
                ) : leadHistory.length === 0 ? (
                  <div className="relative border-l border-gray-800 ml-3 pl-6 space-y-5 py-2 text-xs text-gray-500">
                    <div className="relative animate-fade-in">
                      <span className="absolute -left-[30px] top-0 flex h-4 w-4 rounded-full bg-blue-900 border border-blue-500 items-center justify-center">
                        <Inbox className="h-2 w-2 text-blue-400" />
                      </span>
                      <p className="text-xs text-white font-semibold">Lead Created</p>
                      <p className="text-[10px] text-gray-550 mt-0.5">Inquiry submitted from {SOURCE_LABELS[selectedLead.source] || selectedLead.source}.</p>
                      <span className="text-[9px] text-gray-600 block mt-0.5">{new Date(selectedLead.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-l border-gray-800 ml-3 pl-6 space-y-5 py-2">
                    {leadHistory.map((item, index) => {
                      const adminName = item.admin_profiles?.full_name || 'Staff User';
                      let eventTitle = 'CRM Update';
                      let description = `Pipeline log action: ${item.action}`;
                      
                      if (item.action === 'insert') {
                        eventTitle = 'Lead Initiated';
                        description = `New inquiry arrived from ${SOURCE_LABELS[selectedLead.source] || selectedLead.source}.`;
                      } else if (item.action === 'triage') {
                        eventTitle = 'Lead Triaged';
                        const meta = item.metadata || {};
                        const statusLabel = STATUS_OPTIONS.find(o => o.value === meta.status)?.label || meta.status || '';
                        description = `Triage values updated: status is now ${statusLabel}.`;
                      } else if (item.metadata?.attachment_added) {
                        eventTitle = 'Attachment Uploaded';
                        description = `Added document: ${item.metadata.attachment_added}`;
                      } else if (item.metadata?.attachment_deleted) {
                        eventTitle = 'Attachment Deleted';
                        description = 'An attachment was removed.';
                      }

                      return (
                        <div key={index} className="relative animate-fade-in">
                          <span className="absolute -left-[30px] top-0 flex h-4 w-4 rounded-full bg-indigo-950 border border-indigo-500 items-center justify-center">
                            <Clock className="h-2 w-2 text-indigo-400" />
                          </span>
                          <p className="text-xs text-white font-semibold">{eventTitle}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
                          <span className="text-[9px] text-gray-600 block mt-1">By {adminName} • {new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: CRM Update details form */}
            <form onSubmit={handleSaveDetails} className="lg:col-span-1 p-5 rounded-lg border border-gray-800 bg-[#1A1A1A] space-y-6 h-fit">
              <h4 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-800 pb-2.5">
                Triage Actions
              </h4>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="triage-status">Pipeline Status</Label>
                <select
                  id="triage-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as InquiryRow['status'])}
                  className="w-full rounded border border-gray-800 bg-[#111111] p-2 text-xs text-white outline-none focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Assign Admin */}
              <div className="space-y-1.5">
                <Label htmlFor="triage-assignee">Assign Owner</Label>
                <select
                  id="triage-assignee"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full rounded border border-gray-800 bg-[#111111] p-2 text-xs text-white outline-none focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
                >
                  <option value="">Unassigned</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Follow Up Date picker */}
              <div className="space-y-1.5">
                <Label htmlFor="triage-follow-up">Follow Up Date</Label>
                <input
                  id="triage-follow-up"
                  type="date"
                  value={editFollowUpDate}
                  onChange={(e) => setEditFollowUpDate(e.target.value)}
                  className="w-full rounded border border-gray-800 bg-[#111111] p-2 text-xs text-white outline-none focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <Label>Internal Staff Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Record callback attempts, project scopes, style logs..."
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-800/60">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold w-full"
                >
                  {saving ? 'Saving...' : 'Save Updates'}
                </Button>

                {selectedLead.status !== 'resolved' && (
                  <Button
                    type="button"
                    onClick={() => handleMarkResolved(selectedLead.id)}
                    disabled={saving}
                    variant="outline"
                    className="border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 w-full cursor-pointer"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            </form>

          </div>
        </Modal>
      )}
    </div>
  );
}
