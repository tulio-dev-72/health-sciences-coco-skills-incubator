"use client";

import { Card, SectionHeader, StatTile } from "@/components/ui/primitives";
import type { AuthorizationMetrics } from "@/lib/operations/metrics";

type AuthorizationMetricsPanelProps = {
  metrics: AuthorizationMetrics;
};

export function AuthorizationMetricsPanel({ metrics }: AuthorizationMetricsPanelProps) {
  return (
    <Card variant="surface">
      <SectionHeader
        label="Authorization metrics"
        title="Operational throughput"
        subtitle="Metrics computed from workflow state, audit timestamps, and webhook delivery logs — not simulated analytics."
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <StatTile label="Pending authorizations" value={metrics.pendingAuthorizations} accent />
        <StatTile label="Average approval time" value={metrics.averageApprovalTime} />
        <StatTile label="High-risk settlements" value={metrics.highRiskSettlements} />
        <StatTile label="Webhook success rate" value={metrics.webhookSuccessRate} />
      </div>
    </Card>
  );
}
