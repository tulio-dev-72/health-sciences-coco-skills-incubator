"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { SettlementReviewCard } from "@/components/demo/settlement-review-card";
import { Card, DangerButton, PrimaryButton, SecondaryButton, SectionHeader } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT, WEBHOOK_LIFECYCLE_STATUSES } from "@/data/primary-scenario";
import { submitAuthorizedFireblocksTransfer } from "@/lib/fireblocks/authorize-transfer";
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
    setWorkflowStep("webhook");
    setWebhookStatuses([]);

    for (const status of WEBHOOK_LIFECYCLE_STATUSES) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setWebhookStatuses((current) => [...current, status]);
      await syncFireblocksTransferStatus({
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
    setWorkflowStep("custody");

    const transfer = state.transfers.find((item) => item.id === transferId);
    if (!transfer) return;

    try {
      const { fireblocksTxId, fireblocksStatus } = await submitAuthorizedFireblocksTransfer(
        transfer,
        state.fireblocksEnabled,
      );

      await new Promise((resolve) => setTimeout(resolve, 1400));
      setPhase("created");
      await approveTransfer(transferId, {
        fireblocksTxId,
        fireblocksStatus,
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

  async function handleReject(transferId: string) {
    await rejectTransfer(transferId);
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
      <ConnectedWorkflowStepper />

      <main className="space-y-3 px-3 py-3">
        {phase !== "idle" ? <MpcCustodyBoundaryPanel compact /> : null}

        {!canApprove ? (
          <Card variant="accent">
            <p className="text-sm font-semibold text-ops-warning">
              Authorization restricted to Treasury Manager
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">
              Analyst role can initiate and review settlements only. Switch role to authorize custody
              release to Fireblocks infrastructure.
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
                          className="w-full"
                          disabled={busyId === transfer.id}
                          onClick={() => handleAuthorize(transfer.id)}
                        >
                          {busyId === transfer.id ? "Authorizing…" : "Authorize Settlement"}
                        </PrimaryButton>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <DangerButton className="w-full" onClick={() => handleReject(transfer.id)}>
                            Reject Settlement
                          </DangerButton>
                          <SecondaryButton className="w-full" onClick={() => handleEscalate(transfer.id)}>
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
