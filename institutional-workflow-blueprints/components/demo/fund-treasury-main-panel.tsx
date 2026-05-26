"use client";

import { useCallback, useEffect, useState } from "react";
import { IntegrationStatusBadge } from "@/components/ui/badges";
import {
  Card,
  InputLabel,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  TextInput,
} from "@/components/ui/primitives";
import { fetchFireblocksStatus, fetchTreasuryMainFunding } from "@/lib/fireblocks/api-client";
import {
  FUND_TREASURY_MAIN_EXPLANATION,
  FUND_TREASURY_MAIN_RECOMMENDED_AMOUNT,
  SEPOLIA_ETH_FAUCET_URL,
} from "@/lib/fireblocks/sepolia-eth";
import type { TreasuryMainFundingInfo } from "@/lib/fireblocks/funding-types";

export function FundTreasuryMainPanel() {
  const [integrationStatus, setIntegrationStatus] = useState<"connected" | "offline">("offline");
  const [funding, setFunding] = useState<TreasuryMainFundingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const status = await fetchFireblocksStatus();
      setIntegrationStatus(status.integrationStatus === "connected" ? "connected" : "offline");

      if (status.integrationStatus !== "connected") {
        setFunding(null);
        setError(status.message);
        return;
      }

      const next = await fetchTreasuryMainFunding();
      setFunding(next);
    } catch (refreshError) {
      setFunding(null);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to load Treasury Main funding details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCopyAddress() {
    if (!funding?.depositAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(funding.depositAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const fundingStatus = funding?.fundingStatus ?? "needs_funding";
  const statusLabel = fundingStatus === "ready" ? "Ready" : "Needs funding";
  const statusClass =
    fundingStatus === "ready"
      ? "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/20"
      : "bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/20";

  return (
    <Card variant="elevated">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionHeader
          label="Sandbox funding"
          title="Fund Treasury Main"
          subtitle="Prepare Treasury Main with Sepolia test ETH before authorization and settlement tests."
        />
        <IntegrationStatusBadge status={integrationStatus} />
      </div>

      <p className="text-xs leading-relaxed text-ops-text-secondary">{FUND_TREASURY_MAIN_EXPLANATION}</p>
      <p className="mt-2 text-xs leading-relaxed text-ops-text-secondary">
        {FUND_TREASURY_MAIN_RECOMMENDED_AMOUNT}
      </p>

      {loading ? (
        <p className="mt-4 text-xs text-ops-text-secondary">Loading Fireblocks vault funding state…</p>
      ) : error ? (
        <p className="mt-4 rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-3 py-2 text-xs text-ops-danger">
          {error}
        </p>
      ) : funding ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-secondary">
              Funding status
            </p>
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="grid gap-2 rounded-lg border border-ops-border bg-ops-overlay/50 px-3 py-3 text-xs">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-medium text-ops-text-secondary">Treasury Main vault ID</span>
              <span className="break-all font-mono text-[11px] text-ops-text">{funding.vaultId}</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-medium text-ops-text-secondary">Sepolia ETH asset</span>
              <span className="font-mono text-[11px] text-ops-text">
                {funding.assetLabel} · {funding.assetId}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-medium text-ops-text-secondary">ETH Sepolia balance</span>
              <span className="font-semibold tabular-nums text-ops-text">
                {funding.available.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
                {funding.assetId}
              </span>
            </div>
            {funding.available === 0 ? (
              <p className="text-[11px] text-ops-warning">
                Balance is zero — request Sepolia test ETH from the faucet before running custody
                authorization tests.
              </p>
            ) : null}
          </div>

          <div>
            <InputLabel htmlFor="treasury-main-deposit-address">ETH deposit address</InputLabel>
            <TextInput
              id="treasury-main-deposit-address"
              readOnly
              value={funding.depositAddress}
              className="bg-ops-overlay/50 font-mono text-[11px]"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <SecondaryButton type="button" className="w-full" onClick={() => void handleCopyAddress()}>
              {copied ? "Address copied" : "Copy address"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() => window.open(funding.faucetUrl || SEPOLIA_ETH_FAUCET_URL, "_blank", "noopener,noreferrer")}
            >
              Open Sepolia faucet
            </SecondaryButton>
          </div>
        </div>
      ) : null}

      <PrimaryButton type="button" className="mt-4 w-full" disabled={loading} onClick={() => void refresh()}>
        {loading ? "Refreshing…" : "Refresh Fireblocks balance"}
      </PrimaryButton>
    </Card>
  );
}
