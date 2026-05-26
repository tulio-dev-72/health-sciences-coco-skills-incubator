import { NextResponse } from "next/server";

import { TREASURY_MAIN_VAULT_NAME } from "@/lib/fireblocks/constants";
import { requireFireblocksConfigured, requireFireblocksRole, TREASURY_OPS_ROLES } from "@/lib/fireblocks/route-utils";
import { getTreasuryMainVault } from "@/lib/fireblocks/service";

export async function GET() {
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

  try {
    const vault = await getTreasuryMainVault();
    if (!vault) {
      return NextResponse.json(
        {
          error: `Vault "${TREASURY_MAIN_VAULT_NAME}" was not found in Fireblocks sandbox.`,
          integrationStatus: "offline",
          message: `Create or rename a vault to "${TREASURY_MAIN_VAULT_NAME}" in Fireblocks Console, or set FIREBLOCKS_SOURCE_VAULT_ID.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ vault });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Treasury Main vault from Fireblocks.",
      },
      { status: 502 },
    );
  }
}
