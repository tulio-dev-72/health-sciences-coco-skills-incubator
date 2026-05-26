"use client";

import { usePathname } from "next/navigation";
import { AccessRestrictedPanel } from "@/components/demo/access-restricted-panel";
import { getRouteAccessRestriction } from "@/lib/auth/access-restriction";
import { canAccessRoute } from "@/lib/auth/permissions";
import { useAppStore } from "@/lib/store";

export function DemoRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { effectiveRole, sessionReady } = useAppStore();

  if (!sessionReady || !effectiveRole || pathname.startsWith("/demo/access-restricted")) {
    return children;
  }

  if (canAccessRoute(effectiveRole, pathname)) {
    return children;
  }

  return (
    <main className="ops-page">
      <AccessRestrictedPanel
        restriction={getRouteAccessRestriction(pathname)}
        currentRole={effectiveRole}
      />
    </main>
  );
}
