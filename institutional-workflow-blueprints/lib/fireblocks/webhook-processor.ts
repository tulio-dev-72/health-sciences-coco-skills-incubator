import type { SupabaseClient } from "@supabase/supabase-js";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { formatCurrency } from "@/lib/format";
import { mapFireblocksToSettlementLifecycle } from "@/lib/fireblocks/lifecycle";
import type { WebhookHandlerResult } from "@/lib/fireblocks/webhook-types";
import { insertAuditLog } from "@/lib/supabase/workflow/audit";
import {
  mapSettlementRow,
  type SettlementRow,
} from "@/lib/supabase/workflow/mappers";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function readString(record: UnknownRecord | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseWebhookPayload(payload: unknown) {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;

  return {
    root: root ?? {},
    externalTxId:
      readString(data, "externalTxId") ??
      readString(data, "externalTransactionId") ??
      readString(root, "externalTxId"),
    fireblocksTxId:
      readString(data, "id") ?? readString(data, "txId") ?? readString(root, "id"),
    status: readString(data, "status") ?? readString(root, "status") ?? "UPDATED",
    subStatus: readString(data, "subStatus") ?? readString(root, "subStatus"),
    eventType:
      readString(root, "type") ??
      readString(root, "eventType") ??
      "TRANSACTION_STATUS_UPDATED",
  };
}

async function getSettlementByExternalId(
  supabase: SupabaseClient,
  externalId: string,
): Promise<SettlementRow | null> {
  const { data } = await supabase
    .from("settlement_requests")
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();
  return (data as SettlementRow | null) ?? null;
}

async function getSettlementByFireblocksTxId(
  supabase: SupabaseClient,
  fireblocksTxId: string,
): Promise<SettlementRow | null> {
  const { data } = await supabase
    .from("settlement_requests")
    .select("*")
    .eq("fireblocks_tx_id", fireblocksTxId)
    .maybeSingle();
  return (data as SettlementRow | null) ?? null;
}

export async function processFireblocksWebhookPayload(
  supabase: SupabaseClient,
  payload: unknown,
  options: { signatureValid: boolean },
): Promise<WebhookHandlerResult> {
  const parsed = parseWebhookPayload(payload);
  const now = new Date().toISOString();
  const rawPayload = asRecord(payload) ?? {};

  const { data: insertedEvent, error: insertError } = await supabase
    .from("fireblocks_events")
    .insert({
      external_id: parsed.externalTxId,
      fireblocks_tx_id: parsed.fireblocksTxId,
      event_type: parsed.eventType,
      status: parsed.status,
      sub_status: parsed.subStatus,
      payload: rawPayload,
      delivery_status: "received",
      signature_valid: options.signatureValid,
      settlement_matched: false,
    })
    .select("id")
    .single();

  if (insertError || !insertedEvent) {
    throw new Error(insertError?.message ?? "Unable to store webhook payload.");
  }

  const eventId = insertedEvent.id as string;

  if (!parsed.externalTxId && !parsed.fireblocksTxId) {
    await supabase
      .from("fireblocks_events")
      .update({
        delivery_status: "ignored",
        processing_error: "No externalTxId or fireblocksTxId in payload.",
      })
      .eq("id", eventId);

    return { ok: true, eventId, deliveryStatus: "ignored" };
  }

  let settlement =
    (parsed.externalTxId
      ? await getSettlementByExternalId(supabase, parsed.externalTxId)
      : null) ??
    (parsed.fireblocksTxId
      ? await getSettlementByFireblocksTxId(supabase, parsed.fireblocksTxId)
      : null);

  if (!settlement) {
    await supabase
      .from("fireblocks_events")
      .update({
        delivery_status: "ignored",
        processing_error: "No matching settlement_request found.",
      })
      .eq("id", eventId);

    return {
      ok: true,
      eventId,
      deliveryStatus: "ignored",
      settlementExternalId: parsed.externalTxId,
      fireblocksStatus: parsed.status,
    };
  }

  try {
    const lifecycle = mapFireblocksToSettlementLifecycle(parsed.status, settlement.status);
    const completed = lifecycle.fireblocksStatus === "COMPLETED";
    const previousFireblocksStatus = settlement.fireblocks_status;

    const { data: updatedSettlement, error: updateError } = await supabase
      .from("settlement_requests")
      .update({
        fireblocks_tx_id: parsed.fireblocksTxId ?? settlement.fireblocks_tx_id,
        fireblocks_status: lifecycle.fireblocksStatus,
        status: lifecycle.settlementStatus,
        policy_summary: completed
          ? "Settlement completed. Review the operational audit timeline."
          : settlement.policy_summary,
        updated_at: now,
      })
      .eq("id", settlement.id)
      .select("*")
      .single();

    if (updateError || !updatedSettlement) {
      throw new Error(updateError?.message ?? "Unable to update settlement lifecycle.");
    }

    await supabase
      .from("fireblocks_events")
      .update({
        settlement_request_id: settlement.id,
        settlement_matched: true,
        delivery_status: "processed",
        external_id: settlement.external_id,
        fireblocks_tx_id: parsed.fireblocksTxId ?? settlement.fireblocks_tx_id,
      })
      .eq("id", eventId);

    await insertAuditLog(supabase, {
      settlementRequestId: settlement.id,
      action: AUDIT_ACTIONS.webhookStatusUpdated,
      actor: "Fireblocks Webhook",
      role: "admin",
      details: `${lifecycle.fireblocksStatus}${completed ? " — settlement completed" : ""}`,
      metadata: { eventId, eventType: parsed.eventType },
      createdAt: now,
    });

    if (completed && previousFireblocksStatus !== "COMPLETED") {
      await insertAuditLog(supabase, {
        settlementRequestId: settlement.id,
        action: AUDIT_ACTIONS.settlementCompleted,
        actor: "Fireblocks Webhook",
        role: "admin",
        details: `${formatCurrency(Number(settlement.amount), settlement.asset)} settlement completed on ${settlement.settlement_rail ?? "Ethereum"}.`,
        metadata: { eventId, fireblocksTxId: parsed.fireblocksTxId },
        createdAt: now,
      });
    }

    const transfer = mapSettlementRow(updatedSettlement as SettlementRow);

    return {
      ok: true,
      eventId,
      deliveryStatus: "processed",
      settlementExternalId: transfer.id,
      fireblocksStatus: lifecycle.fireblocksStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";

    await supabase
      .from("fireblocks_events")
      .update({
        delivery_status: "failed",
        processing_error: message,
        settlement_request_id: settlement.id,
      })
      .eq("id", eventId);

    throw error;
  }
}
