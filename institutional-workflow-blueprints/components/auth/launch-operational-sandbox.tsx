"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, SecondaryButton } from "@/components/ui/primitives";
import {
  LAUNCH_SANDBOX_SUBTITLE,
  LAUNCH_SANDBOX_TITLE,
  SANDBOX_ACCESS_LABEL,
  SANDBOX_ROLES,
} from "@/data/sandbox-roles";
import { launchSandboxRole } from "@/lib/auth/sandbox-login";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

type LaunchOperationalSandboxProps = {
  nextPath?: string;
  compact?: boolean;
  className?: string;
};

export function LaunchOperationalSandbox({
  nextPath = "/",
  compact = false,
  className = "",
}: LaunchOperationalSandboxProps) {
  const router = useRouter();
  const { isSupabaseAuth, isDemoMode, refreshSession } = useAuth();
  const { setRole } = useAppStore();
  const [busyRole, setBusyRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLaunch(role: UserRole) {
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

  return (
    <section className={className}>
      <Card variant={compact ? "ghost" : "elevated"} className="border-ops-border bg-ops-surface">
        <div className="border-b border-ops-border-subtle pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Operational access
          </p>
          <h2 className="mt-1 text-sm font-semibold text-ops-text">{LAUNCH_SANDBOX_TITLE}</h2>
          <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">
            {LAUNCH_SANDBOX_SUBTITLE}
          </p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ops-text-dim">
            {SANDBOX_ACCESS_LABEL}
          </p>
        </div>

        <div className={`mt-3 grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
          {SANDBOX_ROLES.map((entry) => (
            <article
              key={entry.role}
              className="rounded-lg border border-ops-border-subtle bg-ops-overlay/30 px-3 py-3"
            >
              <h3 className="text-xs font-semibold text-ops-text">{entry.title}</h3>
              <p className="mt-1.5 text-[11px] leading-snug text-ops-text-secondary">
                {entry.description}
              </p>
              <p className="mt-2 text-[10px] text-ops-text-dim">{entry.responsibility}</p>
              <SecondaryButton
                type="button"
                className="mt-3 w-full"
                disabled={busyRole !== null}
                onClick={() => void handleLaunch(entry.role)}
              >
                {busyRole === entry.role ? "Launching…" : entry.actionLabel}
              </SecondaryButton>
            </article>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-3 py-2 text-[11px] text-ops-danger">
            {error}
          </p>
        ) : null}

        {isSupabaseAuth ? (
          <p className="mt-3 border-t border-ops-border-subtle pt-3 text-[10px] leading-relaxed text-ops-text-dim">
            Institutional credentials can also be used via the sign-in form above. Sandbox roles map
            to preconfigured {getRoleLabel("analyst").toLowerCase()}, manager, and admin profiles.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
