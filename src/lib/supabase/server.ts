/**
 * Server-side Supabase admin client.
 *
 * Uses the service-role key (SUPABASE_SERVICE_ROLE_KEY) which bypasses Row
 * Level Security and should NEVER be exposed to the browser.  Only import
 * this module from:
 *   - src/app/api/**\/route.ts
 *   - server components / server actions (not 'use client' files)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Returns true when both the URL and service-role key are present in the
 * environment.  API routes check this before attempting any Supabase operation.
 */
export function isSupabaseAdminConfigured(): boolean {
  return supabaseUrl.length > 0 && serviceRoleKey.length > 0;
}

/**
 * Creates a new Supabase client using the service-role key.
 *
 * A fresh client is created on every call (no module-level singleton) so that
 * there is no risk of the service-role key leaking into the client bundle via
 * tree-shaking or Next.js edge caching.
 */
export function createAdminClient(): SupabaseClient {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin client is not configured. ' +
        'Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable automatic session management – this is a server-only client
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
