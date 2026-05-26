import type { UserRole } from "@/lib/types";
import type { WorkflowStepId } from "@/lib/workflow";

/** Existing demo routes — verified in app/demo/** */
export const ROLE_DESTINATIONS: Record<UserRole, string> = {
  analyst: "/demo/create",
  treasury_manager: "/demo/approvals",
  admin: "/demo/settings",
};

export const ROLE_WORKFLOW_STEPS: Record<UserRole, WorkflowStepId> = {
  analyst: "create",
  treasury_manager: "approval",
  admin: "audit",
};

export function getRoleDestination(role: UserRole): string {
  return ROLE_DESTINATIONS[role];
}

export function getRoleWorkflowStep(role: UserRole): WorkflowStepId {
  return ROLE_WORKFLOW_STEPS[role];
}

export function isKnownAppRoute(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/operations") ||
    path.startsWith("/demo") ||
    path.startsWith("/auth")
  );
}
