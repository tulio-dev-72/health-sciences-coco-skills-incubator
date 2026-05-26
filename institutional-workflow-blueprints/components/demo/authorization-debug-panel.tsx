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

  const payloadRows: Array<{ label: string; value: string | number | null }> = [
    { label: "sourceVaultId", value: debug.sourceVaultId },
    { label: "assetId", value: debug.assetId },
    { label: "destination", value: debug.destinationAddress },
    { label: "amount", value: debug.amount },
    { label: "externalTxId", value: debug.externalTxId },
  ];

  const contextRows: Array<{ label: string; value: string | number | null }> = [
    { label: "vaultName", value: debug.vaultName },
    { label: "transferAsset", value: debug.transferAsset },
    { label: "availableBalance", value: debug.availableBalance },
    { label: "destinationType", value: debug.destinationType },
  ];

  return (
    <Card variant="ghost" className="border border-dashed border-ops-border bg-ops-overlay/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-secondary">
        Authorization debug
      </p>
      <p className="mt-1 text-[11px] text-ops-text-dim">
        Dev-only diagnostics for the Fireblocks transaction payload and API response.
      </p>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
          Validated payload
        </p>
        <dl className="mt-2 space-y-2">
          {payloadRows.map((row) => (
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
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
          Treasury context
        </p>
        <dl className="mt-2 space-y-2">
          {contextRows.map((row) => (
            <div key={row.label} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ops-text-dim">
                {row.label}
              </dt>
              <dd className="break-all font-mono text-[11px] text-ops-text-secondary">
                {row.value === null || row.value === "" ? "—" : String(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {rawError ? (
        <div className="mt-3 rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-danger">
            Fireblocks API error
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-ops-danger">{rawError}</p>
        </div>
      ) : null}

      {apiResponse ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
            Fireblocks response
          </p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-ops-border bg-ops-surface p-3 font-mono text-[10px] leading-relaxed text-ops-text-secondary">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      ) : null}
    </Card>
  );
}
