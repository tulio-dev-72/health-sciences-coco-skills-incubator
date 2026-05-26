"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountBadge } from "@/components/ui/badges";
import { canViewAuthorizationQueue, filterTransfersForRole } from "@/lib/policy";
import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

const navItems: Array<{
  href: string;
  label: string;
  short: string;
  roles: UserRole[];
}> = [
  { href: "/demo", label: "Operations", short: "Ops", roles: ["analyst", "treasury_manager", "admin"] },
  { href: "/demo/create", label: "Initiate", short: "Init", roles: ["analyst"] },
  { href: "/demo/approvals", label: "Authorize", short: "Auth", roles: ["treasury_manager", "admin"] },
  { href: "/demo/audit", label: "Audit trail", short: "Audit", roles: ["admin"] },
  { href: "/demo/settings", label: "Governance", short: "Gov", roles: ["admin"] },
];

export function DemoBottomNav() {
  const pathname = usePathname();
  const { state, effectiveRole } = useAppStore();
  const visibleTransfers = filterTransfersForRole(state.transfers, effectiveRole);
  const pendingCount = visibleTransfers.filter(
    (transfer) => transfer.status === "PENDING_APPROVAL",
  ).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ops-border bg-ops-surface shadow-[0_-6px_28px_rgba(4,16,24,0.12)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-0.5 pb-[max(env(safe-area-inset-bottom),0.375rem)] pt-1 md:max-w-2xl xl:max-w-4xl">
        {navItems
          .filter((item) => effectiveRole && item.roles.includes(effectiveRole))
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/demo" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-bold transition ${
                  active
                    ? "bg-ops-primary-muted text-ops-primary ring-1 ring-ops-primary/20"
                    : "text-ops-text-secondary hover:bg-ops-overlay hover:text-ops-text"
                }`}
              >
                <span className="flex items-center gap-0.5 text-[10px] uppercase tracking-wide">
                  {item.short}
                  {item.href === "/demo/approvals" && canViewAuthorizationQueue(effectiveRole) ? (
                    <CountBadge count={pendingCount} />
                  ) : null}
                </span>
                <span className="hidden truncate text-[9px] font-medium normal-case sm:inline">
                  {item.label}
                </span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
