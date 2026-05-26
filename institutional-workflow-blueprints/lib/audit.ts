/** Audit log action labels — operational treasury vocabulary. */
export const AUDIT_ACTIONS = {
  settlementInitiated: "Analyst initiated settlement",
  policyEvaluated: "Policy workflow evaluated",
  authorizationQueued: "Settlement pending authorization",
  managerAuthorized: "Treasury Manager authorized settlement",
  settlementRejected: "Settlement rejected",
  fireblocksTransactionCreated: "Fireblocks transaction created",
  webhookStatusUpdated: "Settlement lifecycle updated",
  settlementCompleted: "Settlement completed",
  tapPolicyUpdated: "TAP policy configuration updated",
  allowlistUpdated: "Destination allowlist updated",
  /** @deprecated Legacy labels — kept for migrated sessions */
  settlementRequestCreated: "Analyst initiated settlement",
  policyWorkflowEvaluated: "Policy workflow evaluated",
  authorizationSubmitted: "Settlement pending authorization",
  transactionAuthorized: "Treasury Manager authorized settlement",
  transactionRejected: "Settlement rejected",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const APPROVAL_THRESHOLD = 10000;

export const HIGH_VALUE_THRESHOLD = 100_000;
