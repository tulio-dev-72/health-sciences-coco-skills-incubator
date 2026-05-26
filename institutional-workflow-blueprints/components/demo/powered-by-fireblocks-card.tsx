"use client";

import { LiveBadge } from "@/components/ui/badges";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { useFireblocksConnection } from "@/lib/fireblocks/use-fireblocks-connection";

const fireblocksCapabilities = [
  { title: "Custody", detail: "MPC vaults — assets held in qualified institutional custody." },
  { title: "TAP policy", detail: "Co-signers and custody rules enforced before signing." },
  { title: "Settlement", detail: "Approved payouts signed and broadcast from vaults." },
  { title: "Network", detail: "Counterparty connectivity across digital asset rails." },
];

export function PoweredByFireblocksCard({ compact = false }: { compact?: boolean }) {
  const { connected, status } = useFireblocksConnection();

  return (
    <Card variant="elevated">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <SectionHeader
            label="Infrastructure"
            title="Fireblocks custody"
            subtitle={
              compact
                ? "Signing and settlement run on Fireblocks infrastructure."
                : "Business approval in this app. Custody, policy, and settlement on Fireblocks."
            }
          />
        </div>
        <LiveBadge live={connected} />
      </div>

      <div className="grid gap-1.5">
        {fireblocksCapabilities.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-ops-border-subtle bg-ops-overlay/50 px-2.5 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ops-primary">
              {item.title}
            </p>
            <p className="mt-0.5 text-[11px] text-ops-text-secondary">{item.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-2.5 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2 text-[11px] text-ops-text-secondary">
        Real Fireblocks sandbox infrastructure using test assets, not mainnet funds.{" "}
        {connected ? (
          <>
            <span className="font-medium text-ops-text">Fireblocks connected.</span> Treasury Main
            vault ID{" "}
            {status.treasuryMainVaultId ? (
              <span className="font-mono text-ops-text">{status.treasuryMainVaultId}</span>
            ) : (
              "is discovered from the SDK at runtime."
            )}
          </>
        ) : (
          <>
            <span className="font-medium text-ops-text">Fireblocks offline.</span>{" "}
            {status.message}
          </>
        )}
      </p>
    </Card>
  );
}
