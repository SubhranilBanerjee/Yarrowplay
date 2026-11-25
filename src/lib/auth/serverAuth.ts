import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const ADMIN_SESSION_COOKIE = 'yarrowplay_admin_session';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
  status?: number;
}

function getSigningSecret(): string {
  const seed = `${process.env.ADMIN_PASSWORD || ''}:${process.env.ADMIN_EMAIL || ''}:${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function createAdminSessionToken(email: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): { valid: boolean; email?: string } {
  if (!token || !token.includes('.')) return { valid: false };
  try {
    const [payload, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false };
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return { valid: false };
    }
    return { valid: true, email: decoded.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Secure server-side administrator role verification.
 * Validates either:
 * 1. Server-signed HttpOnly admin session cookie (issued when authenticating with .env.local ADMIN_EMAIL / ADMIN_PASSWORD or Supabase admin login)
 * 2. Authenticated Supabase session whose profile role is 'admin' or email matches ADMIN_EMAIL.
 */
export async function verifyAdminSession(req?: NextRequest): Promise<AdminAuthResult> {
  try {
    // 1. Check signed HttpOnly admin session cookie
    let cookieToken = req?.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!cookieToken) {
      const cookieStore = await cookies();
      cookieToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    }

    const tokenCheck = verifyAdminSessionToken(cookieToken);
    if (tokenCheck.valid) {
      return {
        isAdmin: true,
        email: tokenCheck.email || process.env.ADMIN_EMAIL,
        role: 'admin',
      };
    }

    // 2. Fallback to Supabase Auth session + DB role check
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAdmin: false,
        error: 'Unauthorized: Valid user session required',
        status: 401,
      };
    }

    const adminSupabase = await createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, email, role, sub_role')
      .eq('id', user.id)
      .maybeSingle();

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();

    const hasAdminRole = profile?.role === 'admin';
    const isEnvAdmin = Boolean(envAdminEmail && userEmail === envAdminEmail);

    if (hasAdminRole || isEnvAdmin) {
      return {
        isAdmin: true,
        userId: user.id,
        email: user.email,
        role: profile?.role || 'admin',
      };
    }

    return {
      isAdmin: false,
      error: 'Forbidden: Administrative privileges required',
      status: 403,
    };
  } catch (err: any) {
    return {
      isAdmin: false,
      error: err?.message || 'Authentication verification failed',
      status: 500,
    };
  }
}
