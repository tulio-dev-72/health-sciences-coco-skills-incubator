"use client";

import { useRouter } from "next/navigation";
import { RoleBadge, LiveBadge } from "@/components/ui/badges";
import { useAuth } from "@/components/auth/auth-provider";
import { exitSandboxSession } from "@/lib/auth/exit-sandbox-session";
import { useFireblocksConnection } from "@/lib/fireblocks/use-fireblocks-connection";
import { getRoleLabel, useAppStore } from "@/lib/store";

const shellMaxWidth = "max-w-lg md:max-w-2xl xl:max-w-4xl";

export function DemoTopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const { isSupabaseAuth, signOut } = useAuth();
  const { effectiveRole, sessionReady, clearRole, actorName } = useAppStore();
  const { connected } = useFireblocksConnection();
  const displayRole = sessionReady ? effectiveRole : null;
  const displayName = sessionReady ? actorName : "Loading…";

  async function handleSwitchRole() {
    await exitSandboxSession({ clearRole, router });
  }

  async function handleEndSession() {
    await exitSandboxSession({
      clearRole,
      signOut: isSupabaseAuth ? signOut : undefined,
      router,
      endSession: isSupabaseAuth,
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ops-border bg-ops-surface shadow-[var(--ops-shadow-md)] backdrop-blur-md">
      <div
        className={`mx-auto flex ${shellMaxWidth} flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ops-text-dim">
              Treasury Control Center
            </p>
            <LiveBadge live={connected} />
          </div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ops-text">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-ops-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-col sm:items-end sm:text-right">
          {displayRole ? <RoleBadge role={displayRole} /> : null}
          <p className="text-[11px] font-medium text-ops-text-secondary">{displayName}</p>
          <div className="flex gap-3 sm:flex-col sm:gap-1">
            <button
              type="button"
              onClick={() => void handleSwitchRole()}
              className="inline-flex min-h-11 items-center text-[11px] font-medium text-ops-text-secondary hover:text-ops-primary"
            >
              Switch role
            </button>
            <button
              type="button"
              onClick={() => void handleEndSession()}
              className="inline-flex min-h-11 items-center text-[11px] text-ops-text-dim hover:text-ops-text-secondary"
            >
              End session
            </button>
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
