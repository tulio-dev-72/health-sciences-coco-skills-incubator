import type { PolicySettings, Transfer } from "@/lib/types";
import type { WorkflowSnapshot } from "@/lib/supabase/workflow/mappers";
import { readApiResponse } from "@/lib/auth/api-errors";

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

export async function fetchWorkflowState(): Promise<WorkflowSnapshot> {
  const response = await fetch("/api/workflow/state", { cache: "no-store" });
  return readApiResponse<WorkflowSnapshot>(response);
}

export async function apiCreateSettlement(
  body: CreateSettlementBody,
): Promise<{ transfer: Transfer; policySummary: string }> {
  const response = await fetch("/api/workflow/settlements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse(response);
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
  const payload = await readApiResponse<{ transfer: Transfer }>(response);
  return payload.transfer;
}

export async function apiRejectSettlement(externalId: string): Promise<Transfer> {
  const response = await fetch(`/api/workflow/settlements/${externalId}/reject`, {
    method: "POST",
  });
  const payload = await readApiResponse<{ transfer: Transfer }>(response);
  return payload.transfer;
}

export async function apiUpdateFireblocksStatus(input: {
  externalTxId?: string;
  fireblocksTxId?: string;
  status: string;
  subStatus?: string | null;
  eventType?: string;
  statusSource?: "webhook" | "fireblocks_api" | "demo_simulation";
}): Promise<Transfer | null> {
  const response = await fetch("/api/workflow/fireblocks-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readApiResponse<{ transfer: Transfer | null }>(response);
  return payload.transfer;
}

export async function apiUpdatePolicy(patch: Partial<PolicySettings>): Promise<PolicySettings> {
  const response = await fetch("/api/workflow/policy", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const payload = await readApiResponse<{ policy: PolicySettings }>(response);
  return payload.policy;
}
