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
  Upload, Briefcase, ArrowLeft, Loader2, Plus, Trash2, 
  Sparkles, Star, Eye
} from 'lucide-react';
import Link from 'next/link';

// Zod Schema matching database constraints
const projectSchema = z.object({
  name: z.string().min(2, 'Project Name must be at least 2 characters'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and single hyphens (e.g., modern-living-room)'),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  completion_year: z.number().int().min(1990, 'Year must be after 1990').max(2100, 'Year must be before 2100').nullable().optional(),
  category_id: z.string().min(1, 'Please select a Category'),
  project_type_id: z.string().optional().nullable(),
  related_service_id: z.string().optional().nullable(),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface GalleryImageItem {
  id?: string;
  media_id: string;
  public_url: string;
  display_order: number;
  file_name?: string;
}

interface ImageRowResult {
  id: string;
  project_id: string;
  media_id: string;
  display_order: number;
  media_library: {
    public_url: string;
    storage_path: string;
  } | null;
}

interface DBTagItem {
  id: string;
  name: string;
  slug: string;
}

interface ProjectFormProps {
  projectId?: string; // If provided, we are in EDIT mode
}

export function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const isEditMode = !!projectId;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  // Dropdown options
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; title: string }[]>([]);

  // Tags states
  const [allTags, setAllTags] = useState<DBTagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Images states
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
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      location: '',
      completion_year: null,
      category_id: '',
      project_type_id: null,
      related_service_id: null,
      is_featured: false,
      is_published: true,
    },
  });

  const nameValue = watch('name');

  // Fetch admin profile
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    checkUser();
  }, [supabase.auth]);

  // Fetch initial dropdown and tag options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, typeRes, servRes, tagRes] = await Promise.all([
          supabase.from('portfolio_categories').select('id, name').order('display_order', { ascending: true }),
          supabase.from('project_types').select('id, name').eq('is_active', true).order('display_order', { ascending: true }),
          supabase.from('services').select('id, title').is('deleted_at', null).order('display_order', { ascending: true }),
          supabase.from('project_tags').select('id, name, slug').order('name', { ascending: true }),
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (typeRes.data) setProjectTypes(typeRes.data);
        if (servRes.data) setServices(servRes.data);
        if (tagRes.data) setAllTags(tagRes.data);
      } catch (err) {
        console.error('Error fetching form metadata:', err);
      }
    };
    fetchOptions();
  }, [supabase]);

  // Fetch project details if editing
  useEffect(() => {
    if (!isEditMode) return;

    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // 1. Fetch main project row
        const { data: project, error } = await supabase
          .from('portfolio_projects')
          .select('*')
          .eq('id', projectId)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) throw error;
        if (!project) {
          toast('Project not found or has been deleted.', 'error');
          router.push('/admin/portfolio');
          return;
        }

        // Populate fields
        setValue('name', project.name);
        setValue('slug', project.slug);
        setValue('description', project.description || '');
        setValue('location', project.location || '');
        setValue('completion_year', project.completion_year || null);
        setValue('category_id', project.category_id);
        setValue('project_type_id', project.project_type_id || '');
        setValue('related_service_id', project.related_service_id || '');
        setValue('is_featured', project.is_featured);
        setValue('is_published', project.is_published);

        // 2. Fetch cover image Details
        if (project.cover_image_id) {
          const { data: media } = await supabase
            .from('media_library')
            .select('public_url')
            .eq('id', project.cover_image_id)
            .maybeSingle();
          if (media) {
            setCoverImage({ id: project.cover_image_id, url: media.public_url });
          }
        }

        // 3. Fetch project tags
        const { data: tagRows } = await supabase
          .from('portfolio_project_tags')
          .select('tag_id')
          .eq('project_id', projectId);
        if (tagRows) {
          setSelectedTagIds(tagRows.map((r) => r.tag_id));
        }

        // 4. Fetch gallery images
        const { data: imageRows } = await supabase
          .from('portfolio_project_images')
          .select('*, media_library(public_url, storage_path)')
          .eq('project_id', projectId)
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

      } catch (err) {
        console.error('Error fetching project details:', err);
        toast('Failed to load project parameters.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, isEditMode, router, setValue, supabase, toast]);

  // Slug generator helper
  const handleGenerateSlug = () => {
    if (!nameValue) {
      toast('Please enter a project name first to generate a slug.', 'info');
      return;
    }
    const generated = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('slug', generated, { shouldValidate: true });
  };

  // Image upload helpers
  const computeSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

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

  const handleUploadImage = async (file: File) => {
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
      const checksum = await computeSHA256(file);

      // Search database for active matching checksum
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

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${checksum}.${fileExt}`;
      const storagePath = `portfolio/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(storagePath);

      // Extract image dimensions
      const dimensions = await getImageDimensions(file);

      // Insert row into media_library
      const { data: newMedia, error: dbError } = await supabase
        .from('media_library')
        .insert({
          bucket: 'portfolio',
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
    } catch (err) {
      console.error('Upload failed:', err);
      toast('Failed to upload image.', 'error');
      return null;
    }
  };

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

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;

    const updated = [...galleryImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setGalleryImages(reordered);
  };

  const removeGalleryImage = (index: number) => {
    const filtered = galleryImages.filter((_, idx) => idx !== index);
    const reordered = filtered.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setGalleryImages(reordered);
  };

  // Tags toggle selection
  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Create Tag inline
  const handleCreateTagInline = async () => {
    if (!newTagText.trim()) return;
    try {
      setCreatingTag(true);
      const generatedSlug = newTagText
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Verify name uniqueness
      const nameExists = allTags.some(
        (t) => t.name.toLowerCase() === newTagText.trim().toLowerCase()
      );
      if (nameExists) {
        toast('A tag with this name already exists.', 'info');
        setNewTagText('');
        return;
      }

      const { data: newTag, error } = await supabase
        .from('project_tags')
        .insert({
          name: newTagText.trim(),
          slug: generatedSlug,
        })
        .select('*')
        .single();

      if (error) throw error;

      toast(`Tag "${newTagText}" created.`, 'success');
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagText('');
    } catch (err) {
      console.error('Error creating inline tag:', err);
      toast('Failed to create new tag.', 'error');
    } finally {
      setCreatingTag(false);
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    if (!coverImage) {
      toast('Please upload a cover image first.', 'error');
      return;
    }

    try {
      setSaving(true);

      // Verify slug uniqueness
      const slugQuery = supabase
        .from('portfolio_projects')
        .select('id')
        .eq('slug', values.slug)
        .is('deleted_at', null);

      if (isEditMode) {
        slugQuery.neq('id', projectId);
      }

      const { data: existingSlug } = await slugQuery.maybeSingle();
      if (existingSlug) {
        toast('This URL Slug is already taken by another active project.', 'error');
        setSaving(false);
        return;
      }

      let activeProjectId = projectId;

      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        location: values.location || null,
        completion_year: values.completion_year || null,
        category_id: values.category_id,
        project_type_id: values.project_type_id || null,
        related_service_id: values.related_service_id || null,
        cover_image_id: coverImage.id,
        is_featured: values.is_featured,
        is_published: values.is_published,
        updated_by: adminUser?.id || null,
      };

      if (isEditMode) {
        // Update main record
        const { error } = await supabase
          .from('portfolio_projects')
          .update(payload)
          .eq('id', projectId);

        if (error) throw error;
      } else {
        // Get max order
        const { data: maxOrderData } = await supabase
          .from('portfolio_projects')
          .select('display_order')
          .is('deleted_at', null)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder = maxOrderData && maxOrderData[0]
          ? (maxOrderData[0].display_order + 1)
          : 0;

        // Insert new record
        const { data: newProj, error } = await supabase
          .from('portfolio_projects')
          .insert({
            ...payload,
            display_order: nextOrder,
            created_by: adminUser?.id || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        activeProjectId = newProj.id;
      }

      // Sync project tags
      // 1. Delete existing associations
      const { error: tagDeleteError } = await supabase
        .from('portfolio_project_tags')
        .delete()
        .eq('project_id', activeProjectId);

      if (tagDeleteError) throw tagDeleteError;

      // 2. Insert new associations
      if (selectedTagIds.length > 0) {
        const tagsToInsert = selectedTagIds.map((tagId) => ({
          project_id: activeProjectId!,
          tag_id: tagId,
        }));

        const { error: tagInsertError } = await supabase
          .from('portfolio_project_tags')
          .insert(tagsToInsert);

        if (tagInsertError) throw tagInsertError;
      }

      // Sync project gallery images
      // 1. Delete existing gallery rows
      const { error: galleryDeleteError } = await supabase
        .from('portfolio_project_images')
        .delete()
        .eq('project_id', activeProjectId);

      if (galleryDeleteError) throw galleryDeleteError;

      // 2. Insert new gallery rows
      if (galleryImages.length > 0) {
        const galleryToInsert = galleryImages.map((img, index) => ({
          project_id: activeProjectId!,
          media_id: img.media_id,
          display_order: index,
        }));

        const { error: galleryInsertError } = await supabase
          .from('portfolio_project_images')
          .insert(galleryToInsert);

        if (galleryInsertError) throw galleryInsertError;
      }

      toast(
        `Project "${values.name}" has been successfully ${isEditMode ? 'updated' : 'created'}.`,
        'success'
      );

      router.push('/admin/portfolio');
      router.refresh();
    } catch (err) {
      console.error('Error saving project:', err);
      toast('Failed to save project. Verify fields and try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
        <span className="text-xs tracking-widest uppercase text-gray-500 font-sans">
          Loading Project Blueprint...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/portfolio"
          className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1">
            <Briefcase className="h-3 w-3" /> Project Studio
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            {isEditMode ? 'Edit Project Details' : 'Create New Showcase Project'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Text Content Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#C9A86A] border-b border-gray-800/85 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Project Specifications
            </h3>

            {/* Name & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('name')}
                label="Project Name"
                placeholder="e.g. Minimalist Champagne Nails"
                error={errors.name?.message}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label error={!!errors.slug}>URL Slug Path</Label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors focus:outline-none cursor-pointer"
                  >
                    Generate from Name
                  </button>
                </div>
                <input
                  {...register('slug')}
                  placeholder="minimalist-champagne-nails"
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

            {/* Description */}
            <Textarea
              {...register('description')}
              label="Project Description (Optional)"
              placeholder="Detailing our precise styling vectors, color hues matching, design inspirations, and execution timeline..."
              error={errors.description?.message}
              rows={4}
              helperText="Describe the details, client brief, or artistic choices of this design."
            />

            {/* Location & Year split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('location')}
                label="Studio Location (Optional)"
                placeholder="e.g. Bandra Studio"
                error={errors.location?.message}
              />

              <Input
                {...register('completion_year', {
                  setValueAs: (value) => (value === '' || value === null || value === undefined ? null : parseInt(value, 10)),
                })}
                label="Completion Year (Optional)"
                placeholder="e.g. 2026"
                type="number"
                error={errors.completion_year?.message}
              />
            </div>

            {/* Dropdown Taxonomy Relationships */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-800/40">
              {/* Category */}
              <div className="space-y-1.5">
                <Label error={!!errors.category_id}>Category (Required)</Label>
                <select
                  {...register('category_id')}
                  className="w-full rounded-md border border-gray-850 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C9A86A]"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <span className="text-xs text-red-400 mt-1 block">
                    {errors.category_id.message}
                  </span>
                )}
              </div>

              {/* Project Type */}
              <div className="space-y-1.5">
                <Label>Project Type (Optional)</Label>
                <select
                  {...register('project_type_id')}
                  className="w-full rounded-md border border-gray-855 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C9A86A]"
                >
                  <option value="">Select Type</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Related Service */}
              <div className="space-y-1.5">
                <Label>Related Service (Optional)</Label>
                <select
                  {...register('related_service_id')}
                  className="w-full rounded-md border border-gray-855 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C9A86A]"
                >
                  <option value="">Select Service</option>
                  {services.map((serv) => (
                    <option key={serv.id} value={serv.id}>
                      {serv.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gallery Images Card */}
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#C9A86A]">
                Gallery Images
              </h3>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {galleryImages.length} image(s)
              </span>
            </div>

            {/* Gallery images grid */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className="relative rounded-lg overflow-hidden border border-gray-800 bg-[#111111] aspect-[4/3] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.public_url} 
                      alt="Gallery Preview" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Reordering/Deletion overlay controls */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 rounded bg-gray-900 border border-gray-700 hover:border-[#C9A86A]/45 hover:text-[#C9A86A] transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Move Left"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(idx, 'down')}
                        disabled={idx === galleryImages.length - 1}
                        className="p-2 rounded bg-gray-900 border border-gray-700 hover:border-[#C9A86A]/45 hover:text-[#C9A86A] transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Move Right"
                      >
                        <Plus className="h-4 w-4 rotate-45" /> {/* Use custom rotation or simple layout */}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="p-2 rounded bg-gray-900 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery Upload control */}
            {galleryLoading ? (
              <div className="h-32 rounded-lg bg-gray-900 border border-dashed border-gray-800 flex flex-col items-center justify-center space-y-2 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A86A]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Uploading Assets...</span>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-800 bg-[#111111] hover:bg-[#1C1C1C] hover:border-[#C9A86A]/30 transition-all text-center p-4">
                <Upload className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-xs font-semibold text-gray-300">Upload Gallery Photos</span>
                <span className="text-[10px] text-gray-500 mt-1 max-w-[240px]">
                  Select one or multiple images. JPEG, PNG or WEBP (Max 10MB each).
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGalleryChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Side Upload */}
        <div className="space-y-6">
          
          {/* Status Settings Card */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-5">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-805/80 pb-2">
              Visibility Settings
            </h3>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-850 bg-[#111111]">
              <div className="flex items-center space-x-2">
                <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
                <div>
                  <p className="text-xs font-semibold text-white">Featured Project</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Show top in showcase lists.</p>
                </div>
              </div>
              <input
                type="checkbox"
                {...register('is_featured')}
                className="h-4 w-4 rounded border-gray-800 bg-[#111111] text-[#C9A86A] focus:ring-[#C9A86A] cursor-pointer"
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-850 bg-[#111111]">
              <div className="flex items-center space-x-2">
                <Eye className="h-4.5 w-4.5 text-[#C9A86A]" />
                <div>
                  <p className="text-xs font-semibold text-white">Publish Status</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Show instantly on live site.</p>
                </div>
              </div>
              <input
                type="checkbox"
                {...register('is_published')}
                className="h-4 w-4 rounded border-gray-800 bg-[#111111] text-[#C9A86A] focus:ring-[#C9A86A] cursor-pointer"
              />
            </div>
          </div>

          {/* Cover Image Upload Card */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-805/80 pb-2">
              Cover Image (Required)
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
                <span className="text-xs font-semibold text-gray-350">Upload Cover Photo</span>
                <span className="text-[10px] text-gray-550 mt-1 max-w-[180px]">
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

          {/* Tags Cloud Card */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-805/80 pb-2">
              Project Tags
            </h3>

            {/* Tag Selection Cloud */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A86A]/10 border-[#C9A86A] text-[#C9A86A]'
                        : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>

            {/* Quick add inline tag controls */}
            <div className="flex gap-2 pt-2 border-t border-gray-800/40">
              <input
                type="text"
                placeholder="New Tag Name..."
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                disabled={creatingTag}
                className="flex-1 rounded border border-gray-800 bg-[#111111] px-3 py-2 text-xs text-white placeholder-gray-650 outline-none focus:border-[#C9A86A]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTagInline();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateTagInline}
                disabled={creatingTag}
                className="rounded bg-[#C9A86A] p-2 text-[#111111] hover:bg-[#C9A86A]/90 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="rounded-xl border border-gray-850 bg-[#1A1A1A] p-6 shadow-xl space-y-3">
            <Button
              variant="accent"
              type="submit"
              disabled={saving}
              className="w-full bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/95 py-3 text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Saving Project...
                </>
              ) : (
                'Save Showcase Project'
              )}
            </Button>
            <Link
              href="/admin/portfolio"
              className="block w-full text-center py-2.5 rounded border border-gray-800 hover:bg-[#252525] text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
