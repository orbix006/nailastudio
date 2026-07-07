'use client';

import React from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Application exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
      <ErrorState 
        type="500" 
        description={error.digest ? `Reference ID: ${error.digest}. Our digital servers encountered an unexpected styling collision. Please try reloading or check back shortly.` : undefined}
        onRetry={reset} 
      />
    </div>
  );
}
