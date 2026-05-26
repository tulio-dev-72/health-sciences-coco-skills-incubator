import { Card, SectionHeader } from "@/components/ui/primitives";

const BOUNDARY_POINTS = [
  "This application never stores private keys or performs MPC signing.",
  "Fireblocks Vault Accounts hold sandbox assets under MPC-secured custody.",
  "Fireblocks handles MPC-secured signing inside the custody/signing boundary.",
  "Approved settlements use server-side SDK transaction orchestration via the Fireblocks API.",
  "Webhook events reflect the Fireblocks authorization lifecycle — not simulated UI state.",
] as const;

export function MpcCustodyBoundaryPanel({ compact = false }: { compact?: boolean }) {
  return (
    <Card variant="accent" className={compact ? "" : "mb-4"}>
      <SectionHeader
        label="Custody / signing boundary"
        title="MPC Custody Boundary"
        subtitle="This app orchestrates enterprise workflow around the Fireblocks custody layer — it does not implement MPC itself."
      />

      <ul className="space-y-2">
        {BOUNDARY_POINTS.map((point) => (
          <li key={point} className="flex gap-2 text-[11px] leading-relaxed text-ops-text-secondary">
            <span className="text-ops-accent">·</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {!compact ? (
        <p className="mt-3 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[10px] text-ops-text-dim">
          Workflow decisions happen in this app. MPC-secured custody, signing, and on-chain
          settlement execution remain inside Fireblocks infrastructure.
        </p>
      ) : null}
    </Card>
  );
}
