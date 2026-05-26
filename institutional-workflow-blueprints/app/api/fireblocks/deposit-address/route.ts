import { NextResponse } from "next/server";
import { getFireblocksConfig, isFireblocksConfigured } from "@/lib/fireblocks/config";
import { getFireblocksDepositAddress } from "@/lib/fireblocks/service";

const SEPOLIA_ASSET_CANDIDATES = ["ETH_TEST5", "ETH_TEST3", "ETH_TEST", "ETH"];

export async function GET(request: Request) {
  if (!isFireblocksConfigured()) {
    return NextResponse.json(
      { error: "Fireblocks is not configured on the server." },
      { status: 503 },
    );
  }

  const config = getFireblocksConfig();
  const { searchParams } = new URL(request.url);
  const vaultAccountId = searchParams.get("vaultAccountId") ?? config?.sourceVaultId ?? "0";
  const requestedAssetId = searchParams.get("assetId");
  const candidates = requestedAssetId ? [requestedAssetId] : SEPOLIA_ASSET_CANDIDATES;

  const errors: string[] = [];

  for (const assetId of candidates) {
    try {
      const result = await getFireblocksDepositAddress(vaultAccountId, assetId);
      return NextResponse.json({
        ...result,
        faucetHint: "Paste this address into https://sepoliafaucet.com to fund your Sandbox vault.",
      });
    } catch (error) {
      errors.push(
        `${assetId}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  return NextResponse.json(
    {
      error: "Could not resolve a Sepolia deposit address.",
      details: errors,
      hint:
        "If you see 'invalid signature', recreate the API user with treasury-demo CSR and update FIREBLOCKS_API_KEY.",
    },
    { status: 502 },
  );
}
