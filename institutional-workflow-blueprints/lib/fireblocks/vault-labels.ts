const FIREBLOCKS_ASSET_LABELS: Record<string, string> = {
  ETH_TEST5: "Sepolia Operating Vault",
  ETH_TEST3: "Sepolia Operating Vault",
  ETH_TEST: "Ethereum Testnet Vault",
  BTC_TEST: "Bitcoin Testnet Vault",
  USDC: "USDC Operating Vault",
  USDT: "USDT Payout Vault",
  USD: "USD Settlement Reserve",
};

export function getFireblocksVaultLabel(
  assetId: string,
  vaultName: string,
  vaultId: string,
): string {
  const friendlyName =
    FIREBLOCKS_ASSET_LABELS[assetId] ??
    assetId.replace(/_/g, " ").replace(/\bTEST\b/gi, "Test");

  if (vaultName.toLowerCase() === "default") {
    return friendlyName;
  }

  return `${friendlyName} · ${vaultName}`;
}
