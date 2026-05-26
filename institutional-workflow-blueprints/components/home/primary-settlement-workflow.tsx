"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuditTimeline } from "@/components/demo/audit-timeline";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { PolicyEvaluationCard } from "@/components/demo/policy-evaluation-card";
import { SettlementReviewCard } from "@/components/demo/settlement-review-card";
import { WorkflowNextStep } from "@/components/demo/workflow-next-step";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { WorkflowStepper } from "@/components/demo/workflow-stepper";
import { PrototypeModeBadge } from "@/components/ui/badges";
import {
  Card,
  DangerButton,
  InputLabel,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  TextInput,
} from "@/components/ui/primitives";
import { PRIMARY_BLUEPRINT_ID, PRIMARY_SETTLEMENT, WEBHOOK_LIFECYCLE_STATUSES } from "@/data/primary-scenario";
import { FireblocksSettlementInfrastructure } from "@/components/demo/fireblocks-settlement-infrastructure";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { submitAuthorizedFireblocksTransfer } from "@/lib/fireblocks/authorize-transfer";
import {
  FUNDING_REQUIRED_BEFORE_AUTHORIZATION,
  SETTLEMENT_RAIL_SEPOLIA,
} from "@/lib/fireblocks/constants";
import { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import {
  simulateFireblocksWebhookEvent,
  useWebhookLifecycleSync,
} from "@/lib/fireblocks/use-webhook-lifecycle-sync";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import { formatCurrency } from "@/lib/format";
import { canApproveTransfers } from "@/lib/policy";
import { getRoleLabel, useAppStore } from "@/lib/store";
import type { WorkflowStepId } from "@/lib/workflow";

type InlineStep = WorkflowStepId;
type SettlementPhase = "idle" | "creating" | "created" | "webhook";

export function PrimarySettlementWorkflow({ onBack }: { onBack: () => void }) {
  const { isDemoMode } = useAuth();
  const {
    state,
    effectiveRole,
    sessionReady,
    setRole,
    setActiveBlueprint,
    setWorkflowStep,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    syncFireblocksTransferStatus,
  } = useAppStore();

  const [step, setStep] = useState<InlineStep>("create");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [escalatedId, setEscalatedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SettlementPhase>("idle");
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [webhookStatuses, setWebhookStatuses] = useState<string[]>([]);

  function goToStep(next: InlineStep) {
    setStep(next);
    setWorkflowStep(next);
  }

  const lifecycleExternalId = activeTransferId ?? state.lastTransferId;
  const { webhookStatuses: liveWebhookStatuses } = useWebhookLifecycleSync({
    externalId: lifecycleExternalId,
    enabled: phase === "webhook" && Boolean(lifecycleExternalId),
    onComplete: () => {
      goToStep("audit");
    },
  });

  const displayedWebhookStatuses =
    liveWebhookStatuses.length > 0 ? liveWebhookStatuses : webhookStatuses;

  const treasury = useFireblocksTreasury();
  const settlement = PRIMARY_SETTLEMENT;
  const transfer = state.transfers.find((item) => item.id === state.lastTransferId);
  const pending = state.transfers.filter((item) => item.status === "PENDING_APPROVAL");
  const canApprove = canApproveTransfers(effectiveRole);
  const activeTransfer = state.transfers.find((item) => item.id === activeTransferId);
  const displayRole = sessionReady ? effectiveRole : null;
  const connected =
    treasury.state.integrationStatus === "connected" && Boolean(treasury.state.vault);
  const ethAvailable =
    treasury.state.sepoliaEthAvailable ?? treasury.sepoliaEthAsset?.available ?? 0;
  const needsFunding =
    Boolean(connected) && (treasury.state.fundingStatus === "needs_funding" || ethAvailable <= 0);
  const settlementRail = treasury.state.settlementRail || SETTLEMENT_RAIL_SEPOLIA;

  async function handleSubmitSettlement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (needsFunding) {
      setSubmitError(FUNDING_REQUIRED_BEFORE_AUTHORIZATION);
      return;
    }

    setSubmitting(true);
    setActiveBlueprint(PRIMARY_BLUEPRINT_ID);

    const settlementAsset =
      connected && treasury.selectedAsset ? treasury.selectedAsset.assetId : settlement.asset;

    const result = await createTransfer(
      {
        asset: settlementAsset,
        amount: settlement.amount,
        destination: settlement.counterpartyAddress,
        destinationLabel: settlement.counterparty,
        reason: settlement.reason,
        sourceVaultId: treasury.state.vault?.id,
        sourceVault: treasury.state.vault?.name ?? settlement.sourceVault,
        settlementRail,
        counterparty: settlement.counterparty,
      },
      { role: effectiveRole ?? "analyst" },
    );

    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    goToStep("policy");
    setSubmitting(false);
  }

  async function simulateWebhookLifecycle(transferId: string, fireblocksTxId: string) {
    setPhase("webhook");
    goToStep("webhook");
    setWebhookStatuses([]);

    for (const status of WEBHOOK_LIFECYCLE_STATUSES) {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (isSupabasePersistenceEnabled()) {
        await simulateFireblocksWebhookEvent({
          externalTxId: transferId,
          fireblocksTxId,
          status,
        });
      } else {
        setWebhookStatuses((current) => [...current, status]);
        await syncFireblocksTransferStatus({
          externalTxId: transferId,
          fireblocksTxId,
          status,
        });
      }
    }

    if (!isSupabasePersistenceEnabled()) {
      goToStep("audit");
    }
  }

  async function handleAuthorize(transferId: string) {
    setAuthError(null);
    setBusyId(transferId);
    setActiveTransferId(transferId);
    setPhase("creating");
    goToStep("custody");

    const pendingTransfer = state.transfers.find((item) => item.id === transferId);
    if (!pendingTransfer) return;

    try {
      const { fireblocksTxId, fireblocksStatus } = await submitAuthorizedFireblocksTransfer(
        pendingTransfer,
        state.fireblocksEnabled,
      );

      await new Promise((resolve) => setTimeout(resolve, 1400));
      setPhase("created");
      goToStep("custody");
      await approveTransfer(transferId, {
        fireblocksTxId,
        fireblocksStatus,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      await simulateWebhookLifecycle(transferId, fireblocksTxId);
    } catch (authorizeError) {
      setPhase("idle");
      setAuthError(
        authorizeError instanceof Error ? authorizeError.message : "Authorization failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(transferId: string) {
    await rejectTransfer(transferId);
    goToStep("audit");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
              Primary operational scenario
            </p>
            <PrototypeModeBadge />
          </div>
          <h2 className="mt-1 text-base font-semibold text-ops-text">
            High-value USDC settlement authorization
          </h2>
          {displayRole ? (
            <p className="mt-1 text-[11px] text-ops-text-secondary">
              Active role:{" "}
              <span className="font-medium text-ops-text">{getRoleLabel(displayRole)}</span>
            </p>
          ) : null}
        </div>
        <SecondaryButton type="button" className="w-full sm:w-auto" onClick={onBack}>
          Back to modules
        </SecondaryButton>
      </div>

      <Card variant="ghost" className="border-ops-border-subtle bg-ops-overlay/30">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          Integration context
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ops-text-secondary">
          {treasury.sandboxNotice} Workflow state is simulated unless Fireblocks sandbox
          credentials and webhook endpoint are enabled. Fireblocks remains the custody, signing,
          and settlement infrastructure.
        </p>
      </Card>

      <WorkflowStepper currentStep={step} />

      {(step === "custody" || step === "webhook" || phase !== "idle") && phase !== "idle" ? (
        <MpcCustodyBoundaryPanel compact />
      ) : null}

      {step === "create" ? (
        <form onSubmit={handleSubmitSettlement} className="space-y-3">
          <FireblocksSettlementInfrastructure treasury={treasury} amount={settlement.amount} />
          <Card variant="elevated">
            <SectionHeader
              label="Settlement request"
              title="Initiate Settlement"
              subtitle={
                connected && treasury.selectedAsset
                  ? `Available ${formatCurrency(treasury.selectedAsset.available, treasury.selectedAsset.assetId)} in ${treasury.state.vault?.name ?? settlement.sourceVault}`
                  : "Connect Fireblocks to load Treasury Main balances from the SDK."
              }
            />
            <div className="space-y-4">
              <div>
                <InputLabel htmlFor="inline-asset">Asset (Fireblocks assetId)</InputLabel>
                <TextInput
                  id="inline-asset"
                  value={
                    treasury.selectedAsset?.assetId ??
                    settlement.asset
                  }
                  readOnly
                  className="bg-ops-overlay/50 font-mono text-[11px]"
                />
              </div>
              <div>
                <InputLabel htmlFor="inline-amount">Amount</InputLabel>
                <TextInput
                  id="inline-amount"
                  value={formatCurrency(settlement.amount, settlement.asset)}
                  readOnly
                  className="bg-ops-overlay/50 font-semibold tabular-nums"
                />
              </div>
              <div>
                <InputLabel htmlFor="inline-vault">Source Vault</InputLabel>
                <TextInput
                  id="inline-vault"
                  value={treasury.state.vault?.name ?? settlement.sourceVault}
                  readOnly
                  className="bg-ops-overlay/50"
                />
              </div>
              {treasury.state.vault ? (
                <div>
                  <InputLabel htmlFor="inline-vault-id">Vault ID</InputLabel>
                  <TextInput
                    id="inline-vault-id"
                    value={treasury.state.vault.id}
                    readOnly
                    className="bg-ops-overlay/50 font-mono text-[11px]"
                  />
                </div>
              ) : null}
              <div>
                <InputLabel htmlFor="inline-counterparty">Counterparty</InputLabel>
                <TextInput
                  id="inline-counterparty"
                  value={settlement.counterparty}
                  readOnly
                  className="bg-ops-overlay/50"
                />
              </div>
              <div>
                <InputLabel htmlFor="inline-rail">Settlement Rail</InputLabel>
                <TextInput
                  id="inline-rail"
                  value={settlementRail}
                  readOnly
                  className="bg-ops-overlay/50"
                />
              </div>
              <div>
                <InputLabel htmlFor="inline-reason">Reason</InputLabel>
                <TextInput id="inline-reason" value={settlement.reason} readOnly className="bg-ops-overlay/50" />
              </div>
            </div>
          </Card>
          {needsFunding ? (
            <Card variant="accent">
              <p className="text-xs text-ops-warning">{FUNDING_REQUIRED_BEFORE_AUTHORIZATION}</p>
            </Card>
          ) : null}
          {submitError ? (
            <Card variant="accent">
              <p className="text-xs text-ops-danger">{submitError}</p>
            </Card>
          ) : null}
          <PrimaryButton type="submit" className="w-full" disabled={submitting || needsFunding}>
            {submitting ? "Evaluating policy…" : "Submit Settlement"}
          </PrimaryButton>
        </form>
      ) : null}

      {step === "policy" && transfer ? (
        <div className="space-y-3">
          <PolicyEvaluationCard transfer={transfer} />
          {transfer.requiresApproval ? (
            <WorkflowNextStep
              title="Route to authorization queue"
              description="Treasury Manager must authorize before Fireblocks custody release."
              nextStep="approval"
              nextLabel="Open authorization queue"
              onContinue={() => goToStep("approval")}
            />
          ) : null}
        </div>
      ) : null}

      {step === "approval" ? (
        <div className="space-y-3">
          {!canApprove ? (
            <Card variant="accent">
              <p className="text-xs font-medium text-ops-warning">
                Analyst role cannot authorize settlements.
              </p>
              <p className="mt-1 text-[11px] text-ops-text-secondary">
                {isDemoMode
                  ? "Switch to Treasury Manager to release authorized settlements to Fireblocks."
                  : "Authorization requires a Treasury Manager account. Sign in with the appropriate role."}
              </p>
              {isDemoMode ? (
                <PrimaryButton
                  type="button"
                  className="mt-3 w-full"
                  onClick={() => setRole("treasury_manager")}
                >
                  Continue as Treasury Manager
                </PrimaryButton>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Sign in as Treasury Manager
                </Link>
              )}
            </Card>
          ) : null}

          {authError ? (
            <Card variant="accent">
              <p className="text-xs text-ops-danger">{authError}</p>
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
              webhookStatuses={displayedWebhookStatuses}
            />
          ) : (
            <>
              <SectionHeader
                label="Authorization"
                title="Authorization Queue"
                subtitle={`${pending.length} settlement(s) pending treasury manager review.`}
              />
              {pending.length === 0 ? (
                <Card variant="ghost">
                  <p className="text-xs text-ops-text-secondary">Authorization queue is empty.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pending.map((pendingTransfer) => (
                    <div key={pendingTransfer.id} className="space-y-2">
                      <SettlementReviewCard transfer={pendingTransfer} />
                      {escalatedId === pendingTransfer.id ? (
                        <Card variant="ghost">
                          <p className="text-xs text-ops-warning">
                            Escalated to senior treasury review — awaiting additional sign-off.
                          </p>
                        </Card>
                      ) : null}
                      {canApprove ? (
                        <div className="grid gap-2">
                          <PrimaryButton
                            type="button"
                            className="w-full"
                            disabled={busyId === pendingTransfer.id}
                            onClick={() => handleAuthorize(pendingTransfer.id)}
                          >
                            {busyId === pendingTransfer.id
                              ? "Authorizing…"
                              : "Authorize Settlement"}
                          </PrimaryButton>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <DangerButton
                              type="button"
                              className="w-full"
                              onClick={() => handleReject(pendingTransfer.id)}
                            >
                              Reject Settlement
                            </DangerButton>
                            <SecondaryButton
                              type="button"
                              className="w-full"
                              onClick={() => setEscalatedId(pendingTransfer.id)}
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
        </div>
      ) : null}

      {step === "audit" ? (
        <div className="space-y-3">
          {state.policySummary ? (
            <Card variant="accent">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
                Session result
              </p>
              <p className="mt-1 text-xs text-ops-text-secondary">{state.policySummary}</p>
            </Card>
          ) : null}
          <SectionHeader
            label="Compliance"
            title="Operational audit timeline"
            subtitle="Chronological record of settlement governance and infrastructure events."
          />
          <Card variant="elevated">
            <AuditTimeline events={state.auditLog} />
          </Card>
          {transfer?.fireblocksTxId ? (
            <FireblocksSettlementPanel
              transfer={transfer}
              phase="webhook"
              webhookStatuses={
                transfer.fireblocksStatus === "COMPLETED"
                  ? [...WEBHOOK_LIFECYCLE_STATUSES]
                  : displayedWebhookStatuses.length > 0
                    ? displayedWebhookStatuses
                    : ["PENDING_SIGNATURE", "CONFIRMING", "COMPLETED"]
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
