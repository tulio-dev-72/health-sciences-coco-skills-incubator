"use client";

import Link from "next/link";
import { Card, PrimaryButton, SectionHeader } from "@/components/ui/primitives";
import { blueprintGtm } from "@/data/demo-guide";
import { getDemoScenario } from "@/data/demo-scenarios";
import { blueprintLibrary } from "@/data/initial-data";
import { useAppStore } from "@/lib/store";

export function DemoGuideCard() {
  const { state } = useAppStore();
  const blueprint = blueprintLibrary.find((item) => item.id === state.activeBlueprint);
  const gtm = state.activeBlueprint ? blueprintGtm[state.activeBlueprint] : null;
  const scenario = getDemoScenario(state.activeBlueprint);

  return (
    <Card variant="elevated">
      <SectionHeader
        label="Workflow guide"
        title="Demo execution path"
        subtitle="Governance workflow — batch ops, exception handling, custody settlement."
      />
      {blueprint && gtm ? (
        <div className="mb-3 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Active module
          </p>
          <p className="mt-0.5 text-xs font-medium text-ops-text">{blueprint.title}</p>
          <p className="mt-1 text-[10px] text-ops-text-secondary">{gtm.buyer}</p>
        </div>
      ) : null}
      <ol className="space-y-2">
        {scenario.walkthrough.map((item) => (
          <li
            key={item.step}
            className="rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ops-primary">
              Step {item.step}
            </p>
            <p className="mt-0.5 text-xs font-medium text-ops-text">{item.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ops-text-secondary">
              {item.detail}
            </p>
          </li>
        ))}
      </ol>
      <Link href="/demo/approvals" className="mt-3 block">
        <PrimaryButton className="w-full">Open approval queue</PrimaryButton>
      </Link>
    </Card>
  );
}

export function UseCaseContextCard() {
  const { state } = useAppStore();
  const gtm = state.activeBlueprint ? blueprintGtm[state.activeBlueprint] : null;

  if (!gtm) return null;

  return (
    <Card variant="ghost">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
        Governance context
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">{gtm.problem}</p>
      <p className="mt-2 border-t border-ops-border-subtle pt-2 text-[11px] text-ops-text-dim">
        <span className="text-ops-text-secondary">Custody layer:</span> {gtm.fireblocksRole}
      </p>
    </Card>
  );
}
