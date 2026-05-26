"use client";

import { getWorkflowStepIndex, workflowSteps, type WorkflowStepId } from "@/lib/workflow";

export function WorkflowStepper({ currentStep }: { currentStep: WorkflowStepId }) {
  const currentIndex = getWorkflowStepIndex(currentStep);
  const current = workflowSteps[currentIndex];

  return (
    <div className="border-b border-ops-border bg-ops-surface px-3 py-3 shadow-[var(--ops-shadow-sm)]">
      {/* Compact progress for narrow viewports — no horizontal scroll */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ops-text-secondary">
            Step {currentIndex + 1} of {workflowSteps.length}
          </p>
          <span className="rounded-md bg-ops-primary-muted px-2 py-0.5 text-[10px] font-semibold text-ops-primary">
            {current.shortLabel}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-ops-text-dim">{current.label}</p>
        <div className="mt-2 flex gap-1">
          {workflowSteps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step.id}
                className={`h-1.5 min-w-0 flex-1 rounded-full ${
                  isCurrent
                    ? "bg-ops-primary"
                    : isComplete
                      ? "bg-ops-success"
                      : "bg-ops-border"
                }`}
                aria-hidden
              />
            );
          })}
        </div>
      </div>

      {/* Grid stepper for tablet+ — wraps without page overflow */}
      <ol className="hidden gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {workflowSteps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              className={`flex min-w-0 flex-col rounded-lg border px-2.5 py-2.5 shadow-[var(--ops-shadow-sm)] ${
                isCurrent
                  ? "border-ops-primary/30 bg-ops-primary-muted ring-1 ring-ops-primary/10"
                  : isComplete
                    ? "border-ops-success/25 bg-ops-success-muted"
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
                className={`mt-0.5 text-[10px] font-semibold leading-tight ${
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
