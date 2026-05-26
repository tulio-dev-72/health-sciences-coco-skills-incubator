"use client";

import type { Transfer } from "@/lib/types";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { FireblocksStatusBadge } from "@/components/ui/badges";
import {
  WEBHOOK_LIFECYCLE_STEPS,
  getStatusSourceLabel,
  normalizeFireblocksStatus,
  type SettlementLifecycleMode,
  type SettlementStatusSource,
} from "@/lib/fireblocks/lifecycle";

type FireblocksSettlementPanelProps = {
  transfer: Transfer;
  phase: "creating" | "created" | "webhook";
  webhookStatuses: string[];
  lifecycleMode?: SettlementLifecycleMode;
  statusSource?: SettlementStatusSource | null;
};

type StepVisualState = "pending" | "active" | "complete";

function resolveStepState(
  stepStatus: string,
  webhookStatuses: string[],
): StepVisualState {
  if (webhookStatuses.length === 0) {
    return "pending";
  }

  const normalizedStep = normalizeFireblocksStatus(stepStatus);
  const normalizedReceived = webhookStatuses.map(normalizeFireblocksStatus);
  const latest = normalizedReceived[normalizedReceived.length - 1];
  const stepIndex = normalizedReceived.indexOf(normalizedStep);

  if (stepIndex === -1) {
    return "pending";
  }

  if (normalizedStep === latest) {
    return normalizedStep === "COMPLETED" ? "complete" : "active";
  }

  return "complete";
}

function LifecycleModeBanner({
  lifecycleMode,
  statusSource,
}: {
  lifecycleMode: SettlementLifecycleMode;
  statusSource: SettlementStatusSource | null;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-ops-border bg-ops-surface px-3 py-2.5">
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          lifecycleMode === "live"
            ? "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/30"
            : "bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/30"
        }`}
      >
        {lifecycleMode === "live" ? "Live Fireblocks lifecycle" : "Simulated lifecycle"}
      </span>
      {statusSource ? (
        <span className="text-[11px] font-medium text-ops-text-secondary">
          Status source:{" "}
          <span className="text-ops-text">{getStatusSourceLabel(statusSource)}</span>
        </span>
      ) : null}
    </div>
  );
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
                  {normalizeFireblocksStatus(step.status) === "COMPLETED"
                    ? "Settlement confirmed on custody rail."
                    : "Awaiting Fireblocks status update…"}
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
  lifecycleMode = "live",
  statusSource = null,
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
            title="Settlement progression"
            subtitle={
              lifecycleMode === "live"
                ? "Status updates from Fireblocks webhooks and API polling — COMPLETED only when custody confirms."
                : "Demo Mode fallback — simulated custody progression without a live Fireblocks transaction."
            }
          />
          <LifecycleModeBanner lifecycleMode={lifecycleMode} statusSource={statusSource} />
          <WebhookLifecycleStepper webhookStatuses={webhookStatuses} />
        </Card>
      ) : null}
    </div>
  );
}
