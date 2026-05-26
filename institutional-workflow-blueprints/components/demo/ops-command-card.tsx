"use client";

import Link from "next/link";
import { LiveBadge } from "@/components/ui/badges";
import { Card, GhostButton, PrimaryButton, StatTile } from "@/components/ui/primitives";
import { getDemoScenario } from "@/data/demo-scenarios";
import { useFireblocksConnection } from "@/lib/fireblocks/use-fireblocks-connection";
import { getRoleLabel, useAppStore } from "@/lib/store";
import {
  canApproveTransfers,
  canCreateSettlements,
  canManagePolicy,
  canViewAuditLogs,
  canViewAuthorizationQueue,
  filterTransfersForRole,
} from "@/lib/policy";

export function OpsCommandCard() {
  const { state, effectiveRole } = useAppStore();
  const { connected } = useFireblocksConnection();
  const scenario = getDemoScenario(state.activeBlueprint);
  const visibleTransfers = filterTransfersForRole(state.transfers, effectiveRole);
  const pending = visibleTransfers.filter((t) => t.status === "PENDING_APPROVAL").length;
  const settled = visibleTransfers.filter(
    (t) => t.status === "SETTLED" || t.status === "APPROVED",
  ).length;
  const canApprove = canApproveTransfers(effectiveRole);
  const isAdmin = canManagePolicy(effectiveRole);
  const canCreate = canCreateSettlements(effectiveRole);

  return (
    <Card variant="accent">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-primary">
            Operations command
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug text-ops-text">{scenario.headline}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ops-text-secondary">
            {scenario.queueSummary}
          </p>
        </div>
        <LiveBadge live={connected} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile label="Awaiting" value={pending} accent />
        <StatTile label="Cleared" value={settled} />
        <StatTile label="In batch" value={visibleTransfers.length} />
      </div>

      <p className="mt-2 font-mono text-[10px] text-ops-text-dim">{scenario.batchLabel}</p>

      <div className="mt-4 rounded-lg border border-ops-border-subtle bg-ops-surface px-3 py-2.5 text-sm text-ops-text-secondary shadow-[var(--ops-shadow-sm)]">
        <span className="font-semibold text-ops-text-dim">Session</span>{" "}
        {effectiveRole ? getRoleLabel(effectiveRole) : "Unauthenticated"}
        {effectiveRole === "analyst" && " · create settlement requests"}
        {effectiveRole === "treasury_manager" && " · authorize custody release"}
        {effectiveRole === "admin" && " · policy, audit, and integration oversight"}
      </div>

      <div className="mt-3 grid gap-2">
        {canCreate ? (
          <Link href="/demo/create">
            <PrimaryButton className="w-full">Initiate settlement request</PrimaryButton>
          </Link>
        ) : null}
        {canViewAuthorizationQueue(effectiveRole) ? (
          <Link href="/demo/approvals">
            <PrimaryButton className="w-full" type="button">
              {canApprove ? "Open transaction authorization" : "View authorization queue"}
            </PrimaryButton>
          </Link>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canViewAuditLogs(effectiveRole) ? (
            <Link href="/demo/audit">
              <GhostButton className="w-full">Audit log</GhostButton>
            </Link>
          ) : null}
          {isAdmin ? (
            <Link href="/demo/settings">
              <GhostButton className="w-full">Policy admin</GhostButton>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
