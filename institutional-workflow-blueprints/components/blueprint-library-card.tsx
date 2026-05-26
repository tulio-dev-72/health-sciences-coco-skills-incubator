"use client";

import Link from "next/link";
import type { Blueprint } from "@/lib/types";
import { Card, PrimaryButton } from "@/components/ui/primitives";
import { useAppStore } from "@/lib/store";
import { PRIMARY_BLUEPRINT_ID } from "@/data/primary-scenario";

const SECONDARY_INFRA_LABEL = "Uses same MPC custody + authorization layer";

export function BlueprintLibraryCard({
  blueprint,
  variant = "default",
  onStartPrimaryWorkflow,
}: {
  blueprint: Blueprint;
  variant?: "primary" | "secondary" | "default";
  onStartPrimaryWorkflow?: () => void;
}) {
  const { setActiveBlueprint } = useAppStore();
  const isPrimary = variant === "primary" || blueprint.id === PRIMARY_BLUEPRINT_ID;

  if (isPrimary) {
    return (
      <Card
        variant="accent"
        className="flex h-full flex-col ring-1 ring-ops-primary/10"
      >
        <span className="mb-2 inline-flex w-fit rounded-md bg-ops-primary-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ops-primary">
          Primary operational scenario
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          {blueprint.buyer}
        </p>
        <h2 className="mt-2 text-base font-semibold text-ops-text sm:text-lg">{blueprint.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ops-text-secondary">
          {blueprint.description}
        </p>
        <div className="mt-4 flex-1 rounded-lg border border-ops-border-subtle bg-ops-overlay/60 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ops-text-dim">
            Scenario
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">
            {blueprint.useCase}
          </p>
        </div>
        <PrimaryButton
          type="button"
          className="mt-4 w-full px-4 py-3 text-xs font-bold uppercase tracking-wide"
          onClick={() => {
            setActiveBlueprint(blueprint.id);
            onStartPrimaryWorkflow?.();
          }}
        >
          Start USDC Settlement Workflow
        </PrimaryButton>
      </Card>
    );
  }

  return (
    <article className="rounded-lg border border-ops-border-subtle/70 bg-ops-surface/40 px-3 py-2.5">
      <p className="text-[9px] leading-snug text-ops-text-dim">{SECONDARY_INFRA_LABEL}</p>
      <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-ops-text-dim/80">
        {blueprint.buyer}
      </p>
      <h3 className="mt-1 text-[11px] font-medium text-ops-text-secondary">{blueprint.title}</h3>
      <p className="mt-1 text-[10px] leading-relaxed text-ops-text-dim">{blueprint.description}</p>
      {blueprint.emphasis && blueprint.emphasis.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {blueprint.emphasis.map((item) => (
            <li
              key={item}
              className="rounded bg-ops-overlay/50 px-1.5 py-0.5 text-[9px] text-ops-text-dim ring-1 ring-ops-border-subtle/60"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        href={`/demo/login?blueprint=${blueprint.id}`}
        onClick={() => setActiveBlueprint(blueprint.id)}
        className="mt-2.5 inline-flex min-h-9 items-center text-[10px] font-medium text-ops-text-dim transition hover:text-ops-text-secondary"
      >
        Open module →
      </Link>
    </article>
  );
}
