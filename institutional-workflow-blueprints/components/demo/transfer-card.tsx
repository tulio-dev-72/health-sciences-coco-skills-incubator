import type { Transfer } from "@/lib/types";
import {
  ApprovedBadge,
  FireblocksStatusBadge,
  PendingApprovalBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/ui/badges";
import { Card } from "@/components/ui/primitives";
import { formatCurrency, formatTimestamp, truncateAddress } from "@/lib/format";

export function TransferCard({ transfer }: { transfer: Transfer }) {
  const isException = transfer.riskLevel === "high" && transfer.status === "PENDING_APPROVAL";

  return (
    <Card variant={isException ? "accent" : "elevated"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ops-text-dim">
            externalTxId · {transfer.id}
          </p>
          <h3 className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-ops-text">
            {formatCurrency(transfer.amount, transfer.asset)}
          </h3>
          <p className="mt-1 truncate text-sm text-ops-text-secondary">{transfer.reason}</p>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <RiskBadge level={transfer.riskLevel} />
        {transfer.status === "PENDING_APPROVAL" ? <PendingApprovalBadge /> : null}
        {transfer.status === "APPROVED" || transfer.status === "SETTLED" ? (
          <ApprovedBadge />
        ) : null}
        <span className="inline-flex items-center rounded-md bg-ops-overlay px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ops-text-secondary ring-1 ring-ops-border">
          {transfer.asset}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-ops-border pt-3 text-sm text-ops-text-secondary">
        <p>
          <span className="font-semibold text-ops-text-dim">Recipient</span>{" "}
          <span className="font-medium text-ops-text">{transfer.destinationLabel}</span>
          <span className="ml-1 font-mono text-xs text-ops-text-dim">
            {truncateAddress(transfer.destination)}
          </span>
        </p>
        <p>
          <span className="font-semibold text-ops-text-dim">Created</span>{" "}
          {formatTimestamp(transfer.createdAt)} · {transfer.createdBy}
        </p>
        {transfer.fireblocksTxId ? (
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-ops-text-dim">fireblocksTxId</span>
            <span className="break-all font-mono text-xs text-ops-text">{transfer.fireblocksTxId}</span>
            {transfer.fireblocksStatus ? (
              <FireblocksStatusBadge status={transfer.fireblocksStatus} />
            ) : null}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
