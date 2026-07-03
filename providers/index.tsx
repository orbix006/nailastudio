'use client';

import React from 'react';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { MotionConfig } from 'framer-motion';

export default function Providers({ children, defaultTheme }: { children: React.ReactNode; defaultTheme?: 'light' | 'dark' }) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </ToastProvider>
    </ThemeProvider>
  );
}
