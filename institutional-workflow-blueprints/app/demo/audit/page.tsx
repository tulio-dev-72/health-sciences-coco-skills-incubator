"use client";

import { DemoTopBar } from "@/components/demo/top-bar";
import { AuditTimeline } from "@/components/demo/audit-timeline";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { APP_TERMS } from "@/data/infrastructure-mapping";
import { useAppStore } from "@/lib/store";

export default function AuditPage() {
  const { state } = useAppStore();
  const lastTransfer = state.transfers.find((item) => item.id === state.lastTransferId);

  return (
    <>
      <DemoTopBar
        title={APP_TERMS.auditLogs}
        subtitle="Operational audit trail — initiation, policy, authorization, Fireblocks, and webhook events."
      />
      <ConnectedWorkflowStepper />

      <main className="ops-page">
        {state.policySummary ? (
          <Card variant="accent" className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
              Session result
            </p>
            <p className="mt-1 text-xs text-ops-text-secondary">{state.policySummary}</p>
          </Card>
        ) : null}

        <SectionHeader
          label="Compliance"
          title="Operational audit timeline"
          subtitle={
            state.auditLog.length === 0
              ? "No events recorded. Run the primary settlement workflow to populate the audit trail."
              : "Chronological record of settlement governance and infrastructure events."
          }
        />

        {state.auditLog.length === 0 ? (
          <Card variant="ghost">
            <p className="text-xs text-ops-text-secondary">
              Audit log empty. All authorization and webhook events are recorded here.
            </p>
          </Card>
        ) : (
          <Card variant="elevated">
            <AuditTimeline events={state.auditLog} />
          </Card>
        )}

        {lastTransfer?.fireblocksTxId && lastTransfer.fireblocksStatus ? (
          <FireblocksSettlementPanel
            transfer={lastTransfer}
            phase="webhook"
            webhookStatuses={
              lastTransfer.fireblocksStatus === "COMPLETED"
                ? ["PENDING_SIGNATURE", "CONFIRMING", "COMPLETED"]
                : [lastTransfer.fireblocksStatus]
            }
          />
        ) : null}
      </main>
    </>
  );
}
