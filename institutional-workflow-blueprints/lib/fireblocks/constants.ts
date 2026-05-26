/** Vault name discovered via Fireblocks SDK — not a hardcoded asset ID. */
export const TREASURY_MAIN_VAULT_NAME = "Treasury Main";

export const SETTLEMENT_RAIL_SEPOLIA = "Ethereum Sepolia";

export const FUNDING_REQUIRED_BEFORE_AUTHORIZATION =
  "Funding required before settlement authorization can proceed.";

export const SETTLEMENT_ASSET_UNAVAILABLE =
  "Vault funded but settlement asset unavailable.";

export const SANDBOX_INFRASTRUCTURE_COPY =
  "Real Fireblocks sandbox infrastructure using test assets, not mainnet funds.";

/** Deep link to a vault account in the Fireblocks Console (sandbox or production). */
export function getFireblocksConsoleVaultUrl(
  vaultId: string,
  basePath?: string | null,
): string {
  const isSandbox = !basePath || /sandbox/i.test(basePath);
  const host = isSandbox ? "https://sandbox.fireblocks.io" : "https://console.fireblocks.io";
  return `${host}/v2/accounts/vault/${encodeURIComponent(vaultId)}`;
}
