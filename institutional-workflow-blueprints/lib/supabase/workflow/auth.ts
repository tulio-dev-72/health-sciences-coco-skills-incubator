import { NextResponse } from "next/server";
import {
  accessDeniedResponse,
  assertOperationalRole,
  requireOperationalUser,
  unauthorizedResponse,
} from "@/lib/auth/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import type { UserRole } from "@/lib/types";

export { accessDeniedResponse, unauthorizedResponse, requireOperationalUser, assertOperationalRole };

export async function requireWorkflowUser() {
  const auth = await requireOperationalUser();
  if ("error" in auth) {
    return auth;
  }

  if (auth.demoMode) {
    return {
      role: auth.role,
      demoMode: true as const,
      user: null,
      profile: null,
      supabase: null,
    };
  }

  const {
    data: { user },
  } = await auth.supabase.auth.getUser();

  if (!user) {
    return { error: unauthorizedResponse() };
  }

  const profile = await fetchUserProfile(auth.supabase, user.id);

  return {
    supabase: auth.supabase,
    user,
    profile,
    role: auth.role,
    demoMode: false as const,
  };
}

export function assertRole(role: UserRole, allowed: UserRole[], message?: string): NextResponse | null {
  return assertOperationalRole(role, allowed, message);
}

export async function requirePersistedWorkflowUser() {
  const auth = await requireWorkflowUser();
  if ("error" in auth) {
    return auth;
  }

  if (auth.demoMode || !auth.supabase || !auth.user) {
    return {
      error: accessDeniedResponse(
        "Institutional workflow persistence requires a signed-in user profile.",
      ),
    };
  }

  return auth as {
    supabase: NonNullable<(typeof auth)["supabase"]>;
    user: NonNullable<(typeof auth)["user"]>;
    profile: (typeof auth)["profile"];
    role: UserRole;
    demoMode: false;
  };
}

/** @deprecated Prefer requireOperationalUser in new routes. */
export async function requireSupabaseWorkflowUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: unauthorizedResponse() };
  }

  const profile = await fetchUserProfile(supabase, user.id);
  const role = profile?.role as UserRole | undefined;

  if (!role) {
    return { error: accessDeniedResponse("Operational role required.") };
  }

  return { supabase, user, profile, role, demoMode: false as const };
}

