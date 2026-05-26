import { NextResponse } from "next/server";

import { requireFireblocksConfigured } from "@/lib/fireblocks/route-utils";
import { extractFireblocksApiErrorDetails } from "@/lib/fireblocks/errors";
import { createTransaction, getVaultAccountById } from "@/lib/fireblocks/service";
import { buildTreasuryStateFromVault } from "@/lib/fireblocks/treasury-state";
import {
  classifyFireblocksApiError,
  validateFireblocksTransaction,
} from "@/lib/fireblocks/transaction-validation";
import { getTransactionRecord, upsertTransactionRecord } from "@/lib/fireblocks/webhook-store";

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
        category: "unknown",
      },
      { status: 400 },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number.", category: "invalid_amount" },
      { status: 400 },
    );
  }

  const existingRecord = await getTransactionRecord({ externalTxId });
  if (existingRecord?.fireblocksTxId) {
    return NextResponse.json(
      {
        error: `Settlement ${externalTxId} already has Fireblocks transaction ${existingRecord.fireblocksTxId}.`,
        category: "duplicate_external_tx_id",
      },
      { status: 409 },
    );
  }

  let validation;
  try {
    const vault = await getVaultAccountById(sourceVaultId);
    validation = validateFireblocksTransaction({
      transfer: {
        id: externalTxId,
        asset: assetId,
        amount,
        destination,
        destinationLabel: destination,
        reason: note,
        sourceVault: vault.name,
        status: "PENDING_APPROVAL",
        riskLevel: "medium",
        requiresApproval: true,
        createdBy: "Treasury Manager",
        createdByRole: "treasury_manager",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      treasury: buildTreasuryStateFromVault(vault),
      externalTxIdAlreadyUsed: false,
    });
  } catch (error) {
    const details = extractFireblocksApiErrorDetails(error);
    console.error("[fireblocks/transactions] vault validation failed", {
      externalTxId,
      sourceVaultId,
      details,
    });
    return NextResponse.json(
      {
        error: details,
        category: classifyFireblocksApiError(error).category,
        details,
        fireblocksError: details,
      },
      { status: 400 },
    );
  }

  if (!validation.ok) {
    console.error("[fireblocks/transactions] payload validation failed", {
      externalTxId,
      assetId,
      sourceVaultId,
      amount,
      destination,
      category: validation.category,
      message: validation.message,
    });
    return NextResponse.json(
      {
        error: validation.message,
        category: validation.category,
        debug: validation.debug,
        details: validation.message,
      },
      { status: 400 },
    );
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

    return NextResponse.json({ ...result, debug: validation.debug });
  } catch (error) {
    const details = extractFireblocksApiErrorDetails(error);
    const classified = classifyFireblocksApiError(error);
    console.error("[fireblocks/transactions] submission failed", {
      externalTxId,
      assetId,
      sourceVaultId,
      amount,
      destination,
      details,
    });

    return NextResponse.json(
      {
        error: details,
        category: classified.category,
        details,
        fireblocksError: details,
        debug: validation.debug,
      },
      { status: 502 },
    );
  }
}
