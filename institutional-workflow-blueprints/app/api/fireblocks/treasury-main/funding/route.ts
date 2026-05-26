import { NextResponse } from "next/server";

import { requireFireblocksConfigured, requireFireblocksRole, TREASURY_OPS_ROLES } from "@/lib/fireblocks/route-utils";
import { getTreasuryMainFundingInfo } from "@/lib/fireblocks/service";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireFireblocksRole(
    TREASURY_OPS_ROLES,
    "Treasury funding data requires an authenticated operational role.",
  );
  if ("error" in auth) {
    return auth.error;
  }

  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  try {
    const funding = await getTreasuryMainFundingInfo();
    return NextResponse.json(funding);
  } catch (error) {
    console.error("[fireblocks/treasury-main/funding] failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Treasury Main funding details from Fireblocks.",
      },
      { status: 502 },
    );
  }
}
