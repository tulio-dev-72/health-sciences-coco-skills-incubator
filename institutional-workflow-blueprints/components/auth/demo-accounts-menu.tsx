"use client";

import { useEffect, useRef, useState } from "react";

import { DemoAccountsPanel } from "@/components/auth/demo-accounts-panel";
import { SecondaryButton } from "@/components/ui/primitives";

export function DemoAccountsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <SecondaryButton type="button" onClick={() => setOpen((current) => !current)}>
        Demo Accounts
      </SecondaryButton>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-ops-border bg-ops-elevated p-3 shadow-[var(--ops-shadow-md)]">
          <DemoAccountsPanel />
        </div>
      ) : null}
    </div>
  );
}
