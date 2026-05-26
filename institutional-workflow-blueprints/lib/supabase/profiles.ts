import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";
import type { UserProfile } from "@/lib/supabase/types";

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, role, display_name, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  input: {
    id: string;
    email: string | null;
    role: UserRole;
    displayName?: string | null;
  },
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: input.id,
        email: input.email,
        role: input.role,
        display_name: input.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id, email, role, display_name, created_at, updated_at")
    .single();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data as UserProfile, error: null };
}
