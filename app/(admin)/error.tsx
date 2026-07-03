'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    console.error('Admin dashboard rendering exception:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 font-sans text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.45 }}
        className="max-w-md w-full text-center space-y-6 p-8 rounded-xl border border-gray-800 bg-[#1A1A1A] shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A86A]/40 to-transparent" />

        <div className="flex flex-col items-center space-y-3">
          <div className="p-3.5 rounded-full bg-red-500/10 text-red-400">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wide">Dashboard Error</h2>
          <p className="text-gray-400 text-xs leading-relaxed font-light">
            An error occurred while loading this dashboard component. This could be due to a network disruption or database timeout.
          </p>
          {error.digest && (
            <p className="text-[9px] text-gray-600 font-mono bg-black/40 px-2 py-0.5 rounded">
              Digest ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
            className="w-full sm:w-auto text-xs py-2 cursor-pointer"
          >
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
            Reset Panel
          </Button>
          <Button
            variant="accent"
            onClick={reset}
            className="w-full sm:w-auto bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold text-xs py-2 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
