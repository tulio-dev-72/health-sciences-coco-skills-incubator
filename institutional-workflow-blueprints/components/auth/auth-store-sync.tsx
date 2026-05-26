"use client";

import { useEffect, useRef } from "react";
import { loadSessionRole } from "@/lib/storage";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

/** Keep app store aligned with the active sandbox session cookie — not Supabase profile role. */
export function AuthStoreSync() {
  const { setRole, clearRole, sessionReady, effectiveRole } = useAppStore();
  const lastSyncedRef = useRef<UserRole | "cleared" | null>(null);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    const sessionRole = loadSessionRole();

    if (sessionRole) {
      if (lastSyncedRef.current === sessionRole) {
        return;
      }
      lastSyncedRef.current = sessionRole;
      if (effectiveRole !== sessionRole) {
        setRole(sessionRole);
      }
      return;
    }

    if (lastSyncedRef.current === "cleared") {
      return;
    }
    lastSyncedRef.current = "cleared";
    if (effectiveRole !== null) {
      clearRole();
    }
  }, [sessionReady, effectiveRole, setRole, clearRole]);

  return null;
}
