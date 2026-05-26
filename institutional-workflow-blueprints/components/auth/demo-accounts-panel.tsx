"use client";

import { useState } from "react";

import { DEMO_ACCOUNTS, DEMO_SANDBOX_LABEL } from "@/data/demo-accounts";

type DemoAccountsPanelProps = {
  onSelectAccount?: (account: { email: string; password: string }) => void;
  className?: string;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-ops-border bg-ops-surface px-2.5 py-1.5 text-[10px] font-medium text-ops-text-secondary transition hover:text-ops-text"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function DemoAccountsPanel({ onSelectAccount, className = "" }: DemoAccountsPanelProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-warning">
        {DEMO_SANDBOX_LABEL}
      </p>

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <div
            key={account.email}
            className="rounded-lg border border-ops-border-subtle bg-ops-surface/80 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ops-text">{account.roleLabel}</p>
                <p className="mt-0.5 text-[10px] text-ops-text-secondary">{account.description}</p>
              </div>
              {onSelectAccount ? (
                <button
                  type="button"
                  onClick={() =>
                    onSelectAccount({ email: account.email, password: account.password })
                  }
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-ops-primary-muted px-3 py-2 text-[10px] font-semibold text-ops-primary"
                >
                  Use
                </button>
              ) : null}
            </div>

            <div className="mt-2 space-y-1.5 font-mono text-[10px] text-ops-text-secondary">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{account.email}</span>
                <CopyButton value={account.email} label={`${account.roleLabel} email`} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>{account.password}</span>
                <CopyButton value={account.password} label={`${account.roleLabel} password`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
