'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

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
  const titleId = React.useId();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<Element | null>(null);

  useLockBodyScroll(isOpen);

  // Manage focus: save trigger, focus close button on open, restore on close
  React.useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      const t = setTimeout(() => closeButtonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    } else {
      if (triggerRef.current && 'focus' in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Escape + focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const slideVariants = {
    left:   { x: '-100%', y: 0 },
    right:  { x: '100%',  y: 0 },
    top:    { x: 0, y: '-100%' },
    bottom: { x: 0, y: '100%'  },
  };

  const positionClasses = {
    left:   'left-0 top-0 bottom-0 h-full w-full max-w-sm border-r',
    right:  'right-0 top-0 bottom-0 h-full w-full max-w-sm border-l',
    top:    'top-0 left-0 right-0 w-full max-h-[80vh] border-b',
    bottom: 'bottom-0 left-0 right-0 w-full max-h-[80vh] border-t',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={slideVariants[position]}
            animate={{ x: 0, y: 0 }}
            exit={slideVariants[position]}
            transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.38 }}
            className={cn(
              'fixed z-10 bg-[#1A1A1A] p-6 shadow-2xl text-white border-[#C9A86A]/20 flex flex-col font-sans focus:outline-none',
              positionClasses[position],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              {title ? (
                <h2
                  id={titleId}
                  className="font-serif text-xl font-bold tracking-wide text-[#C9A86A]"
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className={cn(
                  'rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]'
                )}
                aria-label="Close navigation panel"
              >
                <X className="h-4 w-4" aria-hidden="true" />
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
