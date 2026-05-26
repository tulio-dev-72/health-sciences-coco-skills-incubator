import "server-only";

import { NextResponse } from "next/server";
import {
  assertOperationalRole,
  requireOperationalUser,
  type OperationalAuthContext,
} from "@/lib/auth/api-auth";
import { getFireblocksIntegrationStatus, isFireblocksConfigured } from "@/lib/fireblocks/config";
import type { UserRole } from "@/lib/types";

export const TREASURY_OPS_ROLES: UserRole[] = ["analyst", "treasury_manager", "admin"];
export const AUTHORIZATION_OPS_ROLES: UserRole[] = ["treasury_manager", "admin"];

export function fireblocksUnavailableResponse() {
  const integration = getFireblocksIntegrationStatus();

  return NextResponse.json(
    {
      error: "Fireblocks offline",
      integrationStatus: integration.integrationStatus,
      message: integration.message,
      configured: false,
    },
    { status: 503 },
  );
}

export function requireFireblocksConfigured() {
  if (!isFireblocksConfigured()) {
    return fireblocksUnavailableResponse();
  }

  return null;
}

export async function requireFireblocksRole(
  allowed: UserRole[],
  message?: string,
): Promise<OperationalAuthContext | { error: NextResponse }> {
  const auth = await requireOperationalUser();
  if ("error" in auth) {
    return auth;
  }

  const roleError = assertOperationalRole(auth.role, allowed, message);
  if (roleError) {
    return { error: roleError };
  }

  return auth;
}
