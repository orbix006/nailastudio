'use client';

import { Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Testimonial } from '@/lib/supabase/queries';
import { Card, CardContent } from '@/components/ui/Card';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
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
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-24 bg-[#111111] text-white font-sans overflow-hidden border-t border-[#C9A86A]/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold" aria-hidden="true">
            Testimonials
          </span>
          <h2 id="testimonials-heading" className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Client Experiences
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" aria-hidden="true" />
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((test, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="flex"
            >
              <Card hoverEffect className="flex flex-col w-full bg-[#1A1A1A] border-[#C9A86A]/10 hover:border-[#C9A86A]/20 transition-all duration-300 relative group p-6">
                <CardContent className="p-0 flex flex-col h-full space-y-4">
                  {/* Quote Icon */}
                  <div className="text-[#C9A86A]/20 group-hover:text-[#C9A86A]/30 transition-colors duration-300">
                    <Quote className="h-8 w-8 transform -scale-x-100" />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-1 select-none">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < test.rating
                            ? 'text-[#C9A86A] fill-[#C9A86A]'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Feedback Text */}
                  <p className="text-gray-300 text-sm leading-relaxed font-light flex-grow">
                    &ldquo;{test.quote}&rdquo;
                  </p>

                  {/* Client Info */}
                  <div className="border-t border-gray-800/40 pt-4 mt-4">
                    <h4 className="font-serif font-semibold text-white tracking-wide">
                      {test.client_name}
                    </h4>
                    {test.client_title && (
                      <span className="text-[10px] uppercase tracking-widest text-[#8A7052] font-semibold block mt-0.5">
                        {test.client_title}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
