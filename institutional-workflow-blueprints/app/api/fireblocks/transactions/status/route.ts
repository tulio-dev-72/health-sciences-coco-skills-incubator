import { NextResponse } from "next/server";
import { getTransactionRecord } from "@/lib/fireblocks/webhook-store";
import { getFireblocksTransaction } from "@/lib/fireblocks/service";
import { isFireblocksConfigured } from "@/lib/fireblocks/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const externalTxId = searchParams.get("externalTxId");
  const fireblocksTxId = searchParams.get("fireblocksTxId");

  if (!externalTxId && !fireblocksTxId) {
    return NextResponse.json(
      { error: "externalTxId or fireblocksTxId is required." },
      { status: 400 },
    );
  }

  const stored = await getTransactionRecord({ externalTxId, fireblocksTxId });
  if (stored) {
    return NextResponse.json({
      source: "webhook_store",
      ...stored,
    });
  }

  if (fireblocksTxId && isFireblocksConfigured()) {
    try {
      const live = await getFireblocksTransaction(fireblocksTxId);
      return NextResponse.json({
        source: "fireblocks_api",
        externalTxId: live.externalTxId ?? externalTxId ?? null,
        fireblocksTxId,
        status: live.status ?? "UNKNOWN",
        subStatus: live.subStatus ?? null,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
}
