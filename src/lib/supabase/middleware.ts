import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let API routes handle their own auth without middleware network overhead
  if (pathname.startsWith('/api')) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

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

  // Helper to preserve cookies when redirecting
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected paths that require any authenticated user
  const authRequiredPaths = ['/watchlist', '/favorites', '/playlists', '/blog/studio'];
  const isAuthRequired = authRequiredPaths.some((p) => pathname.startsWith(p));
  const isCreatorPath = pathname.startsWith('/creator');
  const isAdvertiserPath = pathname.startsWith('/advertiser');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // 1. Unauthenticated user trying to access a protected path
  if (!user && (isAuthRequired || isCreatorPath || isAdvertiserPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return redirectWithCookies(url);
  }

  // 2. Authenticated user trying to access login or register page -> redirect to home
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    url.searchParams.delete('redirect');
    return redirectWithCookies(url);
  }

  // 3. Authenticated user accessing role-restricted paths
  if (user && (isCreatorPath || isAdvertiserPath)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (isCreatorPath && profile?.role !== 'creator') {
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      url.searchParams.set('error', 'unauthorized_creator_access');
      return redirectWithCookies(url);
    }

    if (isAdvertiserPath && profile?.role !== 'advertiser') {
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      url.searchParams.set('error', 'unauthorized_advertiser_access');
      return redirectWithCookies(url);
    }
  }

  return supabaseResponse;
}


