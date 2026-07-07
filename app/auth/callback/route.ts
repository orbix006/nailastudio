import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('is_active, role')
          .eq('id', user.id)
          .maybeSingle();

        const isActiveAdmin = profile?.is_active === true && (profile.role === 'admin' || profile.role === 'superadmin');

        if (isActiveAdmin) {
          return NextResponse.redirect(`${origin}/admin`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If validation fails, redirect to login with a generic state error
  return NextResponse.redirect(`${origin}/login?error=Could not exchange auth code for session`);
}
