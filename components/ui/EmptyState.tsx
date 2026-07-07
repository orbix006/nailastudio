import * as React from 'react';
import { Sparkles, FolderOpen, Inbox, BarChart2, EyeOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: 'portfolio' | 'gallery' | 'services' | 'search' | 'dashboard' | 'leads' | 'analytics' | 'default';
  title: string;
  description: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = 'default',
  title,
  description,
  actionLabel,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  const getIcon = () => {
    const classN = "h-12 w-12 text-[#C9A86A]/60 mb-4";
    switch (icon) {
      case 'portfolio':
        return <FolderOpen className={classN} />;
      case 'gallery':
        return <EyeOff className={classN} />;
      case 'services':
        return <Sparkles className={classN} />;
      case 'search':
        return <Search className={classN} />;
      case 'dashboard':
      case 'leads':
        return <Inbox className={classN} />;
      case 'analytics':
        return <BarChart2 className={classN} />;
      default:
        return <FolderOpen className={classN} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#C9A86A]/20 rounded-xl bg-stone-50/50 dark:bg-[#161616]/30 backdrop-blur-sm max-w-md mx-auto ${className}`}>
      {getIcon()}
      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
        {description}
      </p>
      {(actionLabel || actionText) && onAction && (
        <Button variant="accent" size="sm" onClick={onAction}>
          {actionLabel || actionText}
        </Button>
      )}
    </div>
  );
}
