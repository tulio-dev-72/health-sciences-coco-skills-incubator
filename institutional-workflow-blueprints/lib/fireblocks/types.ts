/** Client-safe Fireblocks types — no SDK or env access. */

export type FireblocksIntegrationStatus = "connected" | "offline";

export type FireblocksStatus = {
  configured: boolean;
  integrationStatus: FireblocksIntegrationStatus;
  message: string;
  basePath: string | null;
  sourceVaultId: string | null;
  treasuryMainVaultId: string | null;
  treasuryMainVaultName: string | null;
  sandboxNotice: string;
  security: string[];
};

export type FireblocksVaultAccount = {
  id: string;
  name: string;
  hiddenOnUI: boolean;
  assets: FireblocksVaultAsset[];
};

export type FireblocksVaultAsset = {
  assetId: string;
  total: number;
  available: number;
  pending: number;
  lockedAmount: number;
  pendingOut: number;
};

export type FireblocksSupportedAsset = {
  assetId: string;
  name: string;
  type: string;
  contractAddress: string | null;
  nativeAsset: string | null;
  decimals: number | null;
};

export type FireblocksVaultBalance = {
  vaultId: string;
  vaultName: string;
  asset: string;
  total: number;
  available: number;
};

export type FireblocksDepositAddress = {
  vaultId: string;
  assetId: string;
  address: string;
  faucetHint: string | null;
};

export type FireblocksTransactionStatusResult = {
  fireblocksTxId: string;
  status: string;
  subStatus: string | null;
  externalTxId: string | null;
  assetId: string | null;
  amount: string | null;
  sourceVaultId: string | null;
  updatedAt: string;
};

export type FireblocksCreateTransactionInput = {
  sourceVaultId: string;
  assetId: string;
  amount: number;
  destinationAddress: string;
  externalTxId: string;
  note?: string;
};

export type FireblocksCreateTransactionResult = {
  fireblocksTxId: string;
  status: string;
};

export type FireblocksSubmitInput = {
  externalTxId: string;
  assetId: string;
  sourceVaultId: string;
  amount: number;
  destination: string;
  note: string;
};

export type FireblocksSubmitResult = {
  fireblocksTxId: string;
  status: string;
};

export type FireblocksTreasuryState = {
  integrationStatus: FireblocksIntegrationStatus;
  message: string;
  configured: boolean;
  vault: FireblocksVaultAccount | null;
  assets: FireblocksVaultAsset[];
  degradedMode: boolean;
  /** Resolved Sepolia ETH asset from Fireblocks vault discovery. */
  sepoliaEthAssetId: string | null;
  sepoliaEthAvailable: number | null;
  depositAddress: string | null;
  fundingStatus: "ready" | "needs_funding" | null;
  settlementRail: string;
  basePath: string | null;
  webhookEndpointActive: boolean;
};

export const OFFLINE_FIREBLOCKS_STATUS: FireblocksStatus = {
  configured: false,
  integrationStatus: "offline",
  message: "Fireblocks offline / degraded mode. Configure server environment variables to enable live sandbox discovery.",
  basePath: null,
  sourceVaultId: null,
  treasuryMainVaultId: null,
  treasuryMainVaultName: null,
  sandboxNotice:
    "Real Fireblocks sandbox infrastructure using test assets, not mainnet funds.",
  security: [],
};

export const OFFLINE_TREASURY_STATE: FireblocksTreasuryState = {
  integrationStatus: "offline",
  message: OFFLINE_FIREBLOCKS_STATUS.message,
  configured: false,
  vault: null,
  assets: [],
  degradedMode: true,
  sepoliaEthAssetId: null,
  sepoliaEthAvailable: null,
  depositAddress: null,
  fundingStatus: null,
  settlementRail: "Ethereum Sepolia",
  basePath: null,
  webhookEndpointActive: false,
};
