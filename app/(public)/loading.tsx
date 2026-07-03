import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center space-y-4 text-white font-sans">
      <div className="relative flex items-center justify-center">
        {/* Pulse ring */}
        <div className="absolute h-16 w-16 rounded-full border border-[#C9A86A]/20 animate-ping" />
        
        {/* Logo center */}
        <div className="relative p-4 rounded-full bg-black/40 border border-[#C9A86A]/30 text-[#C9A86A]">
          <Sparkles className="h-8 w-8 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-semibold animate-pulse">
          The Nailaa Studio
        </p>
        <p className="text-[10px] text-gray-500 font-light tracking-widest uppercase">
          Curating Luxury...
        </p>
      </div>
    </div>
  );
}
