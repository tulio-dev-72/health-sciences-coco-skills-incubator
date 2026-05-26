"use client";

import { usePathname } from "next/navigation";
import { DemoBottomNav } from "@/components/demo/bottom-nav";
import { useFireblocksStatusSync } from "@/lib/fireblocks/use-fireblocks-status-sync";
import { useAppStore } from "@/lib/store";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sessionReady, effectiveRole } = useAppStore();
  const isLoginPage = pathname === "/demo/login";
  const showShell = sessionReady && effectiveRole !== null && !isLoginPage;

  useFireblocksStatusSync();

  return (
    <div className="min-h-screen bg-ops-bg">
      <div className={`mx-auto min-h-screen min-w-0 max-w-lg md:max-w-2xl xl:max-w-4xl ${showShell ? "pb-24" : ""}`}>
        {children}
      </div>
      {showShell ? <DemoBottomNav /> : null}
    </div>
  );
}
