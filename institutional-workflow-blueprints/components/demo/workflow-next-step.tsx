"use client";

import Link from "next/link";
import { Card, PrimaryButton } from "@/components/ui/primitives";
import { getWorkflowStepPath, type WorkflowStepId } from "@/lib/workflow";

export function WorkflowNextStep({
  title,
  description,
  nextStep,
  nextLabel,
  onContinue,
}: {
  title: string;
  description: string;
  nextStep: WorkflowStepId;
  nextLabel: string;
  onContinue?: () => void;
}) {
  const href = getWorkflowStepPath(nextStep);

  return (
    <Card variant="elevated">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
        Next step
      </p>
      <h3 className="mt-1 text-sm font-semibold text-ops-text">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">{description}</p>
      {onContinue ? (
        <PrimaryButton className="mt-3 w-full" onClick={onContinue}>
          {nextLabel}
        </PrimaryButton>
      ) : (
        <Link href={href} className="mt-3 block">
          <PrimaryButton className="w-full">{nextLabel}</PrimaryButton>
        </Link>
      )}
    </Card>
  );
}
