"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoTopBar } from "@/components/demo/top-bar";
import {
  Card,
  DangerButton,
  InputLabel,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  TextInput,
} from "@/components/ui/primitives";
import { InfrastructureMappingCard } from "@/components/demo/infrastructure-mapping-card";
import { FundTreasuryMainPanel } from "@/components/demo/fund-treasury-main-panel";
import { MpcCustodyBoundaryPanel } from "@/components/demo/mpc-custody-boundary-panel";
import { FireblocksIntegrationPanel } from "@/components/demo/fireblocks-panel";
import { canManagePolicy } from "@/lib/policy";
import { truncateAddress } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    state,
    sessionReady,
    effectiveRole,
    updatePolicy,
    addWhitelistAddress,
    removeWhitelistAddress,
    resetSession,
  } = useAppStore();
  const [threshold, setThreshold] = useState(String(state.policy.approvalThreshold));
  const [newAddress, setNewAddress] = useState("");
  const canManage = canManagePolicy(effectiveRole);

  if (!sessionReady) {
    return (
      <>
        <DemoTopBar title="Policy admin" subtitle="Governance rules and custody configuration." />
        <main className="px-3 py-3">
          <Card variant="ghost">
            <p className="text-xs text-ops-text-secondary">Loading session…</p>
          </Card>
        </main>
      </>
    );
  }

  if (!canManage) {
    return (
      <>
        <DemoTopBar title="Policy admin" subtitle="Governance rules and custody configuration." />
        <main className="px-3 py-3">
          <Card variant="accent">
            <p className="text-xs font-medium text-ops-warning">Elevated access required.</p>
            <p className="mt-1 text-[11px] text-ops-text-secondary">
              Admin role required to modify policy and Fireblocks settings.
            </p>
            <Link
              href="/demo?role=admin"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[var(--ops-shadow-sm)] transition hover:bg-ops-primary-hover"
            >
              Authenticate as admin
            </Link>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <DemoTopBar
        title="Policy admin"
        subtitle="Business rules in this app. Fireblocks TAP governs custody policy."
      />

      <main className="ops-page">
        <Card variant="elevated">
          <SectionHeader
            label="Governance"
            title="Authorization threshold"
            subtitle="Amounts above this value require manager sign-off."
          />
          <InputLabel htmlFor="threshold">Threshold (USD equivalent)</InputLabel>
          <TextInput
            id="threshold"
            inputMode="numeric"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
          />
          <PrimaryButton
            className="mt-3 w-full"
            onClick={() => {
              const nextThreshold = Number(threshold.replace(/,/g, ""));
              if (!nextThreshold) return;
              updatePolicy({ approvalThreshold: nextThreshold });
            }}
          >
            Save threshold
          </PrimaryButton>
        </Card>

        <Card variant="elevated">
          <SectionHeader
            label="Allowlist"
            title="Approved vendors"
            subtitle="Trusted recipients bypass exception routing."
          />

          <div className="space-y-2">
            {state.policy.whitelistedAddresses.map((address) => (
              <div
                key={address}
                className="flex items-center justify-between gap-2 rounded-lg border border-ops-border-subtle bg-ops-overlay/40 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ops-text">{truncateAddress(address)}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-ops-text-dim">
                    {address}
                  </p>
                </div>
                <DangerButton onClick={() => removeWhitelistAddress(address)}>Remove</DangerButton>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <InputLabel htmlFor="newAddress">Add wallet</InputLabel>
            <TextInput
              id="newAddress"
              placeholder="0x…"
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
            />
            <SecondaryButton
              className="mt-2 w-full"
              onClick={() => {
                if (!newAddress.trim()) return;
                addWhitelistAddress(newAddress.trim());
                setNewAddress("");
              }}
            >
              Add to allowlist
            </SecondaryButton>
          </div>
        </Card>

        <MpcCustodyBoundaryPanel compact />

        <FundTreasuryMainPanel />

        <FireblocksIntegrationPanel />

        <InfrastructureMappingCard />

        <Card variant="accent">
          <SectionHeader
            label="Session"
            title="Reset environment"
            subtitle="Clear transactions, audit events, and restore vault state."
          />
          <DangerButton className="w-full" onClick={resetSession}>
            Reset session
          </DangerButton>
        </Card>
      </main>
    </>
  );
}
