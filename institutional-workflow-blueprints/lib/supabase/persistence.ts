import { isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

export function isSupabasePersistenceEnabled(): boolean {
  return isSupabaseConfigured() && !isDemoModeEnabled();
}

export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    ""
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && getSupabaseServiceRoleKey());
}
