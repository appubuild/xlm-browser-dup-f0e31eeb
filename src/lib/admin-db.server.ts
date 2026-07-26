import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Service-role Supabase client for server-side admin reads.
 * Accepts the managed SUPABASE_SERVICE_ROLE_KEY or the user-provided
 * SB_SERVICE_ROLE_KEY project secret (same value, non-reserved name).
 */
export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SERVICE_ROLE_KEY || null;
}

export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("Service role credentials are not configured on the server.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
