import { NextResponse } from "next/server";

import { requireFireblocksConfigured, requireFireblocksRole } from "@/lib/fireblocks/route-utils";
import { getTransactionStatus } from "@/lib/fireblocks/service";
import { getTransactionRecord } from "@/lib/fireblocks/webhook-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireFireblocksRole(
    ["treasury_manager", "admin"],
    "Fireblocks transaction status is limited to Treasury Manager and Platform Admin.",
  );
  if ("error" in auth) {
    return auth.error;
  }

  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  const { id } = await context.params;
  const fireblocksTxId = id.trim();

  if (!fireblocksTxId) {
    return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });
  }

  const stored = await getTransactionRecord({ fireblocksTxId });

  try {
    const live = await getTransactionStatus(fireblocksTxId);

    return NextResponse.json({
      source: "fireblocks_api",
      ...live,
      storedStatus: stored?.status ?? null,
    });
  } catch (error) {
    if (stored) {
      return NextResponse.json({
        source: "webhook_store",
        fireblocksTxId: stored.fireblocksTxId,
        status: stored.status,
        subStatus: stored.subStatus ?? null,
        externalTxId: stored.externalTxId,
        assetId: null,
        amount: null,
        sourceVaultId: null,
        updatedAt: stored.updatedAt,
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Fireblocks transaction status.",
      },
      { status: 502 },
    );
  }
}
