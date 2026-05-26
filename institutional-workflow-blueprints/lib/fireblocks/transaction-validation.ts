import type { FireblocksTreasuryState } from "@/lib/fireblocks/types";
import type { Transfer } from "@/lib/types";

export type FireblocksTransactionFailureCategory =
  | "missing_balance"
  | "missing_destination"
  | "invalid_asset"
  | "invalid_vault"
  | "invalid_amount"
  | "duplicate_external_tx_id"
  | "credentials"
  | "unknown";

export type FireblocksTransactionDebugInfo = {
  sourceVaultId: string | null;
  assetId: string | null;
  amount: number;
  destinationType: "one_time_address";
  destinationAddress: string | null;
  externalTxId: string;
  transferAsset: string;
  availableBalance: number | null;
  vaultName: string | null;
};

export type FireblocksTransactionPayload = {
  externalTxId: string;
  assetId: string;
  sourceVaultId: string;
  amount: number;
  destination: string;
  note: string;
};

export type FireblocksValidationResult =
  | { ok: true; payload: FireblocksTransactionPayload; debug: FireblocksTransactionDebugInfo }
  | {
      ok: false;
      category: FireblocksTransactionFailureCategory;
      message: string;
      debug: FireblocksTransactionDebugInfo;
    };

const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export const VAULT_FUNDING_ERROR =
  "Fireblocks transaction could not be created because the vault is not funded or destination is missing.";

export function dedupeTransfersById<T extends { id: string; status: string; updatedAt: string }>(
  transfers: T[],
): T[] {
  const statusPriority: Record<string, number> = {
    PENDING_APPROVAL: 5,
    APPROVED: 4,
    CREATED: 3,
    SETTLED: 2,
    REJECTED: 1,
  };

  const byId = new Map<string, T>();
  for (const transfer of transfers) {
    const existing = byId.get(transfer.id);
    if (!existing) {
      byId.set(transfer.id, transfer);
      continue;
    }

    const existingPriority = statusPriority[existing.status] ?? 0;
    const nextPriority = statusPriority[transfer.status] ?? 0;
    if (
      nextPriority > existingPriority ||
      (nextPriority === existingPriority && transfer.updatedAt > existing.updatedAt)
    ) {
      byId.set(transfer.id, transfer);
    }
  }

  return [...byId.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function dedupePendingTransfers(transfers: Transfer[]): Transfer[] {
  return dedupeTransfersById(transfers).filter((transfer) => transfer.status === "PENDING_APPROVAL");
}

function resolveAssetId(transfer: Transfer, treasury: FireblocksTreasuryState): string | null {
  const exact = treasury.assets.find((asset) => asset.assetId === transfer.asset)?.assetId;
  if (exact) {
    return exact;
  }

  const normalized = transfer.asset.toUpperCase();
  const partial = treasury.assets.find(
    (asset) =>
      asset.assetId.toUpperCase().includes(normalized) ||
      normalized.includes(asset.assetId.toUpperCase()),
  )?.assetId;

  return partial ?? treasury.assets[0]?.assetId ?? null;
}

export function buildTransactionDebugInfo(input: {
  transfer: Transfer;
  treasury: FireblocksTreasuryState | null;
  assetId?: string | null;
}): FireblocksTransactionDebugInfo {
  const assetId = input.assetId ?? (input.treasury ? resolveAssetId(input.transfer, input.treasury) : null);
  const matchedAsset = input.treasury?.assets.find((asset) => asset.assetId === assetId) ?? null;

  return {
    sourceVaultId: input.treasury?.vault?.id ?? null,
    assetId: assetId ?? null,
    amount: input.transfer.amount,
    destinationType: "one_time_address",
    destinationAddress: input.transfer.destination?.trim() || null,
    externalTxId: input.transfer.id,
    transferAsset: input.transfer.asset,
    availableBalance: matchedAsset?.available ?? null,
    vaultName: input.treasury?.vault?.name ?? input.transfer.sourceVault ?? null,
  };
}

export function validateFireblocksTransaction(input: {
  transfer: Transfer;
  treasury: FireblocksTreasuryState;
  externalTxIdAlreadyUsed?: boolean;
}): FireblocksValidationResult {
  const { transfer, treasury } = input;
  const assetId = resolveAssetId(transfer, treasury);
  const debug = buildTransactionDebugInfo({ transfer, treasury, assetId });

  if (!treasury.vault?.id) {
    return {
      ok: false,
      category: "invalid_vault",
      message: "Treasury Main vault was not found in Fireblocks. Confirm vault discovery is configured.",
      debug,
    };
  }

  if (!assetId) {
    return {
      ok: false,
      category: "invalid_asset",
      message: `Asset "${transfer.asset}" is not activated in Treasury Main. Activate the sandbox asset in Fireblocks first.`,
      debug,
    };
  }

  if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) {
    return {
      ok: false,
      category: "invalid_amount",
      message: "Settlement amount must be greater than zero.",
      debug,
    };
  }

  const destination = transfer.destination?.trim() ?? "";
  if (!destination) {
    return {
      ok: false,
      category: "missing_destination",
      message: VAULT_FUNDING_ERROR,
      debug,
    };
  }

  if (!ETH_ADDRESS.test(destination)) {
    return {
      ok: false,
      category: "missing_destination",
      message:
        "Destination address is missing or invalid. Provide a valid Ethereum counterparty address before authorization.",
      debug,
    };
  }

  const matchedAsset = treasury.assets.find((asset) => asset.assetId === assetId);
  if (!matchedAsset || matchedAsset.available <= 0 || matchedAsset.available < transfer.amount) {
    return {
      ok: false,
      category: "missing_balance",
      message: VAULT_FUNDING_ERROR,
      debug: {
        ...debug,
        availableBalance: matchedAsset?.available ?? 0,
      },
    };
  }

  if (input.externalTxIdAlreadyUsed) {
    return {
      ok: false,
      category: "duplicate_external_tx_id",
      message: `Settlement ${transfer.id} already has a Fireblocks transaction record. Retry with the existing custody transaction instead of creating a duplicate.`,
      debug,
    };
  }

  return {
    ok: true,
    payload: {
      externalTxId: transfer.id,
      assetId,
      sourceVaultId: treasury.vault.id,
      amount: transfer.amount,
      destination,
      note: transfer.reason,
    },
    debug,
  };
}

export function classifyFireblocksApiError(error: unknown): {
  category: FireblocksTransactionFailureCategory;
  message: string;
  raw: string;
} {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const normalized = raw.toLowerCase();

  if (
    normalized.includes("private key") ||
    normalized.includes("api key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("credentials")
  ) {
    return {
      category: "credentials",
      message:
        "Fireblocks SDK credentials are missing or invalid. Verify FIREBLOCKS_API_KEY and FIREBLOCKS_PRIVATE_KEY in server environment.",
      raw,
    };
  }

  if (
    normalized.includes("insufficient") ||
    normalized.includes("not enough") ||
    normalized.includes("balance") ||
    normalized.includes("funds")
  ) {
    return {
      category: "missing_balance",
      message: VAULT_FUNDING_ERROR,
      raw,
    };
  }

  if (
    normalized.includes("destination") ||
    normalized.includes("address") ||
    normalized.includes("one time") ||
    normalized.includes("one-time")
  ) {
    return {
      category: "missing_destination",
      message: VAULT_FUNDING_ERROR,
      raw,
    };
  }

  if (normalized.includes("asset") && (normalized.includes("not found") || normalized.includes("invalid"))) {
    return {
      category: "invalid_asset",
      message: `Fireblocks rejected the asset ID. Confirm the sandbox asset is activated in Treasury Main.`,
      raw,
    };
  }

  if (normalized.includes("vault") && (normalized.includes("not found") || normalized.includes("invalid"))) {
    return {
      category: "invalid_vault",
      message: "Fireblocks rejected the source vault ID. Confirm Treasury Main vault discovery.",
      raw,
    };
  }

  if (normalized.includes("externaltxid") || normalized.includes("external tx") || normalized.includes("idempotency")) {
    return {
      category: "duplicate_external_tx_id",
      message: "Fireblocks rejected the request because externalTxId is already in use.",
      raw,
    };
  }

  return {
    category: "unknown",
    message: raw || "Fireblocks transaction submission failed.",
    raw,
  };
}

export class FireblocksSubmitError extends Error {
  category: FireblocksTransactionFailureCategory;
  debug?: FireblocksTransactionDebugInfo;
  raw?: string;
  apiResponse?: unknown;

  constructor(input: {
    message: string;
    category: FireblocksTransactionFailureCategory;
    debug?: FireblocksTransactionDebugInfo;
    raw?: string;
    apiResponse?: unknown;
  }) {
    super(input.message);
    this.name = "FireblocksSubmitError";
    this.category = input.category;
    this.debug = input.debug;
    this.raw = input.raw;
    this.apiResponse = input.apiResponse;
  }
}
