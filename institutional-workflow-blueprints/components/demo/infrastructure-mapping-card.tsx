"use client";

import { Card, SectionHeader } from "@/components/ui/primitives";
import {
  APP_TERMS,
  CUSTODY_LAYER_ARCHITECTURE,
  infrastructureMapping,
  integrationReadinessNote,
} from "@/data/infrastructure-mapping";

export function InfrastructureMappingCard({ compact = false }: { compact?: boolean }) {
  const rows = compact ? infrastructureMapping.slice(0, 4) : infrastructureMapping;

  return (
    <Card variant="elevated">
      <SectionHeader
        label="Integration architecture"
        title="Infrastructure mapping"
        subtitle="Workflow Layer → Fireblocks MPC Custody Layer → Blockchain Settlement Rail"
      />

      <div className="mb-3 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
          {CUSTODY_LAYER_ARCHITECTURE.title}
        </p>
        <div className="mt-2 space-y-2">
          {CUSTODY_LAYER_ARCHITECTURE.layers.map((layer, index) => (
            <div key={layer.label} className="flex gap-2">
              <span className="mt-0.5 text-[10px] font-bold text-ops-primary">{index + 1}</span>
              <div>
                <p className="text-xs font-semibold text-ops-text">{layer.label}</p>
                <p className="text-[11px] leading-relaxed text-ops-text-secondary">{layer.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-md border border-ops-border-subtle bg-ops-overlay/50 px-2.5 py-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-ops-text">{row.appConcept}</p>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ops-info">
                → {row.fireblocksConcept}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ops-text-secondary">
              {row.description}
            </p>
            {!compact ? (
              <>
                <p className="mt-1.5 font-mono text-[10px] text-ops-text-dim">{row.apiSurface}</p>
                <p className="mt-1 text-[10px] text-ops-text-dim">{row.sandboxBehavior}</p>
              </>
            ) : null}
          </div>
        ))}
      </div>

      {compact ? (
        <p className="mt-2 text-[10px] text-ops-text-dim">
          + {infrastructureMapping.length - rows.length} more mappings in Policy Admin
        </p>
      ) : null}

      <p className="mt-2.5 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[10px] text-ops-text-secondary">
        {integrationReadinessNote}
      </p>
    </Card>
  );
}

export function InfrastructureMappingLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(APP_TERMS).slice(0, 6).map((term) => (
        <span
          key={term}
          className="rounded border border-ops-border bg-ops-surface px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ops-text-secondary"
        >
          {term}
        </span>
      ))}
    </div>
  );
}
