"use client";

import Link from "next/link";
import { RoleBadge } from "@/components/ui/badges";
import { Card, SecondaryButton } from "@/components/ui/primitives";
import {
  ACCESS_RESTRICTED_TITLE,
  WORKFLOW_ARCHITECTURE_NOTE,
  type AccessRestrictionDetails,
} from "@/lib/auth/access-restriction";
import { getRoleDestination } from "@/lib/auth/role-destinations";
import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/lib/types";

type AccessRestrictedPanelProps = {
  restriction: AccessRestrictionDetails;
  currentRole: UserRole | null;
  returnHref?: string;
  returnLabel?: string;
};

export function AccessRestrictedPanel({
  restriction,
  currentRole,
  returnHref,
  returnLabel = "Return to your workspace",
}: AccessRestrictedPanelProps) {
  const homeHref = returnHref ?? (currentRole ? getRoleDestination(currentRole) : "/");

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="border-b border-ops-border bg-ops-overlay/40 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ops-text-dim">
          Treasury Control Center
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ops-text">
          {restriction.title}
        </h1>
      </div>

      <div className="space-y-4 px-4 py-5">
        <p className="text-sm leading-relaxed text-ops-text-secondary">{restriction.message}</p>

        <div className="grid gap-3 rounded-lg border border-ops-border bg-ops-surface p-3 shadow-[var(--ops-shadow-sm)] sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ops-text-dim">
              Current role
            </p>
            <div className="mt-2">
              {currentRole ? (
                <RoleBadge role={currentRole} />
              ) : (
                <span className="text-sm font-medium text-ops-text-secondary">Unauthenticated</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ops-text-dim">
              Required role
            </p>
            <p className="mt-2 text-sm font-semibold text-ops-text">{restriction.requiredRoleLabel}</p>
          </div>
        </div>

        <div className="rounded-lg border border-ops-border-subtle bg-ops-overlay/30 px-3 py-3">
          <p className="text-[11px] leading-relaxed text-ops-text-secondary">
            {WORKFLOW_ARCHITECTURE_NOTE}
          </p>
        </div>

        {currentRole ? (
          <p className="text-[11px] text-ops-text-dim">
            Signed in as {getRoleLabel(currentRole)}. Contact your platform administrator if you
            need an operational role change.
          </p>
        ) : null}

        <Link href={homeHref} className="block">
          <SecondaryButton type="button" className="w-full">
            {returnLabel}
          </SecondaryButton>
        </Link>
      </div>
    </Card>
  );
}
