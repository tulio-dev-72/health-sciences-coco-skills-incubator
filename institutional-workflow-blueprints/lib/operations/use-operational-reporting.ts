"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchWebhookDeliveries } from "@/lib/fireblocks/api-client";
import { useFireblocksConnection } from "@/lib/fireblocks/use-fireblocks-connection";
import { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { filterTransfersForRole } from "@/lib/policy";
import { useAppStore } from "@/lib/store";

import { countTransfersByLifecycleStage, selectFocusTransfer } from "./lifecycle-timeline";
import {
  computeAuthorizationMetrics,
  computeOperationalRiskSnapshot,
  getActiveLifecycleStage,
  type WebhookDeliverySummary,
} from "./metrics";
import { generateOperationalIntelligence } from "./operational-intelligence";

export function useOperationalReporting() {
  const { state, effectiveRole } = useAppStore();
  const { connected } = useFireblocksConnection();
  const { state: treasury, loading: treasuryLoading } = useFireblocksTreasury();
  const [webhookSummary, setWebhookSummary] = useState<WebhookDeliverySummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWebhookSummary() {
      try {
        const response = await fetchWebhookDeliveries(25);
        if (!cancelled) {
          setWebhookSummary(response.summary);
        }
      } catch {
        if (!cancelled) {
          setWebhookSummary(null);
        }
      }
    }

    void loadWebhookSummary();
    const interval = window.setInterval(() => {
      void loadWebhookSummary();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const visibleTransfers = useMemo(
    () => filterTransfersForRole(state.transfers, effectiveRole),
    [state.transfers, effectiveRole],
  );

  const metrics = useMemo(
    () =>
      computeAuthorizationMetrics({
        transfers: visibleTransfers,
        auditLog: state.auditLog,
        webhookSummary,
      }),
    [visibleTransfers, state.auditLog, webhookSummary],
  );

  const risk = useMemo(
    () =>
      computeOperationalRiskSnapshot({
        transfers: visibleTransfers,
        policy: state.policy,
        treasury,
        lastTransferId: state.lastTransferId,
      }),
    [visibleTransfers, state.policy, treasury, state.lastTransferId],
  );

  const stageCounts = useMemo(
    () => countTransfersByLifecycleStage(visibleTransfers),
    [visibleTransfers],
  );

  const focusTransfer = useMemo(
    () => selectFocusTransfer(visibleTransfers, state.lastTransferId),
    [visibleTransfers, state.lastTransferId],
  );

  const activeStage = useMemo(
    () => getActiveLifecycleStage(visibleTransfers, state.lastTransferId),
    [visibleTransfers, state.lastTransferId],
  );

  const insights = useMemo(
    () =>
      generateOperationalIntelligence({
        transfers: visibleTransfers,
        auditLog: state.auditLog,
        policy: state.policy,
        lastTransferId: state.lastTransferId,
        fireblocksConnected: connected,
        metrics,
        risk,
        webhookSummary,
      }),
    [
      visibleTransfers,
      state.auditLog,
      state.policy,
      state.lastTransferId,
      connected,
      metrics,
      risk,
      webhookSummary,
    ],
  );

  return {
    metrics,
    risk,
    stageCounts,
    focusTransfer,
    activeStage,
    insights,
    treasury,
    treasuryLoading,
    fireblocksConnected: connected,
    webhookSummary,
  };
}
