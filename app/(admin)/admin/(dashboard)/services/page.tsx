'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Scissors, Plus, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit3, 
  Loader2, ImageIcon, HelpCircle 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { logAdminAction } from '@/lib/supabase/audit';

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  is_visible: boolean;
  display_order: number;
  cover_image_id: string | null;
  cover_media?: { public_url: string } | null;
}

interface DbServiceItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  is_visible: boolean;
  display_order: number;
  cover_image_id: string | null;
  cover_media?: { public_url: string } | { public_url: string }[] | null;
}

export default function ServicesListPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Soft Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch services with cover image details from media_library
      const { data, error } = await supabase
        .from('services')
        .select('*, cover_media:media_library(public_url)')
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      // If cover_media is returned as an array, parse the first item, or handle the object structure.
      // PostgREST returns it as a single object if there's a 1-to-1 foreign key.
      const parsedData = ((data as unknown as DbServiceItem[]) || []).map((item) => {
        let mediaUrlObj: { public_url: string } | null = null;
        if (item.cover_media) {
          if (Array.isArray(item.cover_media)) {
            mediaUrlObj = item.cover_media[0] || null;
          } else {
            mediaUrlObj = item.cover_media;
          }
        }
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          short_description: item.short_description,
          is_visible: item.is_visible,
          display_order: item.display_order,
          cover_image_id: item.cover_image_id,
          cover_media: mediaUrlObj,
        };
      });

      setServices(parsedData);
    } catch (err: unknown) {
      console.error('Error fetching services:', err);
      toast('Failed to load services database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleToggleVisibility = async (service: ServiceItem) => {
    try {
      const nextVisibility = !service.is_visible;
      const { error } = await supabase
        .from('services')
        .update({ is_visible: nextVisibility })
        .eq('id', service.id);

      if (error) throw error;

      await logAdminAction(
        nextVisibility ? 'publish' : 'unpublish',
        'services',
        service.id,
        { title: service.title }
      );

      toast(`Service "${service.title}" is now ${nextVisibility ? 'visible' : 'hidden'}.`, 'success');
      // Optimistic update
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_visible: nextVisibility } : s))
      );
    } catch (err: unknown) {
      console.error('Error toggling visibility:', err);
      toast('Failed to update visibility status.', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const currentService = services[index];
    const targetService = services[targetIndex];

    try {
      // Swap display orders in local state optimistically
      const updatedServices = [...services];
      
      // Compute new orders. If they have the same order, enforce proper sequence
      let currentOrder = currentService.display_order;
      let targetOrder = targetService.display_order;

      if (currentOrder === targetOrder) {
        currentOrder = index;
        targetOrder = targetIndex;
      }

      // Update in Supabase
      const { error: err1 } = await supabase
        .from('services')
        .update({ display_order: targetOrder })
        .eq('id', currentService.id);

      const { error: err2 } = await supabase
        .from('services')
        .update({ display_order: currentOrder })
        .eq('id', targetService.id);

      if (err1 || err2) throw new Error('Database reorder failed.');

      // Update state
      updatedServices[index] = { ...currentService, display_order: targetOrder };
      updatedServices[targetIndex] = { ...targetService, display_order: currentOrder };
      
      // Sort state
      updatedServices.sort((a, b) => a.display_order - b.display_order);
      setServices(updatedServices);
      
      toast('Service display order updated.', 'success');
    } catch (err: unknown) {
      console.error('Error reordering services:', err);
      toast('Failed to change display order.', 'error');
      fetchServices(); // Rollback to DB state
    }
  };

  const confirmDelete = (service: ServiceItem) => {
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setDeleting(true);
      // Soft Delete: update deleted_at
      const { error } = await supabase
        .from('services')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', serviceToDelete.id);

      if (error) throw error;

      toast(`Service "${serviceToDelete.title}" has been deleted.`, 'success');
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (err: unknown) {
      console.error('Error soft-deleting service:', err);
      toast('Failed to delete service. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <Scissors className="h-3 w-3" /> Catalog Directory
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            Services Management
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Configure client-facing treatments, features, layouts, and display order.
          </p>
        </div>
        
        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center space-x-1.5 rounded bg-[#C9A86A] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#111111] hover:bg-[#C9A86A]/95 transition-all shadow-md self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Service</span>
        </Link>
      </div>

      {/* Services List Table/Card Container */}
      <div className="rounded-xl border border-[#C9A86A]/10 bg-[#1A1A1A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
            <span className="text-xs tracking-widest uppercase">Loading Services...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center px-6">
            <div className="h-12 w-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600">
              <Scissors className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">No Services Found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Get started by creating your first service. It will instantly show up on the public treatments gallery.
              </p>
            </div>
            <Link
              href="/admin/services/new"
              className="inline-flex items-center space-x-1.5 rounded border border-gray-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-[#252525] hover:text-white"
            >
              <span>Create First Service</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C9A86A]/10 bg-[#141414] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th scope="col" className="py-4 px-6 w-20">Order</th>
                  <th scope="col" className="py-4 px-6 w-24">Cover</th>
                  <th scope="col" className="py-4 px-6">Service Details</th>
                  <th scope="col" className="py-4 px-6 w-28 text-center">Status</th>
                  <th scope="col" className="py-4 px-6 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {services.map((service, idx) => {
                  const coverUrl = service.cover_media?.public_url;
                  
                  return (
                    <tr key={service.id} className="hover:bg-white/[0.01] transition-colors group">
                      {/* Display Order actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            aria-label={`Move ${service.title} up`}
                            className="p-1 rounded bg-[#111111] hover:bg-gray-800 border border-gray-800 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === services.length - 1}
                            title="Move Down"
                            aria-label={`Move ${service.title} down`}
                            className="p-1 rounded bg-[#111111] hover:bg-gray-800 border border-gray-800 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                          >
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                      {/* Cover Image preview */}
                      <td className="py-4 px-6">
                        <div className="relative h-12 w-16 rounded overflow-hidden bg-gray-900 border border-gray-850 flex items-center justify-center">
                          {coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverUrl}
                              alt={`Cover for ${service.title}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gray-700" aria-hidden="true" />
                          )}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-4 px-6">
                        <div className="max-w-md">
                          <p className="font-semibold text-white group-hover:text-[#C9A86A] transition-colors">
                            {service.title}
                          </p>
                          <p className="text-[10px] text-[#C9A86A]/70 font-mono tracking-tight mt-0.5">
                            {service.slug}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-1 leading-relaxed">
                            {service.short_description}
                          </p>
                        </div>
                      </td>

                      {/* Visibility Status Badge */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleVisibility(service)}
                          title={`Click to ${service.is_visible ? 'hide' : 'show'}`}
                          aria-label={`Toggle visibility for ${service.title}, currently ${service.is_visible ? 'shown' : 'hidden'}`}
                          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded cursor-pointer inline-block"
                        >
                          {service.is_visible ? (
                            <Badge variant="accent" className="flex items-center space-x-1 hover:bg-[#C9A86A]/20 transition-all">
                              <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                              <span>Shown</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center space-x-1 border-gray-600 text-gray-400 hover:bg-gray-800 transition-all">
                              <EyeOff className="h-3 w-3 mr-1" aria-hidden="true" />
                              <span>Hidden</span>
                            </Badge>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/services/${service.id}`}
                            className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-[#C9A86A]/30 hover:bg-[#252525] text-gray-300 hover:text-[#C9A86A] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                            title="Edit Service Details"
                            aria-label={`Edit ${service.title}`}
                          >
                            <Edit3 className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => confirmDelete(service)}
                            className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-red-500/30 hover:bg-red-500/5 text-gray-300 hover:text-red-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            title="Delete Service (Soft Delete)"
                            aria-label={`Delete ${service.title}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Soft Delete"
        className="border-red-500/20 max-w-md text-white"
      >
        <div className="space-y-6 pt-3 font-sans">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-500">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Service?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to delete <span className="text-white font-medium">&quot;{serviceToDelete?.title}&quot;</span>?
                This will soft delete the service, meaning it will be immediately hidden from the catalog lists but remains inside the database logs for historical reference.
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
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Service'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
