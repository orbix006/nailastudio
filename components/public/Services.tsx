'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Paintbrush, Layers } from 'lucide-react';
import { Service } from '@/lib/supabase/queries';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ServicesProps {
  services: Service[];
}

export function Services({ services }: ServicesProps) {
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [activeImageMap, setActiveImageMap] = React.useState<Record<string, string>>({});

  const handleOpenDetails = (service: Service) => {
    setSelectedService(service);
    // Initialize active gallery image
    if (service.cover_image_url) {
      setActiveImageMap((prev) => ({
        ...prev,
        [service.id]: service.cover_image_url!,
      }));
    }
  };

  const handleCloseDetails = () => {
    setSelectedService(null);
  };

  // Close modal and scroll smoothly to target anchors
  const handleCTAAction = (targetId: string) => {
    handleCloseDetails();
    setTimeout(() => {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300); // Wait for modal exit transition
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 0.8, bounce: 0.15 },
    },
  };

  return (
    <section id="services" className="py-24 bg-[#141414] text-white font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold">
            Bespoke Treatments
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Services & Artistry
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" />
        </div>

        {/* Responsive Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service) => (
            <motion.div key={service.id} variants={cardVariants} className="flex">
              <Card
                hoverEffect
                className="flex flex-col w-full h-full group bg-[#1A1A1A] border-[#C9A86A]/10 hover:border-[#C9A86A]/30 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-900 border-b border-[#C9A86A]/10">
                  {service.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={service.cover_image_url}
                      alt={service.title}
                      className="w-full h-full object-cover transform duration-700 group-hover:scale-105 origin-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#111111] flex items-center justify-center text-gray-700">
                      Placeholder
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-80" />
                </div>

                <CardHeader className="pb-3 flex-grow">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="accent" className="text-[10px] tracking-widest font-bold">
                      LUXURY
                    </Badge>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-serif text-white group-hover:text-[#C9A86A] transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2 text-sm line-clamp-3 leading-relaxed">
                    {service.short_description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4 pt-0">
                  {/* Miniature features bullets list */}
                  <ul className="space-y-2 text-xs text-gray-400">
                    {service.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Check className="h-3 w-3 text-[#C9A86A] flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0 border-t border-transparent">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenDetails(service)}
                    className="w-full text-left justify-between hover:text-[#C9A86A] hover:bg-transparent group/btn py-2 px-0 cursor-pointer"
                  >
                    <span className="text-xs font-bold tracking-widest uppercase">Discover Service</span>
                    <ArrowRight className="h-4 w-4 transform duration-300 group-hover/btn:translate-x-1.5 text-[#C9A86A]" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Detailed Modal Window (Overlay dialog) */}
      <AnimatePresence>
        {selectedService && (
          <Modal
            isOpen={!!selectedService}
            onClose={handleCloseDetails}
            title={selectedService.title}
            size="lg"
            className="border-[#C9A86A]/25 max-w-4xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Left Column: Image Gallery Viewer */}
              <div className="flex flex-col space-y-4">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/10 bg-gray-900 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImageMap[selectedService.id] || selectedService.cover_image_url || ''}
                    alt={selectedService.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>
                
                {/* Thumbnails Row */}
                {selectedService.gallery_urls.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {/* Include cover image as first thumbnail */}
                    {selectedService.cover_image_url && (
                      <button
                        onClick={() =>
                          setActiveImageMap((prev) => ({
                            ...prev,
                            [selectedService.id]: selectedService.cover_image_url!,
                          }))
                        }
                        className={cn(
                          'relative w-16 h-12 rounded overflow-hidden border cursor-pointer transition-all flex-shrink-0',
                          activeImageMap[selectedService.id] === selectedService.cover_image_url
                            ? 'border-[#C9A86A] scale-95 ring-1 ring-[#C9A86A]'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedService.cover_image_url}
                          alt="Cover Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    {/* Other gallery thumbnails */}
                    {selectedService.gallery_urls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setActiveImageMap((prev) => ({
                            ...prev,
                            [selectedService.id]: url,
                          }))
                        }
                        className={cn(
                          'relative w-16 h-12 rounded overflow-hidden border cursor-pointer transition-all flex-shrink-0',
                          activeImageMap[selectedService.id] === url
                            ? 'border-[#C9A86A] scale-95 ring-1 ring-[#C9A86A]'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Gallery Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Info & Features */}
              <div className="flex flex-col space-y-6">
                
                {/* Overview Description */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold mb-1 flex items-center space-x-1.5">
                    <Sparkles className="h-3 w-3" />
                    <span>Overview</span>
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed font-light">
                    {selectedService.detailed_overview || selectedService.short_description}
                  </p>
                </div>

                {/* Alternate layout columns for Philosophy & Materials */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-800/40 pt-4">
                  {selectedService.design_approach && (
                    <div className="space-y-1">
                      <h5 className="text-[10px] uppercase tracking-[0.2em] text-[#8A7052] font-semibold flex items-center space-x-1">
                        <Paintbrush className="h-3 w-3" />
                        <span>Artistry</span>
                      </h5>
                      <p className="text-gray-400 text-xs leading-relaxed font-light">
                        {selectedService.design_approach}
                      </p>
                    </div>
                  )}
                  {selectedService.materials_finishes && (
                    <div className="space-y-1">
                      <h5 className="text-[10px] uppercase tracking-[0.2em] text-[#8A7052] font-semibold flex items-center space-x-1">
                        <Layers className="h-3 w-3" />
                        <span>Wellness</span>
                      </h5>
                      <p className="text-gray-400 text-xs leading-relaxed font-light">
                        {selectedService.materials_finishes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Features list */}
                {selectedService.features.length > 0 && (
                  <div className="border-t border-gray-800/40 pt-4">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold mb-2">
                      Treatment Highlights
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                      {selectedService.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <Check className="h-3.5 w-3.5 text-[#C9A86A] flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Modal CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-800/40 mt-auto">
                  <Button
                    variant="accent"
                    size="sm"
                    className="w-full sm:w-auto flex-1 font-bold cursor-pointer"
                    onClick={() => {
                      handleCloseDetails();
                      setTimeout(() => {
                        const event = new CustomEvent('open-inquiry-modal', {
                          detail: { source: 'service_modal' },
                        });
                        window.dispatchEvent(event);
                      }, 300);
                    }}
                  >
                    Enquire About Service
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-gray-800 hover:bg-gray-800/40 hover:text-white text-gray-400 font-bold cursor-pointer"
                    onClick={() => handleCTAAction('#portfolio')}
                  >
                    View Related Projects
                  </Button>
                </div>

              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  );
}
