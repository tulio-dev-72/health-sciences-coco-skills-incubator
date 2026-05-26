import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserClient(url, anonKey);
}
