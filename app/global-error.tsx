'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
        <div className="max-w-md w-full text-center space-y-8 p-8 rounded-2xl border border-red-500/20 bg-[#1A1A1A] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-red-500/10 text-red-400 animate-pulse">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-wide">Critical Error</h1>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              A critical system failure crashed the application runtime.
            </p>
            {error.digest && (
              <p className="text-[10px] text-gray-600 font-mono bg-black/30 px-2 py-0.5 rounded">
                ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="accent"
              onClick={reset}
              className="w-full sm:w-auto bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recover System
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
