export type TreasuryMainFundingStatus = "ready" | "needs_funding";

export type TreasuryMainFundingInfo = {
  vaultId: string;
  vaultName: string;
  assetId: string;
  assetLabel: string;
  balance: number;
  available: number;
  depositAddress: string;
  fundingStatus: TreasuryMainFundingStatus;
  faucetUrl: string;
};
