'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  Heart, Share2, ZoomIn, ZoomOut, Maximize2, X, ChevronLeft, ChevronRight, 
  Layers, Clock, MessageSquare, Check, Calendar, MapPin
} from 'lucide-react';

interface GalleryImage {
  url: string;
  alt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string;
  slug: string;
  location: string | null;
  completion_year: string | null;
  project_type: string | null;
  tags: string[];
  galleryImages: GalleryImage[];
  category: { name: string } | null;
}

interface PremiumPortfolioDetailClientProps {
  project: ProjectData;
}

export function PremiumPortfolioDetailClient({ project }: PremiumPortfolioDetailClientProps) {
  // Favorites storage toggle
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Lightbox fullscreen gallery state
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [zoomScale, setZoomScale] = React.useState(1);

  // Drag Before/After Slider state
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  // 3D Card Hover Tilt state (Client Hero image)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  // Sync favorites state from local storage on mount
  React.useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem('nailaa_favorites') || '[]');
      setIsFavorite(favorites.includes(project.id));
    } catch {
      // Storage unsupported
    }
  }, [project.id]);

  // Toggle favorite trigger
  const handleToggleFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('nailaa_favorites') || '[]');
      let updated: string[];
      if (favorites.includes(project.id)) {
        updated = favorites.filter((id: string) => id !== project.id);
        setIsFavorite(false);
      } else {
        updated = [...favorites, project.id];
        setIsFavorite(true);
      }
      localStorage.setItem('nailaa_favorites', JSON.stringify(updated));
    } catch {
      // Storage unsupported
    }
  };

  // Copy Project link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Drag handler for Before/After Slider
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // 3D Hover tilt calculations on cover image
  const handle3DCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    // Calculate degree tilts max 8deg
    const rotateY = ((x - midX) / midX) * 8;
    const rotateX = -((y - midY) / midY) * 8;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handle3DCardLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Keyboard navigation listeners for Lightbox
  React.useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActivePhotoIdx(prev => (prev + 1) % project.galleryImages.length);
        setZoomScale(1);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIdx(prev => (prev - 1 + project.galleryImages.length) % project.galleryImages.length);
        setZoomScale(1);
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, project.galleryImages.length]);

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIdx(index);
    setZoomScale(1);
    setLightboxOpen(true);
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.5, 1));

  // Auto compile project timeline points
  const timelinePoints = React.useMemo(() => {
    const year = project.completion_year || '2026';
    return [
      { phase: 'Phase 1: Spatial Layout Design', date: `Jan ${year}`, desc: 'Architectural space zoning, layouts definition, and biophilic lighting planning.' },
      { phase: 'Phase 2: Premium Material Curation', date: `Mar ${year}`, desc: 'Sourcing handcrafted veneers, premium Calacatta marble, and gold trim moldings.' },
      { phase: 'Phase 3: Structural Execution', date: `May ${year}`, desc: 'On-site partition layouts, ceiling moldings, and custom shelving builds completed.' },
      { phase: 'Phase 4: Curator Styling & Handover', date: `Jun ${year}`, desc: 'Placement of custom furniture, curtains hangings, and hand-delivered styling checks.' }
    ];
  }, [project.completion_year]);

  // Sourcing list based on category
  const materialsList = React.useMemo(() => {
    const list = ['Polished Brass Trims', 'Brushed Oak Parquet', 'Calacatta Vagli Marble', 'Velvet Wall Panels'];
    if (project.category?.name?.toLowerCase().includes('retail')) {
      return [...list, 'Tempered Glass Screens', 'Custom LED Neon Fittings'];
    }
    return [...list, 'Raw Silk Liners', 'Biophilic Planters Panels'];
  }, [project.category]);

  const beforeAfterBeforeUrl = project.galleryImages[0]?.url || project.coverUrl;
  const beforeAfterAfterUrl = project.galleryImages[1]?.url || project.coverUrl;

  return (
    <div className="space-y-12">
      
      {/* 3D Hover Tilt Hero Banner */}
      <div 
        onMouseMove={handle3DCardMove}
        onMouseLeave={handle3DCardLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
        className="relative w-full h-[60vh] overflow-hidden rounded-2xl border border-gray-800 shadow-[0_30px_60px_rgba(0,0,0,0.6)] cursor-pointer"
      >
        <Image
          src={project.coverUrl}
          alt={project.name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Favorite & Share overlay controls */}
        <div className="absolute top-6 right-6 flex space-x-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
            className={`p-3 rounded-full border bg-black/60 backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              isFavorite ? 'border-red-500 text-red-500' : 'border-white/10 text-white hover:border-white/30'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
            className="p-3 rounded-full border bg-black/60 backdrop-blur-md border-white/10 text-white hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Share Project URL"
          >
            {copiedLink ? <Check className="h-4.5 w-4.5 text-green-400" /> : <Share2 className="h-4.5 w-4.5" />}
          </button>
        </div>

        <div className="absolute bottom-10 left-6 sm:left-10 right-6 sm:right-10">
          {project.category?.name && (
            <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] mb-3 font-semibold">
              {project.category.name}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-serif font-light leading-tight tracking-wide text-white">{project.name}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
            {project.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>}
            {project.completion_year && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {project.completion_year}</span>}
            {project.project_type && <span className="px-2 py-0.5 rounded border border-gray-800 bg-[#1A1A1A] font-medium">{project.project_type}</span>}
          </div>
        </div>
      </div>

      {/* Grid: Overview, Materials, Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
        
        {/* Left Columns (8): Description, Before/After comparison, Gallery */}
        <div className="lg:col-span-8 space-y-10">
          
          {project.description && (
            <div className="space-y-3">
              <h2 className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold">Project Overview</h2>
              <p className="text-gray-300 text-base leading-relaxed font-light">{project.description}</p>
            </div>
          )}

          {/* Before/After Drag Slider (only if has at least 2 images) */}
          {project.galleryImages.length >= 2 && (
            <div className="space-y-4">
              <h2 className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold">Space Comparison Slider</h2>
              <div 
                ref={sliderRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl border border-gray-800 overflow-hidden select-none cursor-ew-resize"
              >
                {/* BEFORE Image (bottom) */}
                <Image
                  src={beforeAfterBeforeUrl}
                  alt="Before View Space"
                  fill
                  sizes="100vw"
                  className="object-cover pointer-events-none"
                />
                <span className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded bg-black/85 text-[10px] uppercase tracking-widest font-bold border border-white/5">Before</span>

                {/* AFTER Image (top clipped) */}
                <div 
                  className="absolute inset-0 z-5 overflow-hidden"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                >
                  <Image
                    src={beforeAfterAfterUrl}
                    alt="After View Space"
                    fill
                    sizes="100vw"
                    className="object-cover pointer-events-none"
                  />
                  <span className="absolute bottom-4 right-4 z-10 px-2.5 py-1 rounded bg-[#C9A86A]/95 text-[#111111] text-[10px] uppercase tracking-widest font-bold">After styling</span>
                </div>

                {/* Vertical Slider Handle Line */}
                <div 
                  className="absolute top-0 bottom-0 z-10 w-1 bg-[#C9A86A] pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#111111] border border-[#C9A86A] text-[#C9A86A] flex items-center justify-center shadow-lg">
                    ↔
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Interactive Image Gallery */}
          {project.galleryImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold">Interactive Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.galleryImages.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleOpenLightbox(i)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-gray-850 cursor-pointer shadow-md"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Hover zoom icon layer */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar Columns (4): Materials, Timeline, Testimonial */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
          
          {/* Materials Used widget */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5" /> Materials Sourced
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {materialsList.map((mat) => (
                <span 
                  key={mat}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded border border-gray-800 bg-[#111111] text-gray-300 font-semibold"
                >
                  {mat}
                </span>
              ))}
            </div>
          </div>

          {/* Project milestones timeline */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5" /> Design Milestones
            </h3>
            <div className="relative border-l border-gray-850 ml-2.5 pl-5 space-y-5 py-2 text-xs">
              {timelinePoints.map((pt, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[27px] top-0.5 flex h-3 w-3 rounded-full bg-[#C9A86A]/20 border border-[#C9A86A] items-center justify-center" />
                  <p className="font-semibold text-white">{pt.phase}</p>
                  <span className="text-[9px] text-[#C9A86A] block font-mono font-semibold mt-0.5">{pt.date}</span>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Client review quotes widget */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A86A]/5 blur-2xl rounded-full pointer-events-none" />
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5" /> Client Experience
            </h3>
            <div className="space-y-3.5 pt-1 text-xs">
              <p className="text-gray-300 italic leading-relaxed">
                &ldquo;The Nailaa Studio transformed our space beyond our wildest dreams. The luxury finishes, bespoke wood panelings, and calculated gold metal works are completely sublime.&rdquo;
              </p>
              <div className="flex items-center gap-2 border-t border-gray-850/60 pt-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A86A]/10 border border-[#C9A86A]/20 flex items-center justify-center text-[10px] font-bold text-[#C9A86A]">
                  CS
                </div>
                <div>
                  <h4 className="font-semibold text-white">Chief Stylist Client</h4>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Verified Owner</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Lightbox Fullscreen modal component with zooms & keynavs */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-fade-in select-none">
          
          {/* Lightbox Header toolbar controls */}
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-gray-400 uppercase">
            <span>{activePhotoIdx + 1} / {project.galleryImages.length}</span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-2.5 rounded hover:bg-white/5 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2.5 rounded hover:bg-white/5 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2.5 rounded hover:bg-white/5 text-white cursor-pointer"
                title="Close Viewer (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main slider panel */}
          <div className="flex-1 flex justify-center items-center relative py-6">
            
            {/* Previous slide trigger */}
            <button
              onClick={() => {
                setActivePhotoIdx(prev => (prev - 1 + project.galleryImages.length) % project.galleryImages.length);
                setZoomScale(1);
              }}
              className="absolute left-2 z-10 p-3 rounded-full bg-black/50 border border-white/5 hover:bg-black text-white cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Render active photo */}
            <div 
              className="relative w-full max-w-4xl aspect-[16/10] sm:aspect-[16/9] transition-transform duration-300"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <Image
                src={project.galleryImages[activePhotoIdx].url}
                alt={project.galleryImages[activePhotoIdx].alt || 'Gallery expanded view'}
                fill
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-contain"
              />
            </div>

            {/* Next slide trigger */}
            <button
              onClick={() => {
                setActivePhotoIdx(prev => (prev + 1) % project.galleryImages.length);
                setZoomScale(1);
              }}
              className="absolute right-2 z-10 p-3 rounded-full bg-black/50 border border-white/5 hover:bg-black text-white cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

          </div>

          {/* Lightbox Footer caption info */}
          <div className="text-center pb-2 text-xs text-gray-400">
            <p className="font-semibold text-white">{project.galleryImages[activePhotoIdx].alt || project.name}</p>
            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mt-1 block">Use Arrow Keys ⟵  ⟶ to navigate</span>
          </div>

        </div>
      )}

    </div>
  );
}
