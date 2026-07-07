import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function AccessDeniedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] p-6 text-white font-sans selection:bg-[#C9A86A]/30 select-none">
      <div className="w-full max-w-md rounded-xl border border-[#C9A86A]/20 bg-[#1A1A1A] p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A86A]/10 text-[#C9A86A] transition-transform duration-350 hover:scale-105">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-wide text-[#C9A86A]">
            Access Restricted
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            You don&apos;t have permission to access this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-stone-800 text-stone-300 hover:bg-stone-900 hover:text-white transition-colors duration-250 cursor-pointer text-xs uppercase font-bold tracking-wider"
            >
              Back to Home
            </Button>
          </Link>
          {!user && (
            <Link href="/login" className="flex-1">
              <Button
                variant="accent"
                className="w-full bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 transition-colors duration-250 cursor-pointer text-xs uppercase font-bold tracking-wider"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
