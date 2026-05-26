"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountBadge } from "@/components/ui/badges";
import { canManagePolicy } from "@/lib/policy";
import { useAppStore } from "@/lib/store";

const navItems = [
  { href: "/demo", label: "Dashboard", short: "Dash" },
  { href: "/demo/create", label: "Create TX", short: "Create" },
  { href: "/demo/approvals", label: "Authorize", short: "Auth" },
  { href: "/demo/audit", label: "Audit Logs", short: "Logs" },
  { href: "/demo/settings", label: "Admin", short: "Admin", adminOnly: true },
];

export function DemoBottomNav() {
  const pathname = usePathname();
  const { state, effectiveRole } = useAppStore();
  const pendingCount = state.transfers.filter(
    (transfer) => transfer.status === "PENDING_APPROVAL",
  ).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ops-border bg-ops-surface/95 shadow-[0_-4px_24px_rgba(15,39,68,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(env(safe-area-inset-bottom),0.375rem)] pt-1 md:max-w-2xl xl:max-w-4xl">
        {navItems
          .filter((item) => !item.adminOnly || canManagePolicy(effectiveRole))
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/demo" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-2 text-[10px] font-medium transition sm:min-w-[4rem] sm:px-2 ${
                  active
                    ? "bg-ops-primary-muted text-ops-primary"
                    : "text-ops-text-dim hover:bg-ops-overlay hover:text-ops-text-secondary"
                }`}
              >
                <span className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  {item.short}
                  {item.href === "/demo/approvals" ? (
                    <CountBadge count={pendingCount} />
                  ) : null}
                </span>
                <span className="hidden text-[9px] sm:inline">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
