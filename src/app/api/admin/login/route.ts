import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminSession,
} from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  return NextResponse.json({
    isAdmin: auth.isAdmin,
    email: auth.email || null,
  });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

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

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const envAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    // 1. Check .env.local configured admin credentials
    if (
      envAdminEmail &&
      envAdminPassword &&
      cleanEmail === envAdminEmail &&
      cleanPassword === envAdminPassword
    ) {
      // Also sign into Supabase Auth if that user exists with the same credentials
      try {
        const supabase = await createServerClient();
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
      } catch {
        // Ignore if user isn't registered in Supabase Auth; signed HttpOnly cookie handles admin auth
      }

      const token = createAdminSessionToken(cleanEmail);
      const res = NextResponse.json({
        success: true,
        token,
        user: {
          id: 'env-admin',
          email: cleanEmail,
          role: 'admin',
          display_name: 'Super Admin',
        },
      });

      res.cookies.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return res;
    }

    // 2. Fallback: Authenticate credentials against Supabase Auth + profiles.role check
    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid admin email or password.' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const adminSupabase = await createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, email, role, display_name')
      .eq('id', userId)
      .maybeSingle();

    const isEnvAdmin = Boolean(envAdminEmail && cleanEmail === envAdminEmail);
    const hasAdminRole = profile?.role === 'admin';

    if (!hasAdminRole && !isEnvAdmin) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied: This account does not possess administrative privileges.' },
        { status: 403 }
      );
    }

    const token = createAdminSessionToken(cleanEmail);
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        email: cleanEmail,
        role: 'admin',
        display_name: profile?.display_name || cleanEmail.split('@')[0],
      },
    });

    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Admin authentication failed.' },
      { status: 500 }
    );
  }
}
