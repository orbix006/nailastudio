'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { InquiryForm } from '@/components/public/InquiryForm';
import { ProjectType } from '@/lib/supabase/queries';

interface ContactProps {
  phone: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  projectTypes: ProjectType[];
}

export function Contact({ phone, email, address, hours, projectTypes }: ContactProps) {
  
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, duration: 1.2, bounce: 0.1 },
    },
  };

  return (
    <section id="contact" className="py-24 bg-[#141414] text-white font-sans overflow-hidden border-t border-[#C9A86A]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold">
            Get In Touch
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">
            Book Consultation
          </h2>
          <div className="h-[1px] w-24 bg-[#8A7052] mx-auto mt-4" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeIn}
          className="max-w-5xl mx-auto"
        >
          <Card className="bg-[#1A1A1A] border-[#C9A86A]/10 shadow-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Side: Contact Information & Hours (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-white tracking-wide border-b border-gray-800 pb-3">
                    Contact Details
                  </h3>
                  
                  <div className="space-y-4">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center space-x-4 p-2.5 rounded-lg hover:bg-white/5 transition-all duration-300 group"
                      >
                        <div className="p-2 rounded-full bg-[#C9A86A]/10 text-[#C9A86A] group-hover:bg-[#C9A86A] group-hover:text-[#111111] transition-all flex-shrink-0">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#8A7052] font-semibold">
                            Call Us
                          </span>
                          <p className="text-white text-xs sm:text-sm font-light tracking-wide">{phone}</p>
                        </div>
                      </a>
                    )}

                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="flex items-center space-x-4 p-2.5 rounded-lg hover:bg-white/5 transition-all duration-300 group"
                      >
                        <div className="p-2 rounded-full bg-[#C9A86A]/10 text-[#C9A86A] group-hover:bg-[#C9A86A] group-hover:text-[#111111] transition-all flex-shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#8A7052] font-semibold">
                            Email Us
                          </span>
                          <p className="text-white text-xs sm:text-sm font-light tracking-wide">{email}</p>
                        </div>
                      </a>
                    )}

                    {address && (
                      <div className="flex items-start space-x-4 p-2.5 rounded-lg">
                        <div className="p-2 rounded-full bg-[#C9A86A]/10 text-[#C9A86A] mt-1 select-none flex-shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#8A7052] font-semibold">
                            Visit Studio
                          </span>
                          <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed">{address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-white tracking-wide border-b border-gray-800 pb-3">
                    Studio Timings
                  </h3>
                  
                  {hours && (
                    <div className="flex items-start space-x-4 p-2.5 rounded-lg">
                      <div className="p-2 rounded-full bg-[#C9A86A]/10 text-[#C9A86A] select-none flex-shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#8A7052] font-semibold">
                          Timings
                        </span>
                        <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-line mt-0.5">
                          {hours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-850 pt-4 select-none">
                  <p className="text-[10px] text-[#C9A86A] uppercase tracking-[0.25em] font-semibold">
                    The Nailaa Experience
                  </p>
                  <p className="text-gray-400 text-[11px] font-light leading-relaxed mt-1">
                    Bookings are highly recommended to ensure individualized care and custom styling selections.
                  </p>
                </div>
              </div>

              {/* Right Side: Inquiry Form (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#C9A86A] tracking-wide border-b border-gray-800 pb-3">
                  Share Your Project Details
                </h3>
                <div className="pt-2">
                  <InquiryForm projectTypes={projectTypes} source="contact_form" />
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.div>

      </div>
    </section>
  );
}
