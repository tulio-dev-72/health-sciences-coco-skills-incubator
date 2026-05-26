import type { Transfer } from "@/lib/types";

export type WebhookHandlerResult = {
  ok: boolean;
  eventId?: string;
  settlementExternalId?: string | null;
  fireblocksStatus?: string;
  deliveryStatus: "processed" | "ignored" | "failed";
  error?: string;
};

export type FireblocksWebhookDelivery = {
  id: string;
  settlement_request_id: string | null;
  fireblocks_tx_id: string | null;
  external_id: string | null;
  event_type: string;
  status: string;
  sub_status: string | null;
  delivery_status: string;
  processing_error: string | null;
  signature_valid: boolean | null;
  settlement_matched: boolean | null;
  created_at: string;
};

export type WebhookLifecycleSnapshot = {
  externalId: string;
  statuses: string[];
  latestStatus: string | null;
  deliveryStatus: string | null;
  completed: boolean;
  transfer: Transfer | null;
  deliveries: FireblocksWebhookDelivery[];
};
