"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchFireblocksTreasuryState,
  fetchTreasuryMainDepositAddress,
} from "@/lib/fireblocks/api-client";
import { SANDBOX_INFRASTRUCTURE_COPY } from "@/lib/fireblocks/constants";
import { resolveSepoliaEthAssetId } from "@/lib/fireblocks/sepolia-eth";
import type { FireblocksDepositAddress, FireblocksTreasuryState } from "@/lib/fireblocks/types";
import { OFFLINE_TREASURY_STATE } from "@/lib/fireblocks/types";

export function useFireblocksTreasury() {
  const [state, setState] = useState<FireblocksTreasuryState>(OFFLINE_TREASURY_STATE);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [depositAddress, setDepositAddress] = useState<FireblocksDepositAddress | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const loadDepositAddress = useCallback(async (assetId: string, vaultId: string) => {
    setDepositLoading(true);
    setDepositError(null);

    try {
      const address = await fetchTreasuryMainDepositAddress(assetId);
      setDepositAddress(address);
    } catch (error) {
      setDepositAddress(null);
      setDepositError(
        error instanceof Error ? error.message : "Unable to load deposit address.",
      );
    } finally {
      setDepositLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setDepositError(null);

    try {
      const next = await fetchFireblocksTreasuryState();
      setState(next);

      const preferredSepoliaId =
        next.sepoliaEthAssetId ??
        (next.assets.length > 0 ? resolveSepoliaEthAssetId(next.assets) : null);

      if (next.assets.length > 0) {
        setSelectedAssetId((current) => {
          if (current && next.assets.some((asset) => asset.assetId === current)) {
            return current;
          }
          return preferredSepoliaId ?? next.assets[0].assetId;
        });
      }

      const assetIdForAddress = preferredSepoliaId ?? next.assets[0]?.assetId;
      if (next.depositAddress && next.vault?.id && assetIdForAddress) {
        setDepositAddress({
          vaultId: next.vault.id,
          assetId: assetIdForAddress,
          address: next.depositAddress,
          faucetHint: null,
        });
      } else if (next.integrationStatus === "connected" && next.vault?.id && assetIdForAddress) {
        await loadDepositAddress(assetIdForAddress, next.vault.id);
      } else {
        setDepositAddress(null);
      }
    } finally {
      setLoading(false);
    }
  }, [loadDepositAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedAsset =
    state.assets.find((asset) => asset.assetId === selectedAssetId) ?? state.assets[0] ?? null;

  const sepoliaEthAsset =
    state.assets.find((asset) => asset.assetId === state.sepoliaEthAssetId) ??
    (state.sepoliaEthAssetId && state.sepoliaEthAvailable !== null
      ? {
          assetId: state.sepoliaEthAssetId,
          total: state.sepoliaEthAvailable,
          available: state.sepoliaEthAvailable,
          pending: 0,
          lockedAmount: 0,
          pendingOut: 0,
        }
      : null);

  async function resolveDepositAddress(assetId?: string) {
    const targetAssetId = assetId ?? selectedAssetId ?? state.sepoliaEthAssetId;
    if (!targetAssetId || !state.vault?.id) {
      setDepositError("Select an asset to resolve a deposit address.");
      return;
    }

    await loadDepositAddress(targetAssetId, state.vault.id);
  }

  return {
    state,
    loading,
    refresh,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    sepoliaEthAsset,
    depositAddress,
    depositError,
    depositLoading,
    loadDepositAddress: resolveDepositAddress,
    sandboxNotice: SANDBOX_INFRASTRUCTURE_COPY,
  };
}
