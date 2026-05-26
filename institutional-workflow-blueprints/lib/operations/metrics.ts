import { AUDIT_ACTIONS } from "@/lib/audit";
import { SETTLEMENT_RAIL_SEPOLIA } from "@/lib/fireblocks/constants";
import type { FireblocksTreasuryState } from "@/lib/fireblocks/types";
import { evaluateTransferPolicy, getSettlementEvaluation } from "@/lib/policy";
import type { AuditEvent, PolicySettings, RiskLevel, Transfer } from "@/lib/types";

import {
  resolveTransferLifecycleStage,
  selectFocusTransfer,
  type OperationalLifecycleStageId,
} from "./lifecycle-timeline";

const AUTHORIZATION_ACTIONS = new Set<string>([
  AUDIT_ACTIONS.managerAuthorized,
  AUDIT_ACTIONS.transactionAuthorized,
]);

export type AuthorizationMetrics = {
  pendingAuthorizations: number;
  averageApprovalTime: string;
  highRiskSettlements: number;
  webhookSuccessRate: string;
};

export type OperationalRiskSnapshot = {
  riskLevel: RiskLevel;
  policyTriggered: string;
  counterpartyStatus: string;
  gasReadiness: string;
  settlementRailHealth: string;
  focusTransferId: string | null;
};

export type WebhookDeliverySummary = {
  total: number;
  processed: number;
  failed: number;
  ignored: number;
};

function formatDuration(ms: number): string {
  if (ms < 60_000) {
    return `${Math.round(ms / 1000)}s`;
  }

  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function computeAverageApprovalTime(
  transfers: Transfer[],
  auditLog: AuditEvent[],
): string {
  const durations: number[] = [];

  for (const transfer of transfers) {
    const authorizationEvent = auditLog.find(
      (event) =>
        AUTHORIZATION_ACTIONS.has(event.action) && event.details.includes(transfer.id),
    );

    if (!authorizationEvent) {
      continue;
    }

    const createdAt = new Date(transfer.createdAt).getTime();
    const authorizedAt = new Date(authorizationEvent.timestamp).getTime();

    if (Number.isFinite(createdAt) && Number.isFinite(authorizedAt) && authorizedAt >= createdAt) {
      durations.push(authorizedAt - createdAt);
    }
  }

  if (durations.length === 0) {
    return "—";
  }

  const averageMs = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return formatDuration(averageMs);
}

export function computeWebhookSuccessRate(summary: WebhookDeliverySummary | null): string {
  if (!summary || summary.total === 0) {
    return "—";
  }

  const rate = (summary.processed / summary.total) * 100;
  return `${Math.round(rate)}%`;
}

export function computeAuthorizationMetrics(input: {
  transfers: Transfer[];
  auditLog: AuditEvent[];
  webhookSummary: WebhookDeliverySummary | null;
}): AuthorizationMetrics {
  const pendingAuthorizations = input.transfers.filter(
    (transfer) => transfer.status === "PENDING_APPROVAL",
  ).length;

  const highRiskSettlements = input.transfers.filter(
    (transfer) =>
      transfer.riskLevel === "high" &&
      transfer.status !== "REJECTED" &&
      transfer.status !== "SETTLED",
  ).length;

  return {
    pendingAuthorizations,
    averageApprovalTime: computeAverageApprovalTime(input.transfers, input.auditLog),
    highRiskSettlements,
    webhookSuccessRate: computeWebhookSuccessRate(input.webhookSummary),
  };
}

function resolveHighestRiskLevel(transfers: Transfer[]): RiskLevel {
  if (transfers.some((transfer) => transfer.riskLevel === "high")) {
    return "high";
  }
  if (transfers.some((transfer) => transfer.riskLevel === "medium")) {
    return "medium";
  }
  return "low";
}

export function computeOperationalRiskSnapshot(input: {
  transfers: Transfer[];
  policy: PolicySettings;
  treasury: FireblocksTreasuryState;
  lastTransferId: string | null;
}): OperationalRiskSnapshot {
  const focusTransfer = selectFocusTransfer(input.transfers, input.lastTransferId);
  const pendingOrActive = input.transfers.filter(
    (transfer) => transfer.status !== "REJECTED" && transfer.status !== "SETTLED",
  );

  const riskCandidates = pendingOrActive.length > 0 ? pendingOrActive : input.transfers;
  const riskLevel = resolveHighestRiskLevel(riskCandidates);

  const evaluation = focusTransfer
    ? getSettlementEvaluation(focusTransfer, input.policy)
    : null;

  const policyEvaluation = focusTransfer
    ? evaluateTransferPolicy({
        amount: focusTransfer.amount,
        destination: focusTransfer.destination,
        policy: input.policy,
      })
    : null;

  const ethAvailable = input.treasury.sepoliaEthAvailable;
  const gasReady =
    input.treasury.integrationStatus === "connected" &&
    ethAvailable !== null &&
    ethAvailable > 0;

  const railHealthy =
    input.treasury.integrationStatus === "connected" &&
    gasReady &&
    (input.treasury.fundingStatus === "ready" || (ethAvailable ?? 0) > 0);

  return {
    riskLevel,
    policyTriggered:
      evaluation?.policyTrigger ??
      policyEvaluation?.policyTrigger ??
      (riskLevel === "high" ? "Destination allowlist" : "Within policy thresholds"),
    counterpartyStatus: evaluation?.counterpartyStatus ?? "No active settlement",
    gasReadiness: gasReady
      ? `${ethAvailable?.toFixed(4) ?? "0"} Sepolia ETH available`
      : input.treasury.integrationStatus === "connected"
        ? "Treasury Main requires Sepolia test ETH"
        : "Fireblocks offline — gas readiness unknown",
    settlementRailHealth: railHealthy
      ? `${SETTLEMENT_RAIL_SEPOLIA} rail operational`
      : input.treasury.integrationStatus === "connected"
        ? `${SETTLEMENT_RAIL_SEPOLIA} rail degraded — funding or gas gap`
        : "Settlement rail unavailable — custody integration offline",
    focusTransferId: focusTransfer?.id ?? null,
  };
}

export function getActiveLifecycleStage(
  transfers: Transfer[],
  lastTransferId: string | null,
): OperationalLifecycleStageId | null {
  const focusTransfer = selectFocusTransfer(transfers, lastTransferId);
  return focusTransfer ? resolveTransferLifecycleStage(focusTransfer) : null;
}
