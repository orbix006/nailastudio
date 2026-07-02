import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-red-500/10 bg-red-500/5 w-full font-sans',
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="font-serif text-lg font-bold text-white tracking-wide mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" size="sm">
          {retryText}
        </Button>
      )}
    </div>
  );
}
