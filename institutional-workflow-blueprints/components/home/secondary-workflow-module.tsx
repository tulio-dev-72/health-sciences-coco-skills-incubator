"use client";

import Link from "next/link";
import type { Blueprint } from "@/lib/types";
import { useAppStore } from "@/lib/store";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-2 border-b border-ops-border-subtle/80 py-1 last:border-0">
      <span className="text-[10px] text-ops-text-dim">{label}</span>
      <span className="text-right text-[10px] font-medium text-ops-text">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded bg-ops-success-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ops-success">
      {status}
    </span>
  );
}

export function SecondaryWorkflowModule({ blueprint }: { blueprint: Blueprint }) {
  const { setActiveBlueprint } = useAppStore();
  const meta = blueprint.operationalMeta;

  return (
    <article className="rounded-lg border border-ops-border bg-ops-surface shadow-[var(--ops-shadow-sm)]">
      <div className="flex items-start justify-between gap-2 border-b border-ops-border-subtle px-3 py-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Workflow module
          </p>
          <h3 className="mt-0.5 text-xs font-semibold text-ops-text">{blueprint.title}</h3>
          <p className="mt-0.5 text-[10px] text-ops-text-secondary">{blueprint.buyer}</p>
        </div>
        {meta ? <StatusPill status={meta.status} /> : null}
      </div>

      {meta ? (
        <div className="border-b border-ops-border-subtle px-3 py-1.5">
          <MetaRow label="Settlement Rail" value={meta.settlementRail} />
          <MetaRow label="Custody Layer" value={meta.custodyLayer} />
          <MetaRow label="Workflow Type" value={meta.workflowType} />
          <MetaRow label="Integration" value={meta.integration} />
        </div>
      ) : null}

      <div className="px-3 py-2">
        <p className="text-[10px] leading-snug text-ops-text-secondary">{blueprint.description}</p>
        {blueprint.emphasis && blueprint.emphasis.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {blueprint.emphasis.map((item) => (
              <li key={item} className="flex gap-1.5 text-[10px] text-ops-text-secondary">
                <span className="text-ops-text-dim">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="border-t border-ops-border-subtle px-3 py-2">
        <Link
          href={`/demo/login?blueprint=${blueprint.id}`}
          onClick={() => setActiveBlueprint(blueprint.id)}
          className="inline-flex min-h-9 w-full items-center justify-between text-[10px] font-semibold text-ops-primary transition hover:text-ops-primary-hover"
        >
          <span>{blueprint.actionLabel ?? "View Workflow"}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
