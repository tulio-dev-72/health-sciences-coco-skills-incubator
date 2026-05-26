"use client";

import { IntegrationStatusBadge } from "@/components/ui/badges";
import { Card, SecondaryButton, SectionHeader } from "@/components/ui/primitives";
import {
  FUNDING_REQUIRED_BEFORE_AUTHORIZATION,
  getFireblocksConsoleVaultUrl,
  SETTLEMENT_RAIL_SEPOLIA,
} from "@/lib/fireblocks/constants";
import { getSepoliaEthAssetLabel } from "@/lib/fireblocks/sepolia-eth";
import { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { formatCurrency } from "@/lib/format";

export function TreasuryMainVaultCard() {
  const treasury = useFireblocksTreasury();
  const { state, loading, refresh, sepoliaEthAsset, depositAddress } = treasury;
  const offline = state.degradedMode || state.integrationStatus === "offline";
  const ethAvailable = state.sepoliaEthAvailable ?? sepoliaEthAsset?.available ?? 0;
  const consoleVaultUrl =
    state.vault?.id != null
      ? getFireblocksConsoleVaultUrl(state.vault.id, state.basePath)
      : null;

  return (
    <Card variant="elevated">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionHeader
          label="Custody"
          title="Treasury Main"
          subtitle="Live Fireblocks sandbox vault — balances from SDK, not mock ledger."
        />
        <IntegrationStatusBadge status={state.integrationStatus} />
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-ops-text-secondary">Loading Treasury Main from Fireblocks…</p>
      ) : offline ? (
        <p className="mt-2 text-xs text-ops-text-secondary">{state.message}</p>
      ) : state.vault ? (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-ops-text-secondary">Vault ID</span>
            <span className="break-all font-mono text-[11px] text-ops-text">{state.vault.id}</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-ops-text-secondary">Settlement rail</span>
            <span className="text-ops-text">{state.settlementRail || SETTLEMENT_RAIL_SEPOLIA}</span>
          </div>
          {state.sepoliaEthAssetId ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-ops-text-secondary">
                  {getSepoliaEthAssetLabel(state.sepoliaEthAssetId)}
                </span>
                <span className="font-semibold tabular-nums text-ops-text">
                  {formatCurrency(ethAvailable, state.sepoliaEthAssetId)}
                </span>
              </div>
              <p className="font-mono text-[10px] text-ops-text-dim">assetId {state.sepoliaEthAssetId}</p>
            </>
          ) : null}
          {depositAddress ? (
            <p className="break-all font-mono text-[10px] text-ops-text-secondary">
              {depositAddress.address}
            </p>
          ) : null}
          {ethAvailable <= 0 ? (
            <p className="rounded-lg border border-ops-warning/20 bg-ops-warning-muted px-2.5 py-2 text-[11px] text-ops-warning">
              {FUNDING_REQUIRED_BEFORE_AUTHORIZATION}
            </p>
          ) : null}
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <SecondaryButton type="button" className="w-full" onClick={() => void refresh()}>
              Refresh balance
            </SecondaryButton>
            {consoleVaultUrl ? (
              <SecondaryButton
                type="button"
                className="w-full"
                onClick={() => window.open(consoleVaultUrl, "_blank", "noopener,noreferrer")}
              >
                View Vault in Fireblocks
              </SecondaryButton>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ops-text-secondary">
          Treasury Main vault was not found in Fireblocks sandbox.
        </p>
      )}
    </Card>
  );
}
