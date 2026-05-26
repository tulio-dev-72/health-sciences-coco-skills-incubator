"use client";

import Link from "next/link";
import { RoleBadge, LiveBadge } from "@/components/ui/badges";
import { getRoleLabel, useAppStore } from "@/lib/store";

export function DemoTopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { effectiveRole, sessionReady, clearRole, actorName, state } = useAppStore();
  const displayRole = sessionReady ? effectiveRole : null;
  const displayName = sessionReady ? actorName : "Loading…";

  return (
    <header className="sticky top-0 z-30 border-b border-ops-border bg-ops-surface/90 shadow-[var(--ops-shadow-sm)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-start justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ops-text-dim">
              Treasury Control Center
            </p>
            <LiveBadge live={state.fireblocksEnabled} />
          </div>
          <h1 className="mt-0.5 truncate text-sm font-semibold text-ops-text">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-ops-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          {displayRole ? <RoleBadge role={displayRole} /> : null}
          <p className="mt-1.5 text-[10px] text-ops-text-dim">{displayName}</p>
          <Link
            href="/demo/login"
            className="mt-1 inline-block text-[10px] text-ops-text-secondary hover:text-ops-primary"
          >
            Switch role
          </Link>
          <Link
            href="/"
            onClick={clearRole}
            className="mt-0.5 block text-[10px] text-ops-text-dim hover:text-ops-text-secondary"
          >
            Exit
          </Link>
        </div>
      </div>
    </header>
  );
}

export function DemoRoleSummary() {
  const { effectiveRole } = useAppStore();
  if (!effectiveRole) return null;

  return (
    <p className="text-xs text-ops-text-secondary">
      Signed in as{" "}
      <span className="font-medium text-ops-text">{getRoleLabel(effectiveRole)}</span>
    </p>
  );
}
