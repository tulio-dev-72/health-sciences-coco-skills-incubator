import { NextResponse } from "next/server";
import { isFireblocksConfigured } from "@/lib/fireblocks/config";
import { submitFireblocksTransaction } from "@/lib/fireblocks/service";
import { upsertTransactionRecord } from "@/lib/fireblocks/webhook-store";

export const runtime = "nodejs";

type SubmitBody = {
  externalTxId?: string;
  asset?: string;
  amount?: number;
  destination?: string;
  note?: string;
};

export async function POST(request: Request) {
  if (!isFireblocksConfigured()) {
    return NextResponse.json(
      { error: "Fireblocks is not configured on the server." },
      { status: 503 },
    );
  }

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { externalTxId, asset, amount, destination, note } = body;

  if (!externalTxId || !asset || !destination || !note) {
    return NextResponse.json(
      { error: "externalTxId, asset, destination, and note are required." },
      { status: 400 },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number." }, { status: 400 });
  }

  try {
    const result = await submitFireblocksTransaction({
      externalTxId,
      asset,
      amount,
      destination,
      note,
    });

    await upsertTransactionRecord({
      externalTxId,
      fireblocksTxId: result.fireblocksTxId,
      status: result.status,
      eventType: "TRANSACTION_SUBMITTED",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fireblocks transaction submission failed.",
      },
      { status: 502 },
    );
  }
}
