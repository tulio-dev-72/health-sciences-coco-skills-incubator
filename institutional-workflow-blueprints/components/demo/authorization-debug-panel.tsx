"use client";

import type { FireblocksTransactionDebugInfo } from "@/lib/fireblocks/transaction-validation";
import { Card } from "@/components/ui/primitives";

export function AuthorizationDebugPanel({
  debug,
  apiResponse,
  rawError,
}: {
  debug: FireblocksTransactionDebugInfo | null;
  apiResponse?: unknown;
  rawError?: string | null;
}) {
  if (!debug) {
    return null;
  }

  const rows: Array<{ label: string; value: string | number | null }> = [
    { label: "sourceVaultId", value: debug.sourceVaultId },
    { label: "vaultName", value: debug.vaultName },
    { label: "assetId", value: debug.assetId },
    { label: "transferAsset", value: debug.transferAsset },
    { label: "amount", value: debug.amount },
    { label: "availableBalance", value: debug.availableBalance },
    { label: "destinationType", value: debug.destinationType },
    { label: "destinationAddress", value: debug.destinationAddress },
    { label: "externalTxId", value: debug.externalTxId },
  ];

  return (
    <Card variant="ghost" className="border border-dashed border-ops-border bg-ops-overlay/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-secondary">
        Authorization debug
      </p>
      <p className="mt-1 text-[11px] text-ops-text-dim">
        Dev diagnostics for Fireblocks transaction payload and API response.
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-ops-text-dim">
              {row.label}
            </dt>
            <dd className="break-all font-mono text-[11px] text-ops-text">
              {row.value === null || row.value === "" ? "—" : String(row.value)}
            </dd>
          </div>
        ))}
      </dl>
      {rawError ? (
        <div className="mt-3 rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-danger">
            Fireblocks error
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-ops-danger">{rawError}</p>
        </div>
      ) : null}
      {apiResponse ? (
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-ops-border bg-ops-surface p-3 font-mono text-[10px] leading-relaxed text-ops-text-secondary">
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      ) : null}
    </Card>
  );
}
