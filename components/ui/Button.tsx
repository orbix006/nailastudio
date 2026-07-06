'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Let's define a simple cn helper later

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

// Convert native button elements props to framer motion props to support micro-animations safely
type CombinedButtonProps = ButtonProps & Omit<HTMLMotionProps<'button'>, keyof ButtonProps>;

export const Button = React.forwardRef<HTMLButtonElement, CombinedButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-sans font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-gradient-to-r from-gray-900 via-[#1A1A1A] to-gray-900 text-white hover:text-[#C9A86A] border border-[#C9A86A]/20 hover:border-[#C9A86A]/45 shadow-[0_4px_15px_rgba(0,0,0,0.4)]',
      secondary: 'bg-gradient-to-r from-[#8A7052] to-[#71593F] text-white hover:brightness-105 border border-[#8A7052]/20 shadow-[0_4px_15px_rgba(138,112,82,0.15)]',
      accent: 'bg-gradient-to-r from-[#C9A86A] via-[#E4C892] to-[#C9A86A] text-[#111111] font-bold shadow-[0_4px_20px_rgba(201,168,106,0.2)] hover:shadow-[0_4px_25px_rgba(201,168,106,0.35)]',
      outline: 'bg-transparent border border-[#C9A86A]/30 text-white hover:border-[#C9A86A]/85 hover:bg-[#C9A86A]/5',
      ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-xs tracking-wider uppercase',
      md: 'px-6 py-3 text-sm tracking-wider uppercase',
      lg: 'px-8 py-4 text-base tracking-widest uppercase',
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.99 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
