"use client";

import { useEffect, useRef, useState } from "react";
import { WEBHOOK_LIFECYCLE_STATUSES } from "@/data/primary-scenario";
import { fetchFireblocksTransferStatus } from "@/lib/fireblocks/api-client";
import {
  appendUniqueFireblocksStatus,
  getSettlementLifecycleMode,
  isRealFireblocksTxId,
  normalizeFireblocksStatus,
  type SettlementLifecycleMode,
  type SettlementStatusSource,
} from "@/lib/fireblocks/lifecycle";
import { useWebhookLifecycleSync } from "@/lib/fireblocks/use-webhook-lifecycle-sync";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import { useAppStore } from "@/lib/store";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REJECTED", "CANCELLED", "BLOCKED"]);

export type SettlementLifecycleState = {
  mode: SettlementLifecycleMode;
  statusSource: SettlementStatusSource | null;
  webhookStatuses: string[];
  latestStatus: string | null;
  completed: boolean;
};

type UseSettlementLifecycleSyncOptions = {
  externalId: string | null;
  fireblocksTxId?: string | null;
  /** True when authorize ran in explicit Demo Mode without a live Fireblocks submit. */
  demoFallback: boolean;
  enabled: boolean;
  pollMs?: number;
  onComplete?: () => void;
};

export function useSettlementLifecycleSync({
  externalId,
  fireblocksTxId,
  demoFallback,
  enabled,
  pollMs = 3000,
  onComplete,
}: UseSettlementLifecycleSyncOptions): SettlementLifecycleState {
  const { syncFireblocksTransferStatus } = useAppStore();
  const [simulatedStatuses, setSimulatedStatuses] = useState<string[]>([]);
  const [apiStatuses, setApiStatuses] = useState<string[]>([]);
  const [statusSource, setStatusSource] = useState<SettlementStatusSource | null>(null);
  const simulationStartedRef = useRef(false);
  const completedRef = useRef(false);

  const realTxId = isRealFireblocksTxId(fireblocksTxId) ? fireblocksTxId!.trim() : null;
  const mode = getSettlementLifecycleMode({ fireblocksTxId: realTxId, demoFallback });

  const webhookSync = useWebhookLifecycleSync({
    externalId,
    enabled:
      enabled &&
      mode === "live" &&
      Boolean(externalId) &&
      Boolean(realTxId) &&
      isSupabasePersistenceEnabled(),
    onComplete: () => {
      if (!completedRef.current) {
        completedRef.current = true;
        setStatusSource("webhook");
        onComplete?.();
      }
    },
  });

  useEffect(() => {
    if (webhookSync.webhookStatuses.length > 0) {
      setStatusSource("webhook");
    }
  }, [webhookSync.webhookStatuses]);

  useEffect(() => {
    if (!enabled || mode !== "live" || !realTxId || !externalId) {
      return;
    }

    const trackedTxId = realTxId;
    completedRef.current = false;
    let cancelled = false;

    async function pollApi() {
      try {
        const status = await fetchFireblocksTransferStatus({
          externalTxId: externalId!,
          fireblocksTxId: trackedTxId,
        });

        if (cancelled) {
          return;
        }

        const normalized = normalizeFireblocksStatus(status.status);
        if (TERMINAL_STATUSES.has(normalized) || normalized) {
          setApiStatuses((current) => appendUniqueFireblocksStatus(current, normalized));
        }

        setStatusSource((current) => (current === "webhook" ? "webhook" : "fireblocks_api"));

        await syncFireblocksTransferStatus({
          externalTxId: externalId!,
          fireblocksTxId: status.fireblocksTxId ?? trackedTxId,
          status: normalized,
          subStatus: status.subStatus,
          statusSource: "fireblocks_api",
        });

        if (normalized === "COMPLETED" && !completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      } catch {
        // Ignore until submit/webhook data is available.
      }
    }

    void pollApi();
    const interval = window.setInterval(pollApi, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, mode, realTxId, externalId, pollMs, syncFireblocksTransferStatus, onComplete]);

  useEffect(() => {
    if (!enabled) {
      simulationStartedRef.current = false;
      setSimulatedStatuses([]);
      setApiStatuses([]);
      setStatusSource(null);
      completedRef.current = false;
      return;
    }

    if (mode !== "simulated" || !externalId) {
      return;
    }

    if (simulationStartedRef.current) {
      return;
    }

    simulationStartedRef.current = true;
    completedRef.current = false;
    setStatusSource("demo_simulation");
    setSimulatedStatuses([]);

    let cancelled = false;

    async function runSimulation() {
      for (const status of WEBHOOK_LIFECYCLE_STATUSES) {
        if (cancelled) {
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (cancelled) {
          return;
        }

        setSimulatedStatuses((current) => appendUniqueFireblocksStatus(current, status));
        await syncFireblocksTransferStatus({
          externalTxId: externalId!,
          status,
          statusSource: "demo_simulation",
        });
      }

      if (!cancelled && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }

    void runSimulation();

    return () => {
      cancelled = true;
    };
  }, [enabled, mode, externalId, syncFireblocksTransferStatus, onComplete]);

  const webhookStatuses =
    mode === "simulated"
      ? simulatedStatuses
      : webhookSync.webhookStatuses.length > 0
        ? webhookSync.webhookStatuses
        : apiStatuses;

  const latestStatus =
    webhookStatuses[webhookStatuses.length - 1] ?? webhookSync.latestStatus ?? null;

  const completed =
    mode === "simulated"
      ? simulatedStatuses.some((status) => normalizeFireblocksStatus(status) === "COMPLETED")
      : normalizeFireblocksStatus(latestStatus ?? "") === "COMPLETED" || webhookSync.completed;

  return {
    mode,
    statusSource: mode === "simulated" ? "demo_simulation" : statusSource,
    webhookStatuses,
    latestStatus,
    completed,
  };
}
