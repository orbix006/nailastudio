'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Plus, ArrowUp, ArrowDown, Trash2, Edit3, Loader2, HelpCircle, LayoutGrid 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { Badge } from '@/components/ui/Badge';

interface ProjectTypeItem {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export function PortfolioProjectTypesTab() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [types, setTypes] = useState<ProjectTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectTypeItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ProjectTypeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form values
  const [formName, setFormName] = useState('');

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching project types:', err);
      toast('Failed to load project types.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (type: ProjectTypeItem) => {
    setEditingType(type);
    setFormName(type.name);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast('Project type name is required.', 'error');
      return;
    }

    try {
      setSaving(true);

      const isDuplicate = types.some(
        (t) => t.name.toLowerCase() === formName.trim().toLowerCase() && t.id !== editingType?.id
      );
      if (isDuplicate) {
        toast('A project type with this name already exists.', 'error');
        setSaving(false);
        return;
      }

      if (editingType) {
        // Update
        const { error } = await supabase
          .from('project_types')
          .update({
            name: formName.trim(),
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast(`Project type "${formName}" updated.`, 'success');
      } else {
        // Insert
        const nextOrder = types.length > 0 
          ? Math.max(...types.map(t => t.display_order)) + 1 
          : 0;

        const { error } = await supabase
          .from('project_types')
          .insert({
            name: formName.trim(),
            display_order: nextOrder,
            is_active: true,
          });

        if (error) throw error;
        toast(`Project type "${formName}" created.`, 'success');
      }

      setModalOpen(false);
      fetchTypes();
    } catch (err) {
      console.error('Error saving project type:', err);
      toast('Failed to save project type. Ensure the name is unique.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: ProjectTypeItem) => {
    try {
      const nextActive = !type.is_active;
      const { error } = await supabase
        .from('project_types')
        .update({ is_active: nextActive })
        .eq('id', type.id);

      if (error) throw error;

      toast(`Project type "${type.name}" is now ${nextActive ? 'active' : 'inactive'}.`, 'success');
      setTypes(prev =>
        prev.map(t => t.id === type.id ? { ...t, is_active: nextActive } : t)
      );
    } catch (err) {
      console.error('Error toggling active status:', err);
      toast('Failed to update status.', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= types.length) return;

    const current = types[index];
    const target = types[targetIndex];

    try {
      let currentOrder = current.display_order;
      let targetOrder = target.display_order;

      if (currentOrder === targetOrder) {
        currentOrder = index;
        targetOrder = targetIndex;
      }

      const { error: err1 } = await supabase
        .from('project_types')
        .update({ display_order: targetOrder })
        .eq('id', current.id);

      const { error: err2 } = await supabase
        .from('project_types')
        .update({ display_order: currentOrder })
        .eq('id', target.id);

      if (err1 || err2) throw new Error('Database reorder failed.');

      // Update state
      const updated = [...types];
      updated[index] = { ...current, display_order: targetOrder };
      updated[targetIndex] = { ...target, display_order: currentOrder };
      updated.sort((a, b) => a.display_order - b.display_order);
      setTypes(updated);

      toast('Project type display order updated.', 'success');
    } catch (err) {
      console.error('Error reordering project types:', err);
      toast('Failed to update display order.', 'error');
      fetchTypes();
    }
  };

  const confirmDelete = (type: ProjectTypeItem) => {
    setTypeToDelete(type);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('project_types')
        .delete()
        .eq('id', typeToDelete.id);

      if (error) throw error;

      toast(`Project type "${typeToDelete.name}" deleted.`, 'success');
      setTypes(prev => prev.filter(t => t.id !== typeToDelete.id));
      setDeleteModalOpen(false);
      setTypeToDelete(null);
    } catch (err) {
      console.error('Error deleting project type:', err);
      toast('Failed to delete project type. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#C9A86A]">Manage Project Types</h2>
          <p className="text-gray-400 text-xs mt-1">
            Configure system categories for client inquiries and analytics metadata (e.g. Residential, Commercial, Renovation).
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="accent"
          size="sm"
          className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Project Type</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
            <span className="text-xs tracking-widest uppercase">Loading Project Types...</span>
          </div>
        ) : types.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center px-6">
            <LayoutGrid className="h-12 w-12 text-gray-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-gray-300">No Project Types Found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Get started by creating your first project type.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C9A86A]/10 bg-[#141414] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th scope="col" className="py-4 px-6 w-20">Order</th>
                  <th scope="col" className="py-4 px-6">Type Name</th>
                  <th scope="col" className="py-4 px-6 w-32 text-center">Status</th>
                  <th scope="col" className="py-4 px-6 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {types.map((type, idx) => (
                  <tr key={type.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          aria-label={`Move project type ${type.name} up`}
                          className="p-1 rounded bg-[#111111] hover:bg-gray-855 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === types.length - 1}
                          aria-label={`Move project type ${type.name} down`}
                          className="p-1 rounded bg-[#111111] hover:bg-gray-855 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white group-hover:text-[#C9A86A] transition-colors">
                      {type.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(type)}
                        title={`Click to ${type.is_active ? 'deactivate' : 'activate'}`}
                        aria-label={`Toggle active state of project type ${type.name}, currently ${type.is_active ? 'active' : 'inactive'}`}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded cursor-pointer inline-block"
                      >
                        {type.is_active ? (
                          <Badge variant="accent" className="flex items-center hover:bg-[#C9A86A]/20 transition-all text-xs font-semibold">
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center border-gray-655 text-gray-455 hover:bg-gray-800 transition-all text-xs font-semibold">
                            <span>Inactive</span>
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(type)}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 hover:border-[#C9A86A]/30 text-gray-300 hover:text-[#C9A86A] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                          title="Edit Type"
                          aria-label={`Edit project type ${type.name}`}
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => confirmDelete(type)}
                          className="p-1.5 rounded bg-gray-900 border border-gray-800 hover:border-red-500/30 text-gray-300 hover:text-red-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Delete Type"
                          aria-label={`Delete project type ${type.name}`}
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
        title={editingType ? 'Edit Project Type' : 'Create New Project Type'}
        className="max-w-md text-white border-[#C9A86A]/20"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 font-sans">
          <Input
            label="Type Name"
            placeholder="e.g. Commercial"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={saving}
            required
          />

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
              {saving ? 'Saving...' : 'Save Type'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Project Type Deletion"
        className="border-red-500/20 max-w-md text-white animate-fade-in"
      >
        <div className="space-y-6 pt-3 font-sans">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-500 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Project Type?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to permanently delete the project type <span className="text-white font-medium">&quot;{typeToDelete?.name}&quot;</span>?
                This will set the project type to null on all projects and inquiries referencing it. This action cannot be undone.
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
              {deleting ? 'Deleting...' : 'Delete Type'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
