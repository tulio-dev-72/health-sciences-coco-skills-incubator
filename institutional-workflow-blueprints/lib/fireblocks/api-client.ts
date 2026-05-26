import type { FireblocksStatus, FireblocksVaultBalance } from "@/lib/fireblocks/service";

export async function fetchFireblocksStatus(): Promise<FireblocksStatus> {
  const response = await fetch("/api/fireblocks/status", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load Fireblocks status.");
  }
  return response.json();
}

export async function fetchFireblocksVaults(): Promise<FireblocksVaultBalance[]> {
  const response = await fetch("/api/fireblocks/vaults", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Unable to load Fireblocks vault balances.");
  }
  const data = await response.json();
  return data.vaults;
}

export async function submitFireblocksTransfer(input: {
  externalTxId: string;
  asset: string;
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
    throw new Error(body.error ?? "Fireblocks transaction submission failed.");
  }

  return body as { fireblocksTxId: string; status: string };
}

export async function fetchFireblocksTransferStatus(input: {
  externalTxId?: string;
  fireblocksTxId?: string;
}) {
  const params = new URLSearchParams();
  if (input.externalTxId) params.set("externalTxId", input.externalTxId);
  if (input.fireblocksTxId) params.set("fireblocksTxId", input.fireblocksTxId);

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
  const response = await fetch("/api/fireblocks/webhook", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load webhook setup info.");
  }
  return response.json() as Promise<{
    endpoint: string;
    method: string;
    events: string[];
    setup: string;
  }>;
}
