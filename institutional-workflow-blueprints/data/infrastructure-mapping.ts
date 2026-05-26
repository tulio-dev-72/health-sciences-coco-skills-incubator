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
  createSettlement: "Settlement Request",
  policyWorkflow: "Policy Workflow",
  transactionAuthorization: "Transaction Authorization",
  mpcCustodySigning: "Fireblocks MPC Custody + Signing",
  webhookLifecycle: "Webhook Lifecycle Updates",
  auditLogs: "Audit Timeline",
  tapPolicy: "TAP / Co-Signer Policy",
  externalTxId: "externalTxId",
} as const;

export const CUSTODY_LAYER_ARCHITECTURE = {
  title: "Custody Layer",
  layers: [
    {
      label: "Workflow Layer",
      detail: "Settlement request, policy workflow, and transaction authorization in this app.",
    },
    {
      label: "Fireblocks MPC Custody Layer",
      detail:
        "MPC-secured custody, server-side SDK transaction orchestration, and the custody/signing boundary.",
    },
    {
      label: "Blockchain Settlement Rail",
      detail: "On-chain broadcast and confirmation after Fireblocks authorization lifecycle completion.",
    },
  ],
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
    appConcept: APP_TERMS.createSettlement,
    fireblocksConcept: "Create Transaction",
    description:
      "An outbound settlement request with asset, amount, destination, and a stable externalTxId for idempotency.",
    apiSurface: "POST /v1/transactions",
    sandboxBehavior:
      "The app stores the request locally, evaluates policy, then orchestrates Fireblocks submission only after authorization.",
  },
  {
    id: "policy-workflow",
    appConcept: APP_TERMS.policyWorkflow,
    fireblocksConcept: "Policy + Approval Workflow",
    description:
      "Business rules in this app (thresholds, allowlists) plus Fireblocks TAP rules at the custody layer.",
    apiSurface: "Transaction Authorization Policy (TAP) · Co-signers",
    sandboxBehavior:
      "App-side rules route exceptions to Transaction Authorization. Fireblocks TAP enforces custody policy on sign.",
  },
  {
    id: "authorization",
    appConcept: APP_TERMS.transactionAuthorization,
    fireblocksConcept: "Transaction Authorization",
    description:
      "Human sign-off before a pending transaction is released across the custody/signing boundary.",
    apiSurface: "POST /v1/transactions (after approval) · TAP authorization flow",
    sandboxBehavior:
      "Manager authorization triggers server-side SDK transaction orchestration. Until then, funds remain in vault custody.",
  },
  {
    id: "mpc-custody",
    appConcept: "Custody / signing boundary",
    fireblocksConcept: APP_TERMS.mpcCustodySigning,
    description:
      "This app does not implement MPC. Approved payouts are handed to Fireblocks MPC-secured custody for signing and broadcast.",
    apiSurface: "POST /v1/transactions · Vault Accounts · TAP",
    sandboxBehavior:
      "Private keys remain in Fireblocks. The app only orchestrates workflow and receives Fireblocks authorization lifecycle updates.",
  },
  {
    id: "webhooks",
    appConcept: APP_TERMS.webhookLifecycle,
    fireblocksConcept: "Webhook-driven transaction lifecycle",
    description:
      "Asynchronous Fireblocks authorization lifecycle transitions pushed from custody infrastructure to this app.",
    apiSurface: "POST webhook · TRANSACTION_STATUS_UPDATED",
    sandboxBehavior:
      "Webhook events reflect real transaction lifecycle updates — the app does not simulate custody progression.",
  },
  {
    id: "audit-logs",
    appConcept: APP_TERMS.auditLogs,
    fireblocksConcept: "Audit Logs",
    description:
      "Immutable operational record: request creation, policy outcome, authorization, custody handoff, and settlement result.",
    apiSurface: "GET /v1/transactions · internal audit export",
    sandboxBehavior:
      "Session audit log mirrors events you would correlate with Fireblocks transaction history.",
  },
];

export const integrationReadinessNote =
  "Sandbox prototype — this app orchestrates enterprise workflow around the Fireblocks MPC custody layer. It does not implement MPC signing.";
