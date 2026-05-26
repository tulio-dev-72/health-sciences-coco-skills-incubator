import { NextResponse } from "next/server";

import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { fetchFireblocksVaultBalances } from "@/lib/fireblocks/service";

export async function GET() {
  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  try {
    const vaults = await fetchFireblocksVaultBalances();
    return NextResponse.json({ vaults });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Fireblocks vault balances.",
      },
      { status: 502 },
    );
  }
}
