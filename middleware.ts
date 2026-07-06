import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 1. CSRF Protection for state-changing POST requests
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const referer = request.headers.get('referer');

    let isValid = false;

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        isValid = originHost === host;
      } catch {
        isValid = false;
      }
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        isValid = refererHost === host;
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return new NextResponse('CSRF Validation Failed: Request blocked.', { status: 403 });
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Admin Route Authentication & Active Check
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    const isAccessDeniedPage = request.nextUrl.pathname === '/admin/access-denied';

    if (!user && !isLoginPage && !isAccessDeniedPage) {
      // Redirect unauthenticated user to login
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    if (user) {
      // Verify that this is an active admin profile
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle();

      const isActiveAdmin = profile?.is_active === true;

      if (!isActiveAdmin && !isAccessDeniedPage && !isLoginPage) {
        // Deactivated or missing profile: Sign out and redirect
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/admin/access-denied';
        return NextResponse.redirect(url);
      }

      if (isActiveAdmin && isLoginPage) {
        // Active admin trying to hit login: redirect to dashboard
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
