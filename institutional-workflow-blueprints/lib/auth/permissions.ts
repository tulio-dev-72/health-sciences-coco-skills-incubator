import type { AuditEvent, Transfer, UserRole } from "@/lib/types";
import { getRouteAccessRestriction } from "@/lib/auth/access-restriction";
import { canAccessRoute, resolveAppRouteKey, type AppRouteKey } from "@/lib/auth/route-access";

export type { AppRouteKey };
export { canAccessRoute, resolveAppRouteKey, getRouteAccessRestriction };

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

export function getAccessDeniedMessage(_role: UserRole | null, pathname: string): string {
  return getRouteAccessRestriction(pathname).message;
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
