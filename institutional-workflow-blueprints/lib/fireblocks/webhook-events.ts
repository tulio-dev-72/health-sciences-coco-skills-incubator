import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClientIfConfigured } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/persistence";
import { upsertTransactionRecord } from "@/lib/fireblocks/webhook-store";
import type { WebhookHandlerResult } from "@/lib/fireblocks/webhook-types";
import { processFireblocksWebhookPayload } from "@/lib/fireblocks/webhook-processor";

export type { WebhookHandlerResult } from "@/lib/fireblocks/webhook-types";

export async function handleFireblocksWebhookEvent(
  payload: unknown,
  options?: { signatureValid?: boolean; rawBody?: string },
): Promise<WebhookHandlerResult> {
  const admin = createSupabaseAdminClientIfConfigured();

  if (admin) {
    try {
      return await processFireblocksWebhookPayload(admin, payload, {
        signatureValid: options?.signatureValid ?? true,
      });
    } catch (error) {
      return {
        ok: false,
        deliveryStatus: "failed",
        error: error instanceof Error ? error.message : "Webhook processing failed.",
      };
    }
  }

  // Fallback: file store only when Supabase admin is not configured.
  try {
    const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const data =
      root.data && typeof root.data === "object"
        ? (root.data as Record<string, unknown>)
        : root;

    const externalTxId =
      (typeof data.externalTxId === "string" && data.externalTxId) ||
      (typeof data.externalTransactionId === "string" && data.externalTransactionId) ||
      null;
    const fireblocksTxId =
      (typeof data.id === "string" && data.id) ||
      (typeof data.txId === "string" && data.txId) ||
      null;
    const status = (typeof data.status === "string" && data.status) || "UPDATED";

    if (!externalTxId && !fireblocksTxId) {
      return { ok: true, deliveryStatus: "ignored" };
    }

    await upsertTransactionRecord({
      externalTxId,
      fireblocksTxId,
      status,
      subStatus: typeof data.subStatus === "string" ? data.subStatus : null,
      eventType:
        (typeof root.type === "string" && root.type) ||
        (typeof root.eventType === "string" && root.eventType) ||
        "TRANSACTION_STATUS_UPDATED",
    });

    return {
      ok: true,
      deliveryStatus: "processed",
      settlementExternalId: externalTxId,
      fireblocksStatus: status,
    };
  } catch (error) {
    return {
      ok: false,
      deliveryStatus: "failed",
      error: error instanceof Error ? error.message : "Webhook processing failed.",
    };
  }
}

export async function listFireblocksWebhookDeliveries(
  supabase: SupabaseClient,
  input?: { externalId?: string | null; limit?: number },
) {
  let query = supabase
    .from("fireblocks_events")
    .select(
      "id, settlement_request_id, fireblocks_tx_id, external_id, event_type, status, sub_status, delivery_status, processing_error, signature_valid, settlement_matched, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 25);

  if (input?.externalId) {
    query = query.eq("external_id", input.externalId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export function getWebhookEndpointOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export function isSupabaseWebhookPersistenceEnabled(): boolean {
  return isSupabaseAdminConfigured();
}
