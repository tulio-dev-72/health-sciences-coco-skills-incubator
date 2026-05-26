import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware handles refresh.
        }
      },
    },
  });
}
