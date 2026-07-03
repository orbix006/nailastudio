'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Search, Image as ImageIcon, Check, Loader2, UploadCloud, Trash } from 'lucide-react';
import { UploadModal } from '@/components/admin/UploadModal';
import { cn } from '@/lib/utils';

interface MediaSelectorProps {
  value: string | null | undefined;
  onChange: (mediaId: string | null) => void;
  label?: string;
}

interface MediaItem {
  id: string;
  bucket: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  file_size_bytes: number;
}

export function MediaSelector({ value, onChange, label }: MediaSelectorProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Library list state
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');

  // Inline upload state
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch current value public url
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const fetchPreview = async () => {
      try {
        const { data, error } = await supabase
          .from('media_library')
          .select('public_url')
          .eq('id', value)
          .maybeSingle();

        if (data) {
          setPreviewUrl(data.public_url);
        } else if (error) {
          console.error('Error fetching image preview URL:', error);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPreview();
  }, [value, supabase]);

  // Load library options
  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_library')
        .select('id, bucket, storage_path, public_url, alt_text, file_size_bytes')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLibrary(data || []);
    } catch (err) {
      console.error('Failed to load media selection list:', err);
      toast('Failed to load media library assets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSelector = () => {
    setModalOpen(true);
    fetchLibrary();
  };

  const handleSelectImage = (item: MediaItem) => {
    onChange(item.id);
    setPreviewUrl(item.public_url);
    setModalOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewUrl(null);
  };

  // Filtered selector lists
  const filteredLibrary = library.filter((item) => {
    const filename = item.storage_path.split('/').pop() || '';
    const alt = item.alt_text || '';
    const matchesSearch = filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
      alt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBucket = selectedBucket === 'all' || item.bucket === selectedBucket;
    return matchesSearch && matchesBucket;
  });

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase">{label}</label>}
      
      <div className="flex items-center gap-4">
        {/* Preview image */}
        <div className="relative h-20 w-28 rounded-lg overflow-hidden border border-gray-800 bg-[#111111] flex items-center justify-center">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected Preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-gray-700" />
          )}
        </div>

        {/* Action triggers */}
        <div className="flex flex-col space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenSelector}
              className="border-gray-800 hover:border-[#C9A86A]/40 text-xs cursor-pointer"
            >
              Select Image
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                aria-label="Remove selected image"
                className="border-red-500/10 hover:bg-red-500/10 text-red-400 text-xs cursor-pointer"
              >
                <Trash className="h-3 w-3 mr-1" /> Remove
              </Button>
            )}
          </div>
          <span className="text-[10px] text-gray-550">
            Pick from your catalog or upload a new asset.
          </span>
        </div>
      </div>

      {/* Library Selection Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Media Asset"
        className="max-w-3xl text-white font-sans border-gray-800"
      >
        <div className="space-y-5 pt-2">
          
          {/* Filters & Actions bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                aria-label="Search images by name or alt text"
                placeholder="Search images by name or alt text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
              />
            </div>
            
            <select
              value={selectedBucket}
              aria-label="Filter images by bucket"
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full sm:w-40 px-2 py-2 rounded-md border border-gray-800 bg-[#111111] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
            >
              <option value="all">All Buckets</option>
              <option value="logos">Logos</option>
              <option value="hero">Hero</option>
              <option value="services">Services</option>
              <option value="portfolio">Portfolio</option>
              <option value="about">About</option>
              <option value="testimonials">Testimonials</option>
              <option value="core-values">Core Values</option>
              <option value="media">Media</option>
            </select>

            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 text-xs w-full sm:w-auto cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1" />
              Upload New
            </Button>
          </div>

          {/* Grid Selection */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-gray-500">
              <Loader2 className="h-7 w-7 animate-spin text-[#C9A86A]" />
              <span className="text-xs uppercase tracking-wider">Browsing catalog...</span>
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 border border-gray-850 rounded-lg bg-[#111111] text-center">
              <ImageIcon className="h-8 w-8 text-gray-700 animate-pulse" />
              <p className="text-xs font-semibold text-gray-400">No images found</p>
              <p className="text-[10px] text-gray-650">Verify filter triggers or upload a new asset.</p>
            </div>
          ) : (
            <div className="h-96 overflow-y-auto pr-1 border border-gray-850 rounded-lg bg-[#111111] p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredLibrary.map((item) => {
                  const filename = item.storage_path.split('/').pop() || 'image';
                  const isSelected = value === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectImage(item)}
                      aria-label={`Select image ${filename}`}
                      aria-pressed={isSelected}
                      className={cn(
                        'relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group select-none outline-none transition-all w-full text-left',
                        'focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isSelected 
                          ? 'border-[#C9A86A] ring-1 ring-[#C9A86A]/45' 
                          : 'border-gray-800 hover:border-[#C9A86A]/30'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.public_url} alt={item.alt_text || ''} className="h-full w-full object-cover" />
                      
                      {/* Hover Info bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[9px] text-gray-300 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {filename}
                      </div>

                      {/* Selected Check overlay */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded bg-[#C9A86A] text-[#111111]">
                          <Check className="h-3 w-3 font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-800/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inline UploadModal trigger */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={() => {
          // Re-fetch media list and select the newest uploaded file
          const refresh = async () => {
            try {
              const { data } = await supabase
                .from('media_library')
                .select('id, public_url')
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (data) {
                onChange(data.id);
                setPreviewUrl(data.public_url);
              }
              fetchLibrary();
            } catch (err) {
              console.error(err);
            }
          };
          refresh();
        }}
      />
    </div>
  );
}
