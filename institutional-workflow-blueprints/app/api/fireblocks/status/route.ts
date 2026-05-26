import { NextResponse } from "next/server";

import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { getFireblocksStatusWithTreasury } from "@/lib/fireblocks/service";

export async function GET() {
  try {
    const status = await getFireblocksStatusWithTreasury();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        integrationStatus: "offline",
        message:
          error instanceof Error
            ? error.message
            : "Fireblocks offline / degraded mode.",
        basePath: null,
        sourceVaultId: null,
        treasuryMainVaultId: null,
        treasuryMainVaultName: null,
        sandboxNotice:
          "Real Fireblocks sandbox infrastructure using test assets, not mainnet funds.",
        security: [],
      },
      { status: 200 },
    );
  }
}
