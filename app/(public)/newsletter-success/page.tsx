import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Subscription Confirmed | The Nailaa Studio',
  description: 'Thank you for subscribing to The Nailaa Studio newsletter.',
};

export default function NewsletterSuccessPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center font-sans px-4">
      <div className="max-w-md w-full text-center space-y-8 bg-[#1A1A1A] border border-gray-800 rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A86A]/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <Compass className="h-4.5 w-4.5" /> activation verified
          </span>
          
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white leading-tight">
            Subscription Confirmed
          </h1>
          
          <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
            Thank you for confirming your email! You have successfully completed the double opt-in verification. Welcome to our inner circle of spatial styling.
          </p>
        </div>

        <div className="border-t border-gray-850 pt-6">
          <Link href="/">
            <Button variant="accent" size="md" className="w-full flex items-center justify-center gap-1.5 cursor-pointer">
              Explore The Studio <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
