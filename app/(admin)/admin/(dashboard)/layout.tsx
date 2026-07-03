import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const adminClient = createAdminClient();
  const { data: profile } = (await adminClient
    .from('admin_profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()) as unknown as {
    data: { full_name: string; role: string; is_active: boolean } | null;
  };

  if (!profile || !profile.is_active || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    // Authenticated user is not an active admin/superadmin
    redirect('/admin/access-denied');
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#111111] text-white font-sans">
      {/* Skip to Admin Main Content Link */}
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#C9A86A] focus:text-[#111111] focus:font-semibold focus:rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:ring-offset-2 focus:ring-offset-black"
      >
        Skip to main admin content
      </a>

      <AdminSidebar
        admin={{
          fullName: profile.full_name || 'Admin User',
          email: user.email || '',
          role: profile.role,
        }}
      />
      <main id="admin-main-content" tabIndex={-1} className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
