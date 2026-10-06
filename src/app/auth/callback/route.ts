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
      // Ensure user profile exists in profiles table using admin privileges if available to bypass RLS
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = await createAdminClient();

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id, role, display_name, username')
        .eq('id', data.user.id)
        .maybeSingle();

      const meta = data.user.user_metadata || {};
      const metadataName =
        meta.full_name ||
        meta.name ||
        (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : null) ||
        meta.display_name ||
        data.user.email?.split('@')[0] ||
        'User';

      const avatarUrl = meta.avatar_url || meta.picture || null;
      const baseUsername =
        metadataName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
      const username = `${baseUsername}_${data.user.id.slice(0, 5)}`;

      if (!profile) {
        await adminClient.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          username,
          display_name: metadataName,
          role: (meta.role as any) || 'viewer',
          avatar_url: avatarUrl,
        });
      } else if (!profile.display_name || profile.display_name === data.user.email || profile.display_name === 'User') {
        await adminClient
          .from('profiles')
          .update({
            display_name: metadataName,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          })
          .eq('id', data.user.id);
      }

      const redirectPath = profile?.role === 'creator' ? '/creator/studio' : profile?.role === 'advertiser' ? '/advertiser' : next;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuth+Authentication+Failed`);
}
