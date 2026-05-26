import type { AuditEvent, Transfer, UserRole } from "@/lib/types";

/** Enterprise workflow permissions — Fireblocks TAP remains the custody enforcement layer. */
export function canCreateSettlements(role: UserRole | null): boolean {
  return role === "analyst";
}

export function canViewAllSettlements(role: UserRole | null): boolean {
  return role === "treasury_manager" || role === "admin";
}

export function canViewOwnSettlements(role: UserRole | null): boolean {
  return role === "analyst";
}

export function canApproveTransfers(role: UserRole | null): boolean {
  return role === "treasury_manager";
}

export function canRejectTransfers(role: UserRole | null): boolean {
  return role === "treasury_manager";
}

export function canEscalateSettlements(role: UserRole | null): boolean {
  return role === "treasury_manager";
}

export function canSubmitFireblocksTransactions(role: UserRole | null): boolean {
  return role === "treasury_manager";
}

export function canManagePolicy(role: UserRole | null): boolean {
  return role === "admin";
}

export function canViewAuditLogs(role: UserRole | null): boolean {
  return role === "admin";
}

export function canViewFireblocksIntegrationStatus(role: UserRole | null): boolean {
  return role === "admin";
}

/** Treasury read APIs used during settlement initiation and authorization. */
export function canReadTreasuryOperations(role: UserRole | null): boolean {
  return role === "analyst" || role === "treasury_manager" || role === "admin";
}

export function canViewAuthorizationQueue(role: UserRole | null): boolean {
  return role === "treasury_manager" || role === "admin";
}

export function canSyncFireblocksLifecycle(role: UserRole | null): boolean {
  return role === "treasury_manager" || role === "admin";
}

export function canReadPolicy(role: UserRole | null): boolean {
  return role === "analyst" || role === "treasury_manager" || role === "admin";
}

export type AppRouteKey =
  | "operations"
  | "create"
  | "policy"
  | "approvals"
  | "audit"
  | "settings";

const ROUTE_ACCESS: Record<AppRouteKey, UserRole[]> = {
  operations: ["analyst", "treasury_manager", "admin"],
  create: ["analyst"],
  policy: ["analyst"],
  approvals: ["treasury_manager", "admin"],
  audit: ["admin"],
  settings: ["admin"],
};

export function resolveAppRouteKey(pathname: string): AppRouteKey | null {
  if (pathname === "/demo" || pathname === "/operations") {
    return "operations";
  }
  if (pathname.startsWith("/demo/create")) {
    return "create";
  }
  if (pathname.startsWith("/demo/policy")) {
    return "policy";
  }
  if (pathname.startsWith("/demo/approvals")) {
    return "approvals";
  }
  if (pathname.startsWith("/demo/audit")) {
    return "audit";
  }
  if (pathname.startsWith("/demo/settings")) {
    return "settings";
  }
  return null;
}

export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (!role) {
    return false;
  }

  const routeKey = resolveAppRouteKey(pathname);
  if (!routeKey) {
    return true;
  }

  return ROUTE_ACCESS[routeKey].includes(role);
}

export function getAccessDeniedMessage(role: UserRole | null, pathname: string): string {
  const routeKey = resolveAppRouteKey(pathname);
  if (!role) {
    return "Sign in and select an operational role to continue.";
  }

  switch (routeKey) {
    case "create":
    case "policy":
      return "Only Treasury Analyst can initiate settlement requests.";
    case "approvals":
      return "The authorization queue is limited to Treasury Manager and Platform Admin.";
    case "audit":
      return "Operational audit logs are limited to Platform Admin.";
    case "settings":
      return "Policy and integration administration is limited to Platform Admin.";
    default:
      return "Your role does not have access to this workspace.";
  }
}

export function filterTransfersForRole(transfers: Transfer[], role: UserRole | null): Transfer[] {
  if (!role || canViewAllSettlements(role)) {
    return transfers;
  }

  if (canViewOwnSettlements(role)) {
    return transfers.filter((transfer) => transfer.createdByRole === "analyst");
  }

  return [];
}

export function filterAuditLogForRole(events: AuditEvent[], role: UserRole | null): AuditEvent[] {
  if (canViewAuditLogs(role)) {
    return events;
  }

  return [];
}
