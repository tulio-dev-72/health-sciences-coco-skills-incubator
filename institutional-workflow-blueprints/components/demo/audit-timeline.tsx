import type { AuditEvent } from "@/lib/types";
import { formatOperationalTime } from "@/lib/format";
import { getRoleLabel } from "@/lib/store";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const chronological = [...events].reverse();

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-ops-border" />
      {chronological.map((event) => (
        <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
          <span className="absolute left-1 top-1.5 h-2 w-2 rounded-full border-2 border-ops-primary bg-ops-surface" />
          <p className="font-mono text-[11px] tabular-nums text-ops-text-dim">
            {formatOperationalTime(event.timestamp)}
          </p>
          <h3 className="mt-0.5 text-xs font-semibold text-ops-text">{event.action}</h3>
          {event.details ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-ops-text-secondary">
              {event.details}
            </p>
          ) : null}
          <p className="mt-1.5 text-[10px] text-ops-text-dim">
            {event.actor}
            {event.actor !== "Policy Engine" &&
            event.actor !== "Fireblocks API" &&
            event.actor !== "Fireblocks Webhook"
              ? ` · ${getRoleLabel(event.role)}`
              : null}
          </p>
        </div>
      ))}
    </div>
  );
}
