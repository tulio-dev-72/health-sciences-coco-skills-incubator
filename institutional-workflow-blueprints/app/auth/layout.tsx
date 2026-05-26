import Link from "next/link";

import { DemoAccountsMenu } from "@/components/auth/demo-accounts-menu";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <header className="border-b border-ops-border bg-ops-surface/90 shadow-[var(--ops-shadow-sm)]">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 px-4 py-4 sm:max-w-lg sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-text-dim">
              Treasury Control Center
            </p>
            <p className="text-sm font-semibold text-ops-text">Institutional access</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DemoAccountsMenu />
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-xs text-ops-text-secondary hover:text-ops-primary"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-lg sm:px-6">{children}</main>
    </div>
  );
}
