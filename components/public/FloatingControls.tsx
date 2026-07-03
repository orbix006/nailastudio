'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface FloatingControlsProps {
  whatsappUrl: string | null;
  phone: string | null;
}

export function FloatingControls({ whatsappUrl, phone }: FloatingControlsProps) {
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compile active WhatsApp link
  const finalWhatsappUrl = React.useMemo(() => {
    if (whatsappUrl) return whatsappUrl;
    if (phone) {
      // Strip out non-digit characters for WhatsApp API
      const cleanPhone = phone.replace(/\D/g, '');
      return `https://wa.me/${cleanPhone}`;
    }
    return null;
  }, [whatsappUrl, phone]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center space-y-3 pointer-events-none select-none">
      
      {/* 1. Floating WhatsApp Button */}
      {finalWhatsappUrl && (
        <a
          href={finalWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
          aria-label="Chat with us on WhatsApp"
          className="pointer-events-auto w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {/* Custom WhatsApp Icon SVG */}
          <svg
            className="w-6 h-6 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.015-5.08-2.859-6.927C16.378 2.036 13.916.995 12.007.995c-5.405 0-9.806 4.395-9.809 9.801-.001 1.62.483 3.209 1.4 4.606l-.995 3.635 3.73-.978zm10.597-6.963c-.273-.137-1.62-.8-1.874-.892-.254-.092-.44-.137-.625.137-.184.274-.71.892-.87 1.075-.159.183-.32.206-.593.069-.272-.137-1.15-.424-2.19-1.353-.809-.722-1.356-1.615-1.515-1.889-.159-.274-.017-.422.12-.559.123-.122.273-.32.41-.48.136-.16.182-.274.273-.457.09-.183.045-.343-.023-.48-.068-.137-.624-1.507-.855-2.064-.226-.549-.475-.472-.625-.48l-.534-.01c-.184 0-.485.07-.74.343-.254.274-.972.95-.972 2.32 0 1.37.997 2.695 1.137 2.877.14.183 1.96 2.993 4.747 4.197.663.287 1.18.458 1.583.587.667.212 1.274.182 1.754.11.536-.08 1.62-.662 1.848-1.299.227-.638.227-1.187.16-1.299-.069-.11-.255-.183-.527-.32z" />
          </svg>
 
          {/* Simple Hover Indicator Tooltip */}
          <span className="absolute right-14 bg-black/80 border border-white/10 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none select-none">
            Chat on WhatsApp
          </span>
        </a>
      )}
 
      {/* 2. Scroll-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto"
          >
            <button
              onClick={handleScrollToTop}
              aria-label="Scroll to top of the page"
              className="w-12 h-12 rounded-full border border-white/10 bg-[#1A1A1A] hover:bg-[#C9A86A] text-[#C9A86A] hover:text-[#111111] flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 cursor-pointer relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
 
              {/* Simple Tooltip */}
              <span className="absolute right-14 bg-black/80 border border-white/10 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none select-none">
                Scroll To Top
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
