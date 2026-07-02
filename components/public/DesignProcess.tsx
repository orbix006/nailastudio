'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { DesignProcessStep } from '@/lib/supabase/queries';

interface DesignProcessProps {
  steps: DesignProcessStep[];
}

export function DesignProcess({ steps }: DesignProcessProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 0.8 },
    },
  };

  return (
    <section id="process" className="py-24 bg-[#111111] text-white overflow-hidden font-sans border-t border-[#C9A86A]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold">
            Methodology
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Our Design Process
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" />
        </div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={stepVariants}
              className="flex flex-col items-center text-center space-y-4 group relative"
            >
              {/* Step Number Circle */}
              <div className="w-16 h-16 rounded-full border border-[#C9A86A]/30 flex items-center justify-center bg-[#171717] group-hover:border-[#C9A86A] group-hover:bg-[#C9A86A]/10 transition-all duration-300 relative z-10">
                <span className="font-serif text-xl font-bold text-[#C9A86A]">
                  0{step.step_number}
                </span>
              </div>

              {/* Connecting line for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-[1px] bg-gradient-to-r from-[#C9A86A]/20 to-transparent z-0 pointer-events-none" />
              )}

              <h3 className="font-serif text-xl font-semibold text-white tracking-wide pt-2">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
