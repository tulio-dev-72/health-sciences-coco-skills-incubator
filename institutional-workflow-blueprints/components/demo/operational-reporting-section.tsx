"use client";

import { AiOperationalIntelligencePanel } from "@/components/demo/ai-operational-intelligence-panel";
import { AuthorizationMetricsPanel } from "@/components/demo/authorization-metrics-panel";
import { OperationalInfrastructurePanel } from "@/components/demo/operational-infrastructure-panel";
import { OperationalRiskPanel } from "@/components/demo/operational-risk-panel";
import { SettlementLifecycleTimeline } from "@/components/demo/settlement-lifecycle-timeline";
import { SectionHeader } from "@/components/ui/primitives";
import { useOperationalReporting } from "@/lib/operations/use-operational-reporting";

export function OperationalReportingSection() {
  const reporting = useOperationalReporting();

  return (
    <section className="space-y-3">
      <SectionHeader
        label="Operational reporting"
        title="Treasury control center visibility"
        subtitle="Infrastructure-centric operational reporting for executives and treasury operators."
      />

      <AiOperationalIntelligencePanel insights={reporting.insights} />

      <SettlementLifecycleTimeline
        activeStage={reporting.activeStage}
        stageCounts={reporting.stageCounts}
        focusTransfer={reporting.focusTransfer}
      />

      <div className="grid gap-3 xl:grid-cols-2">
        <AuthorizationMetricsPanel metrics={reporting.metrics} />
        <OperationalRiskPanel risk={reporting.risk} />
      </div>

      <OperationalInfrastructurePanel
        treasury={reporting.treasury}
        loading={reporting.treasuryLoading}
        fireblocksConnected={reporting.fireblocksConnected}
        webhookSummary={reporting.webhookSummary}
      />
    </section>
  );
}
