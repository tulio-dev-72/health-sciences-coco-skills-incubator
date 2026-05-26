"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { isUserRole } from "@/lib/auth/role-labels";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import { loadSessionRole } from "@/lib/storage";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

/** Keep app store aligned with Supabase profile role or sandbox session cookie. */
export function AuthStoreSync() {
  const { isSupabaseAuth, profile } = useAuth();
  const { setRole, clearRole, sessionReady, effectiveRole } = useAppStore();
  const lastSyncedRef = useRef<UserRole | "cleared" | null>(null);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (isSupabaseAuth && isSupabasePersistenceEnabled()) {
      const profileRole = profile?.role;
      if (profileRole && isUserRole(profileRole)) {
        if (lastSyncedRef.current === profileRole) {
          return;
        }
        lastSyncedRef.current = profileRole;
        if (effectiveRole !== profileRole) {
          setRole(profileRole);
        }
      }
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
  }, [sessionReady, isSupabaseAuth, profile?.role, effectiveRole, setRole, clearRole]);

  return null;
}
