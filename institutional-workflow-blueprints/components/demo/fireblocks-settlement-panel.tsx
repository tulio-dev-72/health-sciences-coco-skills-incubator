"use client";

import type { Transfer } from "@/lib/types";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { FireblocksStatusBadge } from "@/components/ui/badges";

type FireblocksSettlementPanelProps = {
  transfer: Transfer;
  phase: "creating" | "created" | "webhook";
  webhookStatuses: string[];
};

export function FireblocksSettlementPanel({
  transfer,
  phase,
  webhookStatuses,
}: FireblocksSettlementPanelProps) {
  if (phase === "creating") {
    return (
      <Card variant="elevated">
        <p className="text-xs font-medium text-ops-text">
          Server-side SDK transaction orchestration…
        </p>
        <p className="mt-1 text-[11px] text-ops-text-secondary">
          Crossing the custody/signing boundary — Fireblocks MPC-secured custody handles signing.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card variant="accent" className="ring-1 ring-ops-info/15">
        <SectionHeader
          label="Infrastructure boundary"
          title="Fireblocks MPC Custody + Signing"
          subtitle="This app orchestrates workflow only — MPC-secured custody and signing remain inside Fireblocks."
        />
        <div className="mt-2 space-y-1.5 font-mono text-[11px] text-ops-text-secondary">
          <p>
            <span className="text-ops-text-dim">fireblocksTxId</span>{" "}
            <span className="text-ops-text">{transfer.fireblocksTxId}</span>
          </p>
          <p>
            <span className="text-ops-text-dim">Vault Account</span>{" "}
            <span className="text-ops-text">{transfer.sourceVault ?? "Treasury Main"}</span>
          </p>
          <p>
            <span className="text-ops-text-dim">Transaction API</span>{" "}
            <span className="text-ops-text">POST /v1/transactions</span>
          </p>
        </div>
      </Card>

      {phase === "webhook" ? (
        <Card variant="elevated">
          <SectionHeader
            label="Event-driven status"
            title="Webhook Lifecycle Updates"
            subtitle="Fireblocks authorization lifecycle events — not simulated UI state."
          />
          <div className="space-y-2">
            {webhookStatuses.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-3 py-2"
              >
                <span className="text-[11px] text-ops-text-secondary">Status update</span>
                <FireblocksStatusBadge status={status} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
