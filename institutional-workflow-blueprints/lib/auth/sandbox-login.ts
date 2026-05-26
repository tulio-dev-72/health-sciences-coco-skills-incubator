"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSandboxAccountForRole } from "@/data/sandbox-roles";
import { commitDemoLogin } from "@/lib/storage";
import type { UserRole } from "@/lib/types";

type LaunchOptions = {
  isSupabaseAuth: boolean;
  isDemoMode: boolean;
  refreshSession: () => Promise<void>;
};

export async function launchSandboxRole(
  role: UserRole,
  { isSupabaseAuth, isDemoMode, refreshSession }: LaunchOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDemoMode) {
    commitDemoLogin(role);
    return { ok: true };
  }

  if (isSupabaseAuth) {
    try {
      const { email, password } = getSandboxAccountForRole(role);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { ok: false, error: error.message };
      }

      await refreshSession();
      return { ok: true };
    } catch (launchError) {
      return {
        ok: false,
        error: launchError instanceof Error ? launchError.message : "Sandbox launch failed.",
      };
    }
  }

  return { ok: false, error: "Operational sandbox is not configured in this environment." };
}
