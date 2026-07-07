'use client';

import React from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Critical root-level error caught by Global Error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#111111] text-white font-sans min-h-screen flex items-center justify-center p-6">
        <ErrorState 
          type="500" 
          title="Critical Error"
          description={error.digest ? `Reference ID: ${error.digest}. A critical system failure crashed the application runtime.` : 'A critical system failure crashed the application runtime.'}
          onRetry={reset} 
        />
      </body>
    </html>
  );
}
