import { NextResponse } from "next/server";

import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { getTreasuryMainFundingInfo } from "@/lib/fireblocks/service";

export const runtime = "nodejs";

export async function GET() {
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
