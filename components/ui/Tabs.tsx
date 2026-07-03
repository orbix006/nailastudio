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
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Navigation tabs"
      className={cn('flex space-x-1 border-b border-gray-800 p-1 font-sans', className)}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative px-4 py-2 text-sm font-semibold tracking-wide outline-none transition-colors duration-200 cursor-pointer select-none',
              isActive ? 'text-[#C9A86A]' : 'text-gray-400 hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded'
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
