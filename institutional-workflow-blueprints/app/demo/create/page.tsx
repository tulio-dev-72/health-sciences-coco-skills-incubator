"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import { FundTreasuryMainPanel } from "@/components/demo/fund-treasury-main-panel";
import { FireblocksSettlementInfrastructure } from "@/components/demo/fireblocks-settlement-infrastructure";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT } from "@/data/primary-scenario";
import {
  FUNDING_REQUIRED_BEFORE_AUTHORIZATION,
  SETTLEMENT_RAIL_SEPOLIA,
} from "@/lib/fireblocks/constants";
import { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export default function CreateTransferPage() {
  const router = useRouter();
  const { createTransfer, setWorkflowStep, setActiveBlueprint } = useAppStore();
  const treasury = useFireblocksTreasury();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settlement = PRIMARY_SETTLEMENT;
  const connected = treasury.state.integrationStatus === "connected" && Boolean(treasury.state.vault);
  const settlementAsset =
    connected && treasury.selectedAsset ? treasury.selectedAsset.assetId : settlement.asset;
  const settlementAmount = settlement.amount;
  const ethAvailable =
    treasury.state.sepoliaEthAvailable ?? treasury.sepoliaEthAsset?.available ?? 0;
  const needsFunding =
    connected && (treasury.state.fundingStatus === "needs_funding" || ethAvailable <= 0);
  const settlementRail = treasury.state.settlementRail || SETTLEMENT_RAIL_SEPOLIA;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (needsFunding) {
      setError(FUNDING_REQUIRED_BEFORE_AUTHORIZATION);
      return;
    }

    setActiveBlueprint("stablecoin-payouts");

    const result = await createTransfer({
      asset: settlementAsset,
      amount: settlementAmount,
      destination: settlement.counterpartyAddress,
      destinationLabel: settlement.counterparty,
      reason: settlement.reason,
      sourceVaultId: treasury.state.vault?.id,
      sourceVault: treasury.state.vault?.name ?? settlement.sourceVault,
      settlementRail,
      counterparty: settlement.counterparty,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    setWorkflowStep("policy");
    setTimeout(() => router.push("/demo/policy"), 600);
  }

  return (
    <>
      <DemoTopBar
        title="Initiate Settlement"
        subtitle="Treasury Analyst submits Sepolia test settlement for policy evaluation and Fireblocks authorization."
      />
      <ConnectedWorkflowStepper />

      <main className="ops-page">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FundTreasuryMainPanel />
          <FireblocksSettlementInfrastructure treasury={treasury} amount={settlementAmount} />

          <Card variant="elevated">
            <SectionHeader
              label="Settlement request"
              title="Outbound settlement"
              subtitle={
                connected && treasury.selectedAsset
                  ? `Available ${formatCurrency(treasury.selectedAsset.available, treasury.selectedAsset.assetId)} in ${treasury.state.vault?.name ?? settlement.sourceVault}`
                  : "Connect Fireblocks to load Treasury Main balances from the SDK."
              }
            />

            <div className="space-y-4">
              <div>
                <InputLabel htmlFor="asset">Asset (Fireblocks assetId)</InputLabel>
                <TextInput
                  id="asset"
                  value={settlementAsset}
                  readOnly
                  className="bg-ops-overlay/50 font-mono text-[11px]"
                />
              </div>
              <div>
                <InputLabel htmlFor="amount">Amount</InputLabel>
                <TextInput
                  id="amount"
                  value={formatCurrency(settlementAmount, settlementAsset)}
                  readOnly
                  className="bg-ops-overlay/50 font-semibold tabular-nums"
                />
              </div>
              <div>
                <InputLabel htmlFor="sourceVault">Source Vault</InputLabel>
                <TextInput
                  id="sourceVault"
                  value={treasury.state.vault?.name ?? settlement.sourceVault}
                  readOnly
                  className="bg-ops-overlay/50"
                />
              </div>
              {treasury.state.vault ? (
                <div>
                  <InputLabel htmlFor="sourceVaultId">Source Vault ID</InputLabel>
                  <TextInput
                    id="sourceVaultId"
                    value={treasury.state.vault.id}
                    readOnly
                    className="bg-ops-overlay/50 font-mono text-[11px]"
                  />
                </div>
              ) : null}
              <div>
                <InputLabel htmlFor="counterparty">Counterparty</InputLabel>
                <TextInput id="counterparty" value={settlement.counterparty} readOnly className="bg-ops-overlay/50" />
              </div>
              <div>
                <InputLabel htmlFor="rail">Settlement Rail</InputLabel>
                <TextInput id="rail" value={settlementRail} readOnly className="bg-ops-overlay/50" />
              </div>
              <div>
                <InputLabel htmlFor="reason">Reason</InputLabel>
                <TextInput id="reason" value={settlement.reason} readOnly className="bg-ops-overlay/50" />
              </div>
            </div>
          </Card>

          {needsFunding ? (
            <Card variant="accent">
              <p className="text-xs text-ops-warning">{FUNDING_REQUIRED_BEFORE_AUTHORIZATION}</p>
            </Card>
          ) : null}

          {error ? (
            <Card variant="accent">
              <p className="text-xs text-ops-danger">{error}</p>
            </Card>
          ) : null}

          <PrimaryButton type="submit" className="w-full" disabled={submitted || needsFunding}>
            {submitted ? "Evaluating policy…" : "Submit Settlement"}
          </PrimaryButton>
        </form>
      </main>
    </>
  );
}
