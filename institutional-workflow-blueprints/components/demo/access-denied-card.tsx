"use client";

import { AccessRestrictedPanel } from "@/components/demo/access-restricted-panel";
import {
  getRouteAccessRestriction,
  type AccessRestrictionDetails,
} from "@/lib/auth/access-restriction";
import type { UserRole } from "@/lib/types";

type AccessDeniedCardProps = {
  message?: string;
  role?: UserRole | null;
  restriction?: AccessRestrictionDetails;
  fromPath?: string;
};

/** @deprecated Use AccessRestrictedPanel directly. */
export function AccessDeniedCard({ message, role, restriction, fromPath }: AccessDeniedCardProps) {
  const resolvedRestriction =
    restriction ??
    (fromPath
      ? getRouteAccessRestriction(fromPath)
      : {
          ...getRouteAccessRestriction("/demo"),
          message: message ?? getRouteAccessRestriction("/demo").message,
        });

  return (
    <AccessRestrictedPanel restriction={resolvedRestriction} currentRole={role ?? null} />
  );
}
