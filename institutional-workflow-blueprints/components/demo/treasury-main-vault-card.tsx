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

type TreasuryMainVaultCardProps = {
  compact?: boolean;
};

export function TreasuryMainVaultCard({ compact = false }: TreasuryMainVaultCardProps) {
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
          title={state.vault?.name ?? "Treasury Main"}
          subtitle="Loaded dynamically from Fireblocks SDK — vault ID, balances, asset IDs, and wallet addresses."
        />
        <IntegrationStatusBadge status={state.integrationStatus} />
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-ops-text-secondary">Loading Treasury Main from Fireblocks…</p>
      ) : offline ? (
        <p className="mt-2 text-xs text-ops-text-secondary">{state.message}</p>
      ) : state.vault ? (
        <div className="mt-3 space-y-3 text-xs">
          <div className="grid gap-2 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-ops-text-secondary">Vault name</span>
              <span className="font-medium text-ops-text">{state.vault.name}</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-ops-text-secondary">Vault ID</span>
              <span className="break-all font-mono text-[11px] text-ops-text">{state.vault.id}</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-ops-text-secondary">Fireblocks connection</span>
              <span className="font-medium text-ops-success">Connected</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-ops-text-secondary">Settlement rail</span>
              <span className="text-ops-text">{state.settlementRail || SETTLEMENT_RAIL_SEPOLIA}</span>
            </div>
          </div>

          {state.sepoliaEthAssetId ? (
            <div className="rounded-lg border border-ops-border-subtle bg-ops-surface/80 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
                Sepolia ETH balance
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-ops-text-secondary">
                  {getSepoliaEthAssetLabel(state.sepoliaEthAssetId)}
                </span>
                <span className="font-semibold tabular-nums text-ops-text">
                  {formatCurrency(ethAvailable, state.sepoliaEthAssetId)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-ops-text-dim">
                assetId {state.sepoliaEthAssetId}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-ops-text-secondary">
              No Sepolia ETH asset activated in Treasury Main.
            </p>
          )}

          {!compact && state.assets.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
                Activated asset IDs
              </p>
              <ul className="mt-2 space-y-1.5">
                {state.assets.map((asset) => (
                  <li
                    key={asset.assetId}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-ops-border-subtle bg-ops-overlay/30 px-2 py-1.5 font-mono text-[10px]"
                  >
                    <span className="text-ops-text">{asset.assetId}</span>
                    <span className="tabular-nums text-ops-text-secondary">
                      available {formatCurrency(asset.available, asset.assetId)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {depositAddress ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
                Wallet address
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-ops-text-secondary">
                {depositAddress.address}
              </p>
              <p className="mt-1 font-mono text-[10px] text-ops-text-dim">
                assetId {depositAddress.assetId}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-ops-text-secondary">
              Wallet address unavailable until Fireblocks resolves the Treasury Main deposit address.
            </p>
          )}

          {ethAvailable <= 0 ? (
            <p className="rounded-lg border border-ops-warning/20 bg-ops-warning-muted px-2.5 py-2 text-[11px] text-ops-warning">
              {FUNDING_REQUIRED_BEFORE_AUTHORIZATION}
            </p>
          ) : null}

          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <SecondaryButton type="button" className="w-full" onClick={() => void refresh()}>
              Refresh from Fireblocks
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
