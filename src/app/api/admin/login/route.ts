import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Authenticate credentials against Supabase Auth
    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Verify role in database
    const adminSupabase = await createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, email, role, display_name')
      .eq('id', userId)
      .maybeSingle();

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const isEnvAdmin = Boolean(envAdminEmail && cleanEmail === envAdminEmail);
    const hasAdminRole = profile?.role === 'admin';

    if (!hasAdminRole && !isEnvAdmin) {
      // Sign out non-admin user from admin session
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied: This account does not possess administrative privileges.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        role: 'admin',
        display_name: profile?.display_name || cleanEmail.split('@')[0],
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Admin authentication failed.' },
      { status: 500 }
    );
  }
}
