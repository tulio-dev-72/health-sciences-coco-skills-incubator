"use client";

import Link from "next/link";
import { Card, SecondaryButton } from "@/components/ui/primitives";
import { getRoleDestination } from "@/lib/auth/role-destinations";
import { getRoleLabel } from "@/lib/store";
import type { UserRole } from "@/lib/types";

type AccessDeniedCardProps = {
  title?: string;
  message: string;
  role?: UserRole | null;
};

export function AccessDeniedCard({
  title = "Access denied",
  message,
  role,
}: AccessDeniedCardProps) {
  const homeHref = role ? getRoleDestination(role) : "/";

  return (
    <Card variant="accent">
      <p className="text-sm font-semibold text-ops-danger">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ops-text-secondary">{message}</p>
      {role ? (
        <p className="mt-2 text-[11px] font-medium text-ops-text-dim">
          Signed in as {getRoleLabel(role)} — enterprise workflow permissions apply before Fireblocks
          custody release.
        </p>
      ) : null}
      <Link href={homeHref} className="mt-4 block">
        <SecondaryButton type="button" className="w-full">
          Return to your workspace
        </SecondaryButton>
      </Link>
    </Card>
  );
}
