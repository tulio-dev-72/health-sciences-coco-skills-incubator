"use client";

import { Card, SectionHeader } from "@/components/ui/primitives";
import {
  getOperationalInsightCategoryLabel,
  type OperationalInsight,
} from "@/lib/operations/operational-intelligence";

const severityStyles = {
  info: "border-ops-border-subtle bg-ops-overlay/35",
  warning: "border-ops-warning/25 bg-ops-warning-muted/35",
  critical: "border-ops-danger/25 bg-ops-danger-muted/35",
} as const;

const severityLabelStyles = {
  info: "text-ops-text-dim",
  warning: "text-ops-warning",
  critical: "text-ops-danger",
} as const;

function InsightCard({ insight }: { insight: OperationalInsight }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${severityStyles[insight.severity]}`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${severityLabelStyles[insight.severity]}`}
      >
        {getOperationalInsightCategoryLabel(insight.category)}
      </p>
      <p className="mt-1 text-sm font-semibold text-ops-text">{insight.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">{insight.body}</p>
    </div>
  );
}

type AiOperationalIntelligencePanelProps = {
  insights: OperationalInsight[];
};

export function AiOperationalIntelligencePanel({
  insights,
}: AiOperationalIntelligencePanelProps) {
  return (
    <Card variant="elevated">
      <SectionHeader
        label="Operational intelligence"
        title="AI operational briefing"
        subtitle="Rule-based summaries from live workflow, policy, infrastructure, and webhook evidence — no speculative analytics."
      />

      <div className="space-y-2">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </Card>
  );
}
