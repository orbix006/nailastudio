'use client';

import * as React from 'react';
import { 
  Gift, Percent, Plus, Trash2, CheckCircle2, 
  AlertCircle, Download, ToggleLeft, ToggleRight, Loader2, Save 
} from 'lucide-react';
import { 
  MarketingData, CouponRow, 
  updateReferralSettingsAction, saveCouponAction, 
  deleteCouponAction, toggleCouponStatusAction, completeReferralAction 
} from '@/lib/marketing-actions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface MarketingCmsClientProps {
  initialData: MarketingData;
}

const DEFAULT_NEW_COUPON = (): CouponRow => ({
  id: `cpn-${Date.now()}`,
  code: '',
  type: 'percent',
  value: 10,
  maxUses: 100,
  currentUses: 0,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  isActive: true,
});

export function MarketingCmsClient({ initialData }: MarketingCmsClientProps) {
  const [data, setData] = React.useState<MarketingData>(initialData);
  const [activeTab, setActiveTab] = React.useState<'referrals' | 'coupons'>('referrals');

  // Coupon modal toggle
  const [couponModalOpen, setCouponModalOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<CouponRow | null>(null);

  // States
  const [loading, setLoading] = React.useState(false);
  const [rewardInput, setRewardInput] = React.useState(initialData.referralSettings.rewardAmount);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Toggle referral program settings
  const handleToggleReferralProgram = async (isEnabled: boolean) => {
    setLoading(true);
    const res = await updateReferralSettingsAction(isEnabled, rewardInput);
    setLoading(false);
    
    if (res.success) {
      setData(prev => ({
        ...prev,
        referralSettings: { ...prev.referralSettings, isEnabled },
      }));
      showToast('success', `Referral program ${isEnabled ? 'activated' : 'deactivated'}.`);
    } else {
      showToast('error', res.error || 'Failed to update referral program.');
    }
  };

  // 2. Save referral settings
  const handleSaveReferralSettings = async () => {
    setLoading(true);
    const res = await updateReferralSettingsAction(data.referralSettings.isEnabled, rewardInput);
    setLoading(false);

    if (res.success) {
      setData(prev => ({
        ...prev,
        referralSettings: { ...prev.referralSettings, rewardAmount: rewardInput },
      }));
      showToast('success', 'Referral settings saved.');
    } else {
      showToast('error', res.error || 'Failed to save settings.');
    }
  };

  // 3. Mark referral as completed
  const handleCompleteReferral = async (id: string) => {
    setLoading(true);
    const res = await completeReferralAction(id);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Referral marked as completed and reward disbursed.');
      setData(prev => {
        const updatedRefs = prev.referrals.map(r => {
          if (r.id === id) {
            return { ...r, status: 'completed' as const, rewardDisbursed: prev.referralSettings.rewardAmount };
          }
          return r;
        });
        return { ...prev, referrals: updatedRefs };
      });
    } else {
      showToast('error', res.error || 'Failed to update referral status.');
    }
  };

  // 4. Toggle coupon status
  const handleToggleCoupon = async (id: string) => {
    const res = await toggleCouponStatusAction(id);
    if (res.success) {
      setData(prev => {
        const updatedCoupons = prev.coupons.map(c => {
          if (c.id === id) {
            return { ...c, isActive: !c.isActive };
          }
          return c;
        });
        return { ...prev, coupons: updatedCoupons };
      });
      showToast('success', 'Coupon status updated.');
    } else {
      showToast('error', res.error || 'Failed to toggle status.');
    }
  };

  // 5. Open coupon modal for Edit / Create
  const handleOpenCouponModal = (coupon: CouponRow | null = null) => {
    setEditingCoupon(coupon || DEFAULT_NEW_COUPON());
    setCouponModalOpen(true);
  };

  // 6. Save Coupon
  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    setLoading(true);
    const res = await saveCouponAction(editingCoupon);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Coupon saved successfully.');
      setCouponModalOpen(false);
      
      setData(prev => {
        const index = prev.coupons.findIndex(c => c.id === editingCoupon.id);
        const updated = [...prev.coupons];
        if (index >= 0) {
          updated[index] = editingCoupon;
        } else {
          updated.push(editingCoupon);
        }
        return { ...prev, coupons: updated };
      });
    } else {
      showToast('error', res.error || 'Failed to save coupon.');
    }
  };

  // 7. Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    setLoading(true);
    const res = await deleteCouponAction(id);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Coupon deleted.');
      setData(prev => ({
        ...prev,
        coupons: prev.coupons.filter(c => c.id !== id),
      }));
    } else {
      showToast('error', res.error || 'Failed to delete coupon.');
    }
  };

  // 8. CSV Referrals Export helper
  const handleExportReferrals = () => {
    try {
      const headers = ['ID', 'Referrer Name', 'Referrer Email', 'Referral Code', 'Referee Name', 'Referee Email', 'Status', 'Reward Disbursed (INR)', 'Date'];
      const rows = data.referrals.map(r => [
        r.id,
        r.referrerName,
        r.referrerEmail,
        r.referralCode,
        r.refereeName,
        r.refereeEmail,
        r.status,
        r.rewardDisbursed,
        r.date
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('success', 'Referrals exported to CSV successfully.');
    } catch {
      showToast('error', 'Export failed.');
    }
  };

  // Referral analytics sums
  const analytics = React.useMemo(() => {
    const total = data.referrals.length;
    const completed = data.referrals.filter(r => r.status === 'completed').length;
    const conversion = total > 0 ? Math.round((completed / total) * 100) : 0;
    const disbursed = data.referrals.reduce((sum, r) => sum + r.rewardDisbursed, 0);

    return { total, completed, conversion, disbursed };
  }, [data.referrals]);

  return (
    <div className="space-y-6 font-sans text-white">
      
      {/* Toast message popup */}
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
            <Gift className="h-6 w-6 text-[#C9A86A]" /> Marketing & Referral Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage customer rewards campaigns, referral tracking, status triggers, and bookings discount coupons.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex select-none bg-[#1A1A1A] p-1 border border-gray-850 rounded-lg self-start sm:self-center">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'referrals' ? 'bg-[#C9A86A] text-[#111111]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Gift className="h-3.5 w-3.5" /> Referrals Program
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'coupons' ? 'bg-[#C9A86A] text-[#111111]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Percent className="h-3.5 w-3.5" /> Coupon Manager
          </button>
        </div>
      </div>

      {/* TAB 1: REFERRALS */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          
          {/* Analytics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Referrals', val: analytics.total },
              { label: 'Successful Referrals', val: analytics.completed },
              { label: 'Conversion Rate', val: `${analytics.conversion}%` },
              { label: 'Total Disbursed', val: `₹${analytics.disbursed.toLocaleString()}` },
            ].map((metric, idx) => (
              <Card key={idx} className="bg-[#1A1A1A] border-gray-800 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#C9A86A]/2 blur-xl rounded-full pointer-events-none" />
                <CardContent className="p-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-[#8A7052] font-semibold">{metric.label}</span>
                  <p className="text-2xl font-serif font-bold text-white mt-1">{metric.val}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Program config panel */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#C9A86A] uppercase tracking-wider">Referral Program Controls</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Activate referral settings and define credit value disbursements.</p>
              </div>

              {/* Toggle btn */}
              <button
                onClick={() => handleToggleReferralProgram(!data.referralSettings.isEnabled)}
                disabled={loading}
                className="text-gray-400 hover:text-[#C9A86A] transition-colors cursor-pointer"
                title={data.referralSettings.isEnabled ? 'Deactivate referral program' : 'Activate referral program'}
              >
                {data.referralSettings.isEnabled ? (
                  <ToggleRight className="h-9 w-9 text-[#C9A86A]" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-gray-700" />
                )}
              </button>
            </div>

            {/* Editable Reward Value */}
            <div className="flex items-end gap-4 max-w-sm">
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Reward Credit Value (₹)</label>
                <input
                  type="number"
                  value={rewardInput}
                  disabled={loading}
                  onChange={(e) => setRewardInput(Number(e.target.value))}
                  className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                />
              </div>

              <Button
                variant="accent"
                disabled={loading}
                className="h-10 cursor-pointer text-xs uppercase tracking-wider font-bold"
                onClick={handleSaveReferralSettings}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />} Save Settings
              </Button>
            </div>
          </div>

          {/* Referral Logs Table */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="text-sm font-semibold text-[#C9A86A] uppercase tracking-wider">Referral Tracking Logs</h3>
              
              {data.referrals.length > 0 && (
                <button
                  onClick={handleExportReferrals}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-[#C9A86A]/30 text-[9px] uppercase font-bold tracking-wider rounded text-gray-300 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              )}
            </div>

            {data.referrals.length === 0 ? (
              <p className="text-center text-xs text-gray-500 italic py-12">No referral logs registered yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-850 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-855 text-gray-400 text-[9px] uppercase tracking-wider font-semibold">
                      <th className="p-3">Referrer</th>
                      <th className="p-3">Referee</th>
                      <th className="p-3">Referral Code</th>
                      <th className="p-3">Reward Value</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-855 text-gray-300">
                    {data.referrals.map(ref => (
                      <tr key={ref.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-white">{ref.referrerName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{ref.referrerEmail}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{ref.refereeName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{ref.refereeEmail}</p>
                        </td>
                        <td className="p-3 font-mono text-[#C9A86A]">{ref.referralCode}</td>
                        <td className="p-3 font-mono">₹{ref.rewardDisbursed.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                            ref.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 font-mono">{ref.date}</td>
                        <td className="p-3 text-right">
                          {ref.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteReferral(ref.id)}
                              disabled={loading}
                              className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[9px] uppercase font-bold tracking-wider border border-emerald-500/20 transition-all cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          
          {/* Coupon codes dashboard log list */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="text-sm font-semibold text-[#C9A86A] uppercase tracking-wider">Coupon Code Manager</h3>
              
              <Button
                variant="accent"
                size="sm"
                className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-bold tracking-wider"
                onClick={() => handleOpenCouponModal(null)}
              >
                <Plus className="h-4 w-4" /> Add Coupon
              </Button>
            </div>

            {data.coupons.length === 0 ? (
              <p className="text-center text-xs text-gray-500 italic py-12">No coupon codes configured yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-855 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-855 text-gray-400 text-[9px] uppercase tracking-wider font-semibold">
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Discount Details</th>
                      <th className="p-3">Usage limit</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-855 text-gray-300">
                    {data.coupons.map(coupon => (
                      <tr key={coupon.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-3 font-mono font-bold text-white tracking-wide">{coupon.code}</td>
                        <td className="p-3 font-semibold text-white">
                          {coupon.type === 'percent' ? `${coupon.value}% Off` : `₹${coupon.value.toLocaleString()} Off`}
                        </td>
                        <td className="p-3 font-mono">
                          {coupon.currentUses} / {coupon.maxUses} Uses
                        </td>
                        <td className="p-3 font-mono text-gray-500">{coupon.expiresAt}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleCoupon(coupon.id)}
                            className="text-gray-400 hover:text-[#C9A86A] transition-colors cursor-pointer"
                            title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                          >
                            {coupon.isActive ? (
                              <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold bg-gray-800 text-gray-550 border border-gray-700">Deactivated</span>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-gray-500 hover:text-red-400 p-1.5 cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      {couponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-4">
            
            <div className="border-b border-gray-850 pb-3">
              <h3 className="font-serif text-base font-semibold text-[#C9A86A]">Configure Discount Coupon</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Input rules and usage threshold parameters for the booking discount.</p>
            </div>

            <form onSubmit={handleSaveCouponSubmit} className="space-y-4">
              
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                  placeholder="e.g. FESTIVE15"
                  className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Discount Type</label>
                  <select
                    value={editingCoupon.type}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as 'percent' | 'fixed' })}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* Value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Discount Value</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingCoupon.value}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Max Uses */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Maximum Uses</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingCoupon.maxUses}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: Number(e.target.value) })}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                {/* Expiry */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={editingCoupon.expiresAt}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCouponModalOpen(false)}
                  className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold cursor-pointer"
                >
                  Save Coupon
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
