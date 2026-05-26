import type { WorkflowStepId } from "@/lib/workflow";

export type UserRole = "analyst" | "treasury_manager" | "admin";

export type TransferStatus =
  | "CREATED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SETTLED";

export type RiskLevel = "low" | "medium" | "high";

/** Sandbox settlement request — maps to Fireblocks Create Transaction (POST /v1/transactions). */
export type Transfer = {
  id: string;
  /** Correlates with Fireblocks externalTxId for idempotent submission. */
  asset: string;
  amount: number;
  destination: string;
  destinationLabel: string;
  reason: string;
  /** Fireblocks vault account ID for source custody. */
  sourceVaultId?: string;
  sourceVault?: string;
  settlementRail?: string;
  counterparty?: string;
  policyTrigger?: string;
  requiredApprover?: string;
  status: TransferStatus;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  createdBy: string;
  createdByRole: UserRole;
  reviewedBy?: string;
  reviewedByRole?: UserRole;
  /** Fireblocks transaction ID after authorization release. */
  fireblocksTxId?: string;
  /** Webhook-driven lifecycle status from Fireblocks. */
  fireblocksStatus?: string;
  createdAt: string;
  updatedAt: string;
};

/** Operational audit log entry — correlates with Fireblocks transaction history. */
export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  role: UserRole;
  timestamp: string;
  details: string;
};

/** App-side policy rules — complements Fireblocks TAP at custody layer. */
export type PolicySettings = {
  approvalThreshold: number;
  whitelistedAddresses: string[];
};

/** Vault account balance view — maps to Fireblocks Vault Accounts API. */
export type VaultBalance = {
  asset: string;
  label: string;
  balance: number;
  available: number;
  pendingOut: number;
};

/** @deprecated Use Transfer — kept for integration migration. */
export type SettlementRequest = Transfer;

/** @deprecated Use VaultBalance */
export type VaultAccount = VaultBalance;

/** @deprecated Use AuditEvent */
export type AuditLogEntry = AuditEvent;

export type BlueprintOperationalMeta = {
  settlementRail: string;
  custodyLayer: string;
  workflowType: string;
  status: string;
  integration: string;
};

export type Blueprint = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  buyer: string;
  /** Operational focus areas for secondary workflow modules. */
  emphasis?: string[];
  /** Infrastructure metadata shown on secondary module panels. */
  operationalMeta?: BlueprintOperationalMeta;
  /** Primary action label for secondary modules. */
  actionLabel?: string;
};

export type AppState = {
  role: UserRole | null;
  activeBlueprint: string | null;
  workflowStep: WorkflowStepId;
  lastTransferId: string | null;
  policySummary: string | null;
  policy: PolicySettings;
  transfers: Transfer[];
  auditLog: AuditEvent[];
  vaultBalances: VaultBalance[];
  fireblocksEnabled: boolean;
};
