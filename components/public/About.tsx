'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AboutContent } from '@/lib/supabase/queries';

interface AboutProps {
  content: AboutContent;
}

export function About({ content }: AboutProps) {
  // Animation variants
  const slideFromLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, duration: 1.2, bounce: 0.15 },
    },
  };

  const slideFromRight = {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, duration: 1.2, bounce: 0.15 },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 1.2, bounce: 0.1 },
    },
  };

  return (
    <section id="about" className="py-24 bg-[#111111] text-white overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Global section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold">
            Bespoke Artistry
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            The Nailaa Studio
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" />
        </motion.div>

        {/* Alternate Block 1: Introduction (Text Left -> Image Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromLeft}
            className="flex flex-col space-y-6"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Story
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.intro_text}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromRight}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.intro_image_url}
              alt="Nail Artistry at The Nailaa Studio"
              className="w-full h-full object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>
        </div>

        {/* Alternate Block 2: Vision (Image Left -> Text Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24 md:flex-row-reverse">
          {/* On mobile, we want the image to stack correctly, but on desktop, image is left, text is right. 
              Next.js Grid automatically handles order based on element position unless ordered otherwise.
              To make it left-image on desktop, we place the image first in markup, but on mobile, it remains on top. */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromLeft}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group md:order-1 order-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.vision_image_url}
              alt="Our Vision for Luxury Grooming"
              className="w-full h-full object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromRight}
            className="flex flex-col space-y-6 md:order-2 order-1"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Vision
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.vision_text}
            </p>
          </motion.div>
        </div>

        {/* Alternate Block 3: Mission (Text Left -> Image Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromLeft}
            className="flex flex-col space-y-6"
          >
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C9A86A] tracking-wide">
              Our Mission
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {content.mission_text}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideFromRight}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A86A]/20 shadow-2xl group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.mission_image_url}
              alt="Our Mission for Bespoke Hand Care"
              className="w-full h-full object-cover transform duration-700 group-hover:scale-105 origin-center"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
