"use client";

import { DemoTopBar } from "@/components/demo/top-bar";
import { AuditTimeline } from "@/components/demo/audit-timeline";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { APP_TERMS } from "@/data/infrastructure-mapping";
import { AUDIT_ACTIONS } from "@/lib/audit";
import {
  getSettlementLifecycleMode,
  type SettlementStatusSource,
} from "@/lib/fireblocks/lifecycle";
import { useAppStore } from "@/lib/store";

export default function AuditPage() {
  const { state } = useAppStore();
  const lastTransfer = state.transfers.find((item) => item.id === state.lastTransferId);

  const lifecycleEvents = state.auditLog.filter(
    (event) =>
      event.action === AUDIT_ACTIONS.webhookStatusUpdated ||
      event.action === AUDIT_ACTIONS.settlementCompleted,
  );
  const lastLifecycleActor = lifecycleEvents[lifecycleEvents.length - 1]?.actor;
  const statusSource: SettlementStatusSource | null =
    lastLifecycleActor === "Fireblocks API"
      ? "fireblocks_api"
      : lastLifecycleActor === "Demo simulation"
        ? "demo_simulation"
        : lastLifecycleActor === "Fireblocks Webhook"
          ? "webhook"
          : null;
  const lifecycleMode = getSettlementLifecycleMode({
    fireblocksTxId: lastTransfer?.fireblocksTxId,
    demoFallback: statusSource === "demo_simulation",
  });
  const webhookStatuses = lastTransfer?.fireblocksStatus ? [lastTransfer.fireblocksStatus] : [];

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

        {lastTransfer?.fireblocksStatus ? (
          <FireblocksSettlementPanel
            transfer={lastTransfer}
            phase="webhook"
            webhookStatuses={webhookStatuses}
            lifecycleMode={lifecycleMode}
            statusSource={statusSource}
          />
        ) : null}
      </main>
    </>
  );
}
