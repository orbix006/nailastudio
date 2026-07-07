'use client';

import {
  Sparkles,
  Shield,
  Compass,
  PenTool,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DesignPhilosophy, WhyChooseUsItem, CoreValueItem } from '@/lib/supabase/queries';
import { Card, CardContent } from '@/components/ui/Card';

interface BrandPhilosophyProps {
  philosophy: DesignPhilosophy;
  whyChooseUs: WhyChooseUsItem[];
  coreValues: CoreValueItem[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Shield,
  Compass,
  PenTool,
  Heart,
  TrendingUp,
};

function ResolveIcon({ name, className }: { name: string | null; className?: string }) {
  const IconComponent = (name && iconMap[name]) ? iconMap[name] : Sparkles;
  return <IconComponent className={className} />;
}

export function BrandPhilosophy({ philosophy, whyChooseUs, coreValues }: BrandPhilosophyProps) {
  const cardListVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section aria-label="Brand Philosophy and Core Values" className="py-24 bg-white dark:bg-[#141414] text-stone-900 dark:text-white font-sans overflow-hidden border-t border-stone-200 dark:border-[#C9A86A]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

        {/* PART 1: Design Philosophy Quote & Description */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Quote Panel */}
          <div className="lg:col-span-7 border-l-2 border-[#C9A86A] pl-6 py-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A86A] font-bold">
              Brand Statement
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-semibold leading-tight mt-3 text-stone-850 dark:text-gray-100">
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
            <p className="text-stone-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed font-light">
              {philosophy.description}
            </p>
          </div>
        </motion.div>

        {/* PART 2: Why Choose Us (Full-width Grid) */}
        <div className="pt-16 border-t border-stone-200 dark:border-gray-800/40 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center md:text-left"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
              Excellence
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide mt-1">
              Why Choose Us
            </h3>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={cardListVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {whyChooseUs.map((item, idx) => (
              <motion.div key={idx} variants={cardItemVariants} className="flex">
                <Card 
                  hoverEffect 
                  className="w-full flex flex-col justify-between bg-stone-50 dark:bg-[#1A1A1A] border-stone-200 dark:border-[#C9A86A]/10 hover:border-[#C9A86A]/30 transition-all duration-300 text-stone-900 dark:text-white"
                >
                  <CardContent className="p-6 flex flex-col h-full items-start space-y-4">
                    <div className="p-3 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] flex-shrink-0">
                      <ResolveIcon name={item.icon_name} className="h-6 w-6" />
                    </div>
                    <div className="space-y-2 flex-grow flex flex-col justify-start">
                      <h4 className="font-serif text-lg font-semibold text-stone-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-stone-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* PART 3: Core Values (Full-width Grid) */}
        <div className="pt-16 border-t border-stone-200 dark:border-gray-800/40 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center md:text-left"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
              Philosophy
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide mt-1">
              Core Values
            </h3>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={cardListVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {coreValues.map((item, idx) => (
              <motion.div key={idx} variants={cardItemVariants} className="flex">
                <Card 
                  hoverEffect 
                  className="w-full flex flex-col justify-between bg-stone-50 dark:bg-[#1A1A1A] border-stone-200 dark:border-[#C9A86A]/10 hover:border-[#C9A86A]/30 transition-all duration-300 text-stone-900 dark:text-white"
                >
                  <CardContent className="p-6 flex flex-col h-full items-start space-y-4">
                    <div className="p-3 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] flex-shrink-0">
                      <ResolveIcon name={item.icon_name} className="h-6 w-6" />
                    </div>
                    <div className="space-y-2 flex-grow flex flex-col justify-start">
                      <h4 className="font-serif text-lg font-semibold text-stone-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-stone-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
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
    </section>
  );
}
