'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/FormControls';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const SUPPORTED_BUCKETS = [
  { id: 'logos', label: 'Logos (Theme & Branding)' },
  { id: 'hero', label: 'Hero (Main Homepage Banner)' },
  { id: 'services', label: 'Services (Treatment Gallery)' },
  { id: 'portfolio', label: 'Portfolio (Showcase Projects)' },
  { id: 'about', label: 'About (Story Blocks)' },
  { id: 'testimonials', label: 'Testimonials (Client Avatars)' },
  { id: 'core-values', label: 'Core Values (Icons & Highlights)' },
  { id: 'media', label: 'Media (General Library / Core Assets)' },
];

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [bucket, setBucket] = useState('media');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  // Duplicate detection state (used for single uploads)
  const [duplicateFile, setDuplicateFile] = useState<{
    id: string;
    publicUrl: string;
    bucket: string;
    path: string;
    file: File;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    if (isOpen) {
      fetchUser();
      setDuplicateFile(null);
    }
  }, [isOpen, supabase]);

  // Client-side image compression
  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        resolve(file); // Skip compress for SVG, WebP
        return;
      }
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Resize down if too large (e.g. 1920px max size)
        const MAX_SIZE = 1920;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file); // Keep original if size was not reduced
            }
            URL.revokeObjectURL(img.src);
          },
          'image/jpeg',
          0.82 // 82% compression quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    });
  };

  const computeSHA256 = async (file: File | Blob): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const getImageDimensions = (file: File | Blob): Promise<{ width: number; height: number }> => {
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

  const processUploads = async (files: File[], reuseExisting = false) => {
    if (files.length === 0) return;

    // Filter file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast('Supported file types: JPEG, PNG, WEBP, SVG.', 'error');
      return;
    }

    // Limit check: 10MB
    const maxLimit = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxLimit);
    if (oversizedFiles.length > 0) {
      toast('Some files exceed the 10MB size limit.', 'error');
      return;
    }

    // Handle single file duplicate prompt logic
    if (files.length === 1 && !reuseExisting) {
      const file = files[0];
      try {
        setUploading(true);
        setProgress(15);
        const compressedBlob = await compressImage(file);
        const processedFile = compressedBlob instanceof File 
          ? compressedBlob 
          : new File([compressedBlob], file.name, { type: 'image/jpeg' });

        const checksum = await computeSHA256(processedFile);

        const { data: existingMedia } = await supabase
          .from('media_library')
          .select('id, public_url, bucket, storage_path')
          .eq('checksum_sha256', checksum)
          .is('deleted_at', null)
          .maybeSingle();

        if (existingMedia) {
          setDuplicateFile({
            id: existingMedia.id,
            publicUrl: existingMedia.public_url,
            bucket: existingMedia.bucket,
            path: existingMedia.storage_path,
            file,
          });
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error('Single file checksum check error:', err);
      } finally {
        setUploading(false);
      }
    }

    // Run sequential uploads
    try {
      setUploading(true);
      let successCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Calculate progress percentage based on queue position
        setProgress(Math.round(((i) / files.length) * 100));

        // 1. Client-side compress
        const compressedBlob = await compressImage(file);
        const processedFile = compressedBlob instanceof File 
          ? compressedBlob 
          : new File([compressedBlob], file.name, { type: 'image/jpeg' });

        // 2. Hash check
        const checksum = await computeSHA256(processedFile);

        if (!reuseExisting) {
          const { data: existingMedia } = await supabase
            .from('media_library')
            .select('id')
            .eq('checksum_sha256', checksum)
            .is('deleted_at', null)
            .maybeSingle();

          if (existingMedia) {
            duplicateCount++;
            continue; // Skip duplicate file
          }
        }

        // 3. Perform upload
        const fileExt = file.name.split('.').pop() || 'jpg';
        const uniqueFileName = `${checksum}.${fileExt}`;
        const storagePath = `${bucket}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, processedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        // Retrieve width/height
        const dimensions = await getImageDimensions(processedFile);

        // Save index
        const { error: dbError } = await supabase
          .from('media_library')
          .insert({
            bucket,
            storage_path: storagePath,
            public_url: publicUrl,
            mime_type: processedFile.type,
            file_size_bytes: processedFile.size,
            width_px: dimensions.width || null,
            height_px: dimensions.height || null,
            alt_text: file.name.split('.')[0].replace(/[-_]/g, ' '), // Pre-fill clean alt name
            checksum_sha256: checksum,
            uploaded_by: adminUser?.id || null,
          });

        if (dbError) throw dbError;
        successCount++;
      }

      setProgress(100);

      if (successCount > 0) {
        toast(`Uploaded ${successCount} asset(s) successfully.`, 'success');
      }
      if (duplicateCount > 0) {
        toast(`Skipped ${duplicateCount} identical duplicate files.`, 'info');
      }

      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error('Multiple files upload failed:', err);
      toast('Upload execution encountered an error.', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      setDuplicateFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploads(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploads(Array.from(e.target.files));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !uploading && onClose()}
      title="Upload Media Assets"
      className="max-w-md text-white border-[#C9A86A]/20 font-sans"
    >
      {duplicateFile ? (
        /* Duplicate Prompt panel */
        <div className="space-y-6 pt-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 flex-shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Duplicate Asset Found</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                An identical image already exists in bucket <span className="text-[#C9A86A] font-semibold">{duplicateFile.bucket}</span> at path <span className="text-white font-mono">{duplicateFile.path}</span>.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">
                Would you like to reuse the existing image, or cancel this action to upload a different file?
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-800 bg-[#111111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={duplicateFile.publicUrl}
              alt="Existing duplicate"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-800/40 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateFile(null);
                onClose();
              }}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => processUploads([duplicateFile.file], true)}
              className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              <span>Reuse Asset</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Normal upload panel */
        <div className="space-y-5 pt-2">
          {/* Target Bucket Selector */}
          <div className="space-y-1.5">
            <Label>Destination Bucket</Label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white outline-none focus:border-[#C9A86A]"
            >
              {SUPPORTED_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-gray-550 block">
              Choose the correct bucket location to ensure permissions and size limits align.
            </span>
          </div>

          {/* Drag & Drop Box */}
          {uploading ? (
            <div className="h-48 rounded-lg bg-gray-900 border border-dashed border-gray-800 flex flex-col items-center justify-center space-y-4 px-6 text-gray-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#C9A86A]" />
              <div className="w-full space-y-2 text-center">
                <span className="text-xs uppercase font-bold tracking-widest text-[#C9A86A] block">
                  Processing Upload Queue... {progress}%
                </span>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-gray-850">
                  <div
                    className="h-full bg-gradient-to-r from-[#8A7052] to-[#C9A86A] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                dragActive
                  ? 'border-[#C9A86A] bg-[#C9A86A]/5'
                  : 'border-gray-800 bg-[#111111] hover:bg-[#1C1C1C] hover:border-[#C9A86A]/20'
              }`}
            >
              <Upload className="h-8 w-8 text-gray-500 mb-2" />
              <span className="text-xs font-semibold text-gray-300">Drag & Drop Images Here</span>
              <span className="text-[10px] text-gray-550 mt-1 max-w-[220px]">
                Or click to browse files. Select one or more images. JPEG, PNG, WEBP, or SVG (Max 10MB).
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </label>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-800/40">
            <Button
              variant="outline"
              disabled={uploading}
              onClick={onClose}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
