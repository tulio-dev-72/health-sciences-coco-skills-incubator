"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { DemoBottomNav } from "@/components/demo/bottom-nav";
import { DemoRouteGuard } from "@/components/demo/route-guard";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { useFireblocksStatusSync } from "@/lib/fireblocks/use-fireblocks-status-sync";
import { ACCESS_PORTAL } from "@/lib/supabase/routes";
import { useAppStore } from "@/lib/store";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionReady, effectiveRole } = useAppStore();
  const isLoginPage = pathname === "/demo/login";
  const showShell = sessionReady && effectiveRole !== null && !isLoginPage;

  useFireblocksStatusSync();

  useEffect(() => {
    if (sessionReady && !effectiveRole && !isLoginPage) {
      router.replace(ACCESS_PORTAL);
    }
  }, [sessionReady, effectiveRole, isLoginPage, router]);

  if (!sessionReady) {
    return <PageLoadingState label="Loading operational workspace…" />;
  }

  if (!effectiveRole && !isLoginPage) {
    return <PageLoadingState label="Returning to access portal…" />;
  }

  return (
    <div className="min-h-screen bg-ops-bg">
      <div className={`mx-auto min-h-screen min-w-0 max-w-lg md:max-w-2xl xl:max-w-4xl ${showShell ? "pb-24" : ""}`}>
        <DemoRouteGuard>{children}</DemoRouteGuard>
      </div>
      {showShell ? <DemoBottomNav /> : null}
    </div>
  );
}
