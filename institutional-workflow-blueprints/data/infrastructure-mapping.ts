export type InfrastructureMappingRow = {
  id: string;
  appConcept: string;
  fireblocksConcept: string;
  description: string;
  apiSurface: string;
  sandboxBehavior: string;
};

/** UI labels aligned with Fireblocks developer vocabulary. */
export const APP_TERMS = {
  vaultAccounts: "Vault Accounts",
  createSettlement: "Create Settlement Request",
  policyWorkflow: "Policy & Approval Workflow",
  transactionAuthorization: "Transaction Authorization",
  auditLogs: "Audit Logs",
  webhookLifecycle: "Webhook Transaction Lifecycle",
  tapPolicy: "TAP / Co-Signer Policy",
  externalTxId: "externalTxId",
} as const;

export const infrastructureMapping: InfrastructureMappingRow[] = [
  {
    id: "vault-accounts",
    appConcept: "Treasury vault balances",
    fireblocksConcept: "Vault Accounts",
    description:
      "Operating liquidity held in Fireblocks MPC vaults. Each account holds asset balances used as transaction sources.",
    apiSurface: "GET /v1/vault/accounts · GET /v1/vault/accounts/{vaultAccountId}",
    sandboxBehavior:
      "Sandbox reads vault account balances into the ops dashboard. Keys and signing never enter this application.",
  },
  {
    id: "create-transaction",
    appConcept: "Initiate settlement",
    fireblocksConcept: "Create Transaction",
    description:
      "An outbound settlement request with asset, amount, destination, and a stable externalTxId for idempotency.",
    apiSurface: "POST /v1/transactions",
    sandboxBehavior:
      "Prototype stores the request locally, evaluates policy, then submits to Fireblocks only after authorization.",
  },
  {
    id: "policy-workflow",
    appConcept: "Policy evaluation",
    fireblocksConcept: "Policy + Approval Workflow",
    description:
      "Business rules in this app (thresholds, allowlists) plus Fireblocks TAP rules at the custody layer.",
    apiSurface: "Transaction Authorization Policy (TAP) · Co-signers",
    sandboxBehavior:
      "App-side rules route exceptions to Transaction Authorization. Fireblocks TAP enforces custody policy on sign.",
  },
  {
    id: "authorization",
    appConcept: "Approval queue",
    fireblocksConcept: "Transaction Authorization",
    description:
      "Human sign-off before a pending transaction is released to Fireblocks for MPC signing and broadcast.",
    apiSurface: "POST /v1/transactions (after approval) · TAP authorization flow",
    sandboxBehavior:
      "Manager authorization triggers Create Transaction in sandbox. Until then, funds remain in vault custody.",
  },
  {
    id: "audit-logs",
    appConcept: "Audit timeline",
    fireblocksConcept: "Audit Logs",
    description:
      "Immutable operational record: request creation, policy outcome, authorization decision, settlement result.",
    apiSurface: "GET /v1/transactions · internal audit export",
    sandboxBehavior:
      "Session audit log mirrors the lifecycle events you would correlate with Fireblocks transaction history.",
  },
  {
    id: "webhooks",
    appConcept: "Settlement status updates",
    fireblocksConcept: "Webhook-driven transaction lifecycle",
    description:
      "Asynchronous status transitions (SUBMITTED → PENDING_SIGNATURE → COMPLETED) pushed from Fireblocks.",
    apiSurface: "POST webhook · TRANSACTION_STATUS_UPDATED",
    sandboxBehavior:
      "Prototype polls status and accepts webhook payloads to update UI badges without manual refresh.",
  },
];

export const integrationReadinessNote =
  "Sandbox prototype — terminology and data shapes match Fireblocks APIs. Live API calls are optional and gated behind Policy Admin.";
