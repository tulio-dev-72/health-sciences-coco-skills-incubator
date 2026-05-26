import type { PolicySettings, Transfer } from "@/lib/types";
import type { WorkflowSnapshot } from "@/lib/supabase/workflow/mappers";

type CreateSettlementBody = {
  asset: string;
  amount: number;
  destination: string;
  destinationLabel: string;
  reason: string;
  sourceVault?: string;
  settlementRail?: string;
  counterparty?: string;
  blueprintId?: string | null;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Workflow request failed.");
  }
  return payload;
}

export async function fetchWorkflowState(): Promise<WorkflowSnapshot> {
  const response = await fetch("/api/workflow/state", { cache: "no-store" });
  return readJson<WorkflowSnapshot>(response);
}

export async function apiCreateSettlement(
  body: CreateSettlementBody,
): Promise<{ transfer: Transfer; policySummary: string }> {
  const response = await fetch("/api/workflow/settlements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson(response);
}

export async function apiApproveSettlement(
  externalId: string,
  fireblocks?: { fireblocksTxId?: string; fireblocksStatus?: string },
): Promise<Transfer> {
  const response = await fetch(`/api/workflow/settlements/${externalId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fireblocks ?? {}),
  });
  const payload = await readJson<{ transfer: Transfer }>(response);
  return payload.transfer;
}

export async function apiRejectSettlement(externalId: string): Promise<Transfer> {
  const response = await fetch(`/api/workflow/settlements/${externalId}/reject`, {
    method: "POST",
  });
  const payload = await readJson<{ transfer: Transfer }>(response);
  return payload.transfer;
}

export async function apiUpdateFireblocksStatus(input: {
  externalTxId?: string;
  fireblocksTxId?: string;
  status: string;
  subStatus?: string | null;
  eventType?: string;
}): Promise<Transfer | null> {
  const response = await fetch("/api/workflow/fireblocks-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readJson<{ transfer: Transfer | null }>(response);
  return payload.transfer;
}

export async function apiUpdatePolicy(patch: Partial<PolicySettings>): Promise<PolicySettings> {
  const response = await fetch("/api/workflow/policy", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const payload = await readJson<{ policy: PolicySettings }>(response);
  return payload.policy;
}
