import type { ReactNode } from "react";
import type { Transfer } from "@/lib/types";
import { getSettlementEvaluation } from "@/lib/policy";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/primitives";
import { RiskBadge, StatusBadge } from "@/components/ui/badges";

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ops-border-subtle pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <span className="shrink-0 text-ops-text-dim">{label}</span>
      <span className="min-w-0 break-words font-medium text-ops-text sm:text-right">{value}</span>
    </div>
  );
}

export function SettlementReviewCard({ transfer }: { transfer: Transfer }) {
  const evaluation = getSettlementEvaluation(transfer);

  return (
    <Card variant="elevated">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Settlement review
          </p>
          <h3 className="mt-1 text-lg font-semibold tabular-nums text-ops-text">
            {formatCurrency(transfer.amount, transfer.asset)}
          </h3>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      <div className="mt-3 grid gap-2 text-xs">
        <ReviewRow label="Vault Account" value={evaluation.vaultAccount} />
        <ReviewRow label="Counterparty" value={evaluation.counterparty} />
        <ReviewRow label="Settlement Rail" value={evaluation.settlementRail} />
        <ReviewRow label="Risk Level" value={<RiskBadge level={transfer.riskLevel} />} />
        <ReviewRow label="Policy Trigger" value={evaluation.policyTrigger} />
        <ReviewRow label="Reason" value={transfer.reason} />
      </div>
    </Card>
  );
}
