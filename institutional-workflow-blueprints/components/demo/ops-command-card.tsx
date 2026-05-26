"use client";

import Link from "next/link";
import { LiveBadge } from "@/components/ui/badges";
import { Card, GhostButton, PrimaryButton, StatTile } from "@/components/ui/primitives";
import { getDemoScenario } from "@/data/demo-scenarios";
import { useFireblocksConnection } from "@/lib/fireblocks/use-fireblocks-connection";
import { getRoleLabel, useAppStore } from "@/lib/store";
import { canApproveTransfers, canManagePolicy } from "@/lib/policy";

export function OpsCommandCard() {
  const { state, effectiveRole } = useAppStore();
  const { connected } = useFireblocksConnection();
  const scenario = getDemoScenario(state.activeBlueprint);
  const pending = state.transfers.filter((t) => t.status === "PENDING_APPROVAL").length;
  const settled = state.transfers.filter(
    (t) => t.status === "SETTLED" || t.status === "APPROVED",
  ).length;
  const canApprove = canApproveTransfers(effectiveRole);
  const isAdmin = canManagePolicy(effectiveRole);

  return (
    <Card variant="accent">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-primary">
            Operations command
          </p>
          <h2 className="mt-1 text-sm font-semibold text-ops-text">{scenario.headline}</h2>
          <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">
            {scenario.queueSummary}
          </p>
        </div>
        <LiveBadge live={connected} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile label="Awaiting" value={pending} accent />
        <StatTile label="Cleared" value={settled} />
        <StatTile label="In batch" value={state.transfers.length} />
      </div>

      <p className="mt-2 font-mono text-[10px] text-ops-text-dim">{scenario.batchLabel}</p>

      <div className="mt-3 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-xs text-ops-text-secondary">
        <span className="text-ops-text-dim">Session</span>{" "}
        {effectiveRole ? getRoleLabel(effectiveRole) : "Unauthenticated"}
        {effectiveRole === "analyst" && " · submit only"}
        {effectiveRole === "treasury_manager" && " · approve queue"}
        {effectiveRole === "admin" && " · policy & custody config"}
      </div>

      <div className="mt-3 grid gap-2">
        <Link href="/demo/approvals">
          <PrimaryButton className="w-full">
            {canApprove ? "Open transaction authorization" : "View authorization queue"}
          </PrimaryButton>
        </Link>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/demo/audit">
            <GhostButton className="w-full">Audit log</GhostButton>
          </Link>
          {isAdmin ? (
            <Link href="/demo/settings">
              <GhostButton className="w-full">Policy admin</GhostButton>
            </Link>
          ) : (
            <Link href="/demo/login">
              <GhostButton className="w-full">Switch role</GhostButton>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
