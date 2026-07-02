'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Compass,
  PenTool,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { DesignPhilosophy, WhyChooseUsItem, CoreValueItem } from '@/lib/supabase/queries';
import { Card, CardContent } from '@/components/ui/Card';

interface BrandPhilosophyProps {
  philosophy: DesignPhilosophy;
  whyChooseUs: WhyChooseUsItem[];
  coreValues: CoreValueItem[];
}

// Icon mapping dictionary to resolve Supabase strings to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Shield,
  Compass,
  PenTool,
  Heart,
  TrendingUp,
};

function ResolveIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return <Sparkles className={className} />;
  const IconComponent = iconMap[name] || Sparkles;
  return <IconComponent className={className} />;
}

export function BrandPhilosophy({ philosophy, whyChooseUs, coreValues }: BrandPhilosophyProps) {
  
  const slideUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 1.2, bounce: 0.15 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 0.8 },
    },
  };

  return (
    <section className="py-24 bg-[#141414] text-white font-sans overflow-hidden border-t border-[#C9A86A]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* PART 1: Design Philosophy Quote & Description */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={slideUp}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Large Quote Panel */}
          <div className="lg:col-span-7 border-l-2 border-[#C9A86A] pl-6 py-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A86A] font-bold">
              Brand Statement
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-semibold leading-tight mt-3 text-gray-100">
              &ldquo;{philosophy.quote}&rdquo;
            </h3>
            {philosophy.author && (
              <p className="text-xs uppercase tracking-widest text-[#8A7052] font-bold mt-4">
                &mdash; {philosophy.author}
              </p>
            )}
          </div>

          {/* Philosophy Paragraphs */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <h4 className="font-serif text-2xl font-bold text-[#C9A86A] tracking-wide">
              {philosophy.title}
            </h4>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {philosophy.description}
            </p>
          </div>
        </motion.div>

        {/* PART 2: Why Choose Us & Core Values Double Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-12 border-t border-gray-800/40">
          
          {/* Column A: Why Choose Us */}
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
                Excellence
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide mt-1">
                Why Choose Us
              </h3>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-4"
            >
              {whyChooseUs.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="bg-[#1A1A1A] border-[#C9A86A]/5 hover:border-[#C9A86A]/20 transition-all duration-300">
                    <CardContent className="p-5 flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] mt-1">
                        <ResolveIcon name={item.icon_name} className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Column B: Core Values */}
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
                Philosophy
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide mt-1">
                Core Values
              </h3>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-4"
            >
              {coreValues.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="bg-[#1A1A1A] border-[#C9A86A]/5 hover:border-[#C9A86A]/20 transition-all duration-300">
                    <CardContent className="p-5 flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] mt-1">
                        <ResolveIcon name={item.icon_name} className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
