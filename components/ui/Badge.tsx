import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'success' | 'error' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'primary', ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans tracking-wide transition-colors';

  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-[#111111] text-white border border-gray-800',
    secondary: 'bg-[#8A7052] text-white',
    accent: 'bg-[#C9A86A] text-[#111111]',
    outline: 'border border-gray-800 text-gray-300',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  };

  return <span className={cn(baseStyles, variants[variant], className)} {...props} />;
}
