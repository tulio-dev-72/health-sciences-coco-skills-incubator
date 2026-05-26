"use client";

import { useRouter } from "next/navigation";
import { DemoTopBar } from "@/components/demo/top-bar";
import { PolicyEvaluationCard } from "@/components/demo/policy-evaluation-card";
import { WorkflowNextStep } from "@/components/demo/workflow-next-step";
import { WorkflowStepper } from "@/components/demo/workflow-stepper";
import { Card, PrimaryButton } from "@/components/ui/primitives";
import { useAppStore } from "@/lib/store";

export default function PolicyCheckPage() {
  const router = useRouter();
  const { state, setWorkflowStep } = useAppStore();
  const transfer = state.transfers.find((item) => item.id === state.lastTransferId);

  if (!transfer) {
    return (
      <>
        <DemoTopBar title="Policy evaluation" subtitle="Operational governance assessment." />
        <WorkflowStepper currentStep="policy" />
        <main className="px-3 py-3">
          <Card variant="ghost">
            <p className="text-xs text-ops-text-secondary">
              No settlement to evaluate. Submit a settlement request first.
            </p>
            <PrimaryButton className="mt-3 w-full" onClick={() => router.push("/demo/create")}>
              Initiate settlement
            </PrimaryButton>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <DemoTopBar
        title="Policy evaluation"
        subtitle="Institutional treasury governance assessment before authorization release."
      />
      <WorkflowStepper currentStep="policy" />

      <main className="space-y-3 px-3 py-3">
        <PolicyEvaluationCard transfer={transfer} />

        {transfer.requiresApproval ? (
          <WorkflowNextStep
            title="Route to authorization queue"
            description="Treasury Manager must authorize before Fireblocks custody release."
            nextStep="approval"
            nextLabel="Open authorization queue"
            onContinue={() => {
              setWorkflowStep("approval");
              router.push("/demo/approvals");
            }}
          />
        ) : null}
      </main>
    </>
  );
}
