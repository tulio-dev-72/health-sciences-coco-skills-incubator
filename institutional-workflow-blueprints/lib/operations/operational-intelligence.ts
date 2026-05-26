import { SETTLEMENT_RAIL_SEPOLIA } from "@/lib/fireblocks/constants";
import { getFireblocksStatusLabel } from "@/lib/fireblocks/lifecycle";
import { evaluateTransferPolicy } from "@/lib/policy";
import type { AuditEvent, PolicySettings, Transfer } from "@/lib/types";

import {
  OPERATIONAL_LIFECYCLE_STAGES,
  resolveTransferLifecycleStage,
  selectFocusTransfer,
} from "./lifecycle-timeline";
import type {
  AuthorizationMetrics,
  OperationalRiskSnapshot,
  WebhookDeliverySummary,
} from "./metrics";

export type OperationalInsightCategory =
  | "summary"
  | "risk"
  | "governance"
  | "lifecycle";

export type OperationalInsight = {
  id: string;
  category: OperationalInsightCategory;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
};

export type OperationalIntelligenceInput = {
  transfers: Transfer[];
  auditLog: AuditEvent[];
  policy: PolicySettings;
  lastTransferId: string | null;
  fireblocksConnected: boolean;
  metrics: AuthorizationMetrics;
  risk: OperationalRiskSnapshot;
  webhookSummary: WebhookDeliverySummary | null;
};

const CATEGORY_LABELS: Record<OperationalInsightCategory, string> = {
  summary: "Operational summary",
  risk: "Risk explanation",
  governance: "Governance recommendation",
  lifecycle: "Lifecycle interpretation",
};

export function getOperationalInsightCategoryLabel(
  category: OperationalInsightCategory,
): string {
  return CATEGORY_LABELS[category];
}

export function generateOperationalIntelligence(
  input: OperationalIntelligenceInput,
): OperationalInsight[] {
  const insights: OperationalInsight[] = [];
  const focusTransfer = selectFocusTransfer(input.transfers, input.lastTransferId);
  const pending = input.transfers.filter((transfer) => transfer.status === "PENDING_APPROVAL");
  const inCustody = input.transfers.filter(
    (transfer) =>
      transfer.status === "APPROVED" ||
      (transfer.fireblocksTxId && transfer.status !== "SETTLED"),
  );
  const settled = input.transfers.filter((transfer) => transfer.status === "SETTLED");

  if (pending.length > 0) {
    insights.push({
      id: "summary-queue",
      category: "summary",
      title: "Authorization queue active",
      body: `${pending.length} settlement request${pending.length === 1 ? "" : "s"} await Treasury Manager release before crossing the MPC custody boundary.`,
      severity: pending.length >= 3 ? "warning" : "info",
    });
  } else if (inCustody.length > 0) {
    insights.push({
      id: "summary-custody",
      category: "summary",
      title: "Custody rail in progress",
      body: `${inCustody.length} settlement${inCustody.length === 1 ? "" : "s"} ${inCustody.length === 1 ? "is" : "are"} inside Fireblocks MPC custody — webhook and API polling drive lifecycle updates.`,
      severity: "info",
    });
  } else if (settled.length > 0) {
    insights.push({
      id: "summary-clear",
      category: "summary",
      title: "Queue cleared",
      body: `${settled.length} settlement${settled.length === 1 ? "" : "s"} completed in the current session with audit evidence preserved.`,
      severity: "info",
    });
  } else {
    insights.push({
      id: "summary-idle",
      category: "summary",
      title: "Operations idle",
      body: "No active settlement requests in workflow. Infrastructure readiness and policy posture remain visible for executive oversight.",
      severity: "info",
    });
  }

  if (input.risk.riskLevel === "high") {
    insights.push({
      id: "risk-high",
      category: "risk",
      title: "Elevated counterparty exposure",
      body: "One or more settlements carry high operational risk — typically a destination outside the approved allowlist. Authorization should not proceed without governance review.",
      severity: "critical",
    });
  } else if (input.risk.riskLevel === "medium") {
    insights.push({
      id: "risk-medium",
      category: "risk",
      title: "Threshold-driven authorization",
      body: `Policy trigger "${input.risk.policyTriggered}" applies to the active settlement profile. Manager authorization is required before custody release.`,
      severity: "warning",
    });
  } else {
    insights.push({
      id: "risk-low",
      category: "risk",
      title: "Policy posture within tolerance",
      body: "Active settlements align with allowlist and threshold rules. Residual risk is limited to infrastructure readiness and custody rail latency.",
      severity: "info",
    });
  }

  if (!input.fireblocksConnected) {
    insights.push({
      id: "governance-fireblocks",
      category: "governance",
      title: "Restore custody integration",
      body: "Fireblocks SDK is offline. Configure server-side credentials before authorizing settlements — workflow orchestration cannot substitute MPC custody.",
      severity: "critical",
    });
  } else if (input.risk.gasReadiness.includes("requires")) {
    insights.push({
      id: "governance-funding",
      category: "governance",
      title: "Fund Treasury Main before release",
      body: "Sepolia test ETH is required for gas and outbound settlement authorization. Use the Treasury Main funding utility before approving high-value releases.",
      severity: "warning",
    });
  } else if (input.metrics.webhookSuccessRate === "—") {
    insights.push({
      id: "governance-webhooks",
      category: "governance",
      title: "Validate webhook delivery path",
      body: "No webhook deliveries recorded yet. Confirm POST /api/webhooks/fireblocks is registered in Fireblocks Console so lifecycle events reach the audit trail.",
      severity: "warning",
    });
  } else if (input.webhookSummary && input.webhookSummary.failed > 0) {
    insights.push({
      id: "governance-webhook-failures",
      category: "governance",
      title: "Review webhook processing failures",
      body: `${input.webhookSummary.failed} webhook event${input.webhookSummary.failed === 1 ? "" : "s"} failed processing. Inspect delivery logs in Policy Admin before the next authorization batch.`,
      severity: "warning",
    });
  } else {
    insights.push({
      id: "governance-ready",
      category: "governance",
      title: "Infrastructure ready for authorization",
      body: "Fireblocks connectivity, Treasury Main funding, and webhook endpoint registration support governed settlement release on the Sepolia test rail.",
      severity: "info",
    });
  }

  if (focusTransfer) {
    const stage = resolveTransferLifecycleStage(focusTransfer);
    const stageMeta = OPERATIONAL_LIFECYCLE_STAGES.find((item) => item.id === stage);
    const policyEvaluation = evaluateTransferPolicy({
      amount: focusTransfer.amount,
      destination: focusTransfer.destination,
      policy: input.policy,
    });

    let lifecycleBody = `${focusTransfer.id} is at "${stageMeta?.label ?? stage}" — ${stageMeta?.description ?? "lifecycle in progress."}`;

    if (focusTransfer.fireblocksStatus) {
      lifecycleBody += ` Fireblocks reports ${getFireblocksStatusLabel(focusTransfer.fireblocksStatus)}.`;
    } else if (stage === "AUTHORIZATION_REQUIRED") {
      lifecycleBody += ` ${policyEvaluation.reasons[0] ?? "Manager authorization required before custody submission."}`;
    } else if (stage === "PENDING_SIGNATURE" && focusTransfer.fireblocksTxId) {
      lifecycleBody += " Transaction submitted — awaiting MPC co-signer completion.";
    }

    insights.push({
      id: "lifecycle-focus",
      category: "lifecycle",
      title: "Active settlement lifecycle",
      body: lifecycleBody,
      severity: stage === "COMPLETED" ? "info" : stage === "AUTHORIZATION_REQUIRED" ? "warning" : "info",
    });
  } else {
    insights.push({
      id: "lifecycle-idle",
      category: "lifecycle",
      title: "Settlement lifecycle reference",
      body: `When initiated, settlements progress CREATED → authorization → MPC signing → ${SETTLEMENT_RAIL_SEPOLIA} confirmation → completed audit record.`,
      severity: "info",
    });
  }

  return insights;
}
