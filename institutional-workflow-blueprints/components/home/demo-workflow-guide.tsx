import { Card, SectionHeader } from "@/components/ui/primitives";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { SETTLEMENT_LIFECYCLE_STEPS } from "@/data/settlement-lifecycle";

export function DemoWorkflowGuide() {
  return (
    <>
      <Card variant="elevated" className="mb-0">
        <SectionHeader
          label="Workflow lifecycle"
          title="Settlement authorization flow"
          subtitle="Enterprise workflow orchestration across policy, authorization, custody, and settlement rails."
        />

        <ol className="space-y-3">
          {SETTLEMENT_LIFECYCLE_STEPS.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ops-primary-muted text-[10px] font-bold text-ops-primary">
                {item.step}
              </span>
              <div>
                <p className="text-xs font-semibold text-ops-text">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ops-text-secondary">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <MpcCustodyBoundaryPanel />
    </>
  );
}
