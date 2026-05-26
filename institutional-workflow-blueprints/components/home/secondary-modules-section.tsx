import type { Blueprint } from "@/lib/types";
import { BlueprintLibraryCard } from "@/components/blueprint-library-card";

const SECTION_INTRO =
  "Additional operational workflow patterns built on the same Fireblocks infrastructure model.";

const SECTION_FOOTER = {
  lead: "All workflows share the same architecture:",
  detail:
    "Workflow orchestration → Fireblocks MPC custody/signing → blockchain settlement rails.",
};

export function SecondaryModulesSection({ blueprints }: { blueprints: Blueprint[] }) {
  if (blueprints.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-lg border border-dashed border-ops-border-subtle/70 px-2.5 py-3 sm:px-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ops-text-dim/80">
        Secondary modules
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-ops-text-dim/90">{SECTION_INTRO}</p>

      <div className="mt-2.5 grid gap-1.5">
        {blueprints.map((blueprint) => (
          <BlueprintLibraryCard key={blueprint.id} blueprint={blueprint} variant="secondary" />
        ))}
      </div>

      <p className="mt-2.5 border-t border-ops-border-subtle/60 pt-2.5 text-[9px] leading-relaxed text-ops-text-dim/80">
        {SECTION_FOOTER.lead}
        <br />
        {SECTION_FOOTER.detail}
      </p>
    </aside>
  );
}
