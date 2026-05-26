import { normalizeFireblocksStatus } from "@/lib/fireblocks/lifecycle";
import type { Transfer } from "@/lib/types";

export const OPERATIONAL_LIFECYCLE_STAGES = [
  {
    id: "CREATED",
    label: "Created",
    description: "Settlement request captured in workflow orchestration.",
  },
  {
    id: "AUTHORIZATION_REQUIRED",
    label: "Authorization required",
    description: "Awaiting Treasury Manager release before custody boundary.",
  },
  {
    id: "PENDING_SIGNATURE",
    label: "Pending signature",
    description: "MPC custody layer orchestrating TAP policy and co-signer signing.",
  },
  {
    id: "CONFIRMING",
    label: "Confirming",
    description: "Settlement rail confirmation in progress on Ethereum Sepolia.",
  },
  {
    id: "COMPLETED",
    label: "Completed",
    description: "Custody release finalized — settlement recorded in audit trail.",
  },
] as const;

export type OperationalLifecycleStageId =
  (typeof OPERATIONAL_LIFECYCLE_STAGES)[number]["id"];

export function resolveTransferLifecycleStage(
  transfer: Transfer,
): OperationalLifecycleStageId {
  const fireblocksStatus = normalizeFireblocksStatus(transfer.fireblocksStatus ?? "");

  if (transfer.status === "SETTLED" || fireblocksStatus === "COMPLETED") {
    return "COMPLETED";
  }

  if (
    fireblocksStatus === "CONFIRMING" ||
    fireblocksStatus === "BROADCASTING" ||
    fireblocksStatus === "PENDING_3RD_PARTY"
  ) {
    return "CONFIRMING";
  }

  if (
    transfer.status === "APPROVED" ||
    fireblocksStatus === "PENDING_SIGNATURE" ||
    fireblocksStatus === "PENDING_AUTHORIZATION" ||
    fireblocksStatus === "SUBMITTED" ||
    fireblocksStatus === "QUEUED" ||
    Boolean(transfer.fireblocksTxId)
  ) {
    return "PENDING_SIGNATURE";
  }

  if (transfer.status === "PENDING_APPROVAL") {
    return "AUTHORIZATION_REQUIRED";
  }

  return "CREATED";
}

export function getLifecycleStageIndex(stage: OperationalLifecycleStageId): number {
  return OPERATIONAL_LIFECYCLE_STAGES.findIndex((item) => item.id === stage);
}

export function countTransfersByLifecycleStage(
  transfers: Transfer[],
): Record<OperationalLifecycleStageId, number> {
  const counts: Record<OperationalLifecycleStageId, number> = {
    CREATED: 0,
    AUTHORIZATION_REQUIRED: 0,
    PENDING_SIGNATURE: 0,
    CONFIRMING: 0,
    COMPLETED: 0,
  };

  for (const transfer of transfers) {
    if (transfer.status === "REJECTED") {
      continue;
    }
    const stage = resolveTransferLifecycleStage(transfer);
    counts[stage] += 1;
  }

  return counts;
}

export function selectFocusTransfer(
  transfers: Transfer[],
  lastTransferId: string | null,
): Transfer | null {
  if (lastTransferId) {
    const last = transfers.find((transfer) => transfer.id === lastTransferId);
    if (last && last.status !== "REJECTED") {
      return last;
    }
  }

  const inFlight = transfers.find(
    (transfer) =>
      transfer.status !== "REJECTED" &&
      transfer.status !== "SETTLED" &&
      resolveTransferLifecycleStage(transfer) !== "COMPLETED",
  );

  if (inFlight) {
    return inFlight;
  }

  return transfers.find((transfer) => transfer.status !== "REJECTED") ?? null;
}
