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
