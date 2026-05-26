"use client";

import Link from "next/link";
import { DemoTopBar } from "@/components/demo/top-bar";
import { DemoGuideCard, UseCaseContextCard } from "@/components/demo/demo-guide-card";
import { InfrastructureMappingCard } from "@/components/demo/infrastructure-mapping-card";
import { OpsCommandCard } from "@/components/demo/ops-command-card";
import { PoweredByFireblocksCard } from "@/components/demo/powered-by-fireblocks-card";
import { TransferCard } from "@/components/demo/transfer-card";
import { APP_TERMS } from "@/data/infrastructure-mapping";
import { Card, SectionHeader, StatTile } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export default function DemoDashboardPage() {
  const { state } = useAppStore();

  const pendingPayouts = state.transfers.filter((t) => t.status === "PENDING_APPROVAL");
  const clearedToday = state.transfers.filter(
    (t) => t.status === "SETTLED" || t.status === "APPROVED",
  );
  const riskAlerts = state.transfers.filter(
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

      <main className="space-y-3 px-3 py-3">
        <OpsCommandCard />
        <UseCaseContextCard />

        <div className="grid grid-cols-2 gap-2">
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
            subtitle="Available liquidity in Fireblocks custody."
          />
          <div className="space-y-2">
            {state.vaultBalances.map((vault) => (
              <Card key={`${vault.asset}-${vault.label}`} variant="elevated">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ops-text-dim">
                      {vault.label}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold tabular-nums text-ops-text">
                      {formatCurrency(vault.available, vault.asset)}
                    </h3>
                    <p className="text-[11px] text-ops-text-secondary">
                      Total {formatCurrency(vault.balance, vault.asset)}
                    </p>
                  </div>
                  <span className="rounded-md bg-ops-primary-muted px-1.5 py-0.5 font-mono text-[10px] text-ops-primary ring-1 ring-ops-primary/10">
                    {vault.asset}
                  </span>
                </div>
                {vault.pendingOut > 0 ? (
                  <p className="mt-2 border-t border-ops-border-subtle pt-2 text-[11px] text-ops-warning">
                    {formatCurrency(vault.pendingOut, vault.asset)} held pending authorization
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
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
