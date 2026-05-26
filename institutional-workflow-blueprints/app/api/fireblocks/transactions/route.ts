import { NextResponse } from "next/server";

import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { createTransaction } from "@/lib/fireblocks/service";
import { upsertTransactionRecord } from "@/lib/fireblocks/webhook-store";

export const runtime = "nodejs";

type SubmitBody = {
  externalTxId?: string;
  assetId?: string;
  sourceVaultId?: string;
  amount?: number;
  destination?: string;
  destinationAddress?: string;
  note?: string;
};

export async function POST(request: Request) {
  const unavailable = requireFireblocksConfigured();
  if (unavailable) {
    return unavailable;
  }

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const externalTxId = body.externalTxId?.trim();
  const assetId = body.assetId?.trim();
  const sourceVaultId = body.sourceVaultId?.trim();
  const destination = (body.destinationAddress ?? body.destination)?.trim();
  const note = body.note?.trim();
  const amount = body.amount;

  if (!externalTxId || !assetId || !sourceVaultId || !destination || !note) {
    return NextResponse.json(
      {
        error:
          "externalTxId, assetId, sourceVaultId, destination, and note are required.",
      },
      { status: 400 },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number." }, { status: 400 });
  }

  try {
    const result = await createTransaction({
      sourceVaultId,
      assetId,
      amount,
      destinationAddress: destination,
      externalTxId,
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
