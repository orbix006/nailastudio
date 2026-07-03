'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Folder, Plus, ArrowUp, ArrowDown, Trash2, Edit3, Loader2, HelpCircle 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/FormControls';
import { logAdminAction } from '@/lib/supabase/audit';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export function PortfolioCategoriesTab() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form values
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast('Failed to load portfolio categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setModalOpen(true);
  };

  // Slug generator helper
  const handleGenerateSlug = () => {
    if (!formName) {
      toast('Please enter a category name first.', 'info');
      return;
    }
    const generated = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormSlug(generated);
  };

  // Save (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast('Category name is required.', 'error');
      return;
    }
    
    // Slug validation regex matching chk_portfolio_categories_slug_format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formSlug)) {
      toast('Slug must contain only lowercase alphanumeric characters and single hyphens (e.g. kitchen-remodel).', 'error');
      return;
    }

    try {
      setSaving(true);

      // Check unique constraints (slug/name) in client state first to avoid DB errors
      const isDuplicateName = categories.some(
        (c) => c.name.toLowerCase() === formName.trim().toLowerCase() && c.id !== editingCategory?.id
      );
      if (isDuplicateName) {
        toast('A category with this name already exists.', 'error');
        setSaving(false);
        return;
      }

      const isDuplicateSlug = categories.some(
        (c) => c.slug.toLowerCase() === formSlug.toLowerCase() && c.id !== editingCategory?.id
      );
      if (isDuplicateSlug) {
        toast('A category with this URL Slug already exists.', 'error');
        setSaving(false);
        return;
      }

      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('portfolio_categories')
          .update({
            name: formName.trim(),
            slug: formSlug.toLowerCase(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        await logAdminAction('update', 'portfolio_categories', editingCategory.id, { name: formName.trim() });
        toast(`Category "${formName}" updated successfully.`, 'success');
      } else {
        // Insert (append to bottom)
        const nextOrder = categories.length > 0 
          ? Math.max(...categories.map(c => c.display_order)) + 1 
          : 0;

        const { error } = await supabase
          .from('portfolio_categories')
          .insert({
            name: formName.trim(),
            slug: formSlug.toLowerCase(),
            display_order: nextOrder,
          });

        if (error) throw error;
        await logAdminAction('insert', 'portfolio_categories', null, { name: formName.trim() });
        toast(`Category "${formName}" created successfully.`, 'success');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      toast('Failed to save category. Make sure name and slug are unique.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reordering
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];

    try {
      let currentOrder = current.display_order;
      let targetOrder = target.display_order;

      if (currentOrder === targetOrder) {
        currentOrder = index;
        targetOrder = targetIndex;
      }

      const { error: err1 } = await supabase
        .from('portfolio_categories')
        .update({ display_order: targetOrder })
        .eq('id', current.id);

      const { error: err2 } = await supabase
        .from('portfolio_categories')
        .update({ display_order: currentOrder })
        .eq('id', target.id);

      if (err1 || err2) throw new Error('Database reorder failed.');

      // Update state
      const updated = [...categories];
      updated[index] = { ...current, display_order: targetOrder };
      updated[targetIndex] = { ...target, display_order: currentOrder };
      updated.sort((a, b) => a.display_order - b.display_order);
      setCategories(updated);

      toast('Category display order updated.', 'success');
    } catch (err) {
      console.error('Error reordering categories:', err);
      toast('Failed to update display order.', 'error');
      fetchCategories();
    }
  };

  // Delete handlers
  const confirmDelete = (category: CategoryItem) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('portfolio_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) {
        // If DB restriction block hits, throw and notify the user clearly
        if (error.code === '23503') {
          throw new Error('RESTRICTED: This category is referenced by existing portfolio projects and cannot be deleted.');
        }
        throw error;
      }

      await logAdminAction('delete', 'portfolio_categories', categoryToDelete.id, { name: categoryToDelete.name });
      toast(`Category "${categoryToDelete.name}" deleted.`, 'success');
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err: unknown) {
      console.error('Error deleting category:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete category.';
      toast(errorMsg.includes('RESTRICTED') ? 'Cannot delete category: It is currently linked to portfolio projects.' : 'Failed to delete category. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#C9A86A]">Manage Categories</h2>
          <p className="text-gray-400 text-xs mt-1">
            Group your projects into distinct portfolio galleries (e.g. Residential, Kitchen, Bathroom).
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="accent"
          size="sm"
          className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Category</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
            <span className="text-xs tracking-widest uppercase">Loading Categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center px-6">
            <Folder className="h-12 w-12 text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-300">No Categories Found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Get started by creating your first project category.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C9A86A]/10 bg-[#141414] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th scope="col" className="py-4 px-6 w-20">Order</th>
                  <th scope="col" className="py-4 px-6">Category Name</th>
                  <th scope="col" className="py-4 px-6">URL Slug</th>
                  <th scope="col" className="py-4 px-6 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          aria-label={`Move category ${cat.name} up`}
                          className="p-1 rounded bg-[#111111] hover:bg-gray-855 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === categories.length - 1}
                          aria-label={`Move category ${cat.name} down`}
                          className="p-1 rounded bg-[#111111] hover:bg-gray-855 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white group-hover:text-[#C9A86A] transition-colors">
                      {cat.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">
                      {cat.slug}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 hover:border-[#C9A86A]/30 text-gray-300 hover:text-[#C9A86A] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                          title="Edit Category"
                          aria-label={`Edit category ${cat.name}`}
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => confirmDelete(cat)}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 hover:border-red-500/30 text-gray-300 hover:text-red-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Delete Category"
                          aria-label={`Delete category ${cat.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        className="max-w-md text-white border-[#C9A86A]/20"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 font-sans">
          <Input
            label="Category Name"
            placeholder="e.g. Residential Interior"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={saving}
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="category-slug">Category Slug</Label>
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
              id="category-slug"
              placeholder="e.g. residential-interior"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              disabled={saving}
              required
              className="w-full rounded-md border border-gray-800 bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:ring-opacity-50 focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
            />
            <span className="text-[10px] text-gray-500 block">
              Used in URL. Lowercase kebab-case only.
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
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Category Deletion"
        className="border-red-500/20 max-w-md text-white animate-fade-in"
      >
        <div className="space-y-6 pt-3 font-sans">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-500 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Category?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to permanently delete the category <span className="text-white font-medium">&quot;{categoryToDelete?.name}&quot;</span>?
                This action is permanent and will fail if any projects are currently cataloged in this category.
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
              {deleting ? 'Deleting...' : 'Delete Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
