'use client';

import { motion } from 'framer-motion';
import { Compass, Palette, LayoutGrid, Eye, Hammer, KeyRound, HelpCircle } from 'lucide-react';
import { DesignProcessStep } from '@/lib/supabase/queries';
import { Card, CardContent } from '@/components/ui/Card';

interface DesignProcessProps {
  steps: DesignProcessStep[];
}

function StepIcon({ stepNumber, className }: { stepNumber: number; className?: string }) {
  const cn = className || '';
  switch (stepNumber) {
    case 1:
      return <Compass className={cn} />;
    case 2:
      return <Palette className={cn} />;
    case 3:
      return <LayoutGrid className={cn} />;
    case 4:
      return <Eye className={cn} />;
    case 5:
      return <Hammer className={cn} />;
    case 6:
      return <KeyRound className={cn} />;
    default:
      return <HelpCircle className={cn} />;
  }
}

export function DesignProcess({ steps }: DesignProcessProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="py-24 bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white overflow-hidden font-sans border-t border-stone-200 dark:border-[#C9A86A]/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold" aria-hidden="true">
            Methodology
          </span>
          <h2 id="process-heading" className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Our Design Process
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" aria-hidden="true" />
        </motion.div>

        {/* Steps Grid */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12"
        >
          {steps.map((step, idx) => {
            const stepNum = step.step_number || (idx + 1);
            return (
              <motion.div
                key={stepNum}
                variants={itemVariants}
                className="flex group"
              >
                <Card 
                  hoverEffect
                  className="w-full relative overflow-hidden bg-white/40 dark:bg-[#1A1A1A]/40 backdrop-blur-sm border-stone-200/85 dark:border-[#C9A86A]/10 hover:border-[#C9A86A]/30 transition-all duration-500 text-stone-900 dark:text-white"
                >
                  {/* Large background watermarked number */}
                  <div className="absolute top-4 right-6 text-5xl sm:text-6xl font-serif font-black text-stone-200/40 dark:text-[#C9A86A]/5 select-none pointer-events-none transition-transform duration-500 group-hover:scale-105">
                    0{stepNum}
                  </div>

                  <CardContent className="p-8 sm:p-10 flex flex-col h-full items-center text-center justify-start space-y-4">
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-full bg-[#C9A86A]/10 text-[#C9A86A] border border-[#C9A86A]/20 flex items-center justify-center flex-shrink-0 transition-all duration-350 group-hover:bg-[#C9A86A]/20 group-hover:scale-110">
                      <StepIcon stepNumber={stepNum} className="h-6 w-6" />
                    </div>

                    {/* Step Label */}
                    <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] font-bold uppercase block">
                      Phase 0{stepNum}
                    </span>

                    {/* Title & Description */}
                    <div className="space-y-2 flex-grow flex flex-col justify-start items-center">
                      <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white tracking-wide group-hover:text-[#C9A86A] transition-colors leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-stone-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
