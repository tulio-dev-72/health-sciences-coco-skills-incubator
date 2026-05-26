import type { Transfer } from "@/lib/types";
import { getSettlementEvaluation } from "@/lib/policy";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/primitives";
import { RiskBadge, StatusBadge } from "@/components/ui/badges";

export function SettlementReviewCard({ transfer }: { transfer: Transfer }) {
  const evaluation = getSettlementEvaluation(transfer);

  return (
    <Card variant="elevated">
      <div className="flex items-start justify-between gap-2">
        <div>
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
        <div className="flex justify-between gap-3 border-b border-ops-border-subtle pb-2">
          <span className="text-ops-text-dim">Vault Account</span>
          <span className="font-medium text-ops-text">{evaluation.vaultAccount}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-ops-border-subtle pb-2">
          <span className="text-ops-text-dim">Counterparty</span>
          <span className="font-medium text-ops-text">{evaluation.counterparty}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-ops-border-subtle pb-2">
          <span className="text-ops-text-dim">Settlement Rail</span>
          <span className="font-medium text-ops-text">{evaluation.settlementRail}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-ops-border-subtle pb-2">
          <span className="text-ops-text-dim">Risk Level</span>
          <RiskBadge level={transfer.riskLevel} />
        </div>
        <div className="flex justify-between gap-3 border-b border-ops-border-subtle pb-2">
          <span className="text-ops-text-dim">Policy Trigger</span>
          <span className="font-medium text-ops-text">{evaluation.policyTrigger}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ops-text-dim">Reason</span>
          <span className="text-right font-medium text-ops-text">{transfer.reason}</span>
        </div>
      </div>
    </Card>
  );
}
