"use client";

import { IntegrationStatusBadge } from "@/components/ui/badges";
import {
  buildInfrastructureStatus,
  InfrastructureStatusPanel,
} from "@/components/demo/infrastructure-status-panel";
import {
  Card,
  InputLabel,
  SecondaryButton,
  SectionHeader,
  TextInput,
} from "@/components/ui/primitives";
import {
  FUNDING_REQUIRED_BEFORE_AUTHORIZATION,
  getFireblocksConsoleVaultUrl,
  SETTLEMENT_RAIL_SEPOLIA,
} from "@/lib/fireblocks/constants";
import { getSepoliaEthAssetLabel } from "@/lib/fireblocks/sepolia-eth";
import type { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { formatCurrency } from "@/lib/format";

type TreasuryHook = ReturnType<typeof useFireblocksTreasury>;

type FireblocksSettlementInfrastructureProps = {
  treasury: TreasuryHook;
  amount?: number;
  showDepositAddress?: boolean;
};

export function FireblocksSettlementInfrastructure({
  treasury,
  amount,
  showDepositAddress = true,
}: FireblocksSettlementInfrastructureProps) {
  const {
    state,
    loading,
    refresh,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    sepoliaEthAsset,
    depositAddress,
    depositError,
    depositLoading,
    sandboxNotice,
  } = treasury;

  const offline = state.degradedMode || state.integrationStatus === "offline";
  const ethAvailable = state.sepoliaEthAvailable ?? sepoliaEthAsset?.available ?? 0;
  const needsFunding = state.fundingStatus === "needs_funding" || ethAvailable <= 0;
  const infrastructureItems = buildInfrastructureStatus({
    integrationStatus: state.integrationStatus,
    fundingStatus: state.fundingStatus,
    ethAvailable: state.sepoliaEthAvailable,
    webhookEndpointActive: state.webhookEndpointActive,
  });
  const consoleVaultUrl =
    state.vault?.id != null
      ? getFireblocksConsoleVaultUrl(state.vault.id, state.basePath)
      : null;

  return (
    <Card variant="ghost" className="border-ops-border bg-ops-surface ring-1 ring-ops-primary/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <SectionHeader
            label="Fireblocks sandbox"
            title="Treasury Main custody"
            subtitle={sandboxNotice}
          />
        </div>
        <IntegrationStatusBadge status={state.integrationStatus} />
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-ops-text-secondary">Discovering vault accounts from Fireblocks…</p>
      ) : offline ? (
        <p className="mt-2 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[11px] text-ops-text-secondary">
          Fireblocks offline / degraded mode. {state.message}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <InfrastructureStatusPanel items={infrastructureItems} />

          {needsFunding ? (
            <p className="rounded-lg border border-ops-warning/20 bg-ops-warning-muted px-3 py-2 text-xs text-ops-warning">
              {FUNDING_REQUIRED_BEFORE_AUTHORIZATION}
            </p>
          ) : null}

          <div className="grid gap-2 rounded-lg border border-ops-border-subtle bg-ops-surface px-3 py-2.5 font-mono text-[11px] break-all text-ops-text-secondary shadow-[var(--ops-shadow-sm)]">
            <p>
              <span className="text-ops-text-dim">vault</span> {state.vault?.name} · id{" "}
              {state.vault?.id}
            </p>
            <p>
              <span className="text-ops-text-dim">settlement rail</span>{" "}
              {state.settlementRail || SETTLEMENT_RAIL_SEPOLIA}
            </p>
            {state.sepoliaEthAssetId ? (
              <>
                <p>
                  <span className="text-ops-text-dim">sepolia assetId</span> {state.sepoliaEthAssetId}{" "}
                  · {getSepoliaEthAssetLabel(state.sepoliaEthAssetId)}
                </p>
                <p>
                  <span className="text-ops-text-dim">ETH Sepolia balance</span>{" "}
                  {formatCurrency(ethAvailable, state.sepoliaEthAssetId)}
                </p>
              </>
            ) : (
              <p>No Sepolia ETH asset activated in Treasury Main.</p>
            )}
          </div>

          {state.assets.length > 0 ? (
            <div>
              <InputLabel htmlFor="fireblocks-asset">Activated vault assets (Fireblocks SDK)</InputLabel>
              <select
                id="fireblocks-asset"
                value={selectedAssetId}
                onChange={(event) => setSelectedAssetId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-ops-border bg-ops-surface px-3 py-2 text-xs text-ops-text"
              >
                {state.assets.map((asset) => (
                  <option key={asset.assetId} value={asset.assetId}>
                    {asset.assetId} · available {formatCurrency(asset.available, asset.assetId)}
                  </option>
                ))}
              </select>
              {selectedAsset ? (
                <p className="mt-1 text-[11px] text-ops-text-secondary">
                  Selected asset total {formatCurrency(selectedAsset.total, selectedAsset.assetId)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-ops-text-secondary">
              No activated assets found in Treasury Main. Activate test assets in Fireblocks Console.
            </p>
          )}

          {typeof amount === "number" && selectedAsset ? (
            <div>
              <InputLabel htmlFor="fireblocks-amount">Settlement amount</InputLabel>
              <TextInput
                id="fireblocks-amount"
                readOnly
                value={formatCurrency(amount, selectedAsset.assetId)}
                className="bg-ops-overlay/50 font-semibold tabular-nums"
              />
            </div>
          ) : null}

          {showDepositAddress ? (
            <div className="space-y-2">
              <InputLabel htmlFor="fireblocks-deposit-address">Treasury Main wallet address</InputLabel>
              {depositLoading ? (
                <p className="text-[11px] text-ops-text-secondary">Resolving deposit address from Fireblocks…</p>
              ) : depositError ? (
                <p className="text-[11px] text-ops-danger">{depositError}</p>
              ) : depositAddress ? (
                <TextInput
                  id="fireblocks-deposit-address"
                  readOnly
                  value={depositAddress.address}
                  className="bg-ops-overlay/50 font-mono text-[11px]"
                />
              ) : (
                <p className="text-[11px] text-ops-text-secondary">
                  Deposit address unavailable until Fireblocks resolves Treasury Main wallet.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
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
      )}
    </Card>
  );
}
