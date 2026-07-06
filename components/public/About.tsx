'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AboutContent } from '@/lib/supabase/queries';

interface AboutProps {
  content: AboutContent;
}

export function About({ content }: AboutProps) {
  const scrollTransition = { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const };
  const headerTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <section id="about" aria-labelledby="about-heading" className="py-24 bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Global section header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={headerTransition}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold" aria-hidden="true">
            Luxury Interior Studio
          </span>
          <h2 id="about-heading" className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            The Nailaa Studio
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" aria-hidden="true" />
        </motion.div>

        {/* Alternate Block 1: Introduction (Text Left → Image Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="flex flex-col space-y-6"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Story
            </h3>
            <p className="text-stone-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.intro_text}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group"
          >
            <Image
              src={content.intro_image_url}
              alt="Luxury interior design mood board selection, fabric swatches, and material samples at The Nailaa Studio"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>
        </div>

        {/* Alternate Block 2: Vision (Image Left → Text Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group md:order-1 order-2"
          >
            <Image
              src={content.vision_image_url}
              alt="Timeless Scandinavian residential villa interior with floor-to-ceiling glass and soft neutral colors"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="flex flex-col space-y-6 md:order-2 order-1"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Vision
            </h3>
            <p className="text-stone-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.vision_text}
            </p>
          </motion.div>
        </div>

        {/* Alternate Block 3: Mission (Text Left → Image Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="flex flex-col space-y-6"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Mission
            </h3>
            <p className="text-stone-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.mission_text}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={scrollTransition}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group"
          >
            <Image
              src={content.mission_image_url}
              alt="Professional architect drafting floor plan layout blueprint on large wooden table"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
