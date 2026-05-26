import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <header className="border-b border-ops-border bg-ops-surface/90 shadow-[var(--ops-shadow-sm)]">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ops-text">
            Treasury Control Center
          </Link>
          <Link href="/" className="text-xs text-ops-text-secondary hover:text-ops-primary">
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
