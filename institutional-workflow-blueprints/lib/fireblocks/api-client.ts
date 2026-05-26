import type {
  FireblocksDepositAddress,
  FireblocksStatus,
  FireblocksTransactionStatusResult,
  FireblocksTreasuryState,
  FireblocksVaultAccount,
  FireblocksVaultBalance,
} from "@/lib/fireblocks/types";
import { OFFLINE_FIREBLOCKS_STATUS, OFFLINE_TREASURY_STATE } from "@/lib/fireblocks/types";

export async function fetchFireblocksStatus(): Promise<FireblocksStatus> {
  try {
    const response = await fetch("/api/fireblocks/status", { cache: "no-store" });
    if (!response.ok) {
      return OFFLINE_FIREBLOCKS_STATUS;
    }
    return response.json();
  } catch {
    return OFFLINE_FIREBLOCKS_STATUS;
  }
}

export async function fetchFireblocksVaults(): Promise<FireblocksVaultBalance[]> {
  const response = await fetch("/api/fireblocks/vaults", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? "Unable to load Fireblocks vault balances.");
  }
  const data = await response.json();
  return data.vaults;
}

export async function fetchTreasuryMainVault(): Promise<FireblocksVaultAccount | null> {
  const response = await fetch("/api/fireblocks/treasury-main", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.vault ?? null;
}

export async function fetchTreasuryMainAssets(): Promise<{
  vaultId: string;
  vaultName: string;
  assets: Array<{
    assetId: string;
    symbol: string;
    type: string | null;
    total: number;
    available: number;
    pending: number;
    lockedAmount: number;
    pendingOut: number;
  }>;
} | null> {
  const response = await fetch("/api/fireblocks/treasury-main/assets", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function fetchTreasuryMainDepositAddress(
  assetId: string,
): Promise<FireblocksDepositAddress> {
  const response = await fetch(
    `/api/fireblocks/treasury-main/address?assetId=${encodeURIComponent(assetId)}`,
    { cache: "no-store" },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Unable to load deposit address from Fireblocks.");
  }
  return body;
}

export async function fetchFireblocksTreasuryState(): Promise<FireblocksTreasuryState> {
  const [status, assetsPayload] = await Promise.all([
    fetchFireblocksStatus(),
    fetchTreasuryMainAssets(),
  ]);

  if (status.integrationStatus !== "connected" || !assetsPayload) {
    return {
      ...OFFLINE_TREASURY_STATE,
      message: status.message,
      integrationStatus: status.integrationStatus,
    };
  }

  return {
    integrationStatus: "connected",
    message: status.message,
    configured: true,
    degradedMode: false,
    vault: {
      id: assetsPayload.vaultId,
      name: assetsPayload.vaultName,
      hiddenOnUI: false,
      assets: assetsPayload.assets.map((asset) => ({
        assetId: asset.assetId,
        total: asset.total,
        available: asset.available,
        pending: asset.pending,
        lockedAmount: asset.lockedAmount,
        pendingOut: asset.pendingOut,
      })),
    },
    assets: assetsPayload.assets.map((asset) => ({
      assetId: asset.assetId,
      total: asset.total,
      available: asset.available,
      pending: asset.pending,
      lockedAmount: asset.lockedAmount,
      pendingOut: asset.pendingOut,
    })),
  };
}

export async function submitFireblocksTransfer(input: {
  externalTxId: string;
  assetId: string;
  sourceVaultId: string;
  amount: number;
  destination: string;
  note: string;
}) {
  const response = await fetch("/api/fireblocks/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? body.message ?? "Fireblocks transaction submission failed.");
  }

  return body as { fireblocksTxId: string; status: string };
}

export async function fetchFireblocksTransactionStatus(
  fireblocksTxId: string,
): Promise<FireblocksTransactionStatusResult> {
  const response = await fetch(`/api/fireblocks/transactions/${encodeURIComponent(fireblocksTxId)}`, {
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Unable to load Fireblocks transaction status.");
  }

  return body as FireblocksTransactionStatusResult;
}

export async function fetchFireblocksTransferStatus(input: {
  externalTxId?: string;
  fireblocksTxId?: string;
}) {
  if (input.fireblocksTxId) {
    return fetchFireblocksTransactionStatus(input.fireblocksTxId);
  }

  const params = new URLSearchParams();
  if (input.externalTxId) params.set("externalTxId", input.externalTxId);

  const response = await fetch(`/api/fireblocks/transactions/status?${params.toString()}`, {
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Unable to load Fireblocks transaction status.");
  }

  return body as {
    source: "webhook_store" | "fireblocks_api";
    externalTxId: string;
    fireblocksTxId: string;
    status: string;
    subStatus?: string | null;
    updatedAt: string;
  };
}

export async function fetchFireblocksWebhookInfo() {
  const response = await fetch("/api/webhooks/fireblocks", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load webhook setup info.");
  }
  return response.json() as Promise<{
    endpoint: string;
    legacyEndpoint?: string;
    method: string;
    events: string[];
    setup: string;
  }>;
}

export async function fetchWebhookDeliveries(limit = 15) {
  const response = await fetch(`/api/workflow/webhook-deliveries?limit=${limit}`, {
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Unable to load webhook deliveries.");
  }
  return body as {
    endpoint: string;
    deliveries: Array<{
      id: string;
      external_id: string | null;
      fireblocks_tx_id: string | null;
      event_type: string;
      status: string;
      delivery_status: string;
      processing_error: string | null;
      created_at: string;
    }>;
    summary: {
      total: number;
      processed: number;
      failed: number;
      ignored: number;
    };
  };
}
