"use client";

import type { Transfer } from "@/lib/types";
import { getSettlementEvaluation } from "@/lib/policy";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { RiskBadge, StatusBadge } from "@/components/ui/badges";

function EvaluationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ops-border-subtle py-2.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-[11px] text-ops-text-dim">{label}</span>
      <span className="min-w-0 break-words text-xs font-medium text-ops-text sm:text-right">{value}</span>
    </div>
  );
}

export function PolicyEvaluationCard({ transfer }: { transfer: Transfer }) {
  const { state } = useAppStore();
  const evaluation = getSettlementEvaluation(transfer, state.policy);

  return (
    <Card variant="accent" className="ring-1 ring-ops-primary/10">
      <SectionHeader
        label="Policy engine"
        title="Operational evaluation"
        subtitle="Institutional treasury governance assessment before authorization release."
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        <StatusBadge status={transfer.status} />
        <RiskBadge level={transfer.riskLevel} />
      </div>
      <div className="rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-3">
        <EvaluationRow
          label="Settlement Amount"
          value={formatCurrency(evaluation.settlementAmount, evaluation.asset)}
        />
        <EvaluationRow label="Vault Account" value={evaluation.vaultAccount} />
        <EvaluationRow label="Settlement Rail" value={evaluation.settlementRail} />
        <EvaluationRow label="Counterparty Status" value={evaluation.counterpartyStatus} />
        <EvaluationRow
          label="Risk Level"
          value={evaluation.riskLevel === "medium" ? "Medium" : evaluation.riskLevel === "high" ? "High" : "Low"}
        />
        <EvaluationRow label="Policy Triggered" value={evaluation.policyTrigger} />
        <EvaluationRow label="Required Approver" value={evaluation.requiredApprover} />
        <EvaluationRow label="Status" value={evaluation.status} />
      </div>
    </Card>
  );
}
