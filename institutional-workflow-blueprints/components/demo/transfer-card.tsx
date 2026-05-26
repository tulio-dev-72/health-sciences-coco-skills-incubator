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
          <p className="font-mono text-[10px] uppercase tracking-wide text-ops-text-dim">
            externalTxId · {transfer.id}
          </p>
          <h3 className="mt-0.5 text-base font-semibold tabular-nums text-ops-text">
            {formatCurrency(transfer.amount, transfer.asset)}
          </h3>
          <p className="mt-0.5 truncate text-xs text-ops-text-secondary">{transfer.reason}</p>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <RiskBadge level={transfer.riskLevel} />
        {transfer.status === "PENDING_APPROVAL" ? <PendingApprovalBadge /> : null}
        {transfer.status === "APPROVED" || transfer.status === "SETTLED" ? (
          <ApprovedBadge />
        ) : null}
        <span className="inline-flex items-center rounded bg-ops-overlay px-1.5 py-0.5 font-mono text-[10px] text-ops-text-secondary ring-1 ring-ops-border">
          {transfer.asset}
        </span>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-ops-border-subtle pt-2.5 text-xs text-ops-text-secondary">
        <p>
          <span className="text-ops-text-dim">Recipient</span>{" "}
          <span className="text-ops-text">{transfer.destinationLabel}</span>
          <span className="ml-1 font-mono text-ops-text-dim">
            {truncateAddress(transfer.destination)}
          </span>
        </p>
        <p>
          <span className="text-ops-text-dim">Created</span>{" "}
          {formatTimestamp(transfer.createdAt)} · {transfer.createdBy}
        </p>
        {transfer.fireblocksTxId ? (
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-ops-text-dim">fireblocksTxId</span>
            <span className="break-all font-mono text-[10px] text-ops-text">{transfer.fireblocksTxId}</span>
            {transfer.fireblocksStatus ? (
              <FireblocksStatusBadge status={transfer.fireblocksStatus} />
            ) : null}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
