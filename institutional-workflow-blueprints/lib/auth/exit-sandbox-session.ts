"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ACCESS_PORTAL } from "@/lib/supabase/routes";

type ExitSandboxOptions = {
  clearRole: () => void;
  signOut?: () => Promise<void>;
  router: AppRouterInstance;
  endSession?: boolean;
};

/** Clear sandbox role state and return to the institutional access portal. */
export async function exitSandboxSession({
  clearRole,
  signOut,
  router,
  endSession = false,
}: ExitSandboxOptions): Promise<void> {
  clearRole();

  if (endSession && signOut) {
    await signOut();
  }

  router.replace(ACCESS_PORTAL);
  router.refresh();
}
