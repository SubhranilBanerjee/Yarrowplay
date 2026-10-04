import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Returns a Supabase client with elevated admin privileges if SUPABASE_SERVICE_ROLE_KEY
 * is provided in the environment. Otherwise falls back to the server SSR client.
 */
export async function createAdminClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  // Fallback to standard server client (subject to RLS policies)
  return await createServerClient();
}
