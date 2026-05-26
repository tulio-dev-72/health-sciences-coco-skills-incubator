import { TransferPeerPathType } from "@fireblocks/ts-sdk";
import {
  getFireblocksConfig,
  isFireblocksConfigured,
  resolveFireblocksAssetId,
} from "@/lib/fireblocks/config";
import { getFireblocksClient } from "@/lib/fireblocks/client";

export type FireblocksStatus = {
  configured: boolean;
  basePath: string | null;
  sourceVaultId: string | null;
  security: string[];
};

export type FireblocksVaultBalance = {
  vaultId: string;
  vaultName: string;
  asset: string;
  total: number;
  available: number;
};

export type FireblocksSubmitInput = {
  externalTxId: string;
  asset: string;
  amount: number;
  destination: string;
  note: string;
};

export type FireblocksSubmitResult = {
  fireblocksTxId: string;
  status: string;
};

export function getFireblocksStatus(): FireblocksStatus {
  const config = getFireblocksConfig();

  return {
    configured: isFireblocksConfigured(),
    basePath: config?.basePath ?? null,
    sourceVaultId: config?.sourceVaultId ?? null,
    security: [
      "API credentials are loaded from server environment variables only.",
      "Private keys never reach the browser or React state.",
      "Transactions use externalTxId for idempotency.",
      "Fireblocks TAP and co-signer policies apply on platform settlement.",
      "Use Sandbox API keys until production approval workflows are validated.",
    ],
  };
}

export async function fetchFireblocksVaultBalances(): Promise<FireblocksVaultBalance[]> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.vaults.getPagedVaultAccounts({ limit: 50 });
  const accounts = response.data.accounts ?? [];

  return accounts.flatMap((account) =>
    (account.assets ?? []).map((asset) => ({
      vaultId: String(account.id ?? ""),
      vaultName: account.name ?? `Vault ${account.id}`,
      asset: asset.id ?? "UNKNOWN",
      total: Number(asset.total ?? 0),
      available: Number(asset.available ?? 0),
    })),
  );
}

export async function submitFireblocksTransaction(
  input: FireblocksSubmitInput,
): Promise<FireblocksSubmitResult> {
  const config = getFireblocksConfig();
  if (!config) {
    throw new Error("Fireblocks is not configured.");
  }

  const assetId = resolveFireblocksAssetId(input.asset);
  if (!assetId) {
    throw new Error(`Unsupported asset for Fireblocks: ${input.asset}`);
  }

  const fireblocks = getFireblocksClient();
  const response = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      assetId,
      amount: String(input.amount),
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: config.sourceVaultId,
      },
      destination: {
        type: TransferPeerPathType.OneTimeAddress,
        oneTimeAddress: {
          address: input.destination,
        },
      },
      note: input.note,
      externalTxId: input.externalTxId,
    },
    idempotencyKey: input.externalTxId,
  });

  const fireblocksTxId = response.data.id;
  if (!fireblocksTxId) {
    throw new Error("Fireblocks did not return a transaction ID.");
  }

  return {
    fireblocksTxId,
    status: response.data.status ?? "SUBMITTED",
  };
}

export async function getFireblocksTransaction(txId: string) {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.transactions.getTransaction({ txId });
  return response.data;
}

export async function getFireblocksDepositAddress(
  vaultAccountId: string,
  assetId: string,
): Promise<{ address: string; assetId: string; vaultAccountId: string }> {
  const fireblocks = getFireblocksClient();

  async function readAddress(): Promise<string | null> {
    const response = await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
      vaultAccountId,
      assetId,
    });
    return response.data.addresses?.[0]?.address ?? null;
  }

  let address = await readAddress();
  if (!address) {
    await fireblocks.vaults.activateAssetForVaultAccount({
      vaultAccountId,
      assetId,
    });
    address = await readAddress();
  }

  if (!address) {
    throw new Error(`No deposit address returned for ${assetId} in vault ${vaultAccountId}.`);
  }

  return { address, assetId, vaultAccountId };
}
