import { signOutAction } from '@/lib/supabase/actions';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] p-6 text-white font-sans">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-[#1e1e1e] p-8 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-wide text-red-500 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Your account is not registered as an authorized administrator, or has been deactivated.
        </p>

        <div className="mb-8 p-4 rounded-lg bg-[#111111]/50 border border-gray-800 text-left text-xs text-gray-500">
          <p>
            If you believe this is an error, please contact the lead developer or administrator to assign the proper role to your account in the database.
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md bg-[#8A7052] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8A7052]/90 focus:outline-none focus:ring-2 focus:ring-[#C9A86A] transition-all cursor-pointer"
          >
            Log Out & Try Again
          </button>
        </form>
      </div>
    </div>
  );
}
