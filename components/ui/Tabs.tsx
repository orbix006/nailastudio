'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export function Tabs({
  tabs,
  activeTabId,
  onChange,
  className,
  variant = 'underline',
}: TabsProps) {
  return (
    <div className={cn('flex space-x-1 border-b border-gray-800 p-1 font-sans', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 py-2 text-sm font-semibold tracking-wide outline-none transition-colors duration-200 cursor-pointer select-none',
              isActive ? 'text-[#C9A86A]' : 'text-gray-400 hover:text-white'
            )}
          >
            {/* Display label */}
            <span className="relative z-10">{tab.label}</span>

            {/* Layout underline animation slider */}
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-[-5px] left-0 right-0 h-[2px] bg-[#C9A86A]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Layout pill background animation slider */}
            {isActive && variant === 'pill' && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 rounded-md bg-[#8A7052]/20"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
