import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'default' | 'glass' | 'borderless';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, variant = 'default', ...props }, ref) => {
    const baseClass = 'rounded-xl overflow-hidden font-sans';
    
    const variants = {
      default: 'bg-[#1A1A1A] border border-[#C9A86A]/10 text-white shadow-lg',
      glass: 'bg-[#1A1A1A]/40 backdrop-blur-md border border-[#C9A86A]/10 text-white shadow-2xl',
      borderless: 'bg-[#1A1A1A] text-white',
    };

    const hoverClass = hoverEffect
      ? 'transition-all duration-300 hover:translate-y-[-4px] hover:border-[#C9A86A]/30 hover:shadow-[0_8px_30px_rgba(201,168,106,0.1)]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseClass, variants[variant], hoverClass, className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 flex flex-col space-y-1.5', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-serif text-2xl font-semibold tracking-wide text-[#C9A86A]', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-400 font-sans', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 font-sans text-gray-300 text-sm leading-relaxed', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 flex items-center justify-end border-t border-gray-800/20 mt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
