import { NextResponse } from "next/server";

import { requireFireblocksConfigured, requireFireblocksRole, TREASURY_OPS_ROLES } from "@/lib/fireblocks/route-utils";
import { getDepositAddress, getTreasuryMainVault } from "@/lib/fireblocks/service";

export async function GET(request: Request) {
  const auth = await requireFireblocksRole(
    TREASURY_OPS_ROLES,
    "Deposit address lookup requires an authenticated operational role.",
  );
  if ("error" in auth) {
    return auth.error;
  }

  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId")?.trim();
  const vaultAccountId = searchParams.get("vaultAccountId")?.trim();

  if (!assetId) {
    return NextResponse.json({ error: "assetId query parameter is required." }, { status: 400 });
  }

  try {
    const vault = vaultAccountId
      ? { id: vaultAccountId }
      : await getTreasuryMainVault();

    if (!vault?.id) {
      return NextResponse.json(
        { error: "Treasury Main vault not found. Pass vaultAccountId or configure Fireblocks." },
        { status: 404 },
      );
    }

    const result = await getDepositAddress(vault.id, assetId);
    return NextResponse.json({
      ...result,
      vaultAccountId: result.vaultId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not resolve deposit address.",
      },
      { status: 502 },
    );
  }
}
