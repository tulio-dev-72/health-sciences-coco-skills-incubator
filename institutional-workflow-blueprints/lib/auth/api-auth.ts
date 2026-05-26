import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isUserRole } from "@/lib/auth/role-labels";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import type { UserRole } from "@/lib/types";

export type OperationalAuthContext =
  | {
      demoMode: true;
      role: UserRole;
      userId: null;
      supabase: null;
    }
  | {
      demoMode: false;
      role: UserRole;
      userId: string;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    };

export function accessDeniedResponse(message = "Access denied for your operational role."): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorizedResponse(message = "Authentication required."): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireOperationalUser(): Promise<
  OperationalAuthContext | { error: NextResponse }
> {
  if (isDemoModeEnabled()) {
    const roleValue = (await cookies()).get("iwb_role")?.value;
    if (!roleValue || !isUserRole(roleValue)) {
      return { error: unauthorizedResponse("Select an operational role to continue.") };
    }

    return {
      demoMode: true,
      role: roleValue,
      userId: null,
      supabase: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: unauthorizedResponse() };
  }

  const profile = await fetchUserProfile(supabase, user.id);
  const role = profile?.role;

  if (!role || !isUserRole(role)) {
    return { error: accessDeniedResponse("Operational role required.") };
  }

  return {
    demoMode: false,
    role,
    userId: user.id,
    supabase,
  };
}

export function assertOperationalRole(
  role: UserRole,
  allowed: UserRole[],
  message?: string,
): NextResponse | null {
  if (!allowed.includes(role)) {
    return accessDeniedResponse(message);
  }
  return null;
}
