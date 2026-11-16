import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
  status?: number;
}

/**
 * Secure server-side administrator role verification.
 * Validates the caller's authenticated Supabase session and confirms
 * that the user's role in the database is 'admin' or matches ADMIN_EMAIL.
 * Strictly avoids any hardcoded client bypasses or plaintext passwords.
 */
export async function verifyAdminSession(req?: NextRequest): Promise<AdminAuthResult> {
  try {
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

    // Query user's database role from profiles table
    const adminSupabase = await createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
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

