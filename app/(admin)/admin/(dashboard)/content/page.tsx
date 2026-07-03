'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/FormControls';
import { MediaSelector } from '@/components/admin/MediaSelector';
import { Modal } from '@/components/ui/Modal';
import { 
  Sliders, Layout, Award, Compass, Heart, MessageSquare, 
  Settings, Loader2, ArrowUp, ArrowDown, Plus, Trash2, Edit3
} from 'lucide-react';

interface TestimonialRow {
  id?: string;
  client_name: string;
  designation: string | null;
  review_text: string;
  rating: number;
  is_featured: boolean;
  is_visible: boolean;
  display_order?: number;
}

// Icon library list to pick for features/processes
const ICON_CHOICES = ['Sparkles', 'Shield', 'Compass', 'PenTool', 'Heart', 'TrendingUp'];

export default function ContentManagementPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'hero' | 'story' | 'process' | 'testimonials' | 'general'>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  // ----------------------------------------------------
  // DATA STATES
  // ----------------------------------------------------
  
  // Hero & General settings
  const [hero, setHero] = useState({
    title: '',
    subtitle: '',
    background_type: 'image' as 'image' | 'video',
    background_image_id: null as string | null,
    background_video_id: null as string | null,
    logo_media_id: null as string | null,
    cta1_text: '',
    cta1_target_section: '',
    cta2_text: '',
    cta2_target_section: '',
  });

  const [webSettings, setWebSettings] = useState({
    company_name: '',
    company_description: '',
    contact_phone: '',
    contact_email: '',
    business_hours_text: '',
    business_address: '',
    whatsapp_number: '',
    whatsapp_default_message: '',
    google_maps_embed_url: '',
    logo_media_id: null as string | null,
    favicon_media_id: null as string | null,
  });

  // Story & Philosophy settings
  const [about, setAbout] = useState({
    intro_text: '',
    vision_text: '',
    mission_text: '',
    intro_image_id: null as string | null,
    vision_image_id: null as string | null,
    mission_image_id: null as string | null,
  });

  const [philosophy, setPhilosophy] = useState({
    title: '',
    description: '',
    quote: '',
    author: '',
  });

  const [popupSettings, setPopupSettings] = useState({
    enabled: true,
    title: '',
    subtitle: '',
    delay_seconds: 3,
    show_once_per_session: true,
    primary_button_text: '',
    secondary_button_text: '',
  });

  // List editors states
  const [processSteps, setProcessSteps] = useState<{ id: string; title: string; description: string; display_order: number; is_visible: boolean }[]>([]);
  const [whyChooseFeatures, setWhyChooseFeatures] = useState<{ id: string; title: string; description: string; icon_name: string; display_order: number; is_visible: boolean }[]>([]);
  const [coreValues, setCoreValues] = useState<{ id: string; title: string; description: string; icon_name: string; display_order: number; is_visible: boolean }[]>([]);
  const [socialLinks, setSocialLinks] = useState<{ id: string; platform: string; url: string; display_order: number; is_active: boolean }[]>([]);
  const [footer, setFooter] = useState({
    brand_statement: '',
    copyright_text: '',
    privacy_policy_url: '',
    terms_conditions_url: '',
  });

  // Testimonials state
  const [testimonials, setTestimonials] = useState<{ id: string; client_name: string; designation: string; review_text: string; rating: number; is_featured: boolean; is_visible: boolean; display_order: number }[]>([]);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialRow | null>(null);

  // ----------------------------------------------------
  // SYSTEM SETUP & FETCH
  // ----------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    fetchUser();
  }, [supabase]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all content singletons & lists
      const [
        heroRes, settingsRes, aboutRes, philosophyRes, popupRes, 
        processRes, whyChooseRes, coreRes, socialRes, footerRes, testimonialsRes
      ] = await Promise.all([
        supabase.from('hero_section').select('*').eq('id', true).maybeSingle(),
        supabase.from('website_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('about_content').select('*').eq('id', true).maybeSingle(),
        supabase.from('design_philosophy').select('*').eq('id', true).maybeSingle(),
        supabase.from('consultation_popup_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('design_process_steps').select('*').order('display_order', { ascending: true }),
        supabase.from('why_choose_features').select('*').order('display_order', { ascending: true }),
        supabase.from('core_values').select('*').order('display_order', { ascending: true }),
        supabase.from('social_links').select('*').order('display_order', { ascending: true }),
        supabase.from('footer_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('testimonials').select('*').is('deleted_at', null).order('display_order', { ascending: true }),
      ]);

      // Map values with fallbacks
      if (heroRes.data) {
        setHero({
          title: heroRes.data.title || '',
          subtitle: heroRes.data.subtitle || '',
          background_type: heroRes.data.background_type || 'image',
          background_image_id: heroRes.data.background_image_id || null,
          background_video_id: heroRes.data.background_video_id || null,
          logo_media_id: heroRes.data.logo_media_id || null,
          cta1_text: heroRes.data.cta1_text || '',
          cta1_target_section: heroRes.data.cta1_target_section || '',
          cta2_text: heroRes.data.cta2_text || '',
          cta2_target_section: heroRes.data.cta2_target_section || '',
        });
      }
      if (settingsRes.data) {
        setWebSettings({
          company_name: settingsRes.data.company_name || '',
          company_description: settingsRes.data.company_description || '',
          contact_phone: settingsRes.data.contact_phone || '',
          contact_email: settingsRes.data.contact_email || '',
          business_hours_text: settingsRes.data.business_hours_text || '',
          business_address: settingsRes.data.business_address || '',
          whatsapp_number: settingsRes.data.whatsapp_number || '',
          whatsapp_default_message: settingsRes.data.whatsapp_default_message || '',
          google_maps_embed_url: settingsRes.data.google_maps_embed_url || '',
          logo_media_id: settingsRes.data.logo_media_id || null,
          favicon_media_id: settingsRes.data.favicon_media_id || null,
        });
      }
      if (aboutRes.data) {
        setAbout({
          intro_text: aboutRes.data.intro_text || '',
          vision_text: aboutRes.data.vision_text || '',
          mission_text: aboutRes.data.mission_text || '',
          intro_image_id: aboutRes.data.intro_image_id || null,
          vision_image_id: aboutRes.data.vision_image_id || null,
          mission_image_id: aboutRes.data.mission_image_id || null,
        });
      }
      if (philosophyRes.data) {
        setPhilosophy({
          title: philosophyRes.data.title || '',
          description: philosophyRes.data.description || '',
          quote: philosophyRes.data.quote || '',
          author: philosophyRes.data.author || '',
        });
      }
      if (popupRes.data) {
        setPopupSettings({
          enabled: popupRes.data.enabled ?? true,
          title: popupRes.data.title || '',
          subtitle: popupRes.data.subtitle || '',
          delay_seconds: popupRes.data.delay_seconds || 3,
          show_once_per_session: popupRes.data.show_once_per_session ?? true,
          primary_button_text: popupRes.data.primary_button_text || '',
          secondary_button_text: popupRes.data.secondary_button_text || '',
        });
      }
      if (footerRes.data) {
        setFooter({
          brand_statement: footerRes.data.brand_statement || '',
          copyright_text: footerRes.data.copyright_text || '',
          privacy_policy_url: footerRes.data.privacy_policy_url || '',
          terms_conditions_url: footerRes.data.terms_conditions_url || '',
        });
      }

      setProcessSteps(processRes.data || []);
      setWhyChooseFeatures(whyChooseRes.data || []);
      setCoreValues(coreRes.data || []);
      setSocialLinks(socialRes.data || []);
      setTestimonials(testimonialsRes.data || []);

    } catch (err) {
      console.error('Failed to load database content tables:', err);
      toast('Failed to load CMS content from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ----------------------------------------------------
  // SAVE SINGLETON HELPERS
  // ----------------------------------------------------
  const handleSaveSingleton = async (table: string, payload: Record<string, unknown>) => {
    try {
      setSaving(true);

      const dbPayload = {
        id: true,
        ...payload,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(table)
        .upsert(dbPayload);

      if (error) throw error;
      toast('Changes saved successfully.', 'success');
      loadAllData();
    } catch (err) {
      console.error(`Failed to save to ${table}:`, err);
      toast('Failed to save content. Confirm table fields exist.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // LIST REORDER & CRUD HELPERS
  // ----------------------------------------------------
  const handleMoveListItem = async (table: string, list: Array<{ id: string }>, index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    try {
      setSaving(true);
      const reorderedList = [...list];
      const temp = reorderedList[index];
      reorderedList[index] = reorderedList[targetIdx];
      reorderedList[targetIdx] = temp;

      // Update display orders in db
      const promises = reorderedList.map((item, idx) => 
        supabase
          .from(table)
          .update({ display_order: idx })
          .eq('id', item.id)
      );

      await Promise.all(promises);
      toast('Display order updated.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to update list order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListItem = async (table: string, id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Item deleted.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to delete item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add Item Inline triggers
  const handleAddProcessStep = async () => {
    try {
      const nextOrder = processSteps.length;
      const { error } = await supabase
        .from('design_process_steps')
        .insert({
          title: 'New Process Blueprint',
          description: 'Detailing step execution metrics and outcomes.',
          display_order: nextOrder,
          is_visible: true,
        });
      if (error) throw error;
      toast('Added new design process step.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to create process step.', 'error');
    }
  };

  const handleAddFeature = async () => {
    try {
      const nextOrder = whyChooseFeatures.length;
      const { error } = await supabase
        .from('why_choose_features')
        .insert({
          title: 'Bespoke Perfection',
          description: 'Highlighting studio characteristics and materials.',
          icon_name: 'Sparkles',
          display_order: nextOrder,
          is_visible: true,
        });
      if (error) throw error;
      toast('Added feature highlight.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to create feature.', 'error');
    }
  };

  const handleAddCoreValue = async () => {
    try {
      const nextOrder = coreValues.length;
      const { error } = await supabase
        .from('core_values')
        .insert({
          title: 'Quality First',
          description: 'Every treatment detail built with precision.',
          icon_name: 'Heart',
          display_order: nextOrder,
          is_visible: true,
        });
      if (error) throw error;
      toast('Added core value.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to create core value.', 'error');
    }
  };

  const handleAddSocialLink = async () => {
    try {
      const nextOrder = socialLinks.length;
      const { error } = await supabase
        .from('social_links')
        .insert({
          platform: 'instagram',
          url: 'https://instagram.com/thenailaastudio',
          display_order: nextOrder,
          is_active: true,
        });
      if (error) throw error;
      toast('Added social profile link.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to create social link.', 'error');
    }
  };

  const handleSaveListItem = async (table: string, id: string, fields: Record<string, unknown>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from(table)
        .update(fields)
        .eq('id', id);

      if (error) throw error;
      toast('Item changes saved.', 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // TESTIMONIALS HELPERS
  // ----------------------------------------------------
  const handleOpenTestimonialModal = (item: TestimonialRow | null = null) => {
    setEditingTestimonial(item || {
      client_name: '',
      designation: '',
      review_text: '',
      rating: 5,
      is_featured: false,
      is_visible: true,
    });
    setTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    try {
      setSaving(true);
      const payload = {
        client_name: editingTestimonial.client_name.trim(),
        designation: editingTestimonial.designation?.trim() || null,
        review_text: editingTestimonial.review_text.trim(),
        rating: Number(editingTestimonial.rating),
        is_featured: editingTestimonial.is_featured,
        is_visible: editingTestimonial.is_visible,
        updated_by: adminUser?.id,
      };

      if (editingTestimonial.id) {
        // Edit mode
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingTestimonial.id);
        if (error) throw error;
        toast('Testimonial updated successfully.', 'success');
      } else {
        // Add mode
        const nextOrder = testimonials.length;
        const { error } = await supabase
          .from('testimonials')
          .insert({
            ...payload,
            display_order: nextOrder,
            created_by: adminUser?.id,
          });
        if (error) throw error;
        toast('Testimonial added successfully.', 'success');
      }

      setTestimonialModalOpen(false);
      setEditingTestimonial(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast('Failed to save testimonial.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (item: TestimonialRow) => {
    try {
      setSaving(true);
      // Soft delete testimonial immediately
      const { error } = await supabase
        .from('testimonials')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id);
      if (error) throw error;

      // Update local state instantly for responsiveness
      setTestimonials((prev) => prev.filter((t) => t.id !== item.id));

      // Show success toast with Undo trigger
      toast(
        `Testimonial from "${item.client_name}" removed.`,
        'success',
        6000,
        {
          label: 'Undo',
          onClick: async () => {
            const { error: restoreError } = await supabase
              .from('testimonials')
              .update({ deleted_at: null })
              .eq('id', item.id || '');
            if (restoreError) {
              toast('Failed to restore testimonial.', 'error');
            } else {
              toast('Testimonial restored.', 'success');
              loadAllData();
            }
          },
        }
      );
    } catch (err) {
      console.error(err);
      toast('Failed to delete testimonial.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
        <span className="text-xs tracking-widest uppercase text-gray-500 font-sans">
          Connecting Website CMS Tables...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header Banner */}
      <div>
        <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
          <Sliders className="h-3 w-3" /> Core Customization
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
          Website Content Management
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Directly alter headings, story elements, philosophy text, lists, and settings. Changes populate instantly.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-gray-800 scrollbar-none overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'hero' 
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Hero & Settings
        </button>
        <button
          onClick={() => setActiveTab('story')}
          className={`px-4 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'story' 
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Story & Philosophy
        </button>
        <button
          onClick={() => setActiveTab('process')}
          className={`px-4 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'process' 
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Process & Highlights
        </button>
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`px-4 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'testimonials' 
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Testimonials
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 text-xs uppercase font-bold tracking-widest border-b-2 cursor-pointer transition-all ${
            activeTab === 'general' 
              ? 'border-[#C9A86A] text-[#C9A86A] bg-gray-900/40' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Footer & Socials
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="space-y-8">
        
        {/* ====================================================
            TAB: HERO & SETTINGS
            ==================================================== */}
        {activeTab === 'hero' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Hero details form */}
            <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Layout className="h-4.5 w-4.5" /> Homepage Hero Setup
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Hero Banner Title"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                />

                <Textarea
                  label="Hero Banner Subtitle"
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  rows={2}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>CTA 1 button text</Label>
                    <input
                      value={hero.cta1_text}
                      onChange={(e) => setHero({ ...hero, cta1_text: e.target.value })}
                      placeholder="e.g. Book Consultation"
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA 1 Target block ID</Label>
                    <input
                      value={hero.cta1_target_section}
                      onChange={(e) => setHero({ ...hero, cta1_target_section: e.target.value })}
                      placeholder="e.g. contact"
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>CTA 2 button text</Label>
                    <input
                      value={hero.cta2_text}
                      onChange={(e) => setHero({ ...hero, cta2_text: e.target.value })}
                      placeholder="e.g. View Showcase"
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA 2 Target block ID</Label>
                    <input
                      value={hero.cta2_target_section}
                      onChange={(e) => setHero({ ...hero, cta2_target_section: e.target.value })}
                      placeholder="e.g. portfolio"
                      className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                    />
                  </div>
                </div>

                {/* Media Selectors */}
                <div className="pt-4 border-t border-gray-800/40 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MediaSelector
                    label="Hero Background Photo"
                    value={hero.background_image_id}
                    onChange={(id) => setHero({ ...hero, background_image_id: id })}
                  />
                  <MediaSelector
                    label="Studio Logo Overlay Image"
                    value={hero.logo_media_id}
                    onChange={(id) => setHero({ ...hero, logo_media_id: id })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800/60">
                <Button
                  onClick={() => handleSaveSingleton('hero_section', hero)}
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold"
                >
                  {saving ? 'Saving...' : 'Save Hero Section'}
                </Button>
              </div>
            </div>

            {/* General website information card */}
            <div className="lg:col-span-1 space-y-8">
              <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
                <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5" /> Studio Settings
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Studio Brand Name"
                    value={webSettings.company_name}
                    onChange={(e) => setWebSettings({ ...webSettings, company_name: e.target.value })}
                  />
                  
                  <Input
                    label="Contact Phone"
                    value={webSettings.contact_phone}
                    onChange={(e) => setWebSettings({ ...webSettings, contact_phone: e.target.value })}
                  />

                  <Input
                    label="Contact Email"
                    value={webSettings.contact_email}
                    onChange={(e) => setWebSettings({ ...webSettings, contact_email: e.target.value })}
                  />

                  <Input
                    label="Business Address"
                    value={webSettings.business_address}
                    onChange={(e) => setWebSettings({ ...webSettings, business_address: e.target.value })}
                  />

                  <Input
                    label="Whatsapp Contact Number"
                    value={webSettings.whatsapp_number}
                    onChange={(e) => setWebSettings({ ...webSettings, whatsapp_number: e.target.value })}
                    helperText="Format: +919999999999 (include country code)"
                  />

                  <Textarea
                    label="Whatsapp Default Pre-filled Message"
                    value={webSettings.whatsapp_default_message}
                    onChange={(e) => setWebSettings({ ...webSettings, whatsapp_default_message: e.target.value })}
                    rows={2}
                  />

                  <MediaSelector
                    label="Brand Theme Logo"
                    value={webSettings.logo_media_id}
                    onChange={(id) => setWebSettings({ ...webSettings, logo_media_id: id })}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-800/60">
                  <Button
                    onClick={() => handleSaveSingleton('website_settings', webSettings)}
                    disabled={saving}
                    variant="accent"
                    className="bg-[#C9A86A] text-[#111111] font-bold w-full"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>

              {/* Consultation Popup Settings card */}
              <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
                <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5" /> Consultation Popup
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded border border-gray-850 bg-[#111111]">
                    <span className="text-xs text-gray-400">Popup Enabled</span>
                    <input
                      type="checkbox"
                      checked={popupSettings.enabled}
                      onChange={(e) => setPopupSettings({ ...popupSettings, enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-800 bg-gray-900 accent-[#C9A86A] cursor-pointer"
                    />
                  </div>

                  <Input
                    label="Popup Title"
                    value={popupSettings.title}
                    onChange={(e) => setPopupSettings({ ...popupSettings, title: e.target.value })}
                  />

                  <Textarea
                    label="Popup Subtitle"
                    value={popupSettings.subtitle}
                    onChange={(e) => setPopupSettings({ ...popupSettings, subtitle: e.target.value })}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Delay (seconds)"
                      type="number"
                      value={popupSettings.delay_seconds}
                      onChange={(e) => setPopupSettings({ ...popupSettings, delay_seconds: Number(e.target.value) })}
                    />

                    <div className="flex items-center justify-between p-2 rounded border border-gray-850 bg-[#111111] mt-5">
                      <span className="text-[10px] text-gray-400">Once/Session</span>
                      <input
                        type="checkbox"
                        checked={popupSettings.show_once_per_session}
                        onChange={(e) => setPopupSettings({ ...popupSettings, show_once_per_session: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-900 accent-[#C9A86A] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Primary Button"
                      value={popupSettings.primary_button_text}
                      onChange={(e) => setPopupSettings({ ...popupSettings, primary_button_text: e.target.value })}
                    />
                    <Input
                      label="Secondary Button"
                      value={popupSettings.secondary_button_text}
                      onChange={(e) => setPopupSettings({ ...popupSettings, secondary_button_text: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-800/60">
                  <Button
                    onClick={() => handleSaveSingleton('consultation_popup_settings', popupSettings)}
                    disabled={saving}
                    variant="accent"
                    className="bg-[#C9A86A] text-[#111111] font-bold w-full"
                  >
                    {saving ? 'Saving...' : 'Save Popup Settings'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB: STORY & PHILOSOPHY
            ==================================================== */}
        {activeTab === 'story' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* About content card */}
            <div className="lg:col-span-2 rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Layout className="h-4.5 w-4.5" /> About Story Blocks
              </h3>

              <div className="space-y-6">
                {/* Intro block */}
                <div className="space-y-4 p-4 rounded-lg bg-[#111111] border border-gray-850">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A]">Introductory statement</span>
                  <Textarea
                    value={about.intro_text}
                    onChange={(e) => setAbout({ ...about, intro_text: e.target.value })}
                    rows={2}
                  />
                  <MediaSelector
                    label="Intro Block Image"
                    value={about.intro_image_id}
                    onChange={(id) => setAbout({ ...about, intro_image_id: id })}
                  />
                </div>

                {/* Vision block */}
                <div className="space-y-4 p-4 rounded-lg bg-[#111111] border border-gray-850">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A]">Vision statement</span>
                  <Textarea
                    value={about.vision_text}
                    onChange={(e) => setAbout({ ...about, vision_text: e.target.value })}
                    rows={2}
                  />
                  <MediaSelector
                    label="Vision Block Image"
                    value={about.vision_image_id}
                    onChange={(id) => setAbout({ ...about, vision_image_id: id })}
                  />
                </div>

                {/* Mission block */}
                <div className="space-y-4 p-4 rounded-lg bg-[#111111] border border-gray-850">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A]">Mission statement</span>
                  <Textarea
                    value={about.mission_text}
                    onChange={(e) => setAbout({ ...about, mission_text: e.target.value })}
                    rows={2}
                  />
                  <MediaSelector
                    label="Mission Block Image"
                    value={about.mission_image_id}
                    onChange={(id) => setAbout({ ...about, mission_image_id: id })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-850">
                <Button
                  onClick={() => handleSaveSingleton('about_content', about)}
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold"
                >
                  {saving ? 'Saving...' : 'Save Story Blocks'}
                </Button>
              </div>
            </div>

            {/* Design Philosophy card */}
            <div className="lg:col-span-1 rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Compass className="h-4.5 w-4.5" /> Design Philosophy
              </h3>

              <div className="space-y-4">
                <Input
                  label="Philosophy Block Title"
                  value={philosophy.title}
                  onChange={(e) => setPhilosophy({ ...philosophy, title: e.target.value })}
                />
                
                <Textarea
                  label="Description Paragraph"
                  value={philosophy.description}
                  onChange={(e) => setPhilosophy({ ...philosophy, description: e.target.value })}
                  rows={4}
                />

                <Textarea
                  label="Featured Quote text"
                  value={philosophy.quote}
                  onChange={(e) => setPhilosophy({ ...philosophy, quote: e.target.value })}
                  rows={3}
                />

                <Input
                  label="Quote Author attribution"
                  value={philosophy.author}
                  onChange={(e) => setPhilosophy({ ...philosophy, author: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800/60">
                <Button
                  onClick={() => handleSaveSingleton('design_philosophy', philosophy)}
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold w-full"
                >
                  {saving ? 'Saving...' : 'Save Philosophy'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB: PROCESS & HIGHLIGHTS (Double list reordering)
            ==================================================== */}
        {activeTab === 'process' && (
          <div className="space-y-12 animate-fade-in">
            {/* Section A: Design Process list */}
            <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="font-serif text-lg font-semibold text-[#C9A86A] flex items-center gap-2">
                  <Compass className="h-4.5 w-4.5" /> Design Process steps
                </h3>
                <Button
                  onClick={handleAddProcessStep}
                  variant="outline"
                  size="sm"
                  className="border-gray-800 text-[#C9A86A] hover:bg-gray-900 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
                </Button>
              </div>

              {processSteps.length === 0 ? (
                <p className="text-xs text-gray-550 italic text-center py-6">No process steps listed in DB.</p>
              ) : (
                <div className="space-y-4">
                  {processSteps.map((step, idx) => (
                    <div 
                      key={step.id} 
                      className="p-4 rounded-lg bg-[#111111] border border-gray-850 flex flex-col md:flex-row md:items-center gap-4 justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="flex h-7 w-7 rounded-full bg-[#C9A86A]/10 border border-[#C9A86A]/20 items-center justify-center text-xs font-serif font-bold text-[#C9A86A]">
                          {idx + 1}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                          <input
                            value={step.title}
                            onChange={(e) => handleSaveListItem('design_process_steps', step.id, { title: e.target.value })}
                            className="bg-transparent border-b border-gray-850 focus:border-[#C9A86A] py-1 text-xs outline-none text-white font-semibold"
                            placeholder="Step Title"
                          />
                          <input
                            value={step.description}
                            onChange={(e) => handleSaveListItem('design_process_steps', step.id, { description: e.target.value })}
                            className="bg-transparent border-b border-gray-850 focus:border-[#C9A86A] py-1 text-xs outline-none text-gray-400 sm:col-span-2"
                            placeholder="Step Description..."
                          />
                        </div>
                      </div>

                      {/* Display toggle & sorting triggers */}
                      <div className="flex items-center space-x-3 self-end md:self-center">
                        <button
                          onClick={() => handleSaveListItem('design_process_steps', step.id, { is_visible: !step.is_visible })}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            step.is_visible 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-gray-800 text-gray-500 border border-gray-700'
                          }`}
                        >
                          {step.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => handleMoveListItem('design_process_steps', processSteps, idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveListItem('design_process_steps', processSteps, idx, 'down')}
                          disabled={idx === processSteps.length - 1}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteListItem('design_process_steps', step.id)}
                          className="p-1.5 rounded bg-red-950/20 border border-red-500/10 text-red-400 hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Why Choose Us & Core Values Double grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Why Choose Us features */}
              <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="font-serif text-base font-semibold text-[#C9A86A] flex items-center gap-2">
                    <Award className="h-4.5 w-4.5" /> Why Choose Us
                  </h3>
                  <Button
                    onClick={handleAddFeature}
                    variant="outline"
                    size="sm"
                    className="border-gray-800 text-[#C9A86A] hover:bg-gray-900 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {whyChooseFeatures.length === 0 ? (
                  <p className="text-xs text-gray-550 italic text-center py-6">No feature highlights listed in DB.</p>
                ) : (
                  <div className="space-y-4">
                    {whyChooseFeatures.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-lg bg-[#111111] border border-gray-850 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                          <span className="text-[10px] text-gray-550 uppercase tracking-widest font-bold">Feature #{idx + 1}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSaveListItem('why_choose_features', item.id, { is_visible: !item.is_visible })}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer ${
                                item.is_visible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'
                              }`}
                            >
                              {item.is_visible ? 'Visible' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => handleMoveListItem('why_choose_features', whyChooseFeatures, idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => handleMoveListItem('why_choose_features', whyChooseFeatures, idx, 'down')}
                              disabled={idx === whyChooseFeatures.length - 1}
                              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteListItem('why_choose_features', item.id)}
                              className="p-1 rounded bg-red-950/20 text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Title"
                            value={item.title}
                            onChange={(e) => handleSaveListItem('why_choose_features', item.id, { title: e.target.value })}
                          />
                          <div className="space-y-1">
                            <Label>Lucide Icon Name</Label>
                            <select
                              value={item.icon_name || 'Sparkles'}
                              onChange={(e) => handleSaveListItem('why_choose_features', item.id, { icon_name: e.target.value })}
                              className="w-full rounded-md border border-gray-800 bg-[#111111] px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                            >
                              {ICON_CHOICES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                          </div>
                        </div>

                        <Textarea
                          label="Description"
                          value={item.description}
                          onChange={(e) => handleSaveListItem('why_choose_features', item.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Values list */}
              <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="font-serif text-base font-semibold text-[#C9A86A] flex items-center gap-2">
                    <Heart className="h-4.5 w-4.5" /> Core Values
                  </h3>
                  <Button
                    onClick={handleAddCoreValue}
                    variant="outline"
                    size="sm"
                    className="border-gray-800 text-[#C9A86A] hover:bg-gray-900 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {coreValues.length === 0 ? (
                  <p className="text-xs text-gray-550 italic text-center py-6">No core values listed in DB.</p>
                ) : (
                  <div className="space-y-4">
                    {coreValues.map((valueItem, idx) => (
                      <div 
                        key={valueItem.id} 
                        className="p-4 rounded-lg bg-[#111111] border border-gray-850 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                          <span className="text-[10px] text-gray-550 uppercase tracking-widest font-bold">Value #{idx + 1}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSaveListItem('core_values', valueItem.id, { is_visible: !valueItem.is_visible })}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer ${
                                valueItem.is_visible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'
                              }`}
                            >
                              {valueItem.is_visible ? 'Visible' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => handleMoveListItem('core_values', coreValues, idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => handleMoveListItem('core_values', coreValues, idx, 'down')}
                              disabled={idx === coreValues.length - 1}
                              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteListItem('core_values', valueItem.id)}
                              className="p-1 rounded bg-red-950/20 text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Title"
                            value={valueItem.title}
                            onChange={(e) => handleSaveListItem('core_values', valueItem.id, { title: e.target.value })}
                          />
                          <div className="space-y-1">
                            <Label>Lucide Icon Name</Label>
                            <select
                              value={valueItem.icon_name || 'Heart'}
                              onChange={(e) => handleSaveListItem('core_values', valueItem.id, { icon_name: e.target.value })}
                              className="w-full rounded-md border border-gray-800 bg-[#111111] px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                            >
                              {ICON_CHOICES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                          </div>
                        </div>

                        <Textarea
                          label="Description"
                          value={valueItem.description}
                          onChange={(e) => handleSaveListItem('core_values', valueItem.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ====================================================
            TAB: TESTIMONIALS
            ==================================================== */}
        {activeTab === 'testimonials' && (
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5" /> Client Testimonials
              </h3>
              <Button
                onClick={() => handleOpenTestimonialModal()}
                variant="accent"
                size="sm"
                className="bg-[#C9A86A] text-[#111111] font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Review
              </Button>
            </div>

            {testimonials.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-700 animate-pulse mb-3" />
                <p className="text-sm font-semibold">No reviews registered</p>
                <p className="text-xs text-gray-600 mt-1">Create testimonials to display client reviews on the homepage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col justify-between p-5 rounded-lg border border-gray-850 bg-[#111111] space-y-4 hover:border-[#C9A86A]/20 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-white">{item.client_name}</p>
                          <p className="text-[10px] text-gray-500">{item.designation || 'Client'}</p>
                        </div>
                        <span className="text-xs text-[#C9A86A] font-bold">{'★'.repeat(item.rating)}</span>
                      </div>
                      <p className="text-xs text-gray-400 italic line-clamp-4 leading-relaxed">
                        &quot;{item.review_text}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-850/60 pt-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveListItem('testimonials', item.id, { is_visible: !item.is_visible })}
                          className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold cursor-pointer ${
                            item.is_visible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {item.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                        {item.is_featured && (
                          <span className="px-1.5 py-0.5 rounded bg-[#C9A86A]/10 text-[#C9A86A] text-[8px] uppercase tracking-wider font-bold border border-[#C9A86A]/20">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenTestimonialModal(item)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-[#C9A86A] cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(item)}
                          className="p-1 rounded hover:bg-red-950/20 text-gray-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            TAB: FOOTER & SOCIAL LINKS
            ==================================================== */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Footer settings card */}
            <div className="lg:col-span-1 rounded-xl border border-gray-855 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800 pb-3 flex items-center gap-2">
                <Settings className="h-4.5 w-4.5" /> Footer Brand Setup
              </h3>

              <div className="space-y-4">
                <Textarea
                  label="Footer Brand Statement"
                  value={footer.brand_statement}
                  onChange={(e) => setFooter({ ...footer, brand_statement: e.target.value })}
                  rows={3}
                />

                <Input
                  label="Copyright Template Text"
                  value={footer.copyright_text}
                  onChange={(e) => setFooter({ ...footer, copyright_text: e.target.value })}
                  helperText="Use {year} to dynamically insert the current year."
                />

                <Input
                  label="Privacy Policy URL"
                  value={footer.privacy_policy_url}
                  onChange={(e) => setFooter({ ...footer, privacy_policy_url: e.target.value })}
                />

                <Input
                  label="Terms & Conditions URL"
                  value={footer.terms_conditions_url}
                  onChange={(e) => setFooter({ ...footer, terms_conditions_url: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800/60">
                <Button
                  onClick={() => handleSaveSingleton('footer_settings', footer)}
                  disabled={saving}
                  variant="accent"
                  className="bg-[#C9A86A] text-[#111111] font-bold w-full"
                >
                  {saving ? 'Saving...' : 'Save Footer'}
                </Button>
              </div>
            </div>

            {/* Social Links reorderable manager */}
            <div className="lg:col-span-2 rounded-xl border border-gray-855 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="font-serif text-base font-semibold text-[#C9A86A] flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5" /> Social Media Links
                </h3>
                <Button
                  onClick={handleAddSocialLink}
                  variant="outline"
                  size="sm"
                  className="border-gray-800 text-[#C9A86A] hover:bg-gray-900 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Profile
                </Button>
              </div>

              {socialLinks.length === 0 ? (
                <p className="text-xs text-gray-555 italic text-center py-6">No social profiles configured in DB.</p>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link, idx) => (
                    <div 
                      key={link.id} 
                      className="p-4 rounded-lg bg-[#111111] border border-gray-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-xs text-[#C9A86A] font-bold">#{idx + 1}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                          <div className="space-y-1">
                            <select
                              value={link.platform}
                              onChange={(e) => handleSaveListItem('social_links', link.id, { platform: e.target.value })}
                              className="w-full rounded border border-gray-800 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="facebook">Facebook</option>
                              <option value="pinterest">Pinterest</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="youtube">YouTube</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <input
                              value={link.url}
                              onChange={(e) => handleSaveListItem('social_links', link.id, { url: e.target.value })}
                              className="w-full rounded border border-gray-800 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white outline-none"
                              placeholder="https://instagram.com/profile"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <button
                          onClick={() => handleSaveListItem('social_links', link.id, { is_active: !link.is_active })}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer ${
                            link.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {link.is_active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleMoveListItem('social_links', socialLinks, idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveListItem('social_links', socialLinks, idx, 'down')}
                          disabled={idx === socialLinks.length - 1}
                          className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteListItem('social_links', link.id)}
                          className="p-1 rounded bg-red-950/20 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Testimonial Dialog Modal */}
      {testimonialModalOpen && editingTestimonial && (
        <Modal
          isOpen={true}
          onClose={() => setTestimonialModalOpen(false)}
          title={editingTestimonial.id ? 'Edit Testimonial Details' : 'Add New Client Review'}
          className="max-w-md text-white border-gray-850"
        >
          <form onSubmit={handleSaveTestimonial} className="space-y-4 pt-2 font-sans">
            <Input
              label="Client Name"
              value={editingTestimonial.client_name}
              onChange={(e) => setEditingTestimonial({ ...editingTestimonial, client_name: e.target.value })}
              required
            />

            <Input
              label="Client Designation / Title"
              value={editingTestimonial.designation || ''}
              onChange={(e) => setEditingTestimonial({ ...editingTestimonial, designation: e.target.value })}
              placeholder="e.g. Regular Client / Art Curator"
            />

            <div className="space-y-1.5">
              <Label>Client Review Text</Label>
              <textarea
                value={editingTestimonial.review_text}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, review_text: e.target.value })}
                required
                rows={4}
                className="w-full rounded border border-gray-800 bg-[#111111] p-3 text-xs text-white outline-none focus:border-[#C9A86A]"
                placeholder="Write the client's detailed review..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rating Score (1-5 Stars)</Label>
                <select
                  value={editingTestimonial.rating}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })}
                  className="w-full rounded border border-gray-800 bg-[#111111] p-2 text-xs text-white outline-none"
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded border border-gray-850 bg-[#111111] mt-5">
                <span className="text-xs text-gray-400">Featured Review</span>
                <input
                  type="checkbox"
                  checked={editingTestimonial.is_featured}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, is_featured: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-800 bg-gray-900 accent-[#C9A86A] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestimonialModalOpen(false)}
                className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="bg-[#C9A86A] text-[#111111] font-bold cursor-pointer"
              >
                Save Review
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
