"use client";

import {
  buildInfrastructureStatus,
  type InfrastructureStatusItem,
} from "@/lib/fireblocks/infrastructure-status";

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
        active ? "bg-ops-success" : "bg-ops-text-dim/40"
      }`}
      aria-hidden
    />
  );
}

function StatusRow({ item }: { item: InfrastructureStatusItem }) {
  return (
    <div className="flex gap-2 rounded-md border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2">
      <StatusDot active={item.active} />
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold ${
            item.active ? "text-ops-success" : "text-ops-text-secondary"
          }`}
        >
          {item.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ops-text-secondary">{item.detail}</p>
      </div>
    </div>
  );
}

type InfrastructureStatusPanelProps = {
  items: InfrastructureStatusItem[];
};

export function InfrastructureStatusPanel({ items }: InfrastructureStatusPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-secondary">
        Infrastructure status
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <StatusRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export { buildInfrastructureStatus };
