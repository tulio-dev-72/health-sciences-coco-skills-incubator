"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuditTimeline } from "@/components/demo/audit-timeline";
import { FireblocksSettlementPanel } from "@/components/demo/fireblocks-settlement-panel";
import { PolicyEvaluationCard } from "@/components/demo/policy-evaluation-card";
import { SettlementReviewCard } from "@/components/demo/settlement-review-card";
import { WorkflowNextStep } from "@/components/demo/workflow-next-step";
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
import {
  PRIMARY_BLUEPRINT_ID,
  PRIMARY_SETTLEMENT,
  WEBHOOK_LIFECYCLE_STATUSES,
} from "@/data/primary-scenario";
import { submitFireblocksTransfer } from "@/lib/fireblocks/api-client";
import { formatCurrency } from "@/lib/format";
import { canApproveTransfers } from "@/lib/policy";
import { getRoleLabel, useAppStore } from "@/lib/store";
import type { WorkflowStepId } from "@/lib/workflow";

type InlineStep = Extract<WorkflowStepId, "create" | "policy" | "approval" | "audit">;
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

  const settlement = PRIMARY_SETTLEMENT;
  const transfer = state.transfers.find((item) => item.id === state.lastTransferId);
  const pending = state.transfers.filter((item) => item.status === "PENDING_APPROVAL");
  const canApprove = canApproveTransfers(effectiveRole);
  const activeTransfer = state.transfers.find((item) => item.id === activeTransferId);
  const displayRole = sessionReady ? effectiveRole : null;

  function handleSubmitSettlement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    setActiveBlueprint(PRIMARY_BLUEPRINT_ID);

    const result = createTransfer(
      {
        asset: settlement.asset,
        amount: settlement.amount,
        destination: settlement.counterpartyAddress,
        destinationLabel: settlement.counterparty,
        reason: settlement.reason,
        sourceVault: settlement.sourceVault,
        settlementRail: settlement.settlementRail,
        counterparty: settlement.counterparty,
      },
      { role: effectiveRole ?? "analyst" },
    );

    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    setWorkflowStep("policy");
    setStep("policy");
    setSubmitting(false);
  }

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
    setStep("audit");
  }

  async function handleAuthorize(transferId: string) {
    setAuthError(null);
    setBusyId(transferId);
    setActiveTransferId(transferId);
    setPhase("creating");

    const pendingTransfer = state.transfers.find((item) => item.id === transferId);
    if (!pendingTransfer) return;

    try {
      let fireblocksTxId: string = PRIMARY_SETTLEMENT.demoFireblocksTxId;

      if (state.fireblocksEnabled) {
        try {
          const result = await submitFireblocksTransfer({
            externalTxId: pendingTransfer.id,
            asset: pendingTransfer.asset,
            amount: pendingTransfer.amount,
            destination: pendingTransfer.destination,
            note: pendingTransfer.reason,
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
      setAuthError(
        authorizeError instanceof Error ? authorizeError.message : "Authorization failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleReject(transferId: string) {
    rejectTransfer(transferId);
    setWorkflowStep("audit");
    setStep("audit");
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
        <SecondaryButton type="button" onClick={onBack}>
          Back to modules
        </SecondaryButton>
      </div>

      <Card variant="ghost" className="border-ops-border-subtle bg-ops-overlay/30">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          Integration context
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ops-text-secondary">
          This sandbox models a real Fireblocks integration pattern. Workflow state is simulated
          unless Fireblocks sandbox credentials and webhook endpoint are enabled. Fireblocks remains
          the custody, signing, and settlement infrastructure.
        </p>
      </Card>

      <WorkflowStepper currentStep={step} />

      {step === "create" ? (
        <form onSubmit={handleSubmitSettlement} className="space-y-3">
          <Card variant="elevated">
            <SectionHeader
              label="Settlement request"
              title="Initiate Settlement"
              subtitle={`Available ${formatCurrency(state.vaultBalances[0]?.available ?? 0, settlement.asset)} in ${settlement.sourceVault}`}
            />
            <div className="space-y-4">
              <div>
                <InputLabel htmlFor="inline-asset">Asset</InputLabel>
                <TextInput id="inline-asset" value={settlement.asset} readOnly className="bg-ops-overlay/50" />
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
                  value={settlement.sourceVault}
                  readOnly
                  className="bg-ops-overlay/50"
                />
              </div>
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
                  value={settlement.settlementRail}
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
          {submitError ? (
            <Card variant="accent">
              <p className="text-xs text-ops-danger">{submitError}</p>
            </Card>
          ) : null}
          <PrimaryButton type="submit" className="w-full" disabled={submitting}>
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
              onContinue={() => {
                setWorkflowStep("approval");
                setStep("approval");
              }}
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
              webhookStatuses={webhookStatuses}
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
                            disabled={busyId === pendingTransfer.id}
                            onClick={() => handleAuthorize(pendingTransfer.id)}
                          >
                            {busyId === pendingTransfer.id
                              ? "Authorizing…"
                              : "Authorize Settlement"}
                          </PrimaryButton>
                          <div className="grid grid-cols-2 gap-2">
                            <DangerButton
                              type="button"
                              onClick={() => handleReject(pendingTransfer.id)}
                            >
                              Reject Settlement
                            </DangerButton>
                            <SecondaryButton
                              type="button"
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
                  : webhookStatuses.length > 0
                    ? webhookStatuses
                    : ["PENDING_SIGNATURE", "CONFIRMING", "COMPLETED"]
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
