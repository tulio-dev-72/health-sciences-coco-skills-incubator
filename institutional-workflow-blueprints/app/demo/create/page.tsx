"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import { FireblocksSettlementInfrastructure } from "@/components/demo/fireblocks-settlement-infrastructure";
import { ConnectedWorkflowStepper } from "@/components/demo/connected-workflow-stepper";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT } from "@/data/primary-scenario";
import { useFireblocksTreasury } from "@/lib/fireblocks/use-fireblocks-treasury";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export default function CreateTransferPage() {
  const router = useRouter();
  const { state, createTransfer, setWorkflowStep, setActiveBlueprint } = useAppStore();
  const treasury = useFireblocksTreasury();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settlement = PRIMARY_SETTLEMENT;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setActiveBlueprint("stablecoin-payouts");

    const settlementAsset =
      treasury.state.integrationStatus === "connected" && treasury.selectedAsset
        ? treasury.selectedAsset.assetId
        : settlement.asset;

    const result = await createTransfer({
      asset: settlementAsset,
      amount: settlement.amount,
      destination: settlement.counterpartyAddress,
      destinationLabel: settlement.counterparty,
      reason: settlement.reason,
      sourceVault: treasury.state.vault?.name ?? settlement.sourceVault,
      settlementRail: settlement.settlementRail,
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
        subtitle="Treasury Analyst submits institutional USDC settlement request for policy evaluation and authorization."
      />
      <ConnectedWorkflowStepper />

      <main className="px-3 py-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FireblocksSettlementInfrastructure treasury={treasury} amount={settlement.amount} />

          <Card variant="elevated">
            <SectionHeader
              label="Settlement request"
              title="Outbound settlement"
              subtitle={
                treasury.state.integrationStatus === "connected" && treasury.selectedAsset
                  ? `Available ${formatCurrency(treasury.selectedAsset.available, treasury.selectedAsset.assetId)} in ${treasury.state.vault?.name ?? settlement.sourceVault}`
                  : `Fireblocks offline / degraded mode`
              }
            />

            <div className="space-y-4">
              <div>
                <InputLabel htmlFor="asset">Asset (Fireblocks assetId)</InputLabel>
                <TextInput
                  id="asset"
                  value={treasury.selectedAsset?.assetId ?? settlement.asset}
                  readOnly
                  className="bg-ops-overlay/50 font-mono text-[11px]"
                />
              </div>
              <div>
                <InputLabel htmlFor="amount">Amount</InputLabel>
                <TextInput
                  id="amount"
                  value={formatCurrency(
                    settlement.amount,
                    treasury.selectedAsset?.assetId ?? settlement.asset,
                  )}
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
              <div>
                <InputLabel htmlFor="counterparty">Counterparty</InputLabel>
                <TextInput id="counterparty" value={settlement.counterparty} readOnly className="bg-ops-overlay/50" />
              </div>
              <div>
                <InputLabel htmlFor="rail">Settlement Rail</InputLabel>
                <TextInput id="rail" value={settlement.settlementRail} readOnly className="bg-ops-overlay/50" />
              </div>
              <div>
                <InputLabel htmlFor="reason">Reason</InputLabel>
                <TextInput id="reason" value={settlement.reason} readOnly className="bg-ops-overlay/50" />
              </div>
            </div>
          </Card>

          {error ? (
            <Card variant="accent">
              <p className="text-xs text-ops-danger">{error}</p>
            </Card>
          ) : null}

          <PrimaryButton type="submit" className="w-full" disabled={submitted}>
            {submitted ? "Evaluating policy…" : "Submit Settlement"}
          </PrimaryButton>
        </form>
      </main>
    </>
  );
}
