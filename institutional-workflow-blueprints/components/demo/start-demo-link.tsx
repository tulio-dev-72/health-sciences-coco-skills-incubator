"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/ui/primitives";
import { useAppStore } from "@/lib/store";

export function StartDemoLink({
  href = "/demo/create?role=analyst",
  blueprintId = "stablecoin-payouts",
  children,
  className = "",
  onStart,
}: {
  href?: string;
  blueprintId?: string;
  children: React.ReactNode;
  className?: string;
  onStart?: () => void;
}) {
  const { setActiveBlueprint } = useAppStore();

  if (onStart) {
    return (
      <PrimaryButton
        type="button"
        className={className}
        onClick={() => {
          setActiveBlueprint(blueprintId);
          onStart();
        }}
      >
        {children}
      </PrimaryButton>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={() => setActiveBlueprint(blueprintId)}
    >
      <PrimaryButton type="button" className="w-full">
        {children}
      </PrimaryButton>
    </Link>
  );
}
