'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, ChevronLeft, ChevronRight, X, Calendar, MapPin } from 'lucide-react';
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

  return (
    <section id="portfolio" className="py-24 bg-[#111111] text-white font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold">
            Bespoke Styling Showcase
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Selected Artistry
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" />
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <Button
            variant={activeCategory === 'all' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'rounded-full px-6 transition-all duration-300 font-medium cursor-pointer text-xs uppercase tracking-widest',
              activeCategory === 'all'
                ? 'bg-[#C9A86A] text-[#111111]'
                : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            )}
          >
            All Art
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.slug ? 'accent' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.slug)}
              className={cn(
                'rounded-full px-6 transition-all duration-300 font-medium cursor-pointer text-xs uppercase tracking-widest',
                activeCategory === cat.slug
                  ? 'bg-[#C9A86A] text-[#111111]'
                  : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Dynamic Grid Layout */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/5 bg-[#171717] group cursor-pointer"
                onClick={() => handleOpenProject(project)}
              >
                {/* Cover Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.cover_image_url}
                  alt={project.name}
                  className="w-full h-full object-cover transform duration-700 group-hover:scale-105 origin-center"
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
                      <Focus className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox / Gallery Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10"
          >
            {/* Close trigger button */}
            <button
              onClick={handleCloseProject}
              className="absolute top-6 right-6 z-50 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="relative w-full max-w-5xl flex flex-col items-center">
              
              {/* Media viewer container */}
              <div className="relative w-full aspect-[4/3] max-h-[70vh] rounded-lg overflow-hidden bg-black flex items-center justify-center border border-white/5">
                
                {/* Active Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={projectImages[activeImageIdx]}
                  alt={`${selectedProject.name} ${activeImageIdx + 1}`}
                  className="w-full h-full object-contain"
                />

                {/* Left navigation arrow */}
                {projectImages.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 cursor-pointer transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {projectImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 cursor-pointer transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}

                {/* Image counter indicator */}
                {projectImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 border border-white/10 rounded px-2.5 py-1 text-[10px] tracking-widest font-bold text-gray-300">
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
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-none mt-1">
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
                      <MapPin className="h-3.5 w-3.5 text-[#C9A86A]" />
                      <span>{selectedProject.location}</span>
                    </span>
                  )}
                  {selectedProject.completion_year && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-[#C9A86A]" />
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
                      className={cn(
                        'relative w-16 h-12 rounded overflow-hidden border cursor-pointer transition-all flex-shrink-0',
                        activeImageIdx === idx
                          ? 'border-[#C9A86A] scale-95 ring-1 ring-[#C9A86A]'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="Gallery thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
