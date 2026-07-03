'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const titleId = React.useId();
  const descId = React.useId();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  useLockBodyScroll(isOpen);

  // Focus the close button when modal opens; restore focus on close
  const triggerRef = React.useRef<Element | null>(null);
  React.useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Defer to let animation settle
      const t = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      // Restore focus to triggering element
      if (triggerRef.current && 'focus' in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Escape key + focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.38 }}
            className={cn(
              'relative z-10 w-full rounded-xl border border-[#C9A86A]/20 bg-[#1A1A1A] p-6 shadow-2xl text-white font-sans focus:outline-none',
              sizes[size],
              className
            )}
          >
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className={cn(
                'absolute right-4 top-4 rounded-full p-1.5 text-gray-400',
                'hover:bg-gray-800 hover:text-white transition-colors cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]'
              )}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Header */}
            {title && (
              <div className="mb-4 pr-8">
                <h2
                  id={titleId}
                  className="font-serif text-xl font-bold tracking-wide text-[#C9A86A]"
                >
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-sm text-gray-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
