"use client";

import Link from "next/link";
import { RoleBadge, LiveBadge } from "@/components/ui/badges";
import { ACCESS_PORTAL } from "@/lib/supabase/routes";
import { getRoleLabel, useAppStore } from "@/lib/store";

const shellMaxWidth = "max-w-lg md:max-w-2xl xl:max-w-4xl";

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
      <div
        className={`mx-auto flex ${shellMaxWidth} flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ops-text-dim">
              Treasury Control Center
            </p>
            <LiveBadge live={state.fireblocksEnabled} />
          </div>
          <h1 className="mt-0.5 text-sm font-semibold text-ops-text">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ops-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-col sm:items-end sm:text-right">
          {displayRole ? <RoleBadge role={displayRole} /> : null}
          <p className="text-[10px] text-ops-text-dim">{displayName}</p>
          <div className="flex gap-3 sm:flex-col sm:gap-1">
            <Link
              href={ACCESS_PORTAL}
              onClick={clearRole}
              className="inline-flex min-h-11 items-center text-[11px] font-medium text-ops-text-secondary hover:text-ops-primary"
            >
              Switch role
            </Link>
            <Link
              href={ACCESS_PORTAL}
              onClick={clearRole}
              className="inline-flex min-h-11 items-center text-[11px] text-ops-text-dim hover:text-ops-text-secondary"
            >
              End session
            </Link>
          </div>
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
