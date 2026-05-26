import { upsertTransactionRecord } from "@/lib/fireblocks/webhook-store";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function readString(record: UnknownRecord | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function handleFireblocksWebhookEvent(payload: unknown): Promise<void> {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;

  const externalTxId =
    readString(data, "externalTxId") ??
    readString(data, "externalTransactionId") ??
    readString(root, "externalTxId");

  const fireblocksTxId =
    readString(data, "id") ??
    readString(data, "txId") ??
    readString(root, "id");

  const status =
    readString(data, "status") ??
    readString(root, "status") ??
    "UPDATED";

  const subStatus = readString(data, "subStatus") ?? readString(root, "subStatus");
  const eventType =
    readString(root, "type") ??
    readString(root, "eventType") ??
    "TRANSACTION_STATUS_UPDATED";

  if (!externalTxId && !fireblocksTxId) {
    return;
  }

  await upsertTransactionRecord({
    externalTxId,
    fireblocksTxId,
    status,
    subStatus,
    eventType,
  });
}
