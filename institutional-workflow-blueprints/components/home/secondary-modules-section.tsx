import type { Blueprint } from "@/lib/types";
import { SecondaryWorkflowModule } from "@/components/home/secondary-workflow-module";

const SECTION_INTRO =
  "Additional operational workflow patterns built on the same Fireblocks infrastructure model.";

const ARCHITECTURE_FOOTER =
  "Uses shared Fireblocks custody, authorization, and webhook lifecycle infrastructure.";

export function SecondaryModulesSection({ blueprints }: { blueprints: Blueprint[] }) {
  if (blueprints.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-lg border border-ops-border bg-ops-overlay/40">
      <div className="border-b border-ops-border-subtle px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          Secondary workflow modules
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ops-text-secondary">{SECTION_INTRO}</p>
      </div>

      <div className="space-y-2 p-2">
        {blueprints.map((blueprint) => (
          <SecondaryWorkflowModule key={blueprint.id} blueprint={blueprint} />
        ))}
      </div>

      <p className="border-t border-ops-border-subtle px-3 py-2.5 text-[10px] leading-snug text-ops-text-dim">
        {ARCHITECTURE_FOOTER}
      </p>
    </aside>
  );
}
