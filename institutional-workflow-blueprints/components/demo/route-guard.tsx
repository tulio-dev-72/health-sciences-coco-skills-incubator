"use client";

import { usePathname } from "next/navigation";
import { AccessDeniedCard } from "@/components/demo/access-denied-card";
import { canAccessRoute, getAccessDeniedMessage } from "@/lib/auth/permissions";
import { useAppStore } from "@/lib/store";

export function DemoRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { effectiveRole, sessionReady } = useAppStore();

  if (!sessionReady || !effectiveRole) {
    return children;
  }

  if (canAccessRoute(effectiveRole, pathname)) {
    return children;
  }

  return (
    <main className="ops-page">
      <AccessDeniedCard
        message={getAccessDeniedMessage(effectiveRole, pathname)}
        role={effectiveRole}
      />
    </main>
  );
}
