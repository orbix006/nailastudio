/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOutAction } from '@/lib/supabase/actions';

export default async function AdminDashboardStub() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient() as any;
  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('full_name, role')
    .eq('id', user?.id || '')
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] p-6 text-white font-sans">
      <div className="w-full max-w-md rounded-xl border border-[#C9A86A]/20 bg-[#1e1e1e] p-8 shadow-2xl text-center">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-[#C9A86A] mb-2">
          The Nailaa Studio
        </h1>
        <p className="text-gray-400 text-sm mb-6">ADMIN PORTAL STUB</p>

        <div className="mb-8 p-4 rounded-lg bg-[#111111]/50 border border-gray-800 text-left">
          <p className="text-sm text-gray-500 mb-1">Authenticated User:</p>
          <p className="font-semibold text-white">{profile?.full_name || 'Admin User'}</p>
          <p className="text-xs text-gray-400 mt-1">Email: {user?.email}</p>
          <p className="text-xs text-[#C9A86A] mt-1 capitalize">Role: {profile?.role}</p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md bg-[#8A7052] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8A7052]/90 focus:outline-none focus:ring-2 focus:ring-[#C9A86A] transition-all cursor-pointer"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
