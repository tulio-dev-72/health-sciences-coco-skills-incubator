import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import type { UserRole } from "@/lib/types";

export async function requireWorkflowUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  const profile = await fetchUserProfile(supabase, user.id);
  const role = profile?.role as UserRole | undefined;

  if (!role) {
    return {
      error: NextResponse.json({ error: "Operational role required." }, { status: 403 }),
    };
  }

  return { supabase, user, profile, role };
}

export function assertRole(role: UserRole, allowed: UserRole[]): NextResponse | null {
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Insufficient role for this action." }, { status: 403 });
  }
  return null;
}
