"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSandboxAccountForRole } from "@/data/sandbox-roles";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { fetchUserProfile, upsertUserProfile } from "@/lib/supabase/profiles";
import { commitDemoLogin } from "@/lib/storage";
import type { UserRole } from "@/lib/types";

type LaunchOptions = {
  isSupabaseAuth: boolean;
  isDemoMode: boolean;
  refreshSession: () => Promise<void>;
};

export type LaunchSandboxResult =
  | { ok: true; role: UserRole }
  | { ok: false; error: string };

export async function launchSandboxRole(
  role: UserRole,
  { isSupabaseAuth, isDemoMode, refreshSession }: LaunchOptions,
): Promise<LaunchSandboxResult> {
  if (isDemoMode) {
    commitDemoLogin(role);
    return { ok: true, role };
  }

  if (isSupabaseAuth) {
    try {
      const { email, password } = getSandboxAccountForRole(role);
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        return {
          ok: false,
          error:
            signInError.message === "Invalid login credentials"
              ? "Sandbox role access is unavailable. Confirm demo accounts are seeded in Supabase."
              : signInError.message,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { ok: false, error: "Authentication succeeded but no active session was created." };
      }

      const profile = await fetchUserProfile(supabase, user.id);
      if (!profile?.role) {
        const { error: profileError } = await upsertUserProfile(supabase, {
          id: user.id,
          email: user.email ?? email,
          role,
          displayName: getRoleLabel(role),
        });

        if (profileError) {
          return { ok: false, error: profileError };
        }
      }

      await refreshSession();
      commitDemoLogin(role);
      return { ok: true, role };
    } catch (launchError) {
      return {
        ok: false,
        error: launchError instanceof Error ? launchError.message : "Sandbox launch failed.",
      };
    }
  }

  return { ok: false, error: "Operational sandbox is not configured in this environment." };
}
