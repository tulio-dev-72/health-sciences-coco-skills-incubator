import type { AssetTypeResponse } from "@fireblocks/ts-sdk/models/asset-type-response";
import type { VaultAccount } from "@fireblocks/ts-sdk/models/vault-account";
import type { VaultAsset } from "@fireblocks/ts-sdk/models/vault-asset";

import type {
  FireblocksSupportedAsset,
  FireblocksVaultAccount,
  FireblocksVaultAsset,
} from "@/lib/fireblocks/types";

export function mapVaultAccount(account: VaultAccount): FireblocksVaultAccount {
  return {
    id: String(account.id ?? ""),
    name: account.name ?? `Vault ${account.id ?? ""}`,
    hiddenOnUI: account.hiddenOnUI ?? false,
    assets: (account.assets ?? []).map(mapVaultAsset),
  };
}

export function mapVaultAsset(asset: VaultAsset): FireblocksVaultAsset {
  const total = Number(asset.total ?? asset.balance ?? 0);
  const available = Number(asset.available ?? 0);

  return {
    assetId: asset.id ?? "UNKNOWN",
    total,
    available,
    pending: Number(asset.pending ?? 0),
    lockedAmount: Number(asset.lockedAmount ?? 0),
    pendingOut: Math.max(total - available, 0),
  };
}

export function mapSupportedAsset(asset: AssetTypeResponse): FireblocksSupportedAsset {
  return {
    assetId: asset.id,
    name: asset.name,
    type: asset.type,
    contractAddress: asset.contractAddress ?? null,
    nativeAsset: asset.nativeAsset ?? null,
    decimals: asset.decimals ?? null,
  };
}
