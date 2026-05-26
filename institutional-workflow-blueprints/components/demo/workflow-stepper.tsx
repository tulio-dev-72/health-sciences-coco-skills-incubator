"use client";

import { getWorkflowStepIndex, workflowSteps, type WorkflowStepId } from "@/lib/workflow";

export function WorkflowStepper({ currentStep }: { currentStep: WorkflowStepId }) {
  const currentIndex = getWorkflowStepIndex(currentStep);

  return (
    <div className="border-b border-ops-border-subtle bg-ops-surface/80 px-3 py-3 backdrop-blur-sm">
      <ol className="flex gap-2 overflow-x-auto">
        {workflowSteps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              className={`flex shrink-0 flex-col rounded-lg border px-2.5 py-2 shadow-[var(--ops-shadow-sm)] ${
                isCurrent
                  ? "border-ops-primary/20 bg-ops-primary-muted"
                  : isComplete
                    ? "border-ops-success/15 bg-ops-success-muted"
                    : "border-ops-border bg-ops-surface"
              }`}
            >
              <span
                className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${
                  isCurrent
                    ? "text-ops-primary"
                    : isComplete
                      ? "text-ops-success"
                      : "text-ops-text-dim"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`mt-0.5 text-[10px] font-medium ${
                  isCurrent
                    ? "text-ops-text"
                    : isComplete
                      ? "text-ops-text-secondary"
                      : "text-ops-text-dim"
                }`}
              >
                {step.shortLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
