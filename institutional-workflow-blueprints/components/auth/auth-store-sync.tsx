"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { loadSessionRole } from "@/lib/storage";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

/** Sync Supabase profile role (or demo session role) into app store. */
export function AuthStoreSync() {
  const { profile, isDemoMode, isSupabaseAuth, loading, user } = useAuth();
  const { setRole, clearRole, sessionReady, effectiveRole } = useAppStore();
  const lastSyncedRef = useRef<UserRole | "cleared" | null>(null);

  useEffect(() => {
    if (!sessionReady || loading) {
      return;
    }

    if (isSupabaseAuth) {
      const profileRole = profile?.role as UserRole | undefined;

      if (profileRole) {
        if (lastSyncedRef.current === profileRole) {
          return;
        }
        lastSyncedRef.current = profileRole;
        if (effectiveRole !== profileRole) {
          setRole(profileRole);
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
      return;
    }

    if (isDemoMode) {
      const demoRole = loadSessionRole();
      if (!demoRole) {
        return;
      }
      if (lastSyncedRef.current === demoRole) {
        return;
      }
      lastSyncedRef.current = demoRole;
      if (effectiveRole !== demoRole) {
        setRole(demoRole);
      }
    }
  }, [
    profile?.role,
    user?.id,
    isSupabaseAuth,
    isDemoMode,
    loading,
    sessionReady,
    effectiveRole,
    setRole,
    clearRole,
  ]);

  return null;
}
