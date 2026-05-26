import { NextResponse } from "next/server";
import { resolveAppRouteKey } from "@/lib/auth/route-access";
import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/lib/types";

export const ACCESS_RESTRICTED_TITLE = "Access Restricted";

export const WORKFLOW_ARCHITECTURE_NOTE =
  "App roles govern enterprise workflow orchestration. Fireblocks remains the enforcement layer for MPC custody, signing, transaction authorization, and infrastructure policy enforcement.";

export type AccessRestrictionDetails = {
  title: typeof ACCESS_RESTRICTED_TITLE;
  message: string;
  requiredRoles: UserRole[];
  requiredRoleLabel: string;
};

export type AccessRestrictedPayload = {
  error: string;
  code: "ACCESS_RESTRICTED";
  requiredRoles: UserRole[];
  requiredRoleLabel: string;
  currentRole?: UserRole;
};

export function formatRequiredRolesLabel(roles: UserRole[]): string {
  return roles.map(getRoleLabel).join(" or ");
}

export function getRouteAccessRestriction(pathname: string): AccessRestrictionDetails {
  const routeKey = resolveAppRouteKey(pathname);

  switch (routeKey) {
    case "create":
    case "policy":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Treasury Analyst privileges are required to initiate settlement requests.",
        requiredRoles: ["analyst"],
        requiredRoleLabel: formatRequiredRolesLabel(["analyst"]),
      };
    case "approvals":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Treasury Manager authorization is required for settlement release.",
        requiredRoles: ["treasury_manager", "admin"],
        requiredRoleLabel: formatRequiredRolesLabel(["treasury_manager", "admin"]),
      };
    case "audit":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Platform Admin privileges are required to review operational audit logs.",
        requiredRoles: ["admin"],
        requiredRoleLabel: formatRequiredRolesLabel(["admin"]),
      };
    case "settings":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Platform Admin privileges required for governance configuration.",
        requiredRoles: ["admin"],
        requiredRoleLabel: formatRequiredRolesLabel(["admin"]),
      };
    default:
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Your current operational role cannot access this workspace.",
        requiredRoles: ["analyst", "treasury_manager", "admin"],
        requiredRoleLabel: "Authorized enterprise role",
      };
  }
}

export function getActionAccessRestriction(action: string, requiredRoles: UserRole[]): AccessRestrictionDetails {
  const requiredRoleLabel = formatRequiredRolesLabel(requiredRoles);

  switch (action) {
    case "create_settlement":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Only Treasury Analyst can create settlement requests.",
        requiredRoles,
        requiredRoleLabel,
      };
    case "authorize_settlement":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Treasury Manager authorization is required for settlement release.",
        requiredRoles,
        requiredRoleLabel,
      };
    case "manage_governance":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Platform Admin privileges required for governance configuration.",
        requiredRoles,
        requiredRoleLabel,
      };
    case "view_audit":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Platform Admin privileges are required to review operational audit logs.",
        requiredRoles,
        requiredRoleLabel,
      };
    case "fireblocks_submit":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Treasury Manager authorization is required before Fireblocks custody transaction submission.",
        requiredRoles,
        requiredRoleLabel,
      };
    case "integration_status":
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Platform Admin privileges are required to review Fireblocks integration and webhook status.",
        requiredRoles,
        requiredRoleLabel,
      };
    default:
      return {
        title: ACCESS_RESTRICTED_TITLE,
        message: "Access restricted for your operational role.",
        requiredRoles,
        requiredRoleLabel,
      };
  }
}

export function accessRestrictedResponse(input: {
  message: string;
  requiredRoles: UserRole[];
  currentRole?: UserRole;
}): NextResponse {
  const body: AccessRestrictedPayload = {
    error: input.message,
    code: "ACCESS_RESTRICTED",
    requiredRoles: input.requiredRoles,
    requiredRoleLabel: formatRequiredRolesLabel(input.requiredRoles),
    currentRole: input.currentRole,
  };

  return NextResponse.json(body, { status: 403 });
}

export function isAccessRestrictedPayload(value: unknown): value is AccessRestrictedPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<AccessRestrictedPayload>;
  return payload.code === "ACCESS_RESTRICTED" && typeof payload.error === "string";
}
