import type { UserRole } from "@/lib/types";

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

  if (pathname.startsWith("/demo/access-restricted")) {
    return true;
  }

  const routeKey = resolveAppRouteKey(pathname);
  if (!routeKey) {
    return true;
  }

  return ROUTE_ACCESS[routeKey].includes(role);
}

export function getAllowedRolesForRoute(pathname: string): UserRole[] {
  const routeKey = resolveAppRouteKey(pathname);
  if (!routeKey) {
    return ["analyst", "treasury_manager", "admin"];
  }
  return ROUTE_ACCESS[routeKey];
}
