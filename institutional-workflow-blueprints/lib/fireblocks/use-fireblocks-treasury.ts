"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchFireblocksTreasuryState,
  fetchTreasuryMainDepositAddress,
} from "@/lib/fireblocks/api-client";
import { SANDBOX_INFRASTRUCTURE_COPY } from "@/lib/fireblocks/constants";
import type { FireblocksDepositAddress, FireblocksTreasuryState } from "@/lib/fireblocks/types";
import { OFFLINE_TREASURY_STATE } from "@/lib/fireblocks/types";

export function useFireblocksTreasury() {
  const [state, setState] = useState<FireblocksTreasuryState>(OFFLINE_TREASURY_STATE);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [depositAddress, setDepositAddress] = useState<FireblocksDepositAddress | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchFireblocksTreasuryState();
      setState(next);
      if (next.assets.length > 0) {
        setSelectedAssetId((current) =>
          current && next.assets.some((asset) => asset.assetId === current)
            ? current
            : next.assets[0].assetId,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedAsset =
    state.assets.find((asset) => asset.assetId === selectedAssetId) ?? state.assets[0] ?? null;

  async function loadDepositAddress(assetId?: string) {
    const targetAssetId = assetId ?? selectedAssetId;
    if (!targetAssetId) {
      setDepositError("Select an asset to resolve a deposit address.");
      return;
    }

    setDepositLoading(true);
    setDepositError(null);

    try {
      const address = await fetchTreasuryMainDepositAddress(targetAssetId);
      setDepositAddress(address);
    } catch (error) {
      setDepositAddress(null);
      setDepositError(
        error instanceof Error ? error.message : "Unable to load deposit address.",
      );
    } finally {
      setDepositLoading(false);
    }
  }

  return {
    state,
    loading,
    refresh,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    depositAddress,
    depositError,
    depositLoading,
    loadDepositAddress,
    sandboxNotice: SANDBOX_INFRASTRUCTURE_COPY,
  };
}
