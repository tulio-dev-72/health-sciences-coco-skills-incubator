"use client";

import { useEffect, useState } from "react";
import { LiveBadge } from "@/components/ui/badges";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from "@/components/ui/primitives";
import {
  fetchFireblocksStatus,
  fetchFireblocksVaults,
  fetchFireblocksWebhookInfo,
} from "@/lib/fireblocks/api-client";
import type { FireblocksStatus } from "@/lib/fireblocks/service";
import { getFireblocksVaultLabel } from "@/lib/fireblocks/vault-labels";
import { useAppStore } from "@/lib/store";

const capabilities = [
  "MPC vault custody — keys never in this application",
  "TAP / co-signer policy at custody layer",
  "Transaction signing and on-chain settlement",
  "Webhook-driven status for payout tracking",
];

export function FireblocksIntegrationPanel() {
  const { state, setFireblocksEnabled, syncFireblocksVaults } = useAppStore();
  const [status, setStatus] = useState<FireblocksStatus | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchFireblocksStatus().catch(() => ({
        configured: false,
        basePath: null,
        sourceVaultId: null,
        security: [],
      })),
      fetchFireblocksWebhookInfo().catch(() => null),
    ])
      .then(([nextStatus, webhookInfo]) => {
        setStatus(nextStatus);
        setWebhookUrl(webhookInfo?.endpoint ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function syncVaults() {
    setMessage(null);
    try {
      const vaults = await fetchFireblocksVaults();
      const mapped = vaults.slice(0, 6).map((vault) => ({
        asset: vault.asset,
        label: getFireblocksVaultLabel(vault.asset, vault.vaultName, vault.vaultId),
        balance: vault.total,
        available: vault.available,
        pendingOut: Math.max(vault.total - vault.available, 0),
      }));
      syncFireblocksVaults(mapped);
      setMessage(`Synced ${mapped.length} vault balance(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vault sync failed.");
    }
  }

  return (
    <Card variant="accent">
      <div className="flex items-start justify-between gap-2">
        <SectionHeader
          label="Custody integration"
          title="Fireblocks configuration"
          subtitle="Server-side SDK — signing and settlement never touch the browser."
        />
        <LiveBadge live={state.fireblocksEnabled && !!status?.configured} />
      </div>

      {loading ? (
        <p className="text-xs text-ops-text-secondary">Checking configuration…</p>
      ) : (
        <>
          <ul className="space-y-1 text-[11px] text-ops-text-secondary">
            {capabilities.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-ops-accent">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 font-mono text-[10px] text-ops-text-secondary">
            <p>
              <span className="text-ops-text-dim">configured</span>{" "}
              {status?.configured ? "yes" : "no"}
            </p>
            {status?.basePath ? (
              <p>
                <span className="text-ops-text-dim">api</span> {status.basePath}
              </p>
            ) : null}
            {status?.sourceVaultId ? (
              <p>
                <span className="text-ops-text-dim">vault</span> {status.sourceVaultId}
              </p>
            ) : null}
            <p>
              <span className="text-ops-text-dim">settlement</span>{" "}
              {state.fireblocksEnabled ? "enabled" : "disabled"}
            </p>
            {webhookUrl ? (
              <p className="break-all">
                <span className="text-ops-text-dim">webhook</span> {webhookUrl}
              </p>
            ) : null}
          </div>

          {(status?.security ?? []).length > 0 ? (
            <ul className="mt-2 space-y-1 text-[10px] text-ops-text-dim">
              {status?.security.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 grid gap-2">
            <PrimaryButton
              className="w-full"
              disabled={!status?.configured}
              onClick={() => setFireblocksEnabled(!state.fireblocksEnabled)}
            >
              {state.fireblocksEnabled ? "Disable settlement" : "Enable settlement"}
            </PrimaryButton>
            <SecondaryButton
              className="w-full"
              disabled={!status?.configured}
              onClick={syncVaults}
            >
              Sync vault balances
            </SecondaryButton>
          </div>

          {message ? (
            <p className="mt-2 text-[11px] text-ops-text-secondary">{message}</p>
          ) : null}
        </>
      )}
    </Card>
  );
}
