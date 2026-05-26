import { NextResponse } from "next/server";

import { TREASURY_MAIN_VAULT_NAME } from "@/lib/fireblocks/constants";
import { requireFireblocksConfigured, requireFireblocksRole, TREASURY_OPS_ROLES } from "@/lib/fireblocks/route-utils";
import { getDepositAddress, getTreasuryMainVault } from "@/lib/fireblocks/service";

export async function GET(request: Request) {
  const auth = await requireFireblocksRole(
    TREASURY_OPS_ROLES,
    "Treasury vault data requires an authenticated operational role.",
  );
  if ("error" in auth) {
    return auth.error;
  }

  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  const assetId = new URL(request.url).searchParams.get("assetId")?.trim();
  if (!assetId) {
    return NextResponse.json({ error: "assetId query parameter is required." }, { status: 400 });
  }

  try {
    const vault = await getTreasuryMainVault();
    if (!vault) {
      return NextResponse.json(
        { error: `Vault "${TREASURY_MAIN_VAULT_NAME}" was not found in Fireblocks sandbox.` },
        { status: 404 },
      );
    }

    const result = await getDepositAddress(vault.id, assetId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to resolve deposit address from Fireblocks.",
      },
      { status: 502 },
    );
  }
}
