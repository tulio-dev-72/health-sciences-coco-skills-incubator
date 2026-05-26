import type { VaultBalance } from "@/lib/types";
import { SETTLEMENT_RAIL_SEPOLIA } from "@/lib/fireblocks/constants";

export const PRIMARY_BLUEPRINT_ID = "stablecoin-payouts";

export const PRIMARY_SETTLEMENT = {
  asset: "ETH_TEST5",
  amount: 0.001,
  sourceVault: "Treasury Main",
  counterparty: "Acme Liquidity LLC",
  counterpartyAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  settlementRail: SETTLEMENT_RAIL_SEPOLIA,
  reason: "Vendor settlement",
  policyTrigger: "High-Value Authorization",
  requiredApprover: "Treasury Manager",
  demoFireblocksTxId: "fb_tx_847291",
} as const;

export const PRIMARY_DEMO_TIMES = {
  initiated: "2026-05-24T09:42:00.000Z",
  policyEvaluated: "2026-05-24T09:42:00.000Z",
  authorized: "2026-05-24T09:44:00.000Z",
  fireblocksCreated: "2026-05-24T09:45:00.000Z",
  webhookPending: "2026-05-24T09:46:00.000Z",
  webhookConfirming: "2026-05-24T09:46:30.000Z",
  completed: "2026-05-24T09:47:00.000Z",
} as const;

export const WEBHOOK_LIFECYCLE_STATUSES = [
  "PENDING_SIGNATURE",
  "CONFIRMING",
  "COMPLETED",
] as const;

export function getPrimaryVaultBalances(): VaultBalance[] {
  return [];
}

export function isPrimaryBlueprint(blueprintId: string | null | undefined): boolean {
  return blueprintId === PRIMARY_BLUEPRINT_ID;
}
