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
      'inline-flex items-center justify-center rounded-md font-sans font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-[#111111] text-white hover:bg-[#1e1e1e] border border-gray-800 dark:border-gray-800',
      secondary: 'bg-[#8A7052] text-white hover:bg-[#8A7052]/90',
      accent: 'bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90',
      outline: 'bg-transparent border border-[#8A7052]/50 text-foreground hover:bg-[#8A7052]/10',
      ghost: 'bg-transparent text-foreground hover:bg-foreground/5',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
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
