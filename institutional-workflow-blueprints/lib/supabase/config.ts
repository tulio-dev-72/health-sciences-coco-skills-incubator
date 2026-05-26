export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Explicit demo flag, or dev without Supabase credentials. */
export function isDemoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return true;
  }

  return process.env.NODE_ENV === "development" && !isSupabaseConfigured();
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}
