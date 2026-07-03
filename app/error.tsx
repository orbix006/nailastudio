'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    console.error('Application exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.45 }}
        className="max-w-md w-full text-center space-y-8 p-8 rounded-2xl border border-red-500/20 bg-[#1A1A1A] shadow-2xl relative overflow-hidden"
      >
        {/* Red gradient line highlight */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-red-500/10 text-red-400">
            <AlertOctagon className="h-12 w-12" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide">Something Went Wrong</h1>
          <p className="text-gray-400 text-sm leading-relaxed font-light">
            An unexpected system error occurred while rendering this page. The issue has been logged and we are looking into it.
          </p>
          {error.digest && (
            <p className="text-[10px] text-gray-600 font-mono bg-black/30 px-2.5 py-1 rounded">
              Ref ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full sm:w-auto border-gray-800 hover:bg-gray-800/40 text-gray-300 hover:text-white cursor-pointer"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button
            variant="accent"
            onClick={reset}
            className="w-full sm:w-auto bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
