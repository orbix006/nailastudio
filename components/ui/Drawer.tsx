'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: DrawerPosition;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className,
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Framer motion slide directions
  const slideVariants = {
    left: { x: '-100%', y: 0 },
    right: { x: '100%', y: 0 },
    top: { x: 0, y: '-100%' },
    bottom: { x: 0, y: '100%' },
  };

  const positionClasses = {
    left: 'left-0 top-0 bottom-0 h-full w-full max-w-sm border-r',
    right: 'right-0 top-0 bottom-0 h-full w-full max-w-sm border-l',
    top: 'top-0 left-0 right-0 w-full max-h-[80vh] border-b',
    bottom: 'bottom-0 left-0 right-0 w-full max-h-[80vh] border-t',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={slideVariants[position]}
            animate={{ x: 0, y: 0 }}
            exit={slideVariants[position]}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={cn(
              'fixed z-10 bg-[#1A1A1A] p-6 shadow-2xl text-white border-[#C9A86A]/20 flex flex-col font-sans',
              positionClasses[position],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              {title ? (
                <h3 className="font-serif text-xl font-bold tracking-wide text-[#C9A86A]">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto text-gray-300 text-sm leading-relaxed pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
