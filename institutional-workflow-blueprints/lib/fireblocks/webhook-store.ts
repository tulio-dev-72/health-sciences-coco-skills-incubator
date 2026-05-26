import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type FireblocksTransactionRecord = {
  externalTxId: string;
  fireblocksTxId: string;
  status: string;
  subStatus?: string;
  updatedAt: string;
  events: Array<{
    type: string;
    status: string;
    receivedAt: string;
  }>;
};

type StoreShape = {
  transactions: Record<string, FireblocksTransactionRecord>;
};

const STORE_DIR =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "institutional-workflow-fireblocks")
    : path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "fireblocks-transactions.json");

let memoryStore: StoreShape = { transactions: {} };
let loaded = false;

async function ensureLoaded(): Promise<void> {
  if (loaded) {
    return;
  }

  try {
    const raw = await readFile(STORE_PATH, "utf8");
    memoryStore = JSON.parse(raw) as StoreShape;
  } catch {
    memoryStore = { transactions: {} };
  }

  loaded = true;
}

async function persist(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(memoryStore, null, 2), "utf8");
}

function recordKey(record: Pick<FireblocksTransactionRecord, "externalTxId" | "fireblocksTxId">): string {
  return record.externalTxId || record.fireblocksTxId;
}

export async function upsertTransactionRecord(input: {
  externalTxId?: string | null;
  fireblocksTxId?: string | null;
  status: string;
  subStatus?: string | null;
  eventType?: string;
}): Promise<FireblocksTransactionRecord | null> {
  const externalTxId = input.externalTxId?.trim() ?? "";
  const fireblocksTxId = input.fireblocksTxId?.trim() ?? "";

  if (!externalTxId && !fireblocksTxId) {
    return null;
  }

  await ensureLoaded();

  const existing =
    (externalTxId ? memoryStore.transactions[externalTxId] : undefined) ??
    Object.values(memoryStore.transactions).find((item) => item.fireblocksTxId === fireblocksTxId);

  const now = new Date().toISOString();
  const next: FireblocksTransactionRecord = {
    externalTxId: externalTxId || existing?.externalTxId || fireblocksTxId,
    fireblocksTxId: fireblocksTxId || existing?.fireblocksTxId || "",
    status: input.status,
    subStatus: input.subStatus ?? existing?.subStatus,
    updatedAt: now,
    events: [
      ...(existing?.events ?? []),
      {
        type: input.eventType ?? "status_update",
        status: input.status,
        receivedAt: now,
      },
    ].slice(-20),
  };

  memoryStore.transactions[recordKey(next)] = next;
  if (next.externalTxId && next.externalTxId !== recordKey(next)) {
    memoryStore.transactions[next.externalTxId] = next;
  }
  if (next.fireblocksTxId) {
    memoryStore.transactions[next.fireblocksTxId] = next;
  }

  await persist();
  return next;
}

export async function getTransactionRecord(
  lookup: { externalTxId?: string | null; fireblocksTxId?: string | null },
): Promise<FireblocksTransactionRecord | null> {
  await ensureLoaded();

  const externalTxId = lookup.externalTxId?.trim();
  const fireblocksTxId = lookup.fireblocksTxId?.trim();

  if (externalTxId && memoryStore.transactions[externalTxId]) {
    return memoryStore.transactions[externalTxId];
  }

  if (fireblocksTxId && memoryStore.transactions[fireblocksTxId]) {
    return memoryStore.transactions[fireblocksTxId];
  }

  return (
    Object.values(memoryStore.transactions).find((item) => {
      if (externalTxId && item.externalTxId === externalTxId) return true;
      if (fireblocksTxId && item.fireblocksTxId === fireblocksTxId) return true;
      return false;
    }) ?? null
  );
}

export async function listTransactionRecords(): Promise<FireblocksTransactionRecord[]> {
  await ensureLoaded();

  const seen = new Set<string>();
  return Object.values(memoryStore.transactions).filter((item) => {
    const key = item.externalTxId || item.fireblocksTxId;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
