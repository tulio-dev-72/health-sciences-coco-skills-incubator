"use client";

import Link from "next/link";
import { DemoTopBar } from "@/components/demo/top-bar";
import { DemoGuideCard, UseCaseContextCard } from "@/components/demo/demo-guide-card";
import { InfrastructureMappingCard } from "@/components/demo/infrastructure-mapping-card";
import { OpsCommandCard } from "@/components/demo/ops-command-card";
import { PoweredByFireblocksCard } from "@/components/demo/powered-by-fireblocks-card";
import { TreasuryMainVaultCard } from "@/components/demo/treasury-main-vault-card";
import { TransferCard } from "@/components/demo/transfer-card";
import { APP_TERMS } from "@/data/infrastructure-mapping";
import { Card, SectionHeader, StatTile } from "@/components/ui/primitives";
import { filterTransfersForRole } from "@/lib/policy";
import { useAppStore } from "@/lib/store";

export default function DemoDashboardPage() {
  const { state, effectiveRole } = useAppStore();
  const visibleTransfers = filterTransfersForRole(state.transfers, effectiveRole);

  const pendingPayouts = visibleTransfers.filter((t) => t.status === "PENDING_APPROVAL");
  const clearedToday = visibleTransfers.filter(
    (t) => t.status === "SETTLED" || t.status === "APPROVED",
  );
  const riskAlerts = visibleTransfers.filter(
    (t) =>
      t.riskLevel === "high" &&
      (t.status === "PENDING_APPROVAL" || t.status === "CREATED"),
  );

  return (
    <>
      <DemoTopBar
        title="Operations dashboard"
        subtitle="Vault accounts, transaction authorization queue, and policy exceptions."
      />

      <main className="ops-page">
        <OpsCommandCard />
        <UseCaseContextCard />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatTile label="Pending authorization" value={pendingPayouts.length} accent />
          <StatTile label="Settled" value={clearedToday.length} />
        </div>

        <section>
          <SectionHeader
            label="Authorization"
            title={APP_TERMS.transactionAuthorization}
            subtitle={`${pendingPayouts.length} transaction(s) require authorization.`}
            action={
              <Link href="/demo/approvals" className="text-xs font-medium text-ops-primary">
                Review →
              </Link>
            }
          />
          {pendingPayouts.length === 0 ? (
            <Card variant="ghost">
              <p className="text-xs text-ops-text-secondary">No items awaiting release.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingPayouts.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          )}
        </section>

        {clearedToday.length > 0 ? (
          <section>
            <SectionHeader
            label="Settlement"
            title="Completed transactions"
              subtitle="Auto-approved or settled prior to current review."
            />
            <div className="space-y-2">
              {clearedToday.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader
            label="Custody"
            title={APP_TERMS.vaultAccounts}
            subtitle="Treasury Main balances from Fireblocks SDK — not mock ledger data."
          />
          <TreasuryMainVaultCard />
        </section>

        {riskAlerts.length > 0 ? (
          <section>
            <SectionHeader
              label="Policy"
              title="Exceptions"
              subtitle="Blocked from automated release."
            />
            <div className="space-y-2">
              {riskAlerts.map((transfer) => (
                <Card key={transfer.id} variant="accent">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ops-danger">
                    Policy exception
                  </p>
                  <p className="mt-1 text-xs font-medium text-ops-text">
                    {transfer.id} · {transfer.destinationLabel}
                  </p>
                  <p className="mt-1 text-[11px] text-ops-text-secondary">{transfer.reason}</p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <InfrastructureMappingCard compact />
        <PoweredByFireblocksCard compact />
        <DemoGuideCard />
      </main>
    </>
  );
}
