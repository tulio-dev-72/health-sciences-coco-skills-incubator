import { Card, SectionHeader } from "@/components/ui/primitives";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { DEMO_SANDBOX_LABEL } from "@/data/demo-accounts";
import { SETTLEMENT_LIFECYCLE_STEPS } from "@/data/settlement-lifecycle";

export function DemoWorkflowGuide() {
  return (
    <>
      <Card variant="elevated" className="mb-0">
        <SectionHeader
          label="End-to-end demo"
          title="Settlement lifecycle"
          subtitle="This app orchestrates enterprise workflow around the Fireblocks MPC custody layer."
        />

        <p className="mb-4 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-3 py-2 text-[11px] text-ops-text-secondary">
          {DEMO_SANDBOX_LABEL} Sign in with Demo Accounts, run as Analyst, then switch to Treasury
          Manager for authorization.
        </p>

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
