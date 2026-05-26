"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { SettlementReviewCard } from "@/components/demo/settlement-review-card";
import { WorkflowStepper } from "@/components/demo/workflow-stepper";
import { Card, DangerButton, PrimaryButton, SecondaryButton, SectionHeader } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT, WEBHOOK_LIFECYCLE_STATUSES } from "@/data/primary-scenario";
import { submitFireblocksTransfer } from "@/lib/fireblocks/api-client";
import { canApproveTransfers } from "@/lib/policy";
import { useAppStore } from "@/lib/store";

type SettlementPhase = "idle" | "creating" | "created" | "webhook";

export default function ApprovalsPage() {
  const router = useRouter();
  const {
    state,
    effectiveRole,
    approveTransfer,
    rejectTransfer,
    syncFireblocksTransferStatus,
    setWorkflowStep,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [escalatedId, setEscalatedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SettlementPhase>("idle");
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [webhookStatuses, setWebhookStatuses] = useState<string[]>([]);

  const pending = state.transfers.filter((t) => t.status === "PENDING_APPROVAL");
  const canApprove = canApproveTransfers(effectiveRole);
  const activeTransfer = state.transfers.find((item) => item.id === activeTransferId);

  async function simulateWebhookLifecycle(transferId: string, fireblocksTxId: string) {
    setPhase("webhook");
    setWebhookStatuses([]);

    for (const status of WEBHOOK_LIFECYCLE_STATUSES) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setWebhookStatuses((current) => [...current, status]);
      syncFireblocksTransferStatus({
        externalTxId: transferId,
        fireblocksTxId,
        status,
      });
    }

    setWorkflowStep("audit");
    setTimeout(() => router.push("/demo/audit"), 800);
  }

  async function handleAuthorize(transferId: string) {
    setError(null);
    setBusyId(transferId);
    setActiveTransferId(transferId);
    setPhase("creating");

    const transfer = state.transfers.find((item) => item.id === transferId);
    if (!transfer) return;

    try {
      let fireblocksTxId: string = PRIMARY_SETTLEMENT.demoFireblocksTxId;

      if (state.fireblocksEnabled) {
        try {
          const result = await submitFireblocksTransfer({
            externalTxId: transfer.id,
            asset: transfer.asset,
            amount: transfer.amount,
            destination: transfer.destination,
            note: transfer.reason,
          });
          fireblocksTxId = result.fireblocksTxId;
        } catch {
          fireblocksTxId = PRIMARY_SETTLEMENT.demoFireblocksTxId;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1400));
      setPhase("created");
      approveTransfer(transferId, {
        fireblocksTxId,
        fireblocksStatus: "SUBMITTED",
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      await simulateWebhookLifecycle(transferId, fireblocksTxId);
    } catch (authorizeError) {
      setPhase("idle");
      setError(
        authorizeError instanceof Error ? authorizeError.message : "Authorization failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleReject(transferId: string) {
    rejectTransfer(transferId);
    setWorkflowStep("audit");
    router.push("/demo/audit");
  }

  function handleEscalate(transferId: string) {
    setEscalatedId(transferId);
  }

  return (
    <>
      <DemoTopBar
        title="Authorization Queue"
        subtitle="Treasury manager review before Fireblocks custody release."
      />
      <WorkflowStepper currentStep="approval" />

      <main className="space-y-3 px-3 py-3">
        {!canApprove ? (
          <Card variant="accent">
            <p className="text-xs font-medium text-ops-warning">
              Analyst role cannot authorize settlements.
            </p>
            <p className="mt-1 text-[11px] text-ops-text-secondary">
              Switch to Treasury Manager to release authorized settlements to Fireblocks.
            </p>
          </Card>
        ) : null}

        {error ? (
          <Card variant="accent">
            <p className="text-xs text-ops-danger">{error}</p>
          </Card>
        ) : null}

        {phase !== "idle" && activeTransfer ? (
          <FireblocksSettlementPanel
            transfer={{
              ...activeTransfer,
              fireblocksTxId:
                activeTransfer.fireblocksTxId ?? PRIMARY_SETTLEMENT.demoFireblocksTxId,
            }}
            phase={phase === "webhook" ? "webhook" : phase}
            webhookStatuses={webhookStatuses}
          />
        ) : (
          <>
            <SectionHeader
              label="Authorization"
              title={`Pending authorization (${pending.length})`}
              subtitle="Review settlement details before releasing to Fireblocks infrastructure."
            />

            {pending.length === 0 ? (
              <Card variant="ghost">
                <p className="text-xs text-ops-text-secondary">Authorization queue is empty.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((transfer) => (
                  <div key={transfer.id} className="space-y-2">
                    <SettlementReviewCard transfer={transfer} />
                    {escalatedId === transfer.id ? (
                      <Card variant="ghost">
                        <p className="text-xs text-ops-warning">
                          Escalated to senior treasury review — awaiting additional sign-off.
                        </p>
                      </Card>
                    ) : null}
                    {canApprove ? (
                      <div className="grid gap-2">
                        <PrimaryButton
                          disabled={busyId === transfer.id}
                          onClick={() => handleAuthorize(transfer.id)}
                        >
                          {busyId === transfer.id ? "Authorizing…" : "Authorize Settlement"}
                        </PrimaryButton>
                        <div className="grid grid-cols-2 gap-2">
                          <DangerButton onClick={() => handleReject(transfer.id)}>
                            Reject Settlement
                          </DangerButton>
                          <SecondaryButton onClick={() => handleEscalate(transfer.id)}>
                            Escalate Review
                          </SecondaryButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
