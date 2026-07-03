'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Image as ImageIcon, Upload, Search, Link as LinkIcon, Trash2, 
  RefreshCw, Edit3, Loader2, Eye, HelpCircle, HardDrive, Info
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { UploadModal } from '@/components/admin/UploadModal';
import { Badge } from '@/components/ui/Badge';

interface MediaItem {
  id: string;
  bucket: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  file_size_bytes: number;
  width_px: number | null;
  height_px: number | null;
  alt_text: string | null;
  checksum_sha256: string | null;
  created_at: string;
}

export default function MediaLibraryPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  
  // Alt text edit state
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [altTextValue, setAltTextValue] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);

  // Replace image state
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch admin profile ID
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminUserId(user.id);
    };
    fetchUser();
  }, [supabase]);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
      setSelectedIds([]); // Clear selection on load
    } catch (err) {
      console.error('Error fetching media library:', err);
      toast('Failed to load media files.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Size formatter
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Compute stats based on fetched items
  const stats = useMemo(() => {
    const totalCount = media.length;
    const totalSize = media.reduce((acc, curr) => acc + curr.file_size_bytes, 0);
    
    const bucketBreakdown: Record<string, { count: number; size: number }> = {};
    const bucketsList = ['logos', 'hero', 'services', 'portfolio', 'about', 'testimonials', 'core-values', 'media'];
    
    bucketsList.forEach(b => {
      bucketBreakdown[b] = { count: 0, size: 0 };
    });

    media.forEach((item) => {
      const b = item.bucket;
      if (bucketBreakdown[b]) {
        bucketBreakdown[b].count += 1;
        bucketBreakdown[b].size += item.file_size_bytes;
      }
    });

    return {
      totalCount,
      totalSize,
      bucketBreakdown,
    };
  }, [media]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast('Public URL copied to clipboard.', 'success');
  };

  const handleOpenEditAlt = (item: MediaItem) => {
    setEditItem(item);
    setAltTextValue(item.alt_text || '');
  };

  const handleSaveAltText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      setSavingAlt(true);
      const { error } = await supabase
        .from('media_library')
        .update({
          alt_text: altTextValue.trim() || null,
          updated_by: adminUserId,
        })
        .eq('id', editItem.id);

      if (error) throw error;

      toast('Alt text updated successfully.', 'success');
      setMedia(prev => 
        prev.map(m => m.id === editItem.id ? { ...m, alt_text: altTextValue.trim() || null } : m)
      );
      setEditItem(null);
    } catch (err) {
      console.error('Failed to update alt text:', err);
      toast('Failed to save alt text.', 'error');
    } finally {
      setSavingAlt(false);
    }
  };

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

  const handleReplaceImage = async (item: MediaItem, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast('Supported file types: JPEG, PNG, WEBP, SVG.', 'error');
      return;
    }
    const maxLimit = 10 * 1024 * 1024;
    if (file.size > maxLimit) {
      toast('File size exceeds the 10MB limit.', 'error');
      return;
    }

    try {
      setReplacing(true);
      setReplacingItemId(item.id);

      const checksum = await computeSHA256(file);

      const { error: uploadError } = await supabase.storage
        .from(item.bucket)
        .upload(item.storage_path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const dimensions = await getImageDimensions(file);

      const { error: dbError } = await supabase
        .from('media_library')
        .update({
          file_size_bytes: file.size,
          width_px: dimensions.width || null,
          height_px: dimensions.height || null,
          mime_type: file.type,
          checksum_sha256: checksum,
          updated_by: adminUserId,
        })
        .eq('id', item.id);

      if (dbError) throw dbError;

      toast('Image replaced successfully.', 'success');
      
      setMedia(prev => 
        prev.map(m => m.id === item.id 
          ? { 
              ...m, 
              file_size_bytes: file.size, 
              width_px: dimensions.width || null, 
              height_px: dimensions.height || null,
              mime_type: file.type,
              checksum_sha256: checksum 
            } 
          : m
        )
      );
    } catch (err) {
      console.error('Failed to replace image:', err);
      toast('Failed to replace image file.', 'error');
    } finally {
      setReplacing(false);
      setReplacingItemId(null);
    }
  };

  const confirmDelete = (item: MediaItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('media_library')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast(`Image deleted successfully.`, 'success');
      setMedia(prev => prev.filter(m => m.id !== itemToDelete.id));
      setSelectedIds(prev => prev.filter(x => x !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error soft-deleting media:', err);
      toast('Failed to delete media asset.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Selection Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(filteredMedia.map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      
      const { error } = await supabase
        .from('media_library')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      toast(`Successfully deleted ${selectedIds.length} assets.`, 'success');
      setMedia(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Error soft-deleting media list:', err);
      toast('Failed to delete selected assets.', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Filter logic
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const name = item.storage_path.split('/').pop() || '';
      const alt = item.alt_text || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        alt.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBucket = selectedBucket === 'all' || item.bucket === selectedBucket;

      // Date matching
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const createdDate = new Date(item.created_at);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = createdDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = createdDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setDate(now.getDate() - 30);
          matchesDate = createdDate >= monthAgo;
        }
      }

      return matchesSearch && matchesBucket && matchesDate;
    });
  }, [media, searchQuery, selectedBucket, dateFilter]);

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <HardDrive className="h-3 w-3" /> Storage Center
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            Media Library
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            View, upload, replace, or reuse core assets. Image references are indexed globally for audit trails.
          </p>
        </div>

        <Button
          onClick={() => setUploadOpen(true)}
          variant="accent"
          size="sm"
          className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/95 transition-all shadow-md self-start sm:self-center font-bold"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          <span>Upload Asset(s)</span>
        </Button>
      </div>

      {/* Grid Layout: Stats + Main Library View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Stats sidebar panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] p-5 shadow-xl space-y-6">
            <h3 className="font-serif text-base font-semibold text-[#C9A86A] border-b border-gray-800/80 pb-2 flex items-center gap-2">
              <HardDrive className="h-4.5 w-4.5" /> Storage Stats
            </h3>

            {/* Total Metric Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded bg-[#111111] border border-gray-850">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Files</p>
                <p className="text-lg font-bold text-white mt-1">{stats.totalCount}</p>
              </div>
              <div className="p-3.5 rounded bg-[#111111] border border-gray-850">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Space Used</p>
                <p className="text-sm font-bold text-white mt-1.5 truncate">{formatBytes(stats.totalSize)}</p>
              </div>
            </div>

            {/* Bucket breakdowns */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Bucket Breakdown</h4>
              <div className="space-y-3.5 text-xs">
                {Object.entries(stats.bucketBreakdown).map(([bucketName, info]) => {
                  const pct = stats.totalSize > 0 ? (info.size / stats.totalSize) * 100 : 0;
                  return (
                    <div key={bucketName} className="space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span className="capitalize font-semibold">{bucketName}</span>
                        <span className="text-[10px]">{info.count} files ({formatBytes(info.size, 1)})</span>
                      </div>
                      <div className="w-full bg-[#111111] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#C9A86A] h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Media Search & Grid View */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filters layout */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-gray-800 bg-[#1A1A1A]">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search files by name or alt text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white placeholder-gray-650 outline-none focus:border-[#C9A86A]"
              />
            </div>

            {/* Bucket Filter Select */}
            <div className="w-full sm:w-40">
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white outline-none focus:border-[#C9A86A]"
              >
                <option value="all">All Buckets</option>
                <option value="logos">Logos</option>
                <option value="hero">Hero</option>
                <option value="services">Services</option>
                <option value="portfolio">Portfolio</option>
                <option value="about">About</option>
                <option value="testimonials">Testimonials</option>
                <option value="core-values">Core Values</option>
                <option value="media">Media (General)</option>
              </select>
            </div>

            {/* Date Filter Select */}
            <div className="w-full sm:w-40">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white outline-none focus:border-[#C9A86A]"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-550/5 animate-fade-in text-xs text-white">
              <div className="flex items-center space-x-3.5">
                <span className="font-semibold text-[#C9A86A]">{selectedIds.length} item(s) selected</span>
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-white cursor-pointer underline hover:no-underline"
                >
                  Clear Selection
                </button>
                <button
                  onClick={selectAll}
                  className="text-gray-400 hover:text-white cursor-pointer underline hover:no-underline"
                >
                  Select All Filtered ({filteredMedia.length})
                </button>
              </div>
              <Button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="bg-red-650 hover:bg-red-750 text-white font-bold px-3 py-1.5 text-[11px] cursor-pointer"
                size="sm"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Media Grid Cards */}
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
              <span className="text-xs tracking-widest uppercase">Loading Assets Directory...</span>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center border border-gray-850 rounded-xl bg-[#1A1A1A]">
              <ImageIcon className="h-12 w-12 text-gray-600 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-gray-300">No Assets Found</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Try adjusting search triggers or select another bucket. Click &quot;Upload Asset(s)&quot; to add new entries.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredMedia.map((item) => {
                const name = item.storage_path.split('/').pop() || 'image';
                const uploadDate = new Date(item.created_at).toLocaleDateString();
                const isItemReplacing = replacing && replacingItemId === item.id;
                const isSelected = selectedIds.includes(item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border overflow-hidden shadow-lg hover:border-[#C9A86A]/20 transition-all duration-200 group bg-[#1A1A1A] ${
                      isSelected ? 'border-[#C9A86A] ring-1 ring-[#C9A86A]/50' : 'border-gray-850'
                    }`}
                  >
                    {/* Preview box */}
                    <div className="relative aspect-[4/3] bg-black border-b border-gray-850 flex items-center justify-center overflow-hidden">
                      {/* Checkbox select */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="absolute top-2 right-2 h-4 w-4 rounded border-gray-800 bg-[#111111]/80 accent-[#C9A86A] cursor-pointer z-10"
                      />

                      {isItemReplacing ? (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center space-y-2 text-xs">
                          <Loader2 className="h-6 w-6 animate-spin text-[#C9A86A]" />
                          <span className="text-[10px] tracking-wider uppercase font-bold text-gray-400">Replacing...</span>
                        </div>
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.public_url}
                            alt={item.alt_text || 'Media Thumbnail'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                          {/* Bucket Label Badge */}
                          <Badge 
                            variant="secondary" 
                            className="absolute top-2 left-2 text-[9px] bg-black/60 border border-white/10 uppercase tracking-widest text-[#C9A86A]"
                          >
                            {item.bucket}
                          </Badge>
                          
                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="p-2 rounded bg-gray-950 border border-gray-800 hover:border-[#C9A86A]/40 text-gray-300 hover:text-white transition-all cursor-pointer"
                              title="Full Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCopyUrl(item.public_url)}
                              className="p-2 rounded bg-gray-950 border border-gray-800 hover:border-[#C9A86A]/40 text-gray-300 hover:text-white transition-all cursor-pointer"
                              title="Copy URL"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </button>
                            <label className="p-2 rounded bg-gray-950 border border-gray-800 hover:border-[#C9A86A]/40 text-gray-300 hover:text-white transition-all cursor-pointer">
                              <RefreshCw className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleReplaceImage(item, e.target.files[0]);
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => confirmDelete(item)}
                              className="p-2 rounded bg-gray-950 border border-red-500/20 hover:border-red-500/50 text-gray-300 hover:text-red-400 transition-all cursor-pointer"
                              title="Soft Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Metadata & Actions footer */}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-white truncate" title={name}>
                          {name}
                        </p>
                        <p className="text-[10px] text-gray-550 mt-0.5 font-mono">
                          {item.width_px && item.height_px ? `${item.width_px} × ${item.height_px} px` : 'SVG/Vector'} • {formatBytes(item.file_size_bytes)}
                        </p>
                      </div>

                      {/* Alt text block */}
                      <div className="flex items-center justify-between p-2 rounded bg-[#111111] border border-gray-850">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Alt Text</p>
                          <p className="text-xs text-gray-350 truncate mt-0.5">
                            {item.alt_text ? (
                              item.alt_text
                            ) : (
                              <span className="italic text-gray-650">No alt text provided</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenEditAlt(item)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-[#C9A86A] transition-colors cursor-pointer"
                          title="Edit Alt Text"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-[9px] text-gray-550 flex items-center justify-between pt-1 font-mono">
                        <span>Uploaded</span>
                        <span>{uploadDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal component */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={fetchMedia}
      />

      {/* Lightbox / Preview modal overlay */}
      {previewItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={`Asset Preview — ${previewItem.storage_path.split('/').pop()}`}
          className="max-w-4xl text-white border-white/5 bg-[#111111]/95 animate-fade-in"
        >
          <div className="space-y-6 pt-2 font-sans">
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-gray-850">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewItem.public_url}
                alt={previewItem.alt_text || 'Full size preview'}
                className="max-h-[70vh] object-contain"
              />
            </div>
            
            {/* Asset specifications metadata details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#1A1A1A] border border-gray-850 text-xs">
              <div>
                <p className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Bucket Path</p>
                <p className="font-semibold text-white mt-1 capitalize">{previewItem.bucket}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Dimensions</p>
                <p className="font-semibold text-white mt-1">
                  {previewItem.width_px && previewItem.height_px ? `${previewItem.width_px} × ${previewItem.height_px} px` : 'Vector (SVG)'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">File Size</p>
                <p className="font-semibold text-white mt-1">{formatBytes(previewItem.file_size_bytes)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Mime Type</p>
                <p className="font-semibold text-white mt-1">{previewItem.mime_type}</p>
              </div>
            </div>

            {/* Checksum SHA-256 validation code */}
            {previewItem.checksum_sha256 && (
              <div className="p-3 rounded bg-gray-950 border border-gray-850/80 flex items-center space-x-2 text-[10px] font-mono">
                <Info className="h-4 w-4 text-[#C9A86A] flex-shrink-0" />
                <span className="text-gray-500">SHA-256 Index Checksum:</span>
                <span className="text-gray-300 truncate" title={previewItem.checksum_sha256}>{previewItem.checksum_sha256}</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-850/40">
              <Button
                variant="outline"
                onClick={() => setPreviewItem(null)}
                className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Alt Text Modal */}
      {editItem && (
        <Modal
          isOpen={true}
          onClose={() => !savingAlt && setEditItem(null)}
          title="Edit Image Accessibility Metadata"
          className="max-w-md text-white border-[#C9A86A]/20"
        >
          <form onSubmit={handleSaveAltText} className="space-y-4 pt-2 font-sans">
            <Input
              label="Image Alt Text"
              placeholder="e.g. Bespoke gel overlay nails with gold details in Bandra studio"
              value={altTextValue}
              onChange={(e) => setAltTextValue(e.target.value)}
              disabled={savingAlt}
              helperText="Describe the contents of this image. Screen readers and search engine indexing bots query this field for accessibility."
            />

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800/40">
              <Button
                variant="outline"
                disabled={savingAlt}
                type="button"
                onClick={() => setEditItem(null)}
                className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                disabled={savingAlt}
                type="submit"
                className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
              >
                {savingAlt ? 'Saving...' : 'Save Alt Text'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Soft Delete"
        className="border-red-500/20 max-w-md text-white font-sans animate-fade-in"
      >
        <div className="space-y-6 pt-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-550 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Media Asset?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to delete <span className="text-white font-medium">&quot;{itemToDelete?.storage_path.split('/').pop()}&quot;</span>?
                This will soft delete the image registry, hiding it from all selectors and pages. Existing pages referencing this media ID may fall back to default layouts.
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
              className="bg-red-600 hover:bg-red-750 text-white font-bold cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Asset'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => !bulkDeleting && setBulkDeleteModalOpen(false)}
        title="Confirm Bulk Soft Delete"
        className="border-red-500/20 max-w-md text-white font-sans animate-fade-in"
      >
        <div className="space-y-6 pt-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-555 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Multiple Media Assets?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">{selectedIds.length} select asset(s)</span>?
                This will soft delete all selected image registries. Pages referencing these assets may fall back to default assets or blank elements.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-800/40 pt-4">
            <Button
              variant="outline"
              disabled={bulkDeleting}
              onClick={() => setBulkDeleteModalOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
              className="bg-red-650 hover:bg-red-750 text-white font-bold cursor-pointer"
            >
              {bulkDeleting ? 'Deleting Assets...' : 'Delete Selected Assets'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
