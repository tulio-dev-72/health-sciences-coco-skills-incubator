"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { InfrastructureOverview } from "@/components/auth/infrastructure-overview";
import { IntegrationStatusBadge } from "@/components/ui/badges";
import { SecondaryButton } from "@/components/ui/primitives";
import {
  ACCESS_PORTAL_SUBTITLE,
  ACCESS_PORTAL_TITLE,
  SANDBOX_ACCESS_LABEL,
  SANDBOX_FOOTER_NOTE,
  SANDBOX_ROLES,
} from "@/data/sandbox-roles";
import { launchSandboxRole } from "@/lib/auth/sandbox-login";
import { fetchFireblocksStatus } from "@/lib/fireblocks/api-client";
import { useAppStore } from "@/lib/store";
import { OPERATIONS_HOME } from "@/lib/supabase/routes";
import type { UserRole } from "@/lib/types";

export function AccessPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? OPERATIONS_HOME;
  const { user, profile, loading, isSupabaseAuth, isDemoMode, refreshSession } = useAuth();
  const { effectiveRole, setRole, sessionReady } = useAppStore();
  const [busyRole, setBusyRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<"connected" | "offline">("offline");

  const hasOperationalAccess = isSupabaseAuth
    ? Boolean(user && profile?.role)
    : Boolean(effectiveRole);

  useEffect(() => {
    void fetchFireblocksStatus()
      .then((status) => {
        setIntegrationStatus(status.integrationStatus === "connected" ? "connected" : "offline");
      })
      .catch(() => {
        setIntegrationStatus("offline");
      });
  }, []);

  useEffect(() => {
    if (!loading && sessionReady && hasOperationalAccess) {
      router.replace(nextPath);
    }
  }, [loading, sessionReady, hasOperationalAccess, nextPath, router]);

  async function handleEnter(role: UserRole) {
    setBusyRole(role);
    setError(null);

    const result = await launchSandboxRole(role, {
      isSupabaseAuth,
      isDemoMode,
      refreshSession,
    });

    if (!result.ok) {
      setError(result.error);
      setBusyRole(null);
      return;
    }

    if (isDemoMode) {
      setRole(role);
    }

    router.push(nextPath);
    router.refresh();
    setBusyRole(null);
  }

  if (loading || (sessionReady && hasOperationalAccess)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ops-bg">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-ops-overlay" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ops-text-dim">
            Institutional access portal
          </p>
          <IntegrationStatusBadge status={integrationStatus} />
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ops-text sm:text-3xl">
              {ACCESS_PORTAL_TITLE}
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ops-text-secondary">
              {ACCESS_PORTAL_SUBTITLE}
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-ops-border bg-ops-surface p-4 shadow-[var(--ops-shadow-md)] sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
              {SANDBOX_ACCESS_LABEL}
            </p>

            <div className="mt-4 space-y-2">
              {SANDBOX_ROLES.map((entry) => (
                <article
                  key={entry.role}
                  className="rounded-lg border border-ops-border-subtle bg-ops-overlay/30 px-3 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-ops-text">{entry.title}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">
                        {entry.description}
                      </p>
                      <p className="mt-1.5 text-[10px] text-ops-text-dim">{entry.responsibility}</p>
                    </div>
                    <SecondaryButton
                      type="button"
                      className="w-full shrink-0 sm:w-auto sm:min-w-[9.5rem]"
                      disabled={busyRole !== null}
                      onClick={() => void handleEnter(entry.role)}
                    >
                      {busyRole === entry.role ? "Entering…" : entry.actionLabel}
                    </SecondaryButton>
                  </div>
                </article>
              ))}
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-3 py-2 text-[11px] text-ops-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <InfrastructureOverview compact />
          </div>
        </div>

        <p className="mx-auto max-w-xl pb-2 text-center text-[10px] leading-relaxed text-ops-text-dim">
          {SANDBOX_FOOTER_NOTE}
        </p>
        {isSupabaseAuth ? (
          <p className="mx-auto max-w-xl pb-4 text-center text-[10px] text-ops-text-dim">
            Organization credentials?{" "}
            <a href="/auth/sign-in" className="font-medium text-ops-primary hover:underline">
              Institutional sign-in
            </a>
          </p>
        ) : (
          <div className="pb-4" />
        )}
      </div>
    </div>
  );
}
