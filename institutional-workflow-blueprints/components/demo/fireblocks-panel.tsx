"use client";

import { useEffect, useState } from "react";
import { FireblocksStatusBadge, IntegrationStatusBadge } from "@/components/ui/badges";
import {
  Card,
  SecondaryButton,
  SectionHeader,
} from "@/components/ui/primitives";
import { TreasuryMainVaultCard } from "@/components/demo/treasury-main-vault-card";
import {
  fetchFireblocksStatus,
  fetchFireblocksWebhookInfo,
  fetchWebhookDeliveries,
} from "@/lib/fireblocks/api-client";
import type { FireblocksStatus } from "@/lib/fireblocks/types";

const capabilities = [
  "MPC vault custody — keys never in this application",
  "TAP / co-signer policy at custody layer",
  "Transaction signing and on-chain settlement",
  "Webhook-driven status for payout tracking",
];

function deliveryLabel(status: string): string {
  switch (status) {
    case "processed":
      return "Delivered";
    case "failed":
      return "Failed";
    case "ignored":
      return "Ignored";
    default:
      return "Received";
  }
}

export function FireblocksIntegrationPanel() {
  const [status, setStatus] = useState<FireblocksStatus | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<
    Awaited<ReturnType<typeof fetchWebhookDeliveries>>["deliveries"]
  >([]);
  const [deliverySummary, setDeliverySummary] = useState<
    Awaited<ReturnType<typeof fetchWebhookDeliveries>>["summary"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  async function refreshStatus() {
    setLoading(true);
    try {
      const [nextStatus, webhookInfo, deliveryInfo] = await Promise.all([
        fetchFireblocksStatus(),
        fetchFireblocksWebhookInfo().catch(() => null),
        fetchWebhookDeliveries().catch(() => null),
      ]);
      setStatus(nextStatus);
      setWebhookUrl(webhookInfo?.endpoint ?? null);
      if (deliveryInfo) {
        setDeliveries(deliveryInfo.deliveries);
        setDeliverySummary(deliveryInfo.summary);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshStatus();

    const interval = window.setInterval(() => {
      void fetchWebhookDeliveries()
        .then((deliveryInfo) => {
          setDeliveries(deliveryInfo.deliveries);
          setDeliverySummary(deliveryInfo.summary);
        })
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <TreasuryMainVaultCard />

      <Card variant="accent" className="mt-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <SectionHeader
              label="Custody integration"
              title="Fireblocks configuration"
              subtitle="Server-side SDK — signing and settlement never touch the browser."
            />
          </div>
          <IntegrationStatusBadge status={status?.integrationStatus ?? "offline"} />
        </div>

        {loading ? (
          <p className="text-xs text-ops-text-secondary">Checking configuration…</p>
        ) : (
          <>
            {status?.integrationStatus === "offline" ? (
              <p className="rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[11px] text-ops-text-secondary">
                {status.message}
              </p>
            ) : null}

            {status?.integrationStatus === "connected" ? (
              <ul className="space-y-1 text-[11px] text-ops-text-secondary">
                {capabilities.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-ops-accent">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 space-y-1 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 font-mono text-[10px] text-ops-text-secondary">
              <p>
                <span className="text-ops-text-dim">connection</span>{" "}
                {status?.integrationStatus ?? "offline"}
              </p>
              {status?.sandboxNotice ? (
                <p className="text-ops-text-dim">{status.sandboxNotice}</p>
              ) : null}
              {status?.treasuryMainVaultName ? (
                <p>
                  <span className="text-ops-text-dim">treasury</span> {status.treasuryMainVaultName}
                  {status.treasuryMainVaultId ? ` · id ${status.treasuryMainVaultId}` : ""}
                </p>
              ) : null}
              {status?.basePath ? (
                <p>
                  <span className="text-ops-text-dim">api</span> {status.basePath}
                </p>
              ) : null}
              {webhookUrl ? (
                <p className="break-all">
                  <span className="text-ops-text-dim">webhook</span> {webhookUrl}
                </p>
              ) : null}
              {deliverySummary ? (
                <p>
                  <span className="text-ops-text-dim">deliveries</span>{" "}
                  {deliverySummary.processed} processed · {deliverySummary.failed} failed ·{" "}
                  {deliverySummary.ignored} ignored
                </p>
              ) : null}
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
                Webhook delivery log
              </p>
              {deliveries.length === 0 ? (
                <p className="mt-2 text-[11px] text-ops-text-secondary">
                  No webhook events received yet.
                </p>
              ) : (
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="rounded-lg border border-ops-border-subtle bg-ops-surface/80 px-2.5 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-[10px] text-ops-text">
                          {delivery.external_id ?? delivery.fireblocks_tx_id ?? "unknown"}
                        </p>
                        <span className="rounded-md bg-ops-overlay px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ops-text-secondary">
                          {deliveryLabel(delivery.delivery_status)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <FireblocksStatusBadge status={delivery.status} />
                        <span className="text-[10px] text-ops-text-dim">{delivery.event_type}</span>
                      </div>
                      {delivery.processing_error ? (
                        <p className="mt-1 text-[10px] text-ops-danger">{delivery.processing_error}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-ops-text-dim">
                        {new Date(delivery.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(status?.security ?? []).length > 0 ? (
              <ul className="mt-2 space-y-1 text-[10px] text-ops-text-dim">
                {status?.security.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : null}

            <SecondaryButton type="button" className="mt-3 w-full" onClick={() => void refreshStatus()}>
              Refresh Fireblocks status
            </SecondaryButton>
          </>
        )}
      </Card>
    </>
  );
}
