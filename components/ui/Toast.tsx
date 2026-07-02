'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastContextType = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  toasts: ToastItem[];
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertTriangle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-amber-500" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-[#1A1A1A]/95',
    error: 'border-rose-500/20 bg-[#1A1A1A]/95',
    info: 'border-amber-500/20 bg-[#1A1A1A]/95',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto flex items-center justify-between w-full p-4 rounded-lg border shadow-2xl backdrop-blur-md text-white text-sm font-sans',
        borders[item.type]
      )}
    >
      <div className="flex items-center space-x-3 pr-2">
        <span>{icons[item.type]}</span>
        <span className="leading-snug">{item.message}</span>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-gray-500 hover:text-white rounded-full p-1 hover:bg-gray-800 transition-colors cursor-pointer flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
