import { APP_TERMS } from "@/data/infrastructure-mapping";
import type { SettlementLifecycleStepId } from "@/data/settlement-lifecycle";

export type WorkflowStepId = SettlementLifecycleStepId;

export type WorkflowStep = {
  id: WorkflowStepId;
  label: string;
  shortLabel: string;
  path: string;
  fireblocksConcept: string;
};

export const workflowSteps: WorkflowStep[] = [
  {
    id: "create",
    label: APP_TERMS.createSettlement,
    shortLabel: "Request",
    path: "/demo/create",
    fireblocksConcept: "Settlement request draft",
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
    id: "custody",
    label: APP_TERMS.mpcCustodySigning,
    shortLabel: "MPC Custody",
    path: "/demo/approvals",
    fireblocksConcept: "Server-side SDK · POST /v1/transactions",
  },
  {
    id: "webhook",
    label: APP_TERMS.webhookLifecycle,
    shortLabel: "Webhooks",
    path: "/demo/approvals",
    fireblocksConcept: "Fireblocks authorization lifecycle",
  },
  {
    id: "audit",
    label: APP_TERMS.auditLogs,
    shortLabel: "Audit",
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
  if (pathname.startsWith("/demo/create")) return "create";
  if (pathname.startsWith("/demo/policy")) return "policy";
  if (pathname.startsWith("/demo/approvals")) return "approval";
  if (pathname.startsWith("/demo/audit")) return "audit";
  return "create";
}

export function getLoginRouteForRole(
  _role: "analyst" | "treasury_manager" | "admin",
): { step: WorkflowStepId; path: string } {
  return { step: "create", path: "/demo" };
}

const LEGACY_WORKFLOW_STEPS: Record<string, WorkflowStepId> = {
  blueprint: "create",
  login: "create",
};

/** Normalize persisted or legacy workflow step ids. */
export function normalizeWorkflowStep(step: string | null | undefined): WorkflowStepId {
  if (!step) {
    return "create";
  }

  if (step in LEGACY_WORKFLOW_STEPS) {
    return LEGACY_WORKFLOW_STEPS[step];
  }

  if (workflowSteps.some((item) => item.id === step)) {
    return step as WorkflowStepId;
  }

  return "create";
}
