'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSettings } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  settings: HeroSettings;
}

export function Hero({ settings }: HeroProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Parallax Scroll Offset Calculations
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 300]);
  const yContent = useTransform(scrollY, [0, 1000], [0, -80]);
  const opacityContent = useTransform(scrollY, [0, 600], [1, 0]);

  // Ken Burns Animation Configurations
  const kenBurnsVariants = {
    animate: {
      scale: [1.02, 1.08],
      x: ['0%', '-1%'],
      y: ['0%', '0.5%'],
      transition: {
        duration: 25,
        ease: 'linear' as const,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  // Staggered Text & Button Entrance Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 70,
        damping: 18,
      },
    },
  };

  // Smooth scroll handler to target section
  const handleScrollTo = (targetId: string | null) => {
    if (!targetId) return;
    const cleanId = targetId.startsWith('#') ? targetId : `#${targetId}`;
    const targetElement = document.querySelector(cleanId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showVideo = settings.background_type === 'video' && settings.background_video_url;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#111111] flex items-center justify-center font-sans text-white"
    >
      {/* Background Media Container (Parallax Scrolling) */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
      >
        {/* Dark legibility overlay */}
        <div className="absolute inset-0 z-10 bg-black/55 dark:bg-black/60 backdrop-brightness-95" />
        {/* Elegant bottom gradient shadow */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-85" />

        {showVideo ? (
          <video
            src={settings.background_video_url!}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <motion.div
            variants={kenBurnsVariants}
            animate="animate"
            className="relative w-full h-full"
          >
            <Image
              src={settings.background_image_url || '/images/hero_background.png'}
              alt="The Nailaa Studio - Modern luxury living room with natural lighting, premium neutral furniture, textured walls, and marble finishes"
              fill
              priority
              sizes="100vw"
              className="object-cover origin-center"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Main Content Area (Parallax & Fade) */}
      <motion.div
        style={{ y: yContent, opacity: opacityContent }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
      >
        {/* Optional Studio Hero Logo */}
        {settings.logo_url && (
          <motion.div variants={itemVariants} className="mb-6 select-none">
            <Image
              src={settings.logo_url}
              alt="The Nailaa Studio Logo"
              width={200}
              height={80}
              priority
              className="h-20 w-auto object-contain mx-auto"
            />
          </motion.div>
        )}

        {/* Dynamic Heading */}
        <motion.h1
          variants={itemVariants}
          className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold tracking-wide leading-tight mb-6 bg-gradient-to-b from-white via-white to-[#E5D5C0]/85 bg-clip-text text-transparent"
        >
          {settings.title}
        </motion.h1>

        {/* Subtitle */}
        {settings.subtitle && (
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl font-light text-gray-300 max-w-2xl mx-auto leading-relaxed tracking-wider mb-10"
          >
            {settings.subtitle}
          </motion.p>
        )}

        {/* Call to Actions (CTA Buttons) */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {settings.cta1_text && (
            <Button
              variant="accent"
              size="lg"
              className="w-full sm:w-56 font-bold cursor-pointer"
              onClick={() => handleScrollTo(settings.cta1_target_section)}
            >
              {settings.cta1_text}
            </Button>
          )}

          {settings.cta2_text && (
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-56 border-white/30 text-white hover:bg-white/10 font-bold cursor-pointer"
              onClick={() => handleScrollTo(settings.cta2_target_section)}
            >
              {settings.cta2_text}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
