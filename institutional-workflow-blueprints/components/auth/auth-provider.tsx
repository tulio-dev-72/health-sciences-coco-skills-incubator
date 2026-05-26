"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import type { UserProfile } from "@/lib/supabase/types";
import { loadSessionRole } from "@/lib/storage";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isSupabaseAuth: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isDemoMode = isDemoModeEnabled();
  const isSupabaseAuth = isSupabaseConfigured() && !isDemoMode;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseAuth) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user: nextUser },
      } = await supabase.auth.getUser();

      setUser(nextUser);

      if (nextUser) {
        const nextProfile = await fetchUserProfile(supabase, nextUser.id);
        setProfile(nextProfile);
      } else {
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseAuth]);

  useEffect(() => {
    void refreshSession();

    if (!isSupabaseAuth) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseAuth, refreshSession]);

  const signOut = useCallback(async () => {
    if (isSupabaseAuth) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, [isSupabaseAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: isSupabaseAuth ? Boolean(user) : Boolean(loadSessionRole()),
      isDemoMode,
      isSupabaseAuth,
      refreshSession,
      signOut,
    }),
    [user, profile, loading, isDemoMode, isSupabaseAuth, refreshSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
