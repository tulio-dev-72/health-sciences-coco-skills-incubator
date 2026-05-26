import "server-only";

import { TransferPeerPathType } from "@fireblocks/ts-sdk";

import { getFireblocksClient } from "@/lib/fireblocks/client";
import {
  SANDBOX_INFRASTRUCTURE_COPY,
  TREASURY_MAIN_VAULT_NAME,
} from "@/lib/fireblocks/constants";
import {
  getFireblocksConfig,
  getFireblocksIntegrationStatus,
  isFireblocksConfigured,
} from "@/lib/fireblocks/config";
import { mapSupportedAsset, mapVaultAccount, mapVaultAsset } from "@/lib/fireblocks/mappers";
import type {
  FireblocksCreateTransactionInput,
  FireblocksCreateTransactionResult,
  FireblocksDepositAddress,
  FireblocksStatus,
  FireblocksSupportedAsset,
  FireblocksTransactionStatusResult,
  FireblocksVaultAccount,
  FireblocksVaultAsset,
  FireblocksVaultBalance,
} from "@/lib/fireblocks/types";

export type {
  FireblocksCreateTransactionInput,
  FireblocksCreateTransactionResult,
  FireblocksDepositAddress,
  FireblocksStatus,
  FireblocksSubmitInput,
  FireblocksSubmitResult,
  FireblocksSupportedAsset,
  FireblocksTransactionStatusResult,
  FireblocksVaultAccount,
  FireblocksVaultAsset,
  FireblocksVaultBalance,
} from "@/lib/fireblocks/types";

export async function listVaultAccounts(): Promise<FireblocksVaultAccount[]> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.vaults.getPagedVaultAccounts({ limit: 100 });
  return (response.data.accounts ?? []).map(mapVaultAccount);
}

export async function getVaultByName(name: string): Promise<FireblocksVaultAccount | null> {
  const accounts = await listVaultAccounts();
  const match = accounts.find(
    (account) => account.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );

  if (match) {
    return match;
  }

  const config = getFireblocksConfig();
  if (config?.sourceVaultId) {
    return getVaultAccountById(config.sourceVaultId);
  }

  return null;
}

export async function getTreasuryMainVault(): Promise<FireblocksVaultAccount | null> {
  return getVaultByName(TREASURY_MAIN_VAULT_NAME);
}

export async function getVaultAccountById(vaultId: string): Promise<FireblocksVaultAccount> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.vaults.getVaultAccount({ vaultAccountId: vaultId });
  return mapVaultAccount(response.data);
}

export async function listVaultAssets(vaultId: string): Promise<FireblocksVaultAsset[]> {
  const vault = await getVaultAccountById(vaultId);
  return vault.assets;
}

export async function listSupportedAssets(): Promise<FireblocksSupportedAsset[]> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.blockchainsAssets.getSupportedAssets();
  const assets = Array.isArray(response.data) ? response.data : [];
  return assets.map(mapSupportedAsset);
}

export async function getVaultAsset(
  vaultId: string,
  assetId: string,
): Promise<FireblocksVaultAsset> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.vaults.getVaultAccountAsset({
    vaultAccountId: vaultId,
    assetId,
  });
  return mapVaultAsset(response.data);
}

export async function getDepositAddress(
  vaultId: string,
  assetId: string,
): Promise<FireblocksDepositAddress> {
  const fireblocks = getFireblocksClient();

  async function readAddress(): Promise<string | null> {
    const response = await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
      vaultAccountId: vaultId,
      assetId,
      limit: 1,
    });
    return response.data.addresses?.[0]?.address ?? null;
  }

  let address = await readAddress();
  if (!address) {
    await fireblocks.vaults.activateAssetForVaultAccount({
      vaultAccountId: vaultId,
      assetId,
    });
    address = await readAddress();
  }

  if (!address) {
    throw new Error(`No deposit address returned for ${assetId} in vault ${vaultId}.`);
  }

  const isTestAsset = /test|sepolia|goerli|devnet/i.test(assetId);

  return {
    vaultId,
    assetId,
    address,
    faucetHint: isTestAsset
      ? "Fund this sandbox address from a Sepolia faucet — test assets only, not mainnet funds."
      : null,
  };
}

export async function createTransaction(
  input: FireblocksCreateTransactionInput,
): Promise<FireblocksCreateTransactionResult> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      assetId: input.assetId,
      amount: String(input.amount),
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: input.sourceVaultId,
      },
      destination: {
        type: TransferPeerPathType.OneTimeAddress,
        oneTimeAddress: {
          address: input.destinationAddress,
        },
      },
      note: input.note ?? `Settlement ${input.externalTxId}`,
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

export async function getTransactionStatus(
  fireblocksTxId: string,
): Promise<FireblocksTransactionStatusResult> {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.transactions.getTransaction({ txId: fireblocksTxId });
  const tx = response.data;

  return {
    fireblocksTxId,
    status: tx.status ?? "UNKNOWN",
    subStatus: tx.subStatus ?? null,
    externalTxId: tx.externalTxId ?? null,
    assetId: tx.assetId ?? null,
    amount: tx.amountInfo?.amount ?? tx.amount?.toString() ?? null,
    sourceVaultId: tx.source?.id ?? null,
    updatedAt: tx.lastUpdated ? new Date(tx.lastUpdated).toISOString() : new Date().toISOString(),
  };
}

export async function fetchFireblocksVaultBalances(): Promise<FireblocksVaultBalance[]> {
  const accounts = await listVaultAccounts();

  return accounts.flatMap((account) =>
    account.assets.map((asset) => ({
      vaultId: account.id,
      vaultName: account.name,
      asset: asset.assetId,
      total: asset.total,
      available: asset.available,
    })),
  );
}

export function getFireblocksStatus(): FireblocksStatus {
  const integration = getFireblocksIntegrationStatus();
  const config = getFireblocksConfig();

  return {
    configured: integration.configured,
    integrationStatus: integration.integrationStatus,
    message: integration.message,
    basePath: config?.basePath ?? getFireblocksBaseUrlFallback(),
    sourceVaultId: config?.sourceVaultId ?? null,
    treasuryMainVaultId: null,
    treasuryMainVaultName: TREASURY_MAIN_VAULT_NAME,
    sandboxNotice: SANDBOX_INFRASTRUCTURE_COPY,
    security: integration.configured
      ? [
          SANDBOX_INFRASTRUCTURE_COPY,
          "Vault accounts, assets, and balances are discovered from the Fireblocks SDK.",
          "Private keys never reach the browser or React state.",
          "Transactions use externalTxId for idempotency.",
          "Webhook lifecycle updates arrive at POST /api/webhooks/fireblocks.",
        ]
      : [],
  };
}

export async function getFireblocksStatusWithTreasury(): Promise<FireblocksStatus> {
  const status = getFireblocksStatus();

  if (!isFireblocksConfigured()) {
    return status;
  }

  try {
    const treasury = await getTreasuryMainVault();
    return {
      ...status,
      treasuryMainVaultId: treasury?.id ?? status.sourceVaultId,
    };
  } catch {
    return status;
  }
}

function getFireblocksBaseUrlFallback(): string | null {
  return (
    process.env.FIREBLOCKS_BASE_URL?.trim() ??
    process.env.FIREBLOCKS_BASE_PATH?.trim() ??
    null
  );
}

/** @deprecated Use createTransaction */
export async function submitFireblocksTransaction(input: {
  externalTxId: string;
  assetId: string;
  sourceVaultId: string;
  amount: number;
  destination: string;
  note: string;
}) {
  return createTransaction({
    sourceVaultId: input.sourceVaultId,
    assetId: input.assetId,
    amount: input.amount,
    destinationAddress: input.destination,
    externalTxId: input.externalTxId,
    note: input.note,
  });
}

/** @deprecated Use getTransactionStatus */
export async function getFireblocksTransaction(txId: string) {
  const fireblocks = getFireblocksClient();
  const response = await fireblocks.transactions.getTransaction({ txId });
  return response.data;
}

/** @deprecated Use getDepositAddress */
export async function getFireblocksDepositAddress(vaultAccountId: string, assetId: string) {
  const result = await getDepositAddress(vaultAccountId, assetId);
  return {
    address: result.address,
    assetId: result.assetId,
    vaultAccountId: result.vaultId,
  };
}
