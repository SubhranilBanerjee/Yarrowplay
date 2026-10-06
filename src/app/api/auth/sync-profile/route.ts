import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();

    // Check if profile exists
    const { data: existingProfile, error: selectError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const meta = user.user_metadata || {};
    const resolvedName =
      meta.full_name ||
      meta.name ||
      (meta.given_name
        ? `${meta.given_name} ${meta.family_name || ''}`.trim()
        : null) ||
      meta.display_name ||
      user.email?.split('@')[0] ||
      'User';

    const avatarUrl =
      meta.avatar_url || meta.picture || existingProfile?.avatar_url || null;

    const baseUsername =
      resolvedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) || 'user';
    const generatedUsername = `${baseUsername}_${user.id.slice(0, 5)}`;

    if (!existingProfile) {
      // Insert new profile
      const { data: newProfile, error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: generatedUsername,
          display_name: resolvedName,
          role: (meta.role as any) || 'viewer',
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert profile:', insertError);
        return NextResponse.json(
          {
            profile: {
              id: user.id,
              email: user.email,
              username: generatedUsername,
              display_name: resolvedName,
              role: (meta.role as any) || 'viewer',
              avatar_url: avatarUrl,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json({ profile: newProfile });
    }

    // Profile already exists; update display_name or avatar if it was just email or missing
    const needsNameUpdate =
      !existingProfile.display_name ||
      existingProfile.display_name === user.email ||
      existingProfile.display_name === 'User';

    const needsAvatarUpdate = !existingProfile.avatar_url && avatarUrl;

    if (needsNameUpdate || needsAvatarUpdate) {
      const updateData: any = {};
      if (needsNameUpdate) updateData.display_name = resolvedName;
      if (needsAvatarUpdate) updateData.avatar_url = avatarUrl;

      const { data: updatedProfile } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      return NextResponse.json({ profile: updatedProfile || existingProfile });
    }

    return NextResponse.json({ profile: existingProfile });
  } catch (err: any) {
    console.error('sync-profile error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
