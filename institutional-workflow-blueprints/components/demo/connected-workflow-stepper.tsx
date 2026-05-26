"use client";

import { WorkflowStepper } from "@/components/demo/workflow-stepper";
import { useAppStore } from "@/lib/store";
import type { WorkflowStepId } from "@/lib/workflow";

/** Reads workflow step from global store; pass override during inline flows. */
export function ConnectedWorkflowStepper({
  overrideStep,
}: {
  overrideStep?: WorkflowStepId;
}) {
  const { state } = useAppStore();
  return <WorkflowStepper currentStep={overrideStep ?? state.workflowStep} />;
}
