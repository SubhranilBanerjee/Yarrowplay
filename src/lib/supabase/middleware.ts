import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let API routes handle their own auth without middleware network overhead
  if (pathname.startsWith('/api')) {
    return NextResponse.next({ request });
  }

  // Protected paths that require any authenticated user
  const authRequiredPaths = ['/home', '/watchlist', '/favorites', '/playlists', '/blog/studio'];
  const isAuthRequired = authRequiredPaths.some((p) => pathname.startsWith(p));
  const isCreatorPath = pathname.startsWith('/creator');
  const isAdvertiserPath = pathname.startsWith('/advertiser');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  // Quick exit: Not logged in and accessing protected route -> redirect immediately without network call
  if (!hasAuthCookie && (isAuthRequired || isCreatorPath || isAdvertiserPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Quick exit: If path doesn't require auth and isn't login/register, don't block on network
  if (!isAuthRequired && !isCreatorPath && !isAdvertiserPath && !isAuthPage) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (isAuthRequired || isCreatorPath || isAdvertiserPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and accesses auth pages (/login, /register), redirect to /home
  if (user && isAuthPage) {
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

