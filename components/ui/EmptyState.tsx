import * as React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-gray-800 bg-[#1A1A1A]/30 w-full font-sans',
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8A7052]/10 text-[#C9A86A] mb-4">
        {icon || <FileQuestion className="h-6 w-6" />}
      </div>

      <h3 className="font-serif text-lg font-bold text-white tracking-wide mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}
