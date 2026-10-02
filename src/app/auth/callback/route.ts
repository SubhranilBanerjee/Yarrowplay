import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Ensure user profile exists in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        const metadataName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'User';
        const username =
          metadataName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + data.user.id.slice(0, 5);

        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          username,
          display_name: metadataName,
          role: 'viewer',
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        });
      }

      const redirectPath = profile?.role === 'creator' ? '/creator/studio' : profile?.role === 'advertiser' ? '/advertiser' : next;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuth+Authentication+Failed`);
}
