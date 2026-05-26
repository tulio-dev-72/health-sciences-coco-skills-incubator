"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { loadSessionRole } from "@/lib/storage";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

/** Sync Supabase profile role (or demo session role) into app store. */
export function AuthStoreSync() {
  const { profile, isDemoMode, isSupabaseAuth, loading, user } = useAuth();
  const { setRole, clearRole, sessionReady } = useAppStore();

  useEffect(() => {
    if (!sessionReady || loading) {
      return;
    }

    if (isSupabaseAuth) {
      if (profile?.role) {
        setRole(profile.role as UserRole);
      } else if (user) {
        clearRole();
      } else {
        clearRole();
      }
      return;
    }

    if (isDemoMode) {
      const demoRole = loadSessionRole();
      if (demoRole) {
        setRole(demoRole);
      }
    }
  }, [
    profile?.role,
    user,
    isSupabaseAuth,
    isDemoMode,
    loading,
    sessionReady,
    setRole,
    clearRole,
  ]);

  return null;
}
