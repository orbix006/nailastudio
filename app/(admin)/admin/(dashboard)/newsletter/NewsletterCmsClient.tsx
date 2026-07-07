'use client';

import * as React from 'react';
import { 
  Newspaper, Users, Mail, Download, Send, CheckCircle2, 
  AlertCircle, BarChart3, ArrowUpRight, Search, Save, Plus, Clock 
} from 'lucide-react';
import { Subscriber, Campaign, saveCampaignAction, sendCampaignAction } from '@/lib/newsletter-actions';
import { Button } from '@/components/ui/Button';

interface NewsletterCmsClientProps {
  initialSubscribers: Subscriber[];
  initialCampaigns: Campaign[];
}

const DEFAULT_NEW_CAMPAIGN = (): Campaign => ({
  id: `campaign-${Date.now()}`,
  subject: 'Bespoke Styling Updates: Autumn Palette',
  body: 'Greetings from The Nailaa Studio,\n\nWe are thrilled to unveil our new luxury autumn gel formulas and handcrafted overlays...',
  status: 'draft',
  sentAt: null,
  recipientsCount: 0,
  clicks: 0,
  opens: 0,
});

export function NewsletterCmsClient({ initialSubscribers, initialCampaigns }: NewsletterCmsClientProps) {
  const [subscribers] = React.useState<Subscriber[]>(initialSubscribers);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);

  // Tab controller: subscribers vs campaigns
  const [activeTab, setActiveTab] = React.useState<'subscribers' | 'campaigns'>('subscribers');

  // Search queries
  const [subscriberSearch, setSubscriberSearch] = React.useState('');
  const [subscriberStatus, setSubscriberStatus] = React.useState<string>('all'); // all, pending, active

  // Loader & feedback notifications
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter subscribers list
  const filteredSubscribers = React.useMemo(() => {
    const query = subscriberSearch.toLowerCase();
    return subscribers.filter(s => {
      const matchesSearch = s.email.toLowerCase().includes(query);
      const matchesStatus = subscriberStatus === 'all' || s.status === subscriberStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, subscriberSearch, subscriberStatus]);

  // Export subscribers to CSV file
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('error', 'There are no subscribers to export.');
      return;
    }

    try {
      const headers = ['ID', 'Email', 'Opt-In Status', 'Signup Date', 'Verified Date'];
      const rows = subscribers.map(s => [
        s.id,
        s.email,
        s.status,
        s.createdAt,
        s.verifiedAt || '—'
      ]);
      
      const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nailaa_subscribers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('success', 'Subscribers list exported successfully.');
    } catch {
      showToast('error', 'Failed to generate CSV export.');
    }
  };

  // Update locally selected campaign form parameters
  const updateCampaignValue = (updater: (prev: Campaign) => Campaign) => {
    if (!selectedCampaign) return;
    setSelectedCampaign(prev => prev ? updater(prev) : null);
  };

  // Save campaign draft
  const handleSaveCampaign = async () => {
    if (!selectedCampaign) return;
    setLoading(true);

    const res = await saveCampaignAction(selectedCampaign);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Campaign draft saved successfully.');
      setCampaigns(prev => {
        const idx = prev.findIndex(c => c.id === selectedCampaign.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = selectedCampaign;
          return next;
        }
        return [selectedCampaign, ...prev];
      });
    } else {
      showToast('error', res.error || 'Failed to save campaign draft.');
    }
  };

  // Send campaign dispatch simulation
  const handleSendCampaign = async () => {
    if (!selectedCampaign) return;
    const verifiedCount = subscribers.filter(s => s.status === 'active').length;
    
    if (verifiedCount === 0) {
      showToast('error', 'Cannot dispatch campaign. No active verified subscribers found.');
      return;
    }

    if (!window.confirm(`Are you sure you want to send this campaign to all ${verifiedCount} verified subscribers?`)) return;

    setLoading(true);
    // Save draft state first
    await saveCampaignAction(selectedCampaign);
    const res = await sendCampaignAction(selectedCampaign.id);
    setLoading(false);

    if (res.success) {
      showToast('success', `Campaign dispatched successfully to ${res.sentCount} subscribers.`);
      
      // Update local state list
      const updatedCampaign: Campaign = {
        ...selectedCampaign,
        status: 'sent',
        sentAt: new Date().toISOString(),
        recipientsCount: res.sentCount || 0,
        opens: Math.round((res.sentCount || 0) * 0.45),
        clicks: Math.round((res.sentCount || 0) * 0.18),
      };

      setSelectedCampaign(updatedCampaign);
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? updatedCampaign : c));
    } else {
      showToast('error', res.error || 'Failed to dispatch campaign.');
    }
  };

  const activeSubCount = subscribers.filter(s => s.status === 'active').length;
  const pendingSubCount = subscribers.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6 font-sans text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400'
            : 'bg-rose-950/90 border-rose-500 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-white flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-[#C9A86A]" /> Newsletter Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Monitor double opt-in subscribers, export CSV lists, write campaign newsletters, and view interaction analytics.
          </p>
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-t-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'subscribers'
              ? 'bg-[#1A1A1A] border-t border-x border-gray-800 text-[#C9A86A] -mb-2.5 pb-2.5 z-10'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="h-4 w-4" /> Subscribers ({subscribers.length})
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-t-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-[#1A1A1A] border-t border-x border-gray-800 text-[#C9A86A] -mb-2.5 pb-2.5 z-10'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Mail className="h-4 w-4" /> Campaigns ({campaigns.length})
        </button>
      </div>

      {/* TAB 1: Subscribers list view */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          
          {/* Analytics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-5 shadow-md flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Total Contacts</span>
                <h3 className="text-2xl font-serif font-bold mt-1 text-white">{subscribers.length}</h3>
              </div>
              <Users className="h-8 w-8 text-gray-700" />
            </div>

            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-5 shadow-md flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-500">Verified Active</span>
                <h3 className="text-2xl font-serif font-bold mt-1 text-emerald-400">{activeSubCount}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-950" />
            </div>

            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-5 shadow-md flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-500">Opt-In Pending</span>
                <h3 className="text-2xl font-serif font-bold mt-1 text-amber-400">{pendingSubCount}</h3>
              </div>
              <Clock className="h-8 w-8 text-amber-950" />
            </div>
          </div>

          {/* Table list controls */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              <div className="flex flex-1 gap-3 max-w-md">
                {/* Search */}
                <div className="relative flex-1 flex items-center bg-gray-900 border border-gray-800 rounded-lg">
                  <Search className="h-4 w-4 text-gray-550 ml-3" />
                  <input
                    type="text"
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    placeholder="Search by email..."
                    className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-gray-600 outline-none"
                  />
                </div>

                {/* Filter */}
                <select
                  value={subscriberStatus}
                  onChange={(e) => setSubscriberStatus(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Export */}
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" /> Export CSV List
              </Button>

            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-850 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-850 text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Double Opt-In Status</th>
                    <th className="p-3">Signup Date</th>
                    <th className="p-3">Verified Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-550 italic">No matching subscribers in registry.</td>
                    </tr>
                  ) : (
                    filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-3 font-medium text-white">{sub.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                            sub.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                          }`}>
                            {sub.status === 'active' ? 'active / verified' : 'pending activation'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 font-mono">{new Date(sub.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-gray-500 font-mono">
                          {sub.verifiedAt ? new Date(sub.verifiedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Campaigns editor view */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: campaigns list */}
          <div className="lg:col-span-4 bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-850 pb-2.5">
              <h3 className="font-serif text-sm font-semibold text-[#C9A86A]">Created Campaigns</h3>
              <button
                onClick={() => setSelectedCampaign(DEFAULT_NEW_CAMPAIGN())}
                className="p-1 rounded bg-[#C9A86A]/10 text-[#C9A86A] hover:bg-[#C9A86A]/20 transition-all cursor-pointer"
                title="Create New Campaign"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <p className="text-center text-xs text-gray-550 italic py-8">No campaigns created.</p>
              ) : (
                campaigns.map(c => {
                  const isSelected = selectedCampaign?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCampaign({ ...c })}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#252525] border-[#C9A86A]/30 shadow-md'
                          : 'bg-[#111111] border-gray-850 hover:border-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                          c.status === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {c.status}
                        </span>
                        {c.sentAt && (
                          <span className="text-[8px] text-gray-550 font-mono">{new Date(c.sentAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate max-w-full">{c.subject}</h4>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Editor & Analytics */}
          <div className="lg:col-span-8">
            {!selectedCampaign ? (
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-12 text-center space-y-4 shadow-xl">
                <Mail className="h-10 w-10 text-gray-650 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No campaign selected</h3>
                <p className="text-xs text-gray-555 max-w-xs mx-auto">
                  Select a campaign draft to configure or click the &ldquo;+&rdquo; icon to start a new broadcast newsletter.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Form Editor */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-xl p-6 space-y-4">
                  <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5">
                    {selectedCampaign.status === 'sent' ? 'Broadcast Campaign Details' : 'Configure Campaign Broadcast'}
                  </h3>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Subject Line</label>
                    <input
                      type="text"
                      disabled={selectedCampaign.status === 'sent'}
                      value={selectedCampaign.subject}
                      onChange={(e) => updateCampaignValue(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] disabled:opacity-50"
                    />
                  </div>

                  {/* Body markup */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Newsletter Body (Rich Text / Plain Text)</label>
                    <textarea
                      rows={8}
                      disabled={selectedCampaign.status === 'sent'}
                      value={selectedCampaign.body}
                      onChange={(e) => updateCampaignValue(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-[#C9A86A] resize-y disabled:opacity-50"
                    />
                  </div>

                  {/* Action Footer if draft */}
                  {selectedCampaign.status === 'draft' && (
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={handleSaveCampaign}
                      >
                        <Save className="h-4 w-4" /> Save Draft
                      </Button>

                      <Button
                        variant="accent"
                        size="sm"
                        disabled={loading}
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={handleSendCampaign}
                      >
                        <Send className="h-4 w-4" /> Broadcast to Verified List
                      </Button>
                    </div>
                  )}
                </div>

                {/* Conversion metrics analytics panel (if sent) */}
                {selectedCampaign.status === 'sent' && (
                  <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-xl p-6 space-y-4">
                    <h3 className="font-serif text-sm font-semibold text-emerald-400 border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
                      <BarChart3 className="h-4.5 w-4.5" /> Campaign Performance Interaction Analytics
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      {/* Sent count */}
                      <div className="bg-[#111111] border border-gray-850 p-4 rounded-lg text-center">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Recipients Sent</span>
                        <h4 className="text-xl font-bold mt-1 text-white">{selectedCampaign.recipientsCount}</h4>
                      </div>

                      {/* Opens */}
                      <div className="bg-[#111111] border border-gray-850 p-4 rounded-lg text-center">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold">Email Opens</span>
                        <h4 className="text-xl font-bold mt-1 text-emerald-400">{selectedCampaign.opens}</h4>
                        <span className="text-[8px] text-gray-500 block mt-0.5">45% open rate</span>
                      </div>

                      {/* Clicks */}
                      <div className="bg-[#111111] border border-gray-850 p-4 rounded-lg text-center">
                        <span className="text-[9px] uppercase tracking-wider text-[#C9A86A] font-bold">Click-throughs</span>
                        <h4 className="text-xl font-bold mt-1 text-[#C9A86A]">{selectedCampaign.clicks}</h4>
                        <span className="text-[8px] text-gray-500 block mt-0.5">18% CTR</span>
                      </div>

                      {/* Impact rating */}
                      <div className="bg-[#111111] border border-gray-850 p-4 rounded-lg text-center flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold flex items-center justify-center gap-1">
                          Conversion <ArrowUpRight className="h-3 w-3" />
                        </span>
                        <h4 className="text-lg font-bold mt-1 text-indigo-400 uppercase tracking-widest">high</h4>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
