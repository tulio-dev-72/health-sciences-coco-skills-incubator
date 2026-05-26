"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { IntegrationStatusBadge, RoleBadge } from "@/components/ui/badges";
import { fetchFireblocksStatus } from "@/lib/fireblocks/api-client";
import { getRoleLabel, isUserRole } from "@/lib/auth/role-labels";
import { AUTH_SIGN_IN } from "@/lib/supabase/routes";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

type AppHeaderProps = {
  actions?: ReactNode;
  onSignOut?: () => void;
};

export function AppHeader({ actions, onSignOut }: AppHeaderProps) {
  const router = useRouter();
  const { user, profile, loading, isSupabaseAuth, isDemoMode, signOut } = useAuth();
  const { effectiveRole, clearRole } = useAppStore();
  const [integrationStatus, setIntegrationStatus] = useState<"connected" | "offline">("offline");

  const displayRole: UserRole | null = isSupabaseAuth
    ? profile?.role && isUserRole(profile.role)
      ? profile.role
      : null
    : effectiveRole;

  useEffect(() => {
    void fetchFireblocksStatus()
      .then((status) => {
        setIntegrationStatus(status.integrationStatus === "connected" ? "connected" : "offline");
      })
      .catch(() => {
        setIntegrationStatus("offline");
      });
  }, []);

  async function handleSignOut() {
    onSignOut?.();
    clearRole();
    await signOut();
    router.push(AUTH_SIGN_IN);
    router.refresh();
  }

  const isAuthenticated = isSupabaseAuth ? Boolean(user) : Boolean(displayRole);

  return (
    <header className="border-b border-ops-border bg-ops-surface/95 shadow-[var(--ops-shadow-sm)] backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-ops-text sm:text-lg">
              Treasury Control Center
            </h1>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <IntegrationStatusBadge status={integrationStatus} />

            {loading ? (
              <span
                className="inline-flex min-h-10 w-20 animate-pulse rounded-lg bg-ops-overlay"
                aria-label="Loading session"
              />
            ) : isAuthenticated ? (
              <>
                {displayRole ? (
                  <div className="rounded-lg border border-ops-border bg-ops-elevated px-3 py-2">
                    <p className="text-[10px] text-ops-text-dim">Active role</p>
                    <div className="mt-0.5">
                      <RoleBadge role={displayRole} />
                    </div>
                  </div>
                ) : null}
                {isSupabaseAuth && user ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ops-border bg-ops-surface px-3.5 py-2 text-xs font-medium text-ops-text-secondary transition hover:text-ops-text"
                  >
                    End session
                  </button>
                ) : isDemoMode && displayRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearRole();
                      router.refresh();
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ops-border bg-ops-surface px-3.5 py-2 text-xs font-medium text-ops-text-secondary transition hover:text-ops-text"
                  >
                    End session
                  </button>
                ) : null}
              </>
            ) : (
              <Link
                href={AUTH_SIGN_IN}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ops-border bg-ops-primary px-3.5 py-2 text-xs font-medium text-white transition hover:bg-ops-primary-hover"
              >
                Authenticate
              </Link>
            )}

            {actions}
          </div>
        </div>

        {isAuthenticated && displayRole ? (
          <p className="mt-2 text-[10px] text-ops-text-dim sm:hidden">
            Signed in as {getRoleLabel(displayRole)}
          </p>
        ) : null}
      </div>
    </header>
  );
}
