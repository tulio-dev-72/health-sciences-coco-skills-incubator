"use client";

import type { Transfer } from "@/lib/types";
import {
  getLifecycleStageIndex,
  OPERATIONAL_LIFECYCLE_STAGES,
  type OperationalLifecycleStageId,
} from "@/lib/operations/lifecycle-timeline";
import { Card, SectionHeader } from "@/components/ui/primitives";

type StepVisualState = "complete" | "active" | "pending";

function resolveStepVisualState(
  stageId: OperationalLifecycleStageId,
  activeStage: OperationalLifecycleStageId | null,
): StepVisualState {
  if (!activeStage) {
    return "pending";
  }

  const stageIndex = getLifecycleStageIndex(stageId);
  const activeIndex = getLifecycleStageIndex(activeStage);

  if (stageIndex < activeIndex) {
    return "complete";
  }
  if (stageIndex === activeIndex) {
    return activeStage === "COMPLETED" ? "complete" : "active";
  }
  return "pending";
}

type SettlementLifecycleTimelineProps = {
  activeStage: OperationalLifecycleStageId | null;
  stageCounts: Record<OperationalLifecycleStageId, number>;
  focusTransfer: Transfer | null;
};

export function SettlementLifecycleTimeline({
  activeStage,
  stageCounts,
  focusTransfer,
}: SettlementLifecycleTimelineProps) {
  const totalInPipeline = Object.values(stageCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card variant="elevated">
      <SectionHeader
        label="Settlement lifecycle"
        title="Operational progression"
        subtitle={
          focusTransfer
            ? `Tracking ${focusTransfer.id} through governed custody and settlement rail confirmation.`
            : "Horizontal lifecycle reference for workflow orchestration through MPC custody to completion."
        }
      />

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[640px] items-start gap-0">
          {OPERATIONAL_LIFECYCLE_STAGES.map((stage, index) => {
            const visual = resolveStepVisualState(stage.id, activeStage);
            const isLast = index === OPERATIONAL_LIFECYCLE_STAGES.length - 1;
            const count = stageCounts[stage.id];

            return (
              <div key={stage.id} className="flex min-w-0 flex-1 items-start">
                <div className="flex min-w-0 flex-1 flex-col items-center px-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold uppercase tracking-wide ${
                      visual === "complete"
                        ? "border-ops-success bg-ops-success-muted text-ops-success"
                        : visual === "active"
                          ? "border-ops-info bg-ops-info-muted text-ops-info"
                          : "border-ops-border bg-ops-surface text-ops-text-dim"
                    }`}
                  >
                    {visual === "complete" ? (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" aria-hidden>
                        <path
                          d="M2.5 6 5 8.5 9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : visual === "active" ? (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <p
                    className={`mt-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] ${
                      visual === "active" ? "text-ops-info" : "text-ops-text-secondary"
                    }`}
                  >
                    {stage.id.replaceAll("_", " ")}
                  </p>

                  <p className="mt-1 hidden text-center text-[10px] leading-snug text-ops-text-dim sm:block">
                    {stage.label}
                  </p>

                  {totalInPipeline > 0 && count > 0 ? (
                    <span className="mt-2 inline-flex rounded-md bg-ops-overlay px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ops-text-secondary ring-1 ring-ops-border-subtle">
                      {count}
                    </span>
                  ) : null}
                </div>

                {!isLast ? (
                  <div
                    className={`mt-4 h-px w-full min-w-[1.5rem] flex-1 ${
                      visual === "complete" ? "bg-ops-success/45" : "bg-ops-border"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {focusTransfer ? (
        <div className="mt-4 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Active settlement
          </p>
          <p className="mt-1 text-xs font-medium text-ops-text">
            {focusTransfer.id} · {focusTransfer.destinationLabel}
          </p>
          <p className="mt-1 text-[11px] text-ops-text-secondary">
            {focusTransfer.amount.toLocaleString()} {focusTransfer.asset} ·{" "}
            {focusTransfer.status.replaceAll("_", " ").toLowerCase()}
            {focusTransfer.fireblocksStatus
              ? ` · ${focusTransfer.fireblocksStatus.replaceAll("_", " ").toLowerCase()}`
              : ""}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
