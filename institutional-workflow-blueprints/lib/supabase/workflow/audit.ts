import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

type AuditInput = {
  settlementRequestId?: string | null;
  action: string;
  actor: string;
  role: UserRole | string;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export async function insertAuditLog(
  supabase: SupabaseClient,
  input: AuditInput,
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    settlement_request_id: input.settlementRequestId ?? null,
    action: input.action,
    actor: input.actor,
    role: input.role,
    details: input.details,
    metadata: input.metadata ?? {},
    ...(input.createdAt ? { created_at: input.createdAt } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertFireblocksEvent(
  supabase: SupabaseClient,
  input: {
    settlementRequestId?: string | null;
    fireblocksTxId?: string | null;
    externalId?: string | null;
    eventType: string;
    status: string;
    subStatus?: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("fireblocks_events").insert({
    settlement_request_id: input.settlementRequestId ?? null,
    fireblocks_tx_id: input.fireblocksTxId ?? null,
    external_id: input.externalId ?? null,
    event_type: input.eventType,
    status: input.status,
    sub_status: input.subStatus ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function createExternalSettlementId(): string {
  return `TRX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "analyst":
      return "Analyst";
    case "treasury_manager":
      return "Treasury Manager";
    case "admin":
      return "Admin";
  }
}
