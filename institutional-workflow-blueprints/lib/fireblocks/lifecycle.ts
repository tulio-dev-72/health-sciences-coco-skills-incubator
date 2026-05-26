import type { TransferStatus } from "@/lib/types";

const TERMINAL_FIREBLOCKS = new Set(["COMPLETED", "FAILED", "REJECTED", "CANCELLED", "BLOCKED"]);

const IN_FLIGHT_FIREBLOCKS = new Set([
  "SUBMITTED",
  "PENDING_SIGNATURE",
  "PENDING_AUTHORIZATION",
  "QUEUED",
  "BROADCASTING",
  "CONFIRMING",
  "PENDING_3RD_PARTY",
  "PENDING_AML_SCREENING",
]);

export function normalizeFireblocksStatus(status: string): string {
  return status.trim().toUpperCase();
}

export function isTerminalFireblocksStatus(status: string): boolean {
  return TERMINAL_FIREBLOCKS.has(normalizeFireblocksStatus(status));
}

/** Map Fireblocks transaction status to settlement_requests lifecycle state. */
export function mapFireblocksToSettlementLifecycle(
  fireblocksStatus: string,
  currentSettlementStatus: TransferStatus,
): { settlementStatus: TransferStatus; fireblocksStatus: string } {
  const normalized = normalizeFireblocksStatus(fireblocksStatus);

  if (normalized === "COMPLETED") {
    return { settlementStatus: "SETTLED", fireblocksStatus: normalized };
  }

  if (TERMINAL_FIREBLOCKS.has(normalized) && normalized !== "COMPLETED") {
    return { settlementStatus: currentSettlementStatus, fireblocksStatus: normalized };
  }

  if (IN_FLIGHT_FIREBLOCKS.has(normalized)) {
    const settlementStatus =
      currentSettlementStatus === "PENDING_APPROVAL" ? "APPROVED" : currentSettlementStatus;
    return { settlementStatus, fireblocksStatus: normalized };
  }

  return { settlementStatus: currentSettlementStatus, fireblocksStatus: normalized };
}

export const WEBHOOK_LIFECYCLE_ORDER = [
  "PENDING_SIGNATURE",
  "CONFIRMING",
  "COMPLETED",
] as const;

export type WebhookLifecycleStatus = (typeof WEBHOOK_LIFECYCLE_ORDER)[number];

export const FIREBLOCKS_STATUS_LABELS: Record<string, string> = {
  PENDING_SIGNATURE: "Awaiting MPC signature",
  PENDING_AUTHORIZATION: "Awaiting authorization",
  CONFIRMING: "Confirming on settlement rail",
  COMPLETED: "Settlement complete",
  SUBMITTED: "Submitted to custody",
  BROADCASTING: "Broadcasting to network",
  FAILED: "Settlement failed",
  REJECTED: "Rejected by policy",
  CANCELLED: "Cancelled",
};

export const WEBHOOK_LIFECYCLE_STEPS: ReadonlyArray<{
  status: WebhookLifecycleStatus;
  label: string;
  description: string;
}> = [
  {
    status: "PENDING_SIGNATURE",
    label: "Awaiting MPC signature",
    description: "Fireblocks TAP policy and co-signer authorization in progress.",
  },
  {
    status: "CONFIRMING",
    label: "Confirming on settlement rail",
    description: "Sepolia testnet confirmation for USDC test asset release.",
  },
  {
    status: "COMPLETED",
    label: "Settlement complete",
    description: "Custody release finalized — audit record updated.",
  },
];

export function getFireblocksStatusLabel(status: string): string {
  const normalized = normalizeFireblocksStatus(status);
  return FIREBLOCKS_STATUS_LABELS[normalized] ?? normalized.replaceAll("_", " ").toLowerCase();
}

export function getWebhookLifecycleStepIndex(status: string): number {
  return WEBHOOK_LIFECYCLE_ORDER.indexOf(normalizeFireblocksStatus(status) as WebhookLifecycleStatus);
}
