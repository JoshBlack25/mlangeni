import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/services/supabaseConfig";

/**
 * Service-role client. Bypasses RLS — server-only, never import it from a
 * client component and never prefix the key with NEXT_PUBLIC_.
 *
 * It exists for the PayFast ITN webhook: PayFast calls us server-to-server with
 * no user session, yet the result has to write `payments` and flip
 * `invoices.status`, both of which RLS reserves for signed-in admins. The
 * webhook authenticates the *request* (signature + PayFast's own validate call)
 * instead of a user.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not set so callers can fail
 * with a clear message instead of a confusing 401 from PostgREST.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) return null;

  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
