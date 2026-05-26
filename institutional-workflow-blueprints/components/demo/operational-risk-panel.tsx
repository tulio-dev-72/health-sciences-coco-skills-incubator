"use client";

import { RiskBadge } from "@/components/ui/badges";
import { Card, SectionHeader } from "@/components/ui/primitives";
import type { OperationalRiskSnapshot } from "@/lib/operations/metrics";

function RiskMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ops-border-subtle bg-ops-overlay/35 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-ops-text">{value}</p>
    </div>
  );
}

type OperationalRiskPanelProps = {
  risk: OperationalRiskSnapshot;
};

export function OperationalRiskPanel({ risk }: OperationalRiskPanelProps) {
  return (
    <Card variant="surface">
      <SectionHeader
        label="Operational risk"
        title="Risk posture"
        subtitle={
          risk.focusTransferId
            ? `Derived from ${risk.focusTransferId} and current infrastructure readiness.`
            : "Derived from active settlement profile and infrastructure readiness."
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          Risk level
        </span>
        <RiskBadge level={risk.riskLevel} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <RiskMetricRow label="Policy triggered" value={risk.policyTriggered} />
        <RiskMetricRow label="Counterparty status" value={risk.counterpartyStatus} />
        <RiskMetricRow label="Gas readiness" value={risk.gasReadiness} />
        <RiskMetricRow label="Settlement rail health" value={risk.settlementRailHealth} />
      </div>
    </Card>
  );
}
