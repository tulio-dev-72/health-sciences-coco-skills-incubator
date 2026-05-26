import { readFileSync } from "fs";

export type FireblocksConfig = {
  apiKey: string;
  secretKey: string;
  basePath: string;
  sourceVaultId: string;
  assetIds: Record<string, string>;
};

export function isFireblocksConfigured(): boolean {
  return getFireblocksConfig() !== null;
}

export function getFireblocksConfig(): FireblocksConfig | null {
  const apiKey = process.env.FIREBLOCKS_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  let secretKey = process.env.FIREBLOCKS_SECRET_KEY?.trim();
  const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH?.trim();

  if (!secretKey && secretKeyPath) {
    try {
      secretKey = readFileSync(secretKeyPath, "utf8").trim();
    } catch {
      return null;
    }
  }

  if (!secretKey) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    basePath:
      process.env.FIREBLOCKS_BASE_PATH?.trim() ??
      "https://sandbox-api.fireblocks.io/v1",
    sourceVaultId: process.env.FIREBLOCKS_SOURCE_VAULT_ID?.trim() ?? "0",
    assetIds: {
      USDC: process.env.FIREBLOCKS_ASSET_USDC?.trim() ?? "USDC",
      USDT: process.env.FIREBLOCKS_ASSET_USDT?.trim() ?? "USDT",
      USD: process.env.FIREBLOCKS_ASSET_USD?.trim() ?? "USD",
      ETH_TEST5: process.env.FIREBLOCKS_ASSET_ETH?.trim() ?? "ETH_TEST5",
    },
  };
}

export function resolveFireblocksAssetId(asset: string): string | null {
  const config = getFireblocksConfig();
  if (!config) return null;
  return config.assetIds[asset] ?? asset;
}
