'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/FormControls';
import { MediaSelector } from '@/components/admin/MediaSelector';
import { Settings, Sliders, Palette, ShieldAlert, Loader2, Search } from 'lucide-react';
import { logAdminAction } from '@/lib/supabase/audit';

const FONT_OPTIONS = [
  { name: 'Playfair Display (Serif)', value: 'Playfair Display' },
  { name: 'Inter (Sans)', value: 'Inter' },
  { name: 'Roboto (Sans)', value: 'Roboto' },
  { name: 'Montserrat (Sans)', value: 'Montserrat' },
  { name: 'Outfit (Modern)', value: 'Outfit' },
  { name: 'Lora (Classic)', value: 'Lora' },
  { name: 'Cinzel (Decorative)', value: 'Cinzel' },
];

interface AuditLog {
  id: string;
  admin_id: string;
  action: 'insert' | 'update' | 'delete' | 'login' | 'logout' | 'publish' | 'unpublish' | 'triage';
  table_name: string;
  record_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_profiles?: {
    full_name: string;
  } | null;
}

export default function WebsiteSettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'audit'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  // website_settings state
  const [webSettings, setWebSettings] = useState({
    company_name: 'The Nailaa Studio',
    company_description: '',
    contact_phone: '',
    contact_email: '',
    business_address: '',
    business_hours_text: '',
    whatsapp_number: '',
    whatsapp_default_message: '',
    google_maps_embed_url: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    logo_media_id: null as string | null,
    favicon_media_id: null as string | null,
    default_seo_image_id: null as string | null,
  });

  // theme_settings state
  const [themeSettings, setThemeSettings] = useState({
    primary_color: '#111111',
    secondary_color: '#8a7052',
    accent_color: '#c9a86a',
    default_theme: 'dark' as 'light' | 'dark',
    theme_switch_enabled: true,
    heading_font: 'Playfair Display',
    body_font: 'Inter',
    button_border_radius_px: 8,
  });

  // audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTableFilter, setAuditTableFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const LOGS_PER_PAGE = 10;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    fetchUser();
  }, [supabase]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const [webRes, themeRes] = await Promise.all([
        supabase.from('website_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('theme_settings').select('*').eq('id', true).maybeSingle(),
      ]);

      if (webRes.data) {
        setWebSettings({
          company_name: webRes.data.company_name || 'The Nailaa Studio',
          company_description: webRes.data.company_description || '',
          contact_phone: webRes.data.contact_phone || '',
          contact_email: webRes.data.contact_email || '',
          business_address: webRes.data.business_address || '',
          business_hours_text: webRes.data.business_hours_text || '',
          whatsapp_number: webRes.data.whatsapp_number || '',
          whatsapp_default_message: webRes.data.whatsapp_default_message || '',
          google_maps_embed_url: webRes.data.google_maps_embed_url || '',
          google_analytics_id: webRes.data.google_analytics_id || '',
          facebook_pixel_id: webRes.data.facebook_pixel_id || '',
          logo_media_id: webRes.data.logo_media_id || null,
          favicon_media_id: webRes.data.favicon_media_id || null,
          default_seo_image_id: webRes.data.default_seo_image_id || null,
        });
      }

      if (themeRes.data) {
        setThemeSettings({
          primary_color: themeRes.data.primary_color || '#111111',
          secondary_color: themeRes.data.secondary_color || '#8a7052',
          accent_color: themeRes.data.accent_color || '#c9a86a',
          default_theme: (themeRes.data.default_theme || 'dark') as 'light' | 'dark',
          theme_switch_enabled: themeRes.data.theme_switch_enabled ?? true,
          heading_font: themeRes.data.heading_font || 'Playfair Display',
          body_font: themeRes.data.body_font || 'Inter',
          button_border_radius_px: themeRes.data.button_border_radius_px ?? 8,
        });
      }

    } catch (err) {
      console.error('Failed to load website settings:', err);
      toast('Failed to load website settings from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          admin_profiles:admin_id ( full_name )
        `, { count: 'exact' });

      if (auditActionFilter !== 'all') {
        query = query.eq('action', auditActionFilter);
      }
      if (auditTableFilter !== 'all') {
        query = query.eq('table_name', auditTableFilter);
      }
      if (auditSearch.trim()) {
        query = query.or(`table_name.ilike.%${auditSearch}%,action.ilike.%${auditSearch}%`);
      }

      const from = (auditPage - 1) * LOGS_PER_PAGE;
      const to = from + LOGS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setAuditLogs(data || []);
      setTotalLogsCount(count || 0);
    } catch (err) {
      console.error(err);
      toast('Failed to load system audit logs.', 'error');
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, auditPage, auditActionFilter, auditTableFilter, auditSearch]);

  // Validation functions
  const validateWebSettings = () => {
    // Phone regex constraint: ^[0-9+\-() ]{8,20}$
    const phoneRegex = /^[0-9+\-() ]{8,20}$/;
    if (!phoneRegex.test(webSettings.contact_phone)) {
      toast('Contact phone must be between 8 and 20 characters and contain only digits, +, -, ( ) or spaces.', 'error');
      return false;
    }

    // Email regex constraint
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(webSettings.contact_email)) {
      toast('Please enter a valid email address.', 'error');
      return false;
    }

    return true;
  };

  const handleSaveWebSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWebSettings()) return;

    try {
      setSaving(true);
      const payload = {
        id: true,
        ...webSettings,
        updated_at: new Date().toISOString(),
        updated_by: adminUser?.id,
      };

      const { error } = await supabase
        .from('website_settings')
        .upsert(payload);

      if (error) throw error;
      
      // Save Audit log
      await logAdminAction('update', 'website_settings', null, { company_name: webSettings.company_name });

      toast('General settings saved successfully.', 'success');
      loadSettings();
    } catch (err) {
      console.error(err);
      toast('Failed to save general settings. Confirm table fields exist.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThemeSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (themeSettings.button_border_radius_px < 0) {
      toast('Border radius cannot be negative.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: true,
        ...themeSettings,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('theme_settings')
        .upsert(payload);

      if (error) throw error;

      // Save Audit log
      await logAdminAction('update', 'theme_settings', null, { heading_font: themeSettings.heading_font, primary_color: themeSettings.primary_color });

      toast('Theme customization saved successfully.', 'success');
      loadSettings();
    } catch (err) {
      console.error(err);
      toast('Failed to save theme configurations. Confirm table fields exist.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
        <span className="text-xs tracking-widest uppercase text-gray-500 font-sans">
          Loading Website Config Settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header Info */}
      <div>
        <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5" /> Configurations Dashboard
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
          Website Settings
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Configure global metadata, business attributions, social identifiers, custom colors, fonts, and styles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'general'
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          General & Integrations
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-5 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'theme'
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Theme & Colors
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'audit'
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          System Audit Logs
        </button>
      </div>

      {/* Settings Forms */}
      <div>
        
        {/* ====================================================
            TAB: GENERAL & INTEGRATIONS
            ==================================================== */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveWebSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left section: Identity & Contact details */}
            <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5" /> General Info & Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Brand Name"
                  value={webSettings.company_name}
                  onChange={(e) => setWebSettings({ ...webSettings, company_name: e.target.value })}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    value={webSettings.contact_phone}
                    onChange={(e) => setWebSettings({ ...webSettings, contact_phone: e.target.value })}
                    required
                    placeholder="+919999999999"
                  />
                  <Input
                    label="Contact Email"
                    value={webSettings.contact_email}
                    onChange={(e) => setWebSettings({ ...webSettings, contact_email: e.target.value })}
                    required
                    placeholder="hello@studio.com"
                  />
                </div>
              </div>

              <Textarea
                label="Company / Studio Description"
                value={webSettings.company_description}
                onChange={(e) => setWebSettings({ ...webSettings, company_description: e.target.value })}
                rows={3}
                placeholder="Briefly describe your company for search engines and footer text..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Business Address"
                  value={webSettings.business_address}
                  onChange={(e) => setWebSettings({ ...webSettings, business_address: e.target.value })}
                  placeholder="Street details, city, state"
                />
                <Input
                  label="Business Hours Text"
                  value={webSettings.business_hours_text}
                  onChange={(e) => setWebSettings({ ...webSettings, business_hours_text: e.target.value })}
                  placeholder="e.g. Mon – Sat, 9:00 AM – 7:00 PM"
                />
              </div>

              {/* Whatsapp & Google Maps */}
              <div className="pt-4 border-t border-gray-850 space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] block">Social Links & Map embed</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="WhatsApp Contact Number"
                    value={webSettings.whatsapp_number}
                    onChange={(e) => setWebSettings({ ...webSettings, whatsapp_number: e.target.value })}
                    placeholder="+919999999999"
                    helperText="Include country code without special characters."
                  />
                  <Input
                    label="WhatsApp Default Greeting Message"
                    value={webSettings.whatsapp_default_message}
                    onChange={(e) => setWebSettings({ ...webSettings, whatsapp_default_message: e.target.value })}
                    placeholder="Hello, I'd like to book styling..."
                  />
                </div>
                <Input
                  label="Google Maps Embed URL"
                  value={webSettings.google_maps_embed_url}
                  onChange={(e) => setWebSettings({ ...webSettings, google_maps_embed_url: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  helperText="Provide only the raw iframe URL source attribute."
                />
              </div>

              {/* Asset Pickers */}
              <div className="pt-6 border-t border-gray-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                <MediaSelector
                  label="Brand Identity Logo"
                  value={webSettings.logo_media_id}
                  onChange={(id) => setWebSettings({ ...webSettings, logo_media_id: id })}
                />
                <MediaSelector
                  label="Favicon Asset (16x16 / 32x32)"
                  value={webSettings.favicon_media_id}
                  onChange={(id) => setWebSettings({ ...webSettings, favicon_media_id: id })}
                />
                <MediaSelector
                  label="SEO Social Image"
                  value={webSettings.default_seo_image_id}
                  onChange={(id) => setWebSettings({ ...webSettings, default_seo_image_id: id })}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-850">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold"
                >
                  {saving ? 'Saving...' : 'Save General Settings'}
                </Button>
              </div>
            </div>

            {/* Right section: Tracking integrations */}
            <div className="lg:col-span-1 rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6 h-fit">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5" /> Analytics & Pixels
              </h3>

              <div className="space-y-4">
                <Input
                  label="Google Analytics Measurement ID"
                  value={webSettings.google_analytics_id}
                  onChange={(e) => setWebSettings({ ...webSettings, google_analytics_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  helperText="Injects Google Tag Manager scripts automatically in the public client layout."
                />

                <Input
                  label="Facebook Pixel ID"
                  value={webSettings.facebook_pixel_id}
                  onChange={(e) => setWebSettings({ ...webSettings, facebook_pixel_id: e.target.value })}
                  placeholder="123456789012345"
                  helperText="Injects Facebook tracking pixel SDK script elements automatically."
                />
              </div>
            </div>
          </form>
        )}

        {/* ====================================================
            TAB: THEME & COLORS
            ==================================================== */}
        {activeTab === 'theme' && (
          <form onSubmit={handleSaveThemeSettings} className="max-w-4xl rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-8 animate-fade-in">
            <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5" /> Theme Customization
            </h3>

            {/* Colors picker section */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] block">Hex Color Branding</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div className="p-4 rounded-lg bg-[#111111] border border-gray-850 space-y-3">
                  <Label>Primary Background Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeSettings.primary_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                      className="h-8 w-10 border-0 bg-transparent cursor-pointer rounded"
                    />
                    <input
                      type="text"
                      value={themeSettings.primary_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-850 text-xs focus:border-[#C9A86A] outline-none text-white font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="p-4 rounded-lg bg-[#111111] border border-gray-850 space-y-3">
                  <Label>Secondary Color (Muted)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeSettings.secondary_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                      className="h-8 w-10 border-0 bg-transparent cursor-pointer rounded"
                    />
                    <input
                      type="text"
                      value={themeSettings.secondary_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-850 text-xs focus:border-[#C9A86A] outline-none text-white font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="p-4 rounded-lg bg-[#111111] border border-gray-850 space-y-3">
                  <Label>Accent Details Color (Gold)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeSettings.accent_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                      className="h-8 w-10 border-0 bg-transparent cursor-pointer rounded"
                    />
                    <input
                      type="text"
                      value={themeSettings.accent_color}
                      onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-850 text-xs focus:border-[#C9A86A] outline-none text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography & General parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-850">
              {/* Left Column: Fonts selection */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] block">Typography configuration</span>
                
                <div className="space-y-1.5">
                  <Label>Heading Font Family</Label>
                  <select
                    value={themeSettings.heading_font}
                    onChange={(e) => setThemeSettings({ ...themeSettings, heading_font: e.target.value })}
                    className="w-full rounded-md border border-gray-800 bg-[#111111] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#C9A86A]"
                  >
                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Body Paragraphs Font Family</Label>
                  <select
                    value={themeSettings.body_font}
                    onChange={(e) => setThemeSettings({ ...themeSettings, body_font: e.target.value })}
                    className="w-full rounded-md border border-gray-800 bg-[#111111] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#C9A86A]"
                  >
                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Right Column: Theme options & radii */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] block">Styling overrides</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Default Theme Mode</Label>
                    <select
                      value={themeSettings.default_theme}
                      onChange={(e) => setThemeSettings({ ...themeSettings, default_theme: e.target.value as 'light' | 'dark' })}
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#C9A86A]"
                    >
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Button Border Radius (px)</Label>
                    <input
                      type="number"
                      min="0"
                      value={themeSettings.button_border_radius_px}
                      onChange={(e) => setThemeSettings({ ...themeSettings, button_border_radius_px: Number(e.target.value) })}
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-3.5 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded border border-gray-850 bg-[#111111] mt-4">
                  <div>
                    <span className="text-xs text-white block">Theme Switcher Trigger</span>
                    <span className="text-[9px] text-gray-550 block">Allow public website visitors to toggle Light/Dark mode.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={themeSettings.theme_switch_enabled}
                    onChange={(e) => setThemeSettings({ ...themeSettings, theme_switch_enabled: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-gray-800 bg-gray-900 accent-[#C9A86A] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-850">
              <Button
                type="submit"
                disabled={saving}
                variant="accent"
                className="bg-[#C9A86A] text-[#111111] font-bold"
              >
                {saving ? 'Saving...' : 'Save Theme customization'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'audit' && (
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6 animate-fade-in">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5" /> System Audit Trails
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                A historical log of actions executed by studio administrators for security auditing.
              </p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-[#111111] border border-gray-850">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search logs by action or table..."
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-md border border-gray-800 bg-black text-xs text-white outline-none focus:border-[#C9A86A]"
                />
              </div>

              <div className="w-full sm:w-40">
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-black text-xs text-white outline-none focus:border-[#C9A86A]"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="insert">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="publish">Publish</option>
                  <option value="unpublish">Unpublish</option>
                </select>
              </div>

              <div className="w-full sm:w-44">
                <select
                  value={auditTableFilter}
                  onChange={(e) => {
                    setAuditTableFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-black text-xs text-white outline-none focus:border-[#C9A86A]"
                >
                  <option value="all">All Tables</option>
                  <option value="website_settings">Website Settings</option>
                  <option value="theme_settings">Theme Settings</option>
                  <option value="services">Services</option>
                  <option value="portfolio_projects">Portfolio Projects</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="media_library">Media Library</option>
                  <option value="admin_profiles">Admin Profiles</option>
                </select>
              </div>
            </div>

            {/* Timeline UI Representation */}
            <div className="space-y-4">
              {loadingAudit ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-[#C9A86A] mx-auto mb-2" />
                  Fetching system trails...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic bg-[#111111] rounded-lg border border-gray-850">
                  No audit log trails found matching filters.
                </div>
              ) : (
                <div className="relative border-l border-gray-800 ml-4 pl-6 space-y-6">
                  {auditLogs.map((log) => {
                    let badgeColor = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                    let actionLabel: string = log.action;
                    if (log.action === 'insert') {
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      actionLabel = 'create';
                    }
                    if (log.action === 'update') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    if (log.action === 'delete') badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                    if (log.action === 'login') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (log.action === 'logout') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-550/20';
                    if (log.action === 'publish') badgeColor = 'bg-violet-500/10 text-violet-400 border-violet-500/20';
                    if (log.action === 'unpublish') badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

                    return (
                      <div key={log.id} className="relative group">
                        {/* Dot indicator */}
                        <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-[#C9A86A] ring-4 ring-[#1A1A1A] group-hover:scale-125 transition-transform" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg bg-[#111111]/75 border border-gray-850 hover:border-gray-800 transition-colors">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-white">
                                {log.admin_profiles?.full_name || 'Staff User'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${badgeColor}`}>
                                {actionLabel}
                              </span>
                              <span className="text-gray-500">on</span>
                              <span className="font-mono text-gray-300 bg-gray-900/60 px-1.5 py-0.5 rounded">
                                {log.table_name}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-mono truncate max-w-xl" title={JSON.stringify(log.metadata)}>
                              Details: {JSON.stringify(log.metadata)}
                            </p>
                          </div>
                          <div className="text-[10px] text-gray-550 whitespace-nowrap sm:text-right font-mono">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalLogsCount > LOGS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-850 text-xs text-gray-400">
                <span>
                  Showing { (auditPage - 1) * LOGS_PER_PAGE + 1 } to { Math.min(auditPage * LOGS_PER_PAGE, totalLogsCount) } of { totalLogsCount } logs
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                    disabled={auditPage === 1 || loadingAudit}
                    variant="outline"
                    className="border-gray-800 text-xs px-2.5 py-1 text-gray-400"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setAuditPage(prev => prev + 1)}
                    disabled={auditPage * LOGS_PER_PAGE >= totalLogsCount || loadingAudit}
                    variant="outline"
                    className="border-gray-800 text-xs px-2.5 py-1 text-gray-400"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
