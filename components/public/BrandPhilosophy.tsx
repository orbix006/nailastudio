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
    <section aria-label="Brand Philosophy and Core Values" className="py-24 bg-[#141414] text-white font-sans overflow-hidden border-t border-[#C9A86A]/5">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
              className="space-y-4"
            >
              {whyChooseUs.map((item, idx) => (
                <motion.div key={idx} variants={cardItemVariants}>
                  <Card hoverEffect className="bg-[#1A1A1A] border-[#C9A86A]/5 hover:border-[#C9A86A]/20 transition-all duration-300">
                    <CardContent className="p-5 flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] mt-1 flex-shrink-0">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
              className="space-y-4"
            >
              {coreValues.map((item, idx) => (
                <motion.div key={idx} variants={cardItemVariants}>
                  <Card hoverEffect className="bg-[#1A1A1A] border-[#C9A86A]/5 hover:border-[#C9A86A]/20 transition-all duration-300">
                    <CardContent className="p-5 flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A] mt-1 flex-shrink-0">
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
