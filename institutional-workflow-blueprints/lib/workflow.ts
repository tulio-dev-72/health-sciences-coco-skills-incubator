import { APP_TERMS } from "@/data/infrastructure-mapping";

export type WorkflowStepId =
  | "blueprint"
  | "login"
  | "create"
  | "policy"
  | "approval"
  | "audit";

export type WorkflowStep = {
  id: WorkflowStepId;
  label: string;
  shortLabel: string;
  path: string;
  fireblocksConcept: string;
};

export const workflowSteps: WorkflowStep[] = [
  {
    id: "blueprint",
    label: "Operations module",
    shortLabel: "Module",
    path: "/",
    fireblocksConcept: "Use case configuration",
  },
  {
    id: "login",
    label: "Role authentication",
    shortLabel: "Auth",
    path: "/demo/login",
    fireblocksConcept: "Access control",
  },
  {
    id: "create",
    label: APP_TERMS.createSettlement,
    shortLabel: "Create",
    path: "/demo/create",
    fireblocksConcept: "POST /v1/transactions (draft)",
  },
  {
    id: "policy",
    label: APP_TERMS.policyWorkflow,
    shortLabel: "Policy",
    path: "/demo/policy",
    fireblocksConcept: "TAP + business rules",
  },
  {
    id: "approval",
    label: APP_TERMS.transactionAuthorization,
    shortLabel: "Authorize",
    path: "/demo/approvals",
    fireblocksConcept: "Authorization release",
  },
  {
    id: "audit",
    label: APP_TERMS.auditLogs,
    shortLabel: "Logs",
    path: "/demo/audit",
    fireblocksConcept: "Transaction history",
  },
];

export function getWorkflowStepIndex(stepId: WorkflowStepId): number {
  return workflowSteps.findIndex((step) => step.id === stepId);
}

export function getWorkflowStepPath(stepId: WorkflowStepId): string {
  return workflowSteps.find((step) => step.id === stepId)?.path ?? "/";
}

export function getStepFromPath(pathname: string): WorkflowStepId {
  if (pathname === "/") return "blueprint";
  if (pathname.startsWith("/demo/login")) return "login";
  if (pathname.startsWith("/demo/create")) return "create";
  if (pathname.startsWith("/demo/policy")) return "policy";
  if (pathname.startsWith("/demo/approvals")) return "approval";
  if (pathname.startsWith("/demo/audit")) return "audit";
  return "blueprint";
}

export function getLoginRouteForRole(
  _role: "analyst" | "treasury_manager" | "admin",
): { step: WorkflowStepId; path: string } {
  return { step: "create", path: "/demo" };
}
