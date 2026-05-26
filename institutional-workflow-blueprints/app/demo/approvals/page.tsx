"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthorizationDebugPanel } from "@/components/demo/authorization-debug-panel";
import { DemoTopBar } from "@/components/demo/top-bar";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { SettlementReviewCard } from "@/components/demo/settlement-review-card";
import { Card, DangerButton, PrimaryButton, SecondaryButton, SectionHeader } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT, WEBHOOK_LIFECYCLE_STATUSES } from "@/data/primary-scenario";
import {
  submitAuthorizedFireblocksTransfer,
  toAuthorizationFailure,
  type AuthorizedFireblocksTransferFailure,
} from "@/lib/fireblocks/authorize-transfer";
import {
  buildTransactionDebugInfo,
  dedupePendingTransfers,
  type FireblocksTransactionDebugInfo,
} from "@/lib/fireblocks/transaction-validation";
import { canApproveTransfers } from "@/lib/policy";
import { useAppStore } from "@/lib/store";

type SettlementPhase = "idle" | "creating" | "created" | "webhook";

const showDevDebugPanel =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

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
  const [failure, setFailure] = useState<AuthorizedFireblocksTransferFailure | null>(null);
  const [debugInfo, setDebugInfo] = useState<FireblocksTransactionDebugInfo | null>(null);
  const [escalatedId, setEscalatedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SettlementPhase>("idle");
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [webhookStatuses, setWebhookStatuses] = useState<string[]>([]);

  const pending = useMemo(
    () => dedupePendingTransfers(state.transfers),
    [state.transfers],
  );
  const canApprove = canApproveTransfers(effectiveRole);
  const activeTransfer = state.transfers.find((item) => item.id === activeTransferId);
  const previewDebug = useMemo(
    () => (pending[0] ? buildTransactionDebugInfo({ transfer: pending[0], treasury: null }) : null),
    [pending],
  );
  const visibleDebug = debugInfo ?? failure?.debug ?? previewDebug;

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
    setFailure(null);
    setBusyId(transferId);
    setActiveTransferId(transferId);
    setPhase("creating");
    setWorkflowStep("custody");

    const transfer = state.transfers.find((item) => item.id === transferId);
    if (!transfer) {
      setPhase("idle");
      setActiveTransferId(null);
      setBusyId(null);
      setError("Settlement request not found.");
      return;
    }

    try {
      const result = await submitAuthorizedFireblocksTransfer(transfer, state.fireblocksEnabled);
      setDebugInfo(result.debug);

      await new Promise((resolve) => setTimeout(resolve, 1400));
      setPhase("created");
      const approved = await approveTransfer(transferId, {
        fireblocksTxId: result.fireblocksTxId,
        fireblocksStatus: result.fireblocksStatus,
      });

      if (!approved) {
        throw new Error("Authorization state could not be saved. Settlement remains pending.");
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      await simulateWebhookLifecycle(transferId, result.fireblocksTxId);
    } catch (authorizeError) {
      const failureDetails = toAuthorizationFailure(authorizeError, transfer);
      setPhase("idle");
      setActiveTransferId(null);
      setWorkflowStep("approval");
      setFailure(failureDetails);
      setDebugInfo(failureDetails.debug);
      setError(failureDetails.message);
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
            <p className="text-sm font-semibold text-ops-danger">Authorization failed</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">{error}</p>
            {failure?.category ? (
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ops-text-dim">
                Failure category: {failure.category.replaceAll("_", " ")}
              </p>
            ) : null}
            <p className="mt-2 text-[11px] text-ops-text-secondary">
              Settlement remains in Pending Authorization. No duplicate custody request was created.
            </p>
          </Card>
        ) : null}

        {(showDevDebugPanel || failure) && visibleDebug ? (
          <AuthorizationDebugPanel
            debug={visibleDebug}
            apiResponse={failure?.apiResponse}
            rawError={failure?.raw ?? null}
          />
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
                          disabled={busyId !== null}
                          onClick={() => void handleAuthorize(transfer.id)}
                        >
                          {busyId === transfer.id ? "Authorizing…" : "Authorize Settlement"}
                        </PrimaryButton>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <DangerButton
                            className="w-full"
                            disabled={busyId !== null}
                            onClick={() => void handleReject(transfer.id)}
                          >
                            Reject Settlement
                          </DangerButton>
                          <SecondaryButton
                            className="w-full"
                            disabled={busyId !== null}
                            onClick={() => handleEscalate(transfer.id)}
                          >
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
