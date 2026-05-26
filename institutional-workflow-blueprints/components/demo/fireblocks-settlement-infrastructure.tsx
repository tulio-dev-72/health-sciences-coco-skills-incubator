"use client";

import { IntegrationStatusBadge } from "@/components/ui/badges";
import {
  Card,
  InputLabel,
  SecondaryButton,
  SectionHeader,
  TextInput,
} from "@/components/ui/primitives";
import type { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { formatCurrency } from "@/lib/format";

type TreasuryHook = ReturnType<typeof useFireblocksTreasury>;

type FireblocksSettlementInfrastructureProps = {
  treasury: TreasuryHook;
  amount?: number;
  fallbackAssetLabel?: string;
  showDepositAddress?: boolean;
};

export function FireblocksSettlementInfrastructure({
  treasury,
  amount,
  fallbackAssetLabel = "USDC",
  showDepositAddress = true,
}: FireblocksSettlementInfrastructureProps) {
  const {
    state,
    loading,
    refresh,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    depositAddress,
    depositError,
    depositLoading,
    loadDepositAddress,
    sandboxNotice,
  } = treasury;

  const offline = state.degradedMode || state.integrationStatus === "offline";

  return (
    <Card variant="ghost" className="border-ops-border-subtle bg-ops-overlay/30">
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
          Fireblocks offline / degraded mode. {state.message} Demo balances may appear until live
          sandbox credentials are configured.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 rounded-lg border border-ops-border-subtle bg-ops-surface/80 px-2.5 py-2 font-mono text-[10px] break-all text-ops-text-secondary">
            <p>
              <span className="text-ops-text-dim">vault</span> {state.vault?.name} · id{" "}
              {state.vault?.id}
            </p>
            {selectedAsset ? (
              <>
                <p>
                  <span className="text-ops-text-dim">assetId</span> {selectedAsset.assetId}
                </p>
                <p>
                  <span className="text-ops-text-dim">available</span>{" "}
                  {formatCurrency(selectedAsset.available, selectedAsset.assetId)}
                </p>
                <p>
                  <span className="text-ops-text-dim">total</span>{" "}
                  {formatCurrency(selectedAsset.total, selectedAsset.assetId)}
                </p>
              </>
            ) : (
              <p>No activated assets found in Treasury Main. Activate test assets in Fireblocks Console.</p>
            )}
          </div>

          <div>
            <InputLabel htmlFor="fireblocks-asset">Vault asset (from Fireblocks SDK)</InputLabel>
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
          </div>

          {typeof amount === "number" ? (
            <div>
              <InputLabel htmlFor="fireblocks-amount">Settlement amount</InputLabel>
              <TextInput
                id="fireblocks-amount"
                readOnly
                value={formatCurrency(amount, selectedAsset?.assetId ?? fallbackAssetLabel)}
                className="bg-ops-overlay/50 font-semibold tabular-nums"
              />
            </div>
          ) : null}

          {showDepositAddress ? (
            <div className="space-y-2">
              <SecondaryButton
                type="button"
                className="w-full"
                disabled={!selectedAssetId || depositLoading}
                onClick={() => void loadDepositAddress()}
              >
                {depositLoading ? "Resolving address…" : "Get Deposit Address"}
              </SecondaryButton>
              {depositError ? (
                <p className="text-[11px] text-ops-danger">{depositError}</p>
              ) : null}
              {depositAddress ? (
                <div className="rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[11px] text-ops-text-secondary">
                  <p className="font-mono text-[10px] break-all text-ops-text">{depositAddress.address}</p>
                  {depositAddress.faucetHint ? (
                    <p className="mt-1 text-ops-text-dim">{depositAddress.faucetHint}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <SecondaryButton type="button" className="w-full" onClick={() => void refresh()}>
            Refresh from Fireblocks
          </SecondaryButton>
        </div>
      )}
    </Card>
  );
}
