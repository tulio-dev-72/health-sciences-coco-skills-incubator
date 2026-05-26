"use client";

import { useSearchParams } from "next/navigation";
import { DemoTopBar } from "@/components/demo/top-bar";
import { AccessRestrictedPanel } from "@/components/demo/access-restricted-panel";
import { getRouteAccessRestriction } from "@/lib/auth/access-restriction";
import { useAppStore } from "@/lib/store";

export default function AccessRestrictedPage() {
  const searchParams = useSearchParams();
  const { effectiveRole } = useAppStore();
  const fromPath = searchParams.get("from") ?? "/demo";
  const restriction = getRouteAccessRestriction(fromPath);

  return (
    <>
      <DemoTopBar
        title="Access control"
        subtitle="Enterprise workflow permissions for the Treasury Control Center."
      />
      <main className="ops-page">
        <AccessRestrictedPanel
          restriction={restriction}
          currentRole={effectiveRole}
          returnLabel="Return to authorized workspace"
        />
      </main>
    </>
  );
}
