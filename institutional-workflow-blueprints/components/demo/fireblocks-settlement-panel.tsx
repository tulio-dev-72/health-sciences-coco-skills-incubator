"use client";

import type { Transfer } from "@/lib/types";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { FireblocksStatusBadge } from "@/components/ui/badges";
import {
  WEBHOOK_LIFECYCLE_STEPS,
  getWebhookLifecycleStepIndex,
  normalizeFireblocksStatus,
} from "@/lib/fireblocks/lifecycle";

type FireblocksSettlementPanelProps = {
  transfer: Transfer;
  phase: "creating" | "created" | "webhook";
  webhookStatuses: string[];
};

type StepVisualState = "pending" | "active" | "complete";

function resolveStepState(
  stepStatus: string,
  webhookStatuses: string[],
): StepVisualState {
  if (webhookStatuses.length === 0) {
    return "pending";
  }

  const stepIndex = getWebhookLifecycleStepIndex(stepStatus);
  const highestIndex = webhookStatuses.reduce(
    (max, status) => Math.max(max, getWebhookLifecycleStepIndex(status)),
    -1,
  );

  if (stepIndex < highestIndex) {
    return "complete";
  }

  if (stepIndex === highestIndex) {
    const current = normalizeFireblocksStatus(webhookStatuses[webhookStatuses.length - 1] ?? "");
    if (current === "COMPLETED" && stepStatus === "COMPLETED") {
      return "complete";
    }
    return "active";
  }

  return "pending";
}

function WebhookLifecycleStepper({ webhookStatuses }: { webhookStatuses: string[] }) {
  return (
    <div className="space-y-0">
      {WEBHOOK_LIFECYCLE_STEPS.map((step, index) => {
        const visual = resolveStepState(step.status, webhookStatuses);
        const isLast = index === WEBHOOK_LIFECYCLE_STEPS.length - 1;

        return (
          <div key={step.status} className="relative flex gap-3">
            {!isLast ? (
              <div
                className={`absolute left-[11px] top-7 h-[calc(100%-0.25rem)] w-px ${
                  visual === "complete" ? "bg-ops-success/50" : "bg-ops-border"
                }`}
                aria-hidden
              />
            ) : null}
            <div
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                visual === "complete"
                  ? "border-ops-success bg-ops-success-muted text-ops-success"
                  : visual === "active"
                    ? "border-ops-info bg-ops-info-muted text-ops-info"
                    : "border-ops-border bg-ops-surface text-ops-text-dim"
              }`}
            >
              {visual === "complete" ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
                  <path
                    d="M2.5 6 5 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : visual === "active" ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden />
              ) : (
                <span className="text-[10px] font-bold">{index + 1}</span>
              )}
            </div>
            <div
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${
                visual === "active"
                  ? "border-ops-info/25 bg-ops-info-muted/50"
                  : visual === "complete"
                    ? "border-ops-success/20 bg-ops-success-muted/40"
                    : "border-ops-border bg-ops-overlay/50"
              } ${isLast ? "mb-0" : "mb-3"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-semibold text-ops-text">{step.label}</p>
                {visual !== "pending" ? <FireblocksStatusBadge status={step.status} /> : null}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ops-text-secondary">
                {step.description}
              </p>
              {visual === "active" ? (
                <p className="mt-2 text-[10px] font-medium text-ops-info">
                  Event received — processing…
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FireblocksSettlementPanel({
  transfer,
  phase,
  webhookStatuses,
}: FireblocksSettlementPanelProps) {
  if (phase === "creating") {
    return (
      <Card variant="elevated">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-5 w-5 animate-spin rounded-full border-2 border-ops-border border-t-ops-primary" />
          <div>
            <p className="text-sm font-semibold text-ops-text">
              Creating Fireblocks custody transaction
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">
              Crossing the MPC custody boundary — Fireblocks orchestrates signing and TAP policy
              enforcement before settlement rail release.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card variant="accent">
        <SectionHeader
          label="Custody boundary"
          title="Fireblocks MPC custody + signing"
          subtitle="Workflow orchestration stops here — MPC-secured custody and transaction signing remain inside Fireblocks."
        />
        <div className="mt-1 grid gap-2 rounded-lg border border-ops-border bg-ops-overlay/50 px-3 py-3 text-xs">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-medium text-ops-text-secondary">Transaction ID</span>
            <span className="break-all font-mono text-[11px] text-ops-text">
              {transfer.fireblocksTxId}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-medium text-ops-text-secondary">Vault account</span>
            <span className="text-ops-text">{transfer.sourceVault ?? "Treasury Main"}</span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-medium text-ops-text-secondary">Orchestration</span>
            <span className="font-mono text-[11px] text-ops-text">POST /v1/transactions</span>
          </div>
        </div>
      </Card>

      {phase === "webhook" ? (
        <Card variant="elevated">
          <SectionHeader
            label="Event-driven lifecycle"
            title="Webhook settlement progression"
            subtitle="Fireblocks webhook events drive custody status — each transition updates the operational audit trail."
          />
          <WebhookLifecycleStepper webhookStatuses={webhookStatuses} />
        </Card>
      ) : null}
    </div>
  );
}
