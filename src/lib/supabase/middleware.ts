import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected paths that require any authenticated user
  const authRequiredPaths = ['/home', '/watchlist', '/favorites', '/playlists', '/blog/studio'];
  const isAuthRequired = authRequiredPaths.some((p) => pathname.startsWith(p));

  // Role-specific protected paths
  const isCreatorPath = pathname.startsWith('/creator');
  const isAdvertiserPath = pathname.startsWith('/advertiser');

  if (!user && (isAuthRequired || isCreatorPath || isAdvertiserPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and accesses auth pages (/login, /register), redirect to /home
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  // Check role restrictions for creator or advertiser paths
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
      return NextResponse.redirect(url);
    }

    if (isAdvertiserPath && profile?.role !== 'advertiser') {
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      url.searchParams.set('error', 'unauthorized_advertiser_access');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
