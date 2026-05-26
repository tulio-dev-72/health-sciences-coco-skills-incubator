"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import { WorkflowStepper } from "@/components/demo/workflow-stepper";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { PRIMARY_SETTLEMENT } from "@/data/primary-scenario";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export default function CreateTransferPage() {
  const router = useRouter();
  const { state, createTransfer, setWorkflowStep, setActiveBlueprint } = useAppStore();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settlement = PRIMARY_SETTLEMENT;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setActiveBlueprint("stablecoin-payouts");

    const result = createTransfer({
      asset: settlement.asset,
      amount: settlement.amount,
      destination: settlement.counterpartyAddress,
      destinationLabel: settlement.counterparty,
      reason: settlement.reason,
      sourceVault: settlement.sourceVault,
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
        subtitle="Submit high-value USDC settlement request for policy evaluation and authorization."
      />
      <WorkflowStepper currentStep="create" />

      <main className="px-3 py-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Card variant="elevated">
            <SectionHeader
              label="Settlement request"
              title="Outbound USDC settlement"
              subtitle={`Available ${formatCurrency(state.vaultBalances[0]?.available ?? 0, settlement.asset)} in ${settlement.sourceVault}`}
            />

            <div className="space-y-4">
              <div>
                <InputLabel htmlFor="asset">Asset</InputLabel>
                <TextInput id="asset" value={settlement.asset} readOnly className="bg-ops-overlay/50" />
              </div>
              <div>
                <InputLabel htmlFor="amount">Amount</InputLabel>
                <TextInput
                  id="amount"
                  value={formatCurrency(settlement.amount, settlement.asset)}
                  readOnly
                  className="bg-ops-overlay/50 font-semibold tabular-nums"
                />
              </div>
              <div>
                <InputLabel htmlFor="sourceVault">Source Vault</InputLabel>
                <TextInput id="sourceVault" value={settlement.sourceVault} readOnly className="bg-ops-overlay/50" />
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
