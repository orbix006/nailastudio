'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/FormControls';
import { MediaSelector } from '@/components/admin/MediaSelector';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { logAdminAction } from '@/lib/supabase/audit';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  Check,
  Loader2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

interface SeoMetadataRecord {
  id: string;
  page_slug: string;
  title: string;
  meta_description: string | null;
  robots_directive: string | null;
  canonical_url: string | null;
  facebook_image_id: string | null;
  twitter_card_type: string | null;
  twitter_image_id: string | null;
  json_ld: Record<string, unknown> | null;
  updated_at: string;
}

const PRESET_PAGES = [
  { label: 'Homepage (/)', value: 'home' },
  { label: 'About Section', value: 'about' },
  { label: 'Contact Section', value: 'contact' },
  { label: 'Services List', value: 'services' },
  { label: 'Portfolio List', value: 'portfolio' },
];

export default function SeoManagementPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [records, setRecords] = useState<SeoMetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<SeoMetadataRecord | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    page_slug: '',
    title: '',
    meta_description: '',
    robots_directive: 'index, follow',
    canonical_url: '',
    facebook_image_id: null as string | null,
    twitter_card_type: 'summary_large_image',
    twitter_image_id: null as string | null,
    og_title: '',
    og_description: '',
    keywords: '',
    structured_data_raw: '',
  });

  // Previews State
  const [fbImageUrl, setFbImageUrl] = useState<string | null>(null);
  const [twImageUrl, setTwImageUrl] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'google' | 'facebook' | 'twitter'>('google');

  // Load All SEO Records
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('page_slug', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: unknown) {
      console.error('Failed to load SEO metadata:', err);
      toast('Failed to load SEO records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Resolve Facebook share preview image URL in real-time
  useEffect(() => {
    if (!formData.facebook_image_id) {
      setFbImageUrl(null);
      return;
    }
    supabase
      .from('media_library')
      .select('public_url')
      .eq('id', formData.facebook_image_id)
      .maybeSingle()
      .then(({ data }) => {
        setFbImageUrl(data?.public_url || null);
      });
  }, [formData.facebook_image_id, supabase]);

  // Resolve Twitter preview image URL in real-time
  useEffect(() => {
    if (!formData.twitter_image_id) {
      setTwImageUrl(null);
      return;
    }
    supabase
      .from('media_library')
      .select('public_url')
      .eq('id', formData.twitter_image_id)
      .maybeSingle()
      .then(({ data }) => {
        setTwImageUrl(data?.public_url || null);
      });
  }, [formData.twitter_image_id, supabase]);

interface SeoJsonLd {
  og_title?: string;
  og_description?: string;
  keywords?: string;
  structured_data?: Record<string, unknown>;
}

  // Open Editor for Creating/Editing
  const openEditor = (record: SeoMetadataRecord | null = null) => {
    setActiveRecord(record);
    if (record) {
      // Unpack JSONB column properties
      const jsonLd = (record.json_ld as unknown as SeoJsonLd) || {};
      const ogTitle = jsonLd.og_title || '';
      const ogDesc = jsonLd.og_description || '';
      const keywords = jsonLd.keywords || '';
      const structuredData = jsonLd.structured_data
        ? JSON.stringify(jsonLd.structured_data, null, 2)
        : '';

      setFormData({
        page_slug: record.page_slug,
        title: record.title,
        meta_description: record.meta_description || '',
        robots_directive: record.robots_directive || 'index, follow',
        canonical_url: record.canonical_url || '',
        facebook_image_id: record.facebook_image_id,
        twitter_card_type: record.twitter_card_type || 'summary_large_image',
        twitter_image_id: record.twitter_image_id,
        og_title: ogTitle,
        og_description: ogDesc,
        keywords,
        structured_data_raw: structuredData,
      });
    } else {
      setFormData({
        page_slug: '',
        title: '',
        meta_description: '',
        robots_directive: 'index, follow',
        canonical_url: '',
        facebook_image_id: null,
        twitter_card_type: 'summary_large_image',
        twitter_image_id: null,
        og_title: '',
        og_description: '',
        keywords: '',
        structured_data_raw: '',
      });
    }
    setModalOpen(true);
  };

  // Handle Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.page_slug.trim() || !formData.title.trim()) {
      toast('Page slug and Title are required.', 'error');
      return;
    }

    // Uniqueness validation on local memory before querying
    const cleanedSlug = formData.page_slug.trim().toLowerCase().replace(/^\/+/, '');
    if (!activeRecord) {
      const exists = records.some(
        (r) => r.page_slug.trim().toLowerCase().replace(/^\/+/, '') === cleanedSlug
      );
      if (exists) {
        toast('An SEO record with this page slug already exists. Please edit it instead.', 'error');
        return;
      }
    }

    // Validate structured JSON-LD data
    let parsedStructuredData = null;
    if (formData.structured_data_raw.trim()) {
      try {
        parsedStructuredData = JSON.parse(formData.structured_data_raw);
      } catch {
        toast('Invalid JSON syntax in Structured JSON-LD field. Please correct it.', 'error');
        return;
      }
    }

    try {
      setSaving(true);

      const json_ld_payload = {
        og_title: formData.og_title.trim() || null,
        og_description: formData.og_description.trim() || null,
        keywords: formData.keywords.trim() || null,
        structured_data: parsedStructuredData,
      };

      const payload = {
        page_slug: cleanedSlug,
        title: formData.title.trim(),
        meta_description: formData.meta_description.trim() || null,
        robots_directive: formData.robots_directive,
        canonical_url: formData.canonical_url.trim() || null,
        facebook_image_id: formData.facebook_image_id,
        twitter_card_type: formData.twitter_card_type,
        twitter_image_id: formData.twitter_image_id,
        json_ld: json_ld_payload,
        updated_at: new Date().toISOString(),
      };

      if (activeRecord) {
        // Update record
        const { error } = await supabase
          .from('seo_metadata')
          .update(payload)
          .eq('id', activeRecord.id);

        if (error) throw error;

        await logAdminAction('update', 'seo_metadata', activeRecord.id, { page_slug: cleanedSlug });
        toast('SEO metadata updated successfully.', 'success');
      } else {
        // Insert record
        const { data, error } = await supabase
          .from('seo_metadata')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;

        await logAdminAction('insert', 'seo_metadata', data.id, { page_slug: cleanedSlug });
        toast('SEO metadata created successfully.', 'success');
      }

      setModalOpen(false);
      loadRecords();
    } catch (err: unknown) {
      console.error('Failed to save SEO metadata:', err);
      if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
        toast('Uniqueness Conflict: This page slug is already registered.', 'error');
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to save SEO record.';
        toast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Delete
  const handleDelete = async (record: SeoMetadataRecord) => {
    if (!confirm(`Are you sure you want to delete the SEO configurations for "/${record.page_slug}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('seo_metadata')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      await logAdminAction('delete', 'seo_metadata', record.id, { page_slug: record.page_slug });
      toast('SEO metadata record deleted.', 'success');
      loadRecords();
    } catch (err: unknown) {
      console.error('Failed to delete SEO metadata:', err);
      toast('Failed to delete SEO record.', 'error');
    }
  };

  // Filter records by search text
  const filteredRecords = records.filter(
    (r) =>
      r.page_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.meta_description && r.meta_description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 font-sans text-white pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/60 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Site Optimization
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">
            SEO Metadata Manager
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Configure dynamic search engine results, social media metadata embeds, robots crawler permissions, and structured schemas.
          </p>
        </div>

        <Button
          onClick={() => openEditor(null)}
          variant="secondary"
          className="flex items-center gap-1.5 self-start sm:self-center font-bold tracking-wide text-xs"
        >
          <Plus className="h-4 w-4" /> Add SEO Record
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex items-center bg-[#1A1A1A] p-4 rounded-xl border border-gray-800/60 gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by page slug, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-gray-850 focus:border-[#C9A86A] rounded-lg text-xs placeholder-gray-600 text-white outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between pt-2 border-t border-gray-850">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No SEO Metadata Found"
          description={
            searchQuery
              ? 'No records matched your search parameters. Try a different query.'
              : 'Configure search optimization definitions. Click "+ Add SEO Record" to start.'
          }
          actionText={searchQuery ? 'Clear Search' : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const isNoIndex = record.robots_directive ? record.robots_directive.includes('noindex') : false;
            const hasSocialImg = record.facebook_image_id || record.twitter_image_id;

            return (
              <Card
                key={record.id}
                hoverEffect
                className="p-6 flex flex-col justify-between border border-[#C9A86A]/10 bg-[#1A1A1A] hover:border-[#C9A86A]/30 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Slug / Routing title */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-850 pb-2">
                    <span className="font-mono text-xs font-bold text-[#C9A86A] truncate">
                      /{record.page_slug}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isNoIndex ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isNoIndex ? 'NoIndex' : 'Indexable'}
                    </span>
                  </div>

                  {/* SEO Metadata summary */}
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-white leading-tight line-clamp-1">
                      {record.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {record.meta_description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Checklist indicators */}
                  <div className="flex flex-wrap gap-2 pt-2 text-[9px] font-bold tracking-wider uppercase text-gray-500">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded bg-gray-850 ${
                        record.canonical_url ? 'text-[#C9A86A]' : 'text-gray-600'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" /> Canonical
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded bg-gray-850 ${
                        hasSocialImg ? 'text-[#C9A86A]' : 'text-gray-600'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" /> Social OG
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded bg-gray-850 ${
                        record.json_ld?.structured_data ? 'text-[#C9A86A]' : 'text-gray-600'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" /> JSON-LD
                    </span>
                  </div>
                </div>

                {/* Card controls */}
                <div className="flex items-center justify-between border-t border-gray-850 mt-6 pt-4">
                  <a
                    href={
                      record.page_slug === 'home' || record.page_slug === '/'
                        ? '/'
                        : `/${record.page_slug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-wider transition-colors"
                  >
                    View Page <ExternalLink className="h-3 w-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditor(record)}
                      className="p-1.5 text-gray-400 hover:text-[#C9A86A] rounded-lg hover:bg-gray-800/60 transition-all cursor-pointer"
                      title="Edit settings"
                      aria-label="Edit settings"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record)}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800/60 transition-all cursor-pointer"
                      title="Delete record"
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Modal (xl size side-by-side Form + Live Previews) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="xl"
        title={activeRecord ? `Edit SEO: /${activeRecord.page_slug}` : 'Create SEO Record'}
        description="Fill out page metadata. Real-time visual sharing previews are displayed in the right column."
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Column 1: Editable inputs */}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {/* Slug */}
            <div>
              <Label htmlFor="page_slug" required>
                Page Slug
              </Label>
              {activeRecord ? (
                <Input
                  id="page_slug"
                  value={formData.page_slug}
                  disabled
                  className="opacity-60 cursor-not-allowed select-none bg-gray-900 border-gray-800"
                />
              ) : (
                <div className="space-y-1 mt-1">
                  <Input
                    id="page_slug"
                    placeholder="e.g. contact, services/lux-manicure"
                    value={formData.page_slug}
                    onChange={(e) => setFormData({ ...formData, page_slug: e.target.value })}
                    required
                    helperText="Avoid leading slashes. Matching examples: 'about', 'services/gel-extensions'."
                  />
                  {/* Presets shortcut selector */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_PAGES.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, page_slug: preset.value })}
                        className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#111] hover:bg-gray-800 border border-gray-800 rounded transition-all text-gray-400 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <Input
              label="Page Meta Title"
              placeholder="e.g. Luxury Nail Care & Artistry | The Nailaa Studio"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={70}
              helperText={`${formData.title.length}/70 characters (recommended: 50-60)`}
            />

            {/* Meta Description */}
            <Textarea
              label="Meta Description"
              placeholder="Provide a concise description of this page's content for search snippets..."
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={3}
              maxLength={160}
              helperText={`${formData.meta_description.length}/160 characters (recommended: 120-150)`}
            />

            {/* Keywords */}
            <Input
              label="Focus Keywords"
              placeholder="manicure, nail art studio, premium gel nails"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              helperText="Comma-separated keywords list used in search indexing."
            />

            {/* Robots Directive */}
            <div className="space-y-1.5">
              <Label htmlFor="robots_directive">Robots Crawler Permissions</Label>
              <select
                id="robots_directive"
                value={formData.robots_directive}
                onChange={(e) => setFormData({ ...formData, robots_directive: e.target.value })}
                className="w-full rounded-md border border-gray-800 bg-[#111] px-4 py-2.5 text-xs text-white outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] transition-all"
              >
                <option value="index, follow">Index and Follow (Default)</option>
                <option value="noindex, nofollow">NoIndex, NoFollow (Private/Utility pages)</option>
                <option value="index, nofollow">Index, NoFollow</option>
                <option value="noindex, follow">NoIndex, Follow</option>
              </select>
            </div>

            {/* Canonical URL Override */}
            <Input
              label="Canonical URL Override"
              placeholder="e.g. https://thenailaastudio.com/services/nail-spa"
              value={formData.canonical_url}
              onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
              helperText="Overrides the default dynamic path logic. Resolves indexing duplicates."
            />

            {/* Social Share / Facebook Image */}
            <div className="space-y-1 bg-[#111111]/30 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] block mb-2 font-mono">
                OpenGraph Settings (Facebook/LinkedIn)
              </span>
              <Input
                label="Custom OpenGraph Title"
                placeholder={formData.title || 'Page Title'}
                value={formData.og_title}
                onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
              />
              <Textarea
                label="Custom OpenGraph Description"
                placeholder={formData.meta_description || 'Meta Description'}
                value={formData.og_description}
                onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                rows={2}
              />
              <div className="pt-2">
                <MediaSelector
                  label="OpenGraph Social Image (1200x630px)"
                  value={formData.facebook_image_id}
                  onChange={(id) => setFormData({ ...formData, facebook_image_id: id })}
                />
              </div>
            </div>

            {/* Twitter Social Image */}
            <div className="space-y-1 bg-[#111111]/30 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] block mb-2 font-mono">
                Twitter/X Card Settings
              </span>
              <div className="space-y-1.5 mb-2">
                <Label htmlFor="twitter_card_type">Twitter Card Layout</Label>
                <select
                  id="twitter_card_type"
                  value={formData.twitter_card_type}
                  onChange={(e) => setFormData({ ...formData, twitter_card_type: e.target.value })}
                  className="w-full rounded-md border border-gray-800 bg-[#111] px-4 py-2 text-xs text-white outline-none focus:border-[#C9A86A] transition-all"
                >
                  <option value="summary_large_image">Summary Card with Large Image (1200x630)</option>
                  <option value="summary">Summary Card (Square Image Thumbnail)</option>
                </select>
              </div>
              <MediaSelector
                label="Twitter Social Image"
                value={formData.twitter_image_id}
                onChange={(id) => setFormData({ ...formData, twitter_image_id: id })}
              />
            </div>

            {/* Structured Schema JSON-LD */}
            <div className="space-y-1">
              <Label htmlFor="structured_data_raw" className="flex items-center gap-1.5">
                Custom Structured JSON-LD Data <span title="Add structured schema.org markup (e.g. LocalBusiness, FAQPage, etc.) as raw JSON."><HelpCircle className="h-3.5 w-3.5 text-gray-500" /></span>
              </Label>
              <Textarea
                id="structured_data_raw"
                placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}`}
                value={formData.structured_data_raw}
                onChange={(e) => setFormData({ ...formData, structured_data_raw: e.target.value })}
                rows={5}
                className="font-mono text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-850 sticky bottom-0 bg-[#1A1A1A] pb-2 z-10">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>

          {/* Column 2: Live previews */}
          <div className="space-y-6">
            <div className="border-b border-gray-850 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-3 font-mono">
                Visual Share Card Previews
              </span>
              {/* Preview selector tabs */}
              <div className="flex bg-[#111] p-1 rounded-lg border border-gray-850 self-start">
                {(['google', 'facebook', 'twitter'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPreviewTab(tab)}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      previewTab === tab
                        ? 'bg-[#C9A86A] text-[#111111]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'google' ? 'Google' : tab === 'facebook' ? 'Facebook' : 'Twitter/X'}
                  </button>
                ))}
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="p-4 rounded-xl border border-gray-850 bg-[#111] min-h-[300px] flex items-center justify-center">
              {/* Google Preview */}
              {previewTab === 'google' && (
                <div className="w-full space-y-1 font-sans text-left">
                  <span className="text-[10px] text-gray-500 font-mono block">
                    https://thenailaastudio.com/{formData.page_slug || 'page'}
                  </span>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-[#8AB4F8] hover:underline text-lg leading-tight font-medium block"
                  >
                    {formData.title || 'Please enter a page title...'}
                  </a>
                  <p className="text-gray-400 text-xs leading-normal">
                    {formData.meta_description || 'Please enter a meta description to populate the search snippet for search engine crawlers.'}
                  </p>
                </div>
              )}

              {/* Facebook Card Preview */}
              {previewTab === 'facebook' && (
                <div className="w-full rounded-lg border border-gray-800 bg-[#1A1A1A] overflow-hidden text-left shadow-lg">
                  {/* Image wrapper */}
                  <div className="relative aspect-[1.91/1] w-full bg-[#111] flex items-center justify-center">
                    {fbImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={fbImageUrl}
                        alt="Facebook Social Share Preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Globe className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">
                          No OG Image Selected
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Share info box */}
                  <div className="p-3 bg-[#242526] border-t border-gray-850 text-xs">
                    <span className="text-gray-400 text-[10px] font-mono uppercase block">
                      THENAILAASTUDIO.COM
                    </span>
                    <h4 className="font-bold text-white mt-1 text-sm line-clamp-1">
                      {formData.og_title || formData.title || 'OG Sharing Title Override'}
                    </h4>
                    <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                      {formData.og_description || formData.meta_description || 'Select custom social meta description to populate this share card snippet.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Twitter Card Preview */}
              {previewTab === 'twitter' && (
                <div className="w-full text-left">
                  {formData.twitter_card_type === 'summary_large_image' ? (
                    /* Large Card Layout */
                    <div className="rounded-2xl border border-gray-800 bg-[#15181C] overflow-hidden shadow-lg">
                      <div className="relative aspect-[1.91/1] w-full bg-[#111] flex items-center justify-center">
                        {twImageUrl || fbImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={twImageUrl || fbImageUrl || ''}
                            alt="Twitter Social Share Preview"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Globe className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">
                              No Twitter Image Selected
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-850">
                        <span className="text-gray-500 text-[10px] font-mono block">
                          thenailaastudio.com
                        </span>
                        <h4 className="font-bold text-white mt-1 text-xs line-clamp-1">
                          {formData.og_title || formData.title || 'Twitter Card Title'}
                        </h4>
                        <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-normal">
                          {formData.og_description || formData.meta_description || 'Twitter summary description details...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Summary Small Card Layout */
                    <div className="flex rounded-2xl border border-gray-800 bg-[#15181C] overflow-hidden shadow-lg aspect-[3/1] w-full">
                      <div className="relative aspect-square h-full w-28 bg-[#111] shrink-0 flex items-center justify-center">
                        {twImageUrl || fbImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={twImageUrl || fbImageUrl || ''}
                            alt="Twitter Social Share Thumbnail"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Globe className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="p-3 flex flex-col justify-center min-w-0 border-l border-gray-850">
                        <span className="text-gray-500 text-[10px] font-mono block">
                          thenailaastudio.com
                        </span>
                        <h4 className="font-bold text-white mt-0.5 text-xs truncate">
                          {formData.og_title || formData.title || 'Twitter Card Title'}
                        </h4>
                        <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-2 leading-normal">
                          {formData.og_description || formData.meta_description || 'Twitter summary description...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Keyword tags helper */}
            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800/60 text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-white block mb-1 font-mono uppercase tracking-wider text-[10px]">
                Focus Keywords Tips
              </span>
              Add 3-5 focus search keywords separated by commas. These will be output as the `keywords` HTML header parameter to improve crawler tags relevance mapping.
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
