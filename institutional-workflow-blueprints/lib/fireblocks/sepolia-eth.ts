import type { FireblocksVaultAsset } from "@/lib/fireblocks/types";

/** External Sepolia faucet — test ETH only. */
export const SEPOLIA_ETH_FAUCET_URL = "https://www.alchemy.com/faucets/ethereum-sepolia";

export const FUND_TREASURY_MAIN_EXPLANATION =
  "Funding requires free Sepolia test ETH from an external faucet. The Fireblocks SDK retrieves the wallet address and balance; it does not mint test funds.";

export const FUND_TREASURY_MAIN_RECOMMENDED_AMOUNT =
  "Request 0.05–0.1 Sepolia ETH. This is testnet ETH only and has no real monetary value.";

const SEPOLIA_ETH_PATTERNS = [
  /^ETH_TEST5$/i,
  /^ETH_TEST3$/i,
  /^ETH_SEPOLIA$/i,
  /SEPOLIA/i,
  /ETH.*TEST/i,
  /^ETH$/i,
];

export function getConfiguredSepoliaEthAssetId(): string | null {
  const fromEnv = process.env.FIREBLOCKS_ASSET_ETH?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : null;
}

export function resolveSepoliaEthAssetId(assets: FireblocksVaultAsset[]): string | null {
  const configured = getConfiguredSepoliaEthAssetId();
  if (configured && assets.some((asset) => asset.assetId === configured)) {
    return configured;
  }

  for (const pattern of SEPOLIA_ETH_PATTERNS) {
    const match = assets.find((asset) => pattern.test(asset.assetId));
    if (match) {
      return match.assetId;
    }
  }

  const ethLike = assets.find((asset) => /ETH/i.test(asset.assetId));
  return ethLike?.assetId ?? configured ?? "ETH_TEST5";
}

export function getSepoliaEthAssetLabel(assetId: string): string {
  if (/TEST5|SEPOLIA/i.test(assetId)) {
    return "ETH Testnet (Sepolia)";
  }
  if (/TEST/i.test(assetId)) {
    return "ETH Testnet";
  }
  return assetId;
}
