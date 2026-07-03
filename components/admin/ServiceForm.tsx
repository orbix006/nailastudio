'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Input, Textarea, Label } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { 
  Upload, Scissors, ArrowLeft, Loader2, Plus, Trash2, 
  ArrowUp, ArrowDown, ImageIcon, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

// Zod Schema matching database constraints
const serviceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and single hyphens (e.g., bespoke-manicures)'),
  short_description: z.string().min(10, 'Short Description must be at least 10 characters'),
  detailed_overview: z.string().optional(),
  design_approach: z.string().optional(),
  materials_finishes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface FeatureItem {
  id?: string;
  feature: string;
  display_order: number;
}

interface GalleryImageItem {
  id?: string;
  media_id: string;
  public_url: string;
  display_order: number;
  file_name?: string;
}

interface ImageRowResult {
  id: string;
  service_id: string;
  media_id: string;
  display_order: number;
  media_library: {
    public_url: string;
    storage_path: string;
  } | null;
}

interface ServiceFormProps {
  serviceId?: string; // If provided, we are in EDIT mode
}

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const isEditMode = !!serviceId;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  // Custom states for features, cover image, and gallery images
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  
  const [coverImage, setCoverImage] = useState<{ id: string; url: string } | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      slug: '',
      short_description: '',
      detailed_overview: '',
      design_approach: '',
      materials_finishes: '',
    },
  });

  const titleValue = watch('title');

  // Fetch admin profile
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    checkUser();
  }, [supabase.auth]);

  // Fetch service data if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchServiceData = async () => {
      try {
        setLoading(true);

        // 1. Fetch main service record
        const { data: service, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) throw error;
        if (!service) {
          toast('Service not found or has been deleted.', 'error');
          router.push('/admin/services');
          return;
        }

        // Set form fields
        setValue('title', service.title);
        setValue('slug', service.slug);
        setValue('short_description', service.short_description);
        setValue('detailed_overview', service.detailed_overview || '');
        setValue('design_approach', service.design_approach || '');
        setValue('materials_finishes', service.materials_finishes || '');

        // 2. Fetch cover image details if set
        if (service.cover_image_id) {
          const { data: media } = await supabase
            .from('media_library')
            .select('public_url')
            .eq('id', service.cover_image_id)
            .maybeSingle();
          if (media) {
            setCoverImage({ id: service.cover_image_id, url: media.public_url });
          }
        }

        // 3. Fetch features
        const { data: featureRows } = await supabase
          .from('service_features')
          .select('*')
          .eq('service_id', serviceId)
          .order('display_order', { ascending: true });
        
        if (featureRows) {
          setFeatures(featureRows.map((f, i) => ({
            id: f.id,
            feature: f.feature,
            display_order: f.display_order ?? i,
          })));
        }

        // 4. Fetch gallery images
        const { data: imageRows } = await supabase
          .from('service_images')
          .select('*, media_library(public_url, storage_path)')
          .eq('service_id', serviceId)
          .order('display_order', { ascending: true });

        if (imageRows) {
          const loadedGallery = ((imageRows as unknown as ImageRowResult[]) || []).map((row) => {
            const media = row.media_library;
            return {
              id: row.id,
              media_id: row.media_id,
              public_url: media?.public_url || '',
              display_order: row.display_order ?? 0,
              file_name: media?.storage_path ? media.storage_path.split('/').pop() : 'image',
            };
          });
          setGalleryImages(loadedGallery);
        }

      } catch (err: unknown) {
        console.error('Error fetching service:', err);
        toast('Failed to load service data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId, isEditMode, router, setValue, supabase, toast]);

  // Slug generator helper
  const handleGenerateSlug = () => {
    if (!titleValue) {
      toast('Please enter a title first to generate a slug.', 'info');
      return;
    }
    const generated = titleValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('slug', generated, { shouldValidate: true });
  };

  // Hashing helper
  const computeSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Read dimensions helper
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
    });
  };

  // Upload/Deduplicate Image handler
  const handleUploadImage = async (file: File) => {
    // 1. Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('Supported file types: JPEG, PNG, WEBP.', 'error');
      return null;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast('Max file size limit is 10MB.', 'error');
      return null;
    }

    try {
      // 2. Compute Checksum client-side
      const checksum = await computeSHA256(file);

      // 3. Search database for an active media item matching this checksum
      const { data: existingMedia } = await supabase
        .from('media_library')
        .select('id, public_url')
        .eq('checksum_sha256', checksum)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingMedia) {
        toast('Identical image found in library. Reusing existing asset.', 'info');
        return { id: existingMedia.id, url: existingMedia.public_url, filename: file.name };
      }

      // 4. If not duplicate, upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${checksum}.${fileExt}`;
      const storagePath = `services/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 5. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(storagePath);

      // 6. Read dimensions
      const dimensions = await getImageDimensions(file);

      // 7. Register in media_library
      const { data: newMedia, error: dbError } = await supabase
        .from('media_library')
        .insert({
          bucket: 'services',
          storage_path: storagePath,
          public_url: publicUrl,
          mime_type: file.type,
          file_size_bytes: file.size,
          width_px: dimensions.width || null,
          height_px: dimensions.height || null,
          alt_text: file.name,
          checksum_sha256: checksum,
          uploaded_by: adminUser?.id || null,
        })
        .select('id, public_url')
        .single();

      if (dbError) throw dbError;

      toast('Image uploaded and registered successfully.', 'success');
      return { id: newMedia.id, url: newMedia.public_url, filename: file.name };
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      toast('Failed to upload image.', 'error');
      return null;
    }
  };

  // Cover image change handler
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverLoading(true);
    const uploaded = await handleUploadImage(file);
    if (uploaded) {
      setCoverImage({ id: uploaded.id, url: uploaded.url });
    }
    setCoverLoading(false);
  };

  // Gallery images change handler
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryLoading(true);
    let successCount = 0;

    for (const file of files) {
      const uploaded = await handleUploadImage(file);
      if (uploaded) {
        successCount++;
        setGalleryImages((prev) => [
          ...prev,
          {
            media_id: uploaded.id,
            public_url: uploaded.url,
            display_order: prev.length,
            file_name: uploaded.filename,
          },
        ]);
      }
    }

    if (successCount > 0) {
      toast(`Added ${successCount} image(s) to gallery.`, 'success');
    }
    setGalleryLoading(false);
  };

  // Gallery order handlers
  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;

    const updated = [...galleryImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate display orders sequentially
    const reordered = updated.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setGalleryImages(reordered);
  };

  const removeGalleryImage = (index: number) => {
    const filtered = galleryImages.filter((_, idx) => idx !== index);
    // Recalculate display orders sequentially
    const reordered = filtered.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setGalleryImages(reordered);
  };

  // Feature operations handlers
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    
    // Validate uniqueness of feature text per service (constraint uq in db)
    const exists = features.some(
      (f) => f.feature.toLowerCase() === newFeatureText.trim().toLowerCase()
    );

    if (exists) {
      toast('This highlight bullet already exists for this service.', 'info');
      return;
    }

    setFeatures((prev) => [
      ...prev,
      {
        feature: newFeatureText.trim(),
        display_order: prev.length,
      },
    ]);
    setNewFeatureText('');
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;

    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setFeatures(reordered);
  };

  const removeFeature = (index: number) => {
    const filtered = features.filter((_, idx) => idx !== index);
    const reordered = filtered.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setFeatures(reordered);
  };

  // Submit/Save Form Handler
  const onSubmit = async (values: ServiceFormValues) => {
    try {
      setSaving(true);

      // Verify slug uniqueness in database (if slug changed or new service)
      const slugQuery = supabase
        .from('services')
        .select('id')
        .eq('slug', values.slug)
        .is('deleted_at', null);
      
      if (isEditMode) {
        slugQuery.neq('id', serviceId);
      }

      const { data: existingSlug } = await slugQuery.maybeSingle();
      if (existingSlug) {
        toast('This URL Slug is already taken by another active service.', 'error');
        setSaving(false);
        return;
      }

      let activeServiceId = serviceId;

      if (isEditMode) {
        // 1. Update existing service details
        const { error } = await supabase
          .from('services')
          .update({
            title: values.title,
            slug: values.slug,
            short_description: values.short_description,
            detailed_overview: values.detailed_overview || null,
            design_approach: values.design_approach || null,
            materials_finishes: values.materials_finishes || null,
            cover_image_id: coverImage?.id || null,
            updated_by: adminUser?.id || null,
          })
          .eq('id', serviceId);

        if (error) throw error;
      } else {
        // Get max display order to put new service at bottom
        const { data: maxOrderData } = await supabase
          .from('services')
          .select('display_order')
          .is('deleted_at', null)
          .order('display_order', { ascending: false })
          .limit(1);
        
        const nextOrder = maxOrderData && maxOrderData[0] 
          ? (maxOrderData[0].display_order + 1) 
          : 0;

        // 2. Insert new service details
        const { data: newService, error } = await supabase
          .from('services')
          .insert({
            title: values.title,
            slug: values.slug,
            short_description: values.short_description,
            detailed_overview: values.detailed_overview || null,
            design_approach: values.design_approach || null,
            materials_finishes: values.materials_finishes || null,
            cover_image_id: coverImage?.id || null,
            display_order: nextOrder,
            is_visible: true,
            created_by: adminUser?.id || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        activeServiceId = newService.id;
      }

      // Sync service highlights / features
      // 1. Clear old features
      const { error: featDeleteError } = await supabase
        .from('service_features')
        .delete()
        .eq('service_id', activeServiceId);
      
      if (featDeleteError) throw featDeleteError;

      // 2. Insert new features list
      if (features.length > 0) {
        const featuresToInsert = features.map((f, index) => ({
          service_id: activeServiceId!,
          feature: f.feature,
          display_order: index,
        }));

        const { error: featInsertError } = await supabase
          .from('service_features')
          .insert(featuresToInsert);

        if (featInsertError) throw featInsertError;
      }

      // Sync service extra gallery images
      // 1. Clear old gallery references
      const { error: imgDeleteError } = await supabase
        .from('service_images')
        .delete()
        .eq('service_id', activeServiceId);

      if (imgDeleteError) throw imgDeleteError;

      // 2. Insert new gallery list references
      if (galleryImages.length > 0) {
        const galleryToInsert = galleryImages.map((img, index) => ({
          service_id: activeServiceId!,
          media_id: img.media_id,
          display_order: index,
        }));

        const { error: imgInsertError } = await supabase
          .from('service_images')
          .insert(galleryToInsert);

        if (imgInsertError) throw imgInsertError;
      }

      toast(
        `Service "${values.title}" has been successfully ${isEditMode ? 'updated' : 'created'}.`,
        'success'
      );
      
      router.push('/admin/services');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving service:', err);
      toast('Failed to save service. Please verify fields and try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
        <span className="text-xs tracking-widest uppercase text-gray-500 font-sans">
          Loading Service Blueprint...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/services"
          className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1">
            <Scissors className="h-3 w-3" /> Services Catalog
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            {isEditMode ? 'Edit Treatment' : 'Add New Treatment'}
          </h1>
        </div>
      </div>

      {/* Main Form Split */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Copy Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800/80 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Treatment Specifications
            </h3>
            
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('title')}
                label="Treatment Title"
                placeholder="e.g. Bespoke Shellac Manicure"
                error={errors.title?.message}
              />
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label error={!!errors.slug}>URL Slug Path</Label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors focus:outline-none cursor-pointer"
                  >
                    Generate from Title
                  </button>
                </div>
                <input
                  {...register('slug')}
                  placeholder="bespoke-shellac-manicure"
                  className={`w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all focus:ring-1 focus:ring-opacity-50 ${
                    errors.slug
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]'
                  }`}
                />
                {errors.slug && (
                  <span className="text-xs text-red-400 mt-1 block">{errors.slug.message}</span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <Textarea
              {...register('short_description')}
              label="Short Summary description"
              placeholder="Precision shaping, cuticles removal, and signature styling that flatters natural hand angles..."
              error={errors.short_description?.message}
              rows={3}
              helperText="Brief summary shown on the overview listing pages."
            />

            {/* Detailed Overview */}
            <Textarea
              {...register('detailed_overview')}
              label="Detailed Overview Description (Optional)"
              placeholder="An extended luxurious nail treatment introducing specialized nourishing hot mud wraps, signature geometric file vectors, cuticle line conditioning..."
              error={errors.detailed_overview?.message}
              rows={5}
              helperText="Detailed treatment parameters shown in the detail preview overlay modal."
            />

            {/* Artistry & Wellness split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800/40">
              <Textarea
                {...register('design_approach')}
                label="Artistry & Design Approach (Optional)"
                placeholder="We prioritize natural vectors, color matching undertones to create slender visual lines..."
                error={errors.design_approach?.message}
                rows={4}
                helperText="How the styling / artistry is modeled."
              />
              <Textarea
                {...register('materials_finishes')}
                label="Wellness & Materials (Optional)"
                placeholder="Non-toxic base coats, organic skin hydration creams, premium hybrid gels..."
                error={errors.materials_finishes?.message}
                rows={4}
                helperText="Hypoallergenic oils, chrome pigments, etc."
              />
            </div>
          </div>
        </div>

        {/* Right Side: Media upload and features builder */}
        <div className="space-y-6">
          
          {/* Cover Image Card */}
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-800/80 pb-2">
              Cover Image
            </h3>
            
            {coverLoading ? (
              <div className="h-44 rounded-lg bg-gray-900 border border-dashed border-gray-800 flex flex-col items-center justify-center space-y-2 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A86A]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Processing Asset...</span>
              </div>
            ) : coverImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-800 bg-gray-900 aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage.url}
                  alt="Cover Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-xs uppercase tracking-wider transition-opacity duration-200 cursor-pointer"
                >
                  Remove Cover Image
                </button>
              </div>
            ) : (
              <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-800 bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#C9A86A]/30 transition-all text-center p-4">
                <Upload className="h-8 w-8 text-gray-600 mb-2" />
                <span className="text-xs font-semibold text-gray-300">Upload Cover Photo</span>
                <span className="text-[10px] text-gray-500 mt-1 max-w-[180px]">
                  JPEG, PNG or WEBP (Max 10MB). Image dimensions are auto-extracted.
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Highlights & Features Card */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-850/80 pb-2">
              Treatment Highlights
            </h3>
            
            {/* Feature input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Cuticle Detailing"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 rounded border border-gray-800 bg-[#111111] px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#C9A86A]"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="rounded bg-[#C9A86A] p-2 text-[#111111] hover:bg-[#C9A86A]/90 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Feature listing */}
            {features.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">No highlights added yet. Add bullet highlights to display.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[#111111] border border-gray-850 text-xs"
                  >
                    <span className="truncate pr-2 text-gray-300 font-light">{feat.feature}</span>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveFeature(idx, 'up')}
                        disabled={idx === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none focus:outline-none cursor-pointer"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeature(idx, 'down')}
                        disabled={idx === features.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none focus:outline-none cursor-pointer"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-gray-500 hover:text-red-400 focus:outline-none cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gallery Images Card */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-850/80 pb-2">
              Gallery Images
            </h3>

            {galleryLoading ? (
              <div className="h-28 rounded-lg bg-gray-900 border border-dashed border-gray-800 flex flex-col items-center justify-center space-y-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#C9A86A]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Uploading Assets...</span>
              </div>
            ) : (
              <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-805 bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#C9A86A]/30 transition-all text-center p-2">
                <ImageIcon className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-[11px] font-semibold text-gray-300">Upload Gallery Photos</span>
                <span className="text-[9px] text-gray-500 mt-0.5">JPEG, PNG, WEBP (Max 10MB)</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGalleryChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Gallery Listing */}
            {galleryImages.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-1.5 rounded bg-[#111111] border border-gray-850"
                  >
                    <div className="relative h-9 w-12 rounded overflow-hidden flex-shrink-0 bg-gray-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.public_url}
                        alt="Thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 truncate font-light">
                        {img.file_name || 'gallery-image'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(idx, 'down')}
                        disabled={idx === galleryImages.length - 1}
                        className="p-1 text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex gap-4">
            <Link
              href="/admin/services"
              className="flex-1"
            >
              <button
                type="button"
                className="w-full rounded border border-gray-800 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all cursor-pointer bg-[#1A1A1A] hover:bg-[#252525]"
              >
                Cancel
              </button>
            </Link>
            <Button
              type="submit"
              variant="accent"
              isLoading={saving}
              className="flex-1 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {isEditMode ? 'Save Specifications' : 'Publish Treatment'}
            </Button>
          </div>

        </div>

      </form>
    </div>
  );
}
