import { NextResponse } from "next/server";

import { isFireblocksConfigured } from "@/lib/fireblocks/config";
import { requireFireblocksConfigured, requireFireblocksRole } from "@/lib/fireblocks/route-utils";
import { getFireblocksStatusWithTreasury } from "@/lib/fireblocks/service";

function publicStatusPayload(message: string) {
  return NextResponse.json({
    configured: isFireblocksConfigured(),
    integrationStatus: isFireblocksConfigured() ? "restricted" : "offline",
    message,
    basePath: null,
    sourceVaultId: null,
    treasuryMainVaultId: null,
    treasuryMainVaultName: null,
    sandboxNotice:
      "Real Fireblocks sandbox infrastructure using test assets, not mainnet funds.",
    security: [],
  });
}

export async function GET() {
  const auth = await requireFireblocksRole(["analyst", "treasury_manager", "admin"]);
  if ("error" in auth) {
    return publicStatusPayload("Select an operational role to view Fireblocks integration status.");
  }

  if (!isFireblocksConfigured()) {
    return publicStatusPayload("Fireblocks sandbox credentials are not configured.");
  }

  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

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
