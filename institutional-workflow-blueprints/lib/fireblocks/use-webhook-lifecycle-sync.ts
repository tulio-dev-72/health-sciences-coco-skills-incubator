"use client";

import { useEffect, useRef, useState } from "react";
import type { WebhookLifecycleSnapshot } from "@/lib/fireblocks/webhook-types";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import { useAppStore } from "@/lib/store";

type UseWebhookLifecycleSyncOptions = {
  externalId: string | null;
  enabled: boolean;
  pollMs?: number;
  onComplete?: () => void;
};

export function useWebhookLifecycleSync({
  externalId,
  enabled,
  pollMs = 2000,
  onComplete,
}: UseWebhookLifecycleSyncOptions) {
  const { refreshFromServer } = useAppStore();
  const [snapshot, setSnapshot] = useState<WebhookLifecycleSnapshot | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !externalId) {
      return;
    }

    completedRef.current = false;
    let cancelled = false;

    const trackedExternalId = externalId;

    async function poll() {
      try {
        const response = await fetch(
          `/api/webhooks/fireblocks?externalId=${encodeURIComponent(trackedExternalId)}`,
          { cache: "no-store" },
        );

        if (!response.ok || cancelled) {
          return;
        }

        const next = (await response.json()) as WebhookLifecycleSnapshot;
        setSnapshot(next);

        if (isSupabasePersistenceEnabled()) {
          await refreshFromServer();
        }

        if (next.completed && !completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      } catch {
        // Ignore transient polling errors.
      }
    }

    void poll();
    const interval = window.setInterval(poll, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [externalId, enabled, pollMs, onComplete, refreshFromServer]);

  return {
    webhookStatuses: snapshot?.statuses ?? [],
    latestStatus: snapshot?.latestStatus ?? null,
    deliveryStatus: snapshot?.deliveryStatus ?? null,
    completed: snapshot?.completed ?? false,
    deliveries: snapshot?.deliveries ?? [],
  };
}

export async function simulateFireblocksWebhookEvent(input: {
  externalTxId: string;
  fireblocksTxId: string;
  status: string;
  eventType?: string;
}) {
  const response = await fetch("/api/webhooks/fireblocks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fireblocks-webhook-simulate": "true",
    },
    body: JSON.stringify({
      type: input.eventType ?? "TRANSACTION_STATUS_UPDATED",
      data: {
        externalTxId: input.externalTxId,
        id: input.fireblocksTxId,
        status: input.status,
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Webhook simulation failed.");
  }

  return body;
}
