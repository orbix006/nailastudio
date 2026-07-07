import * as React from 'react';
import { AlertTriangle, WifiOff, FileX, ShieldAlert, Database, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ErrorStateProps {
  type?: '404' | '500' | 'network' | 'image' | 'api' | 'form' | 'permission' | 'database' | 'default';
  title?: string;
  description?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({
  type = 'default',
  title,
  description,
  message,
  onRetry,
  retryText,
  className = '',
}: ErrorStateProps) {
  const getIcon = () => {
    const classN = "h-14 w-14 text-rose-500/80 mb-5";
    switch (type) {
      case '404':
        return <FileX className={classN} />;
      case '500':
      case 'api':
      case 'form':
        return <AlertTriangle className={classN} />;
      case 'network':
        return <WifiOff className={classN} />;
      case 'image':
        return <ImageIcon className={classN} />;
      case 'permission':
        return <ShieldAlert className={classN} />;
      case 'database':
        return <Database className={classN} />;
      default:
        return <HelpCircle className={classN} />;
    }
  };

  const getDefaults = () => {
    switch (type) {
      case '404':
        return {
          title: 'Page Not Found',
          description: 'The luxury space you are trying to view does not exist. It may have been relocated or archived.',
        };
      case '500':
        return {
          title: 'Internal Server Error',
          description: 'Our digital servers encountered an unexpected styling collision. Please try reloading or check back shortly.',
        };
      case 'network':
        return {
          title: 'Network Connection Lost',
          description: 'Unable to establish connection to the Nailaa Studio servers. Please verify your internet settings.',
        };
      case 'image':
        return {
          title: 'Presentation Image Missing',
          description: 'The selected interior render detail is temporarily unavailable to load.',
        };
      case 'api':
        return {
          title: 'Server Service Communication Error',
          description: 'Unable to fetch real-time configurations. Please try reloading.',
        };
      case 'form':
        return {
          title: 'Submission Unsuccessful',
          description: 'Encountered an issue dispatching your inquiry details. Please verify form data and try again.',
        };
      case 'permission':
        return {
          title: 'Access Restricted',
          description: 'You do not have the credentials required to view this designer dashboard layer.',
        };
      case 'database':
        return {
          title: 'Material Registry Offline',
          description: 'The backend database is undergoing brief design maintenance. Please try again in a few minutes.',
        };
      default:
        return {
          title: 'Unexpected Error',
          description: 'Something went wrong while presenting this layout component.',
        };
    }
  };

  const defaults = getDefaults();
  const activeTitle = title || defaults.title;
  const activeDescription = description || message || defaults.description;
  const activeRetryText = retryText || "Retry Action";

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-14 border border-[#C9A86A]/10 rounded-2xl bg-stone-50 dark:bg-[#1A1A1A] shadow-2xl max-w-lg mx-auto ${className}`}>
      {getIcon()}
      
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-wide mb-3">
        {activeTitle}
      </h2>
      
      <p className="text-stone-600 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed mb-8 max-w-sm">
        {activeDescription}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {onRetry && (
          <Button variant="accent" size="sm" onClick={onRetry} className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs">
            {activeRetryText}
          </Button>
        )}
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs">
            Back To Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
