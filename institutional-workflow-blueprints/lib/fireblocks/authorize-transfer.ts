"use client";

import { PRIMARY_SETTLEMENT } from "@/data/primary-scenario";
import {
  fetchFireblocksTreasuryState,
  submitFireblocksTransfer,
} from "@/lib/fireblocks/api-client";
import type { Transfer } from "@/lib/types";

export async function submitAuthorizedFireblocksTransfer(
  transfer: Transfer,
  fireblocksEnabled: boolean,
): Promise<{ fireblocksTxId: string; fireblocksStatus: string; demoMode: boolean }> {
  if (!fireblocksEnabled) {
    return {
      fireblocksTxId: PRIMARY_SETTLEMENT.demoFireblocksTxId,
      fireblocksStatus: "SUBMITTED",
      demoMode: true,
    };
  }

  const treasury = await fetchFireblocksTreasuryState();
  if (treasury.degradedMode || !treasury.vault) {
    throw new Error(treasury.message);
  }

  const assetId =
    treasury.assets.find((asset) => asset.assetId === transfer.asset)?.assetId ??
    treasury.assets.find((asset) => asset.assetId.includes(transfer.asset))?.assetId ??
    treasury.assets[0]?.assetId;

  if (!assetId) {
    throw new Error("Treasury Main has no activated assets in Fireblocks sandbox.");
  }

  const result = await submitFireblocksTransfer({
    externalTxId: transfer.id,
    assetId,
    sourceVaultId: treasury.vault.id,
    amount: transfer.amount,
    destination: transfer.destination,
    note: transfer.reason,
  });

  return {
    fireblocksTxId: result.fireblocksTxId,
    fireblocksStatus: result.status,
    demoMode: false,
  };
}
