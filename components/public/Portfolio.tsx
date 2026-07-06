'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, ChevronLeft, ChevronRight, X, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { PortfolioCategory, PortfolioProject } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface PortfolioProps {
  categories: PortfolioCategory[];
  projects: PortfolioProject[];
}

export function Portfolio({ categories, projects }: PortfolioProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [selectedProject, setSelectedProject] = React.useState<PortfolioProject | null>(null);
  const [activeImageIdx, setActiveImageIdx] = React.useState<number>(0);

  // Filter projects by selected category slug
  const filteredProjects = React.useMemo(() => {
    if (activeCategory === 'all') return projects;
    return projects.filter((p) => p.category_slug === activeCategory);
  }, [activeCategory, projects]);

  const handleOpenProject = (project: PortfolioProject) => {
    setSelectedProject(project);
    setActiveImageIdx(0);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
  };

  // Compile list of all images for the selected project (cover + gallery)
  const projectImages = React.useMemo(() => {
    if (!selectedProject) return [];
    return [selectedProject.cover_image_url, ...selectedProject.gallery_urls];
  }, [selectedProject]);

  // Gallery Navigation Functions
  const handlePrevImage = React.useCallback(() => {
    if (projectImages.length <= 1) return;
    setActiveImageIdx((prev) => (prev === 0 ? projectImages.length - 1 : prev - 1));
  }, [projectImages]);

  const handleNextImage = React.useCallback(() => {
    if (projectImages.length <= 1) return;
    setActiveImageIdx((prev) => (prev === projectImages.length - 1 ? 0 : prev + 1));
  }, [projectImages]);

  // Keyboard navigation setup (Left, Right, Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProject) return;
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        handleCloseProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject, handlePrevImage, handleNextImage]);

  const lightboxRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const triggerRef = React.useRef<Element | null>(null);

  // Manage focus trap and restoration for the Lightbox
  React.useEffect(() => {
    if (selectedProject) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => closeButtonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    } else {
      document.body.style.overflow = 'unset';
      if (triggerRef.current && 'focus' in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [selectedProject]);

  React.useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="py-24 bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white font-sans overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold" aria-hidden="true">
            Bespoke Interior Curation
          </span>
          <h2 id="portfolio-heading" className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Selected Artistry
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" aria-hidden="true" />
        </div>

        {/* Filter Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Filter portfolio by project type"
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
        >
          <Button
            variant={activeCategory === 'all' ? 'accent' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={activeCategory === 'all'}
            aria-controls="portfolio-grid"
            id="tab-all"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'rounded-full px-6 transition-all duration-300 font-medium cursor-pointer text-xs uppercase tracking-widest',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              activeCategory === 'all'
                ? 'bg-[#C9A86A] text-[#111111]'
                : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-white/20'
            )}
          >
            All Projects
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.slug ? 'accent' : 'outline'}
              size="sm"
              role="tab"
              aria-selected={activeCategory === cat.slug}
              aria-controls="portfolio-grid"
              id={`tab-${cat.slug}`}
              onClick={() => setActiveCategory(cat.slug)}
              className={cn(
                'rounded-full px-6 transition-all duration-300 font-medium cursor-pointer text-xs uppercase tracking-widest',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                activeCategory === cat.slug
                  ? 'bg-[#C9A86A] text-[#111111]'
                  : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-white/20'
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Dynamic Grid Layout */}
        <motion.div
          layout
          id="portfolio-grid"
          role="region"
          aria-live="polite"
          aria-label="Filtered portfolio projects"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.button
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                aria-label={`View details of project ${project.name}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 dark:border-white/5 bg-stone-100 dark:bg-[#171717] group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                onClick={() => handleOpenProject(project)}
              >
                {/* Cover Image */}
                <Image
                  src={project.cover_image_url}
                  alt={`${project.name} preview`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transform duration-700 group-hover:scale-105 origin-center"
                />

                {/* Glassmorphic Hover Overlay */}
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-10">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A86A]">
                      {project.category_name}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-snug">
                      {project.name}
                    </h3>
                    
                    {/* Tags Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-white/10 hover:bg-white/15 text-white/95 border-transparent text-[9px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 text-[10px] uppercase font-bold tracking-widest text-[#C9A86A] opacity-90 group-hover:opacity-100">
                      <span>View Gallery</span>
                      <Focus className="h-3 w-3" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox / Gallery Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#111111]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-10"
          >
            {/* Close trigger button */}
            <button
              ref={closeButtonRef}
              onClick={handleCloseProject}
              aria-label="Close project details"
              className="absolute top-6 right-6 z-50 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-5xl flex flex-col items-center"
            >
              
              {/* Media viewer container */}
              <div className="relative w-full aspect-[4/3] max-h-[70vh] rounded-lg overflow-hidden bg-black flex items-center justify-center border border-white/5">
                
                {/* Active Image */}
                <Image
                  src={projectImages[activeImageIdx]}
                  alt={`${selectedProject.name} image ${activeImageIdx + 1} of ${projectImages.length}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  className="object-contain"
                />

                {/* Left navigation arrow */}
                {projectImages.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {projectImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}

                {/* Image counter indicator */}
                {projectImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 border border-white/10 rounded px-2.5 py-1 text-[10px] tracking-widest font-bold text-gray-300" aria-live="polite">
                    {activeImageIdx + 1} / {projectImages.length}
                  </div>
                )}
              </div>

              {/* Project description details */}
              <div className="w-full text-center sm:text-left mt-6 flex flex-col sm:flex-row items-start justify-between gap-4 px-2">
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A86A]">
                    {selectedProject.category_name}
                  </span>
                  <h3 id="lightbox-title" className="font-serif text-2xl sm:text-3xl font-bold leading-none mt-1">
                    {selectedProject.name}
                  </h3>
                  {selectedProject.description && (
                    <p className="text-gray-300 text-sm font-light leading-relaxed max-w-xl">
                      {selectedProject.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-3 text-xs text-gray-400 select-none">
                  {selectedProject.location && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-[#C9A86A]" aria-hidden="true" />
                      <span>{selectedProject.location}</span>
                    </span>
                  )}
                  {selectedProject.completion_year && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-[#C9A86A]" aria-hidden="true" />
                      <span>{selectedProject.completion_year}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery thumbnails strip */}
              {projectImages.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto w-full mt-6 pb-2">
                  {projectImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={cn(
                        'relative w-16 h-12 rounded overflow-hidden border cursor-pointer transition-all flex-shrink-0',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-1 focus-visible:ring-offset-black',
                        activeImageIdx === idx
                          ? 'border-[#C9A86A] scale-95 ring-1 ring-[#C9A86A]'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      )}
                    >
                      <Image src={img} alt={`Gallery thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Case Study Link */}
              <div className="w-full flex justify-center mt-6 pb-2">
                <Link
                  href={`/case-study/${selectedProject.slug}`}
                  onClick={handleCloseProject}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A86A] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#C9A86A]/90 transition-all shadow-lg"
                >
                  View Full Case Study <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
