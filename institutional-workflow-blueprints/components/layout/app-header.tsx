"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DemoAccountsMenu } from "@/components/auth/demo-accounts-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleBadge } from "@/components/ui/badges";
import { getRoleLabel, isUserRole } from "@/lib/auth/role-labels";
import { AUTH_SIGN_IN, AUTH_ROLE } from "@/lib/supabase/routes";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

type AppHeaderProps = {
  subtitle?: string;
  actions?: ReactNode;
  onSignOut?: () => void;
};

export function AppHeader({ subtitle, actions, onSignOut }: AppHeaderProps) {
  const router = useRouter();
  const { user, profile, loading, isSupabaseAuth, isDemoMode, signOut } = useAuth();
  const { effectiveRole, clearRole } = useAppStore();

  const displayRole: UserRole | null = isSupabaseAuth
    ? profile?.role && isUserRole(profile.role)
      ? profile.role
      : null
    : effectiveRole;

  async function handleSignOut() {
    onSignOut?.();
    clearRole();
    await signOut();
    router.push(AUTH_SIGN_IN);
    router.refresh();
  }

  return (
    <header className="border-b border-ops-border bg-ops-surface/90 shadow-[var(--ops-shadow-sm)] backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ops-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ops-text-dim">
                Digital asset operations
              </p>
              {isDemoMode ? (
                <span className="rounded-md bg-ops-warning-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ops-warning">
                  Demo Mode
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-lg font-semibold sm:text-xl">Treasury Control Center</h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-xs text-ops-text-secondary">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <DemoAccountsMenu />
            {actions}

            {loading ? (
              <span
                className="inline-flex min-h-11 w-[4.5rem] animate-pulse rounded-lg bg-ops-overlay"
                aria-label="Loading session"
              />
            ) : isSupabaseAuth && user ? (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-ops-border bg-ops-elevated px-3 py-2 sm:flex">
                  <div className="min-w-0 text-right">
                    <p className="truncate text-[11px] font-medium text-ops-text">
                      {profile?.display_name ?? user.email}
                    </p>
                    <p className="truncate text-[10px] text-ops-text-dim">{user.email}</p>
                  </div>
                  {displayRole ? (
                    <RoleBadge role={displayRole} />
                  ) : (
                    <Link
                      href={AUTH_ROLE}
                      className="text-[10px] font-medium text-ops-warning hover:underline"
                    >
                      Set role
                    </Link>
                  )}
                </div>
                {displayRole ? (
                  <span className="sm:hidden">
                    <RoleBadge role={displayRole} />
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ops-border bg-ops-surface px-3.5 py-2 text-xs font-medium text-ops-text-secondary transition hover:text-ops-text"
                >
                  Sign out
                </button>
              </>
            ) : isDemoMode && displayRole ? (
              <>
                <RoleBadge role={displayRole} />
                <Link
                  href="/demo/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ops-border bg-ops-elevated px-3.5 py-2 text-xs font-medium text-ops-text transition hover:border-ops-text-dim"
                >
                  Switch role
                </Link>
              </>
            ) : (
              <Link
                href={isDemoMode ? "/demo/login" : AUTH_SIGN_IN}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ops-border bg-ops-elevated px-3.5 py-2 text-xs font-medium text-ops-text transition hover:border-ops-text-dim"
              >
                {isDemoMode ? "Demo login" : "Sign in"}
              </Link>
            )}
          </div>
        </div>

        {isSupabaseAuth && user && displayRole ? (
          <p className="mt-2 text-[10px] text-ops-text-dim sm:hidden">
            Signed in as {getRoleLabel(displayRole)}
          </p>
        ) : null}
      </div>
    </header>
  );
}
