import { NextResponse } from "next/server";

import { TREASURY_MAIN_VAULT_NAME } from "@/lib/fireblocks/constants";
import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { getTreasuryMainVault, listSupportedAssets, listVaultAssets } from "@/lib/fireblocks/service";

export async function GET() {
  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  try {
    const vault = await getTreasuryMainVault();
    if (!vault) {
      return NextResponse.json(
        {
          error: `Vault "${TREASURY_MAIN_VAULT_NAME}" was not found in Fireblocks sandbox.`,
        },
        { status: 404 },
      );
    }

    const [assets, supportedAssets] = await Promise.all([
      listVaultAssets(vault.id),
      listSupportedAssets().catch(() => []),
    ]);

    const supportedById = new Map(supportedAssets.map((asset) => [asset.assetId, asset]));

    return NextResponse.json({
      vaultId: vault.id,
      vaultName: vault.name,
      assets: assets.map((asset) => ({
        ...asset,
        symbol: supportedById.get(asset.assetId)?.name ?? asset.assetId,
        type: supportedById.get(asset.assetId)?.type ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Treasury Main assets from Fireblocks.",
      },
      { status: 502 },
    );
  }
}
