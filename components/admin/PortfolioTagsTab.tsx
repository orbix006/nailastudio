'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Tag, Plus, Trash2, Edit3, Loader2, HelpCircle 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/FormControls';

interface TagItem {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export function PortfolioTagsTab() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form values
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      toast('Failed to load project tags.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormName('');
    setFormSlug('');
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormSlug(tag.slug);
    setModalOpen(true);
  };

  const handleGenerateSlug = () => {
    if (!formName) {
      toast('Please enter a tag name first.', 'info');
      return;
    }
    const generated = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormSlug(generated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast('Tag name is required.', 'error');
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formSlug)) {
      toast('Slug must contain only lowercase alphanumeric characters and single hyphens (e.g. luxury-nail-art).', 'error');
      return;
    }

    try {
      setSaving(true);

      const isDuplicateName = tags.some(
        (t) => t.name.toLowerCase() === formName.trim().toLowerCase() && t.id !== editingTag?.id
      );
      if (isDuplicateName) {
        toast('A tag with this name already exists.', 'error');
        setSaving(false);
        return;
      }

      const isDuplicateSlug = tags.some(
        (t) => t.slug.toLowerCase() === formSlug.toLowerCase() && t.id !== editingTag?.id
      );
      if (isDuplicateSlug) {
        toast('A tag with this URL Slug already exists.', 'error');
        setSaving(false);
        return;
      }

      if (editingTag) {
        // Update
        const { error } = await supabase
          .from('project_tags')
          .update({
            name: formName.trim(),
            slug: formSlug.toLowerCase(),
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        toast(`Tag "${formName}" updated.`, 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('project_tags')
          .insert({
            name: formName.trim(),
            slug: formSlug.toLowerCase(),
          });

        if (error) throw error;
        toast(`Tag "${formName}" created.`, 'success');
      }

      setModalOpen(false);
      fetchTags();
    } catch (err) {
      console.error('Error saving tag:', err);
      toast('Failed to save tag. Make sure name and slug are unique.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (tag: TagItem) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('project_tags')
        .delete()
        .eq('id', tagToDelete.id);

      if (error) throw error;

      toast(`Tag "${tagToDelete.name}" deleted.`, 'success');
      setTags(prev => prev.filter(t => t.id !== tagToDelete.id));
      setDeleteModalOpen(false);
      setTagToDelete(null);
    } catch (err) {
      console.error('Error deleting tag:', err);
      toast('Failed to delete tag. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#C9A86A]">Manage Tags</h2>
          <p className="text-gray-400 text-xs mt-1">
            Create reusable project tags (e.g. Chrome, Minimalist, Luxury) to catalog styling details.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="accent"
          size="sm"
          className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Tag</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
            <span className="text-xs tracking-widest uppercase">Loading Tags...</span>
          </div>
        ) : tags.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center px-6">
            <Tag className="h-12 w-12 text-gray-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-gray-300">No Tags Found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Get started by creating your first project tag.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <div 
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-[#111111] group hover:border-[#C9A86A]/30 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-white truncate">{tag.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{tag.slug}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(tag)}
                      aria-label={`Edit tag ${tag.name}`}
                      className="p-1 rounded bg-gray-950 border border-gray-800 hover:border-[#C9A86A]/30 text-gray-400 hover:text-[#C9A86A] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                      title="Edit Tag"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(tag)}
                      aria-label={`Delete tag ${tag.name}`}
                      className="p-1 rounded bg-gray-950 border border-gray-800 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Delete Tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        className="max-w-md text-white border-[#C9A86A]/20"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 font-sans">
          <Input
            label="Tag Name"
            placeholder="e.g. Minimalist Art"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={saving}
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tag-slug">Tag Slug</Label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                disabled={saving}
                className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C9A86A] px-1 rounded cursor-pointer"
              >
                Generate Slug
              </button>
            </div>
            <input
              id="tag-slug"
              placeholder="e.g. minimalist-art"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              disabled={saving}
              required
              className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:ring-opacity-50 focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
            />
            <span className="text-[10px] text-gray-500 block">
              Used in URL filter. Lowercase kebab-case only.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800/40">
            <Button
              variant="outline"
              disabled={saving}
              type="button"
              onClick={() => setModalOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={saving}
              type="submit"
              className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Tag'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Tag Deletion"
        className="border-red-500/20 max-w-md text-white animate-fade-in"
      >
        <div className="space-y-6 pt-3 font-sans">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-500 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Tag?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to permanently delete the tag <span className="text-white font-medium">&quot;{tagToDelete?.name}&quot;</span>?
                This will automatically remove the tag from all project associations. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-800/40 pt-4">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteModalOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Tag'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
