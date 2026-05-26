import { SETTLEMENT_RAIL_SEPOLIA } from "@/lib/fireblocks/constants";
import { resolveSepoliaEthAssetId } from "@/lib/fireblocks/sepolia-eth";
import type { FireblocksTreasuryState, FireblocksVaultAccount } from "@/lib/fireblocks/types";

/** Build client-safe treasury state from a vault account returned by the SDK. */
export function buildTreasuryStateFromVault(
  vault: FireblocksVaultAccount,
  options?: {
    message?: string;
    basePath?: string | null;
    depositAddress?: string | null;
    webhookEndpointActive?: boolean;
  },
): FireblocksTreasuryState {
  const sepoliaEthAssetId = resolveSepoliaEthAssetId(vault.assets);
  const sepoliaAsset = vault.assets.find((asset) => asset.assetId === sepoliaEthAssetId) ?? null;
  const sepoliaEthAvailable = sepoliaAsset?.available ?? null;

  return {
    integrationStatus: "connected",
    message: options?.message ?? "",
    configured: true,
    degradedMode: false,
    vault,
    assets: vault.assets,
    sepoliaEthAssetId,
    sepoliaEthAvailable,
    depositAddress: options?.depositAddress ?? null,
    fundingStatus:
      sepoliaEthAvailable !== null && sepoliaEthAvailable > 0 ? "ready" : "needs_funding",
    settlementRail: SETTLEMENT_RAIL_SEPOLIA,
    basePath: options?.basePath ?? null,
    webhookEndpointActive: options?.webhookEndpointActive ?? false,
  };
}
