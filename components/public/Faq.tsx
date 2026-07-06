'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export function Faq() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqData: FaqItem[] = [
    {
      category: 'Consultation',
      question: 'What happens during the initial design consultation?',
      answer: 'Our initial consultation is a detailed spatial mapping session. We discuss your aesthetic preferences, style directives, project scope, budget, and functional needs. We analyze light vectors and structural details to align on a clear design concept.'
    },
    {
      category: 'Pricing',
      question: 'How is project pricing calculated and structured?',
      answer: 'Our pricing is transparent and tailored to your scope. We charge a fixed design fee for space planning and 3D visualization, combined with a customized procurement and project management fee for turnkey execution. Itemized budgets are provided upfront.'
    },
    {
      category: 'Project Timeline',
      question: 'How long does a typical interior design project take?',
      answer: 'Timelines vary by scope. A single room layout or modular kitchen takes 4 to 6 weeks. A complete luxury residential renovation or penthouse fit-out spans 12 to 18 weeks. We establish fixed milestone schedules before construction starts.'
    },
    {
      category: 'Design Process',
      question: 'Can you describe your design process flow?',
      answer: 'We follow a structured 6-step methodology: (1) Discovery: mapping preferences; (2) Concept Development: styling directions; (3) Space Planning: blueprints; (4) 3D Visualization: photorealistic renders; (5) Execution: builder coordination; and (6) Final Styling: decor placement and key handover.'
    },
    {
      category: 'Materials',
      question: 'How are materials selected and sourced?',
      answer: 'We source premium, authentic materials from trusted global suppliers. This includes handpicked marble, sustainably-milled walnut/oak, bespoke modular kitchen hardware, and custom linens. Clients review samples and mood boards in our studio.'
    },
    {
      category: 'Execution',
      question: 'How do you coordinate site construction and execution?',
      answer: 'For turnkey projects, we manage all coordination, vendor vetting, site schedules, and quality inspections. If you have your own contractor, we act as design supervisors, providing detailed 2D blueprint specifications and regular site visits.'
    },
    {
      category: 'Warranty',
      question: 'Do you offer a warranty on modular fittings and craftsmanship?',
      answer: 'Yes. We offer a comprehensive 10-year warranty on all custom modular kitchen cabinetry and structural woodwork components, along with a 1-year service warranty on final finishes and installations.'
    },
    {
      category: 'Customization',
      question: 'Can we request fully customized furniture and detailing?',
      answer: 'Absolutely. We specialize in custom-milled wardrobes, tailor-made sofas, custom lighting mounts, and select metal accents. Every element is designed to fit your unique physical space and aesthetic requirements.'
    }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-24 bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white font-sans overflow-hidden border-t border-stone-200 dark:border-[#C9A86A]/5"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold" aria-hidden="true">
            Questions & Answers
          </span>
          <h2 id="faq-heading" className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Frequently Asked Questions
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" aria-hidden="true" />
        </div>

        {/* Accordions Container */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-stone-200 dark:border-[#C9A86A]/10 rounded-xl bg-white dark:bg-[#1A1A1A] overflow-hidden transition-all duration-300 hover:border-[#C9A86A]/30 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_5px_15px_-5px_rgba(0,0,0,0.3)]"
              >
                {/* Header Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] transition-colors hover:bg-stone-50/50 dark:hover:bg-white/5 cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <HelpCircle className="h-5 w-5 text-[#C9A86A] flex-shrink-0" />
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-[#8A7052] font-bold block mb-1">
                        {item.category}
                      </span>
                      <span className="font-serif font-medium text-sm sm:text-base text-stone-900 dark:text-gray-100 hover:text-[#C9A86A] dark:hover:text-white">
                        {item.question}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-4",
                      isOpen && "transform rotate-180 text-[#C9A86A]"
                    )}
                  />
                </button>

                {/* Body Expand */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-stone-100 dark:border-gray-800/40 text-stone-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed font-light whitespace-pre-line pl-14">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
