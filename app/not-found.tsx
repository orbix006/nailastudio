'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
      <ErrorState type="404" />
    </div>
  );
}
