import { NextResponse } from "next/server";
import { isFireblocksConfigured } from "@/lib/fireblocks/config";
import { fetchFireblocksVaultBalances } from "@/lib/fireblocks/service";

export async function GET() {
  if (!isFireblocksConfigured()) {
    return NextResponse.json(
      { error: "Fireblocks is not configured on the server." },
      { status: 503 },
    );
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
