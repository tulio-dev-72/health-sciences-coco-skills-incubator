import type {
  AppState,
  AuditEvent,
  PolicySettings,
  Transfer,
  TransferStatus,
  UserRole,
} from "@/lib/types";
import { normalizeWorkflowStep, type WorkflowStepId } from "@/lib/workflow";

export type SettlementRow = {
  id: string;
  external_id: string;
  created_by: string;
  blueprint_id: string | null;
  asset: string;
  amount: number;
  destination: string;
  destination_label: string | null;
  reason: string;
  source_vault: string | null;
  settlement_rail: string | null;
  counterparty: string | null;
  policy_trigger: string | null;
  required_approver: string | null;
  status: TransferStatus;
  risk_level: "low" | "medium" | "high";
  requires_approval: boolean;
  created_by_name: string;
  created_by_role: UserRole;
  reviewed_by_name: string | null;
  reviewed_by_role: UserRole | null;
  fireblocks_tx_id: string | null;
  fireblocks_status: string | null;
  policy_summary: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyRow = {
  id: string;
  name: string;
  approval_threshold: number;
  whitelisted_addresses: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  settlement_request_id: string | null;
  action: string;
  actor: string;
  role: string;
  details: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function mapSettlementRow(row: SettlementRow): Transfer {
  return {
    id: row.external_id,
    asset: row.asset,
    amount: Number(row.amount),
    destination: row.destination,
    destinationLabel: row.destination_label ?? row.destination,
    reason: row.reason,
    sourceVault: row.source_vault ?? undefined,
    settlementRail: row.settlement_rail ?? undefined,
    counterparty: row.counterparty ?? undefined,
    policyTrigger: row.policy_trigger ?? undefined,
    requiredApprover: row.required_approver ?? undefined,
    status: row.status,
    riskLevel: row.risk_level,
    requiresApproval: row.requires_approval,
    createdBy: row.created_by_name,
    createdByRole: row.created_by_role,
    reviewedBy: row.reviewed_by_name ?? undefined,
    reviewedByRole: row.reviewed_by_role ?? undefined,
    fireblocksTxId: row.fireblocks_tx_id ?? undefined,
    fireblocksStatus: row.fireblocks_status ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuditLogRow(row: AuditLogRow): AuditEvent {
  return {
    id: row.id,
    action: row.action,
    actor: row.actor,
    role: row.role as UserRole,
    timestamp: row.created_at,
    details: row.details,
  };
}

export function mapPolicyRow(row: PolicyRow): PolicySettings {
  return {
    approvalThreshold: Number(row.approval_threshold),
    whitelistedAddresses: Array.isArray(row.whitelisted_addresses)
      ? row.whitelisted_addresses
      : [],
  };
}

export function deriveWorkflowStep(transfer: Transfer | null): WorkflowStepId {
  if (!transfer) {
    return "create";
  }

  if (transfer.status === "SETTLED" || transfer.fireblocksStatus === "COMPLETED") {
    return "audit";
  }

  if (transfer.fireblocksTxId && transfer.fireblocksStatus) {
    return transfer.fireblocksStatus === "COMPLETED" ? "audit" : "webhook";
  }

  switch (transfer.status) {
    case "CREATED":
      return "policy";
    case "PENDING_APPROVAL":
      return "approval";
    case "APPROVED":
      return "custody";
    case "REJECTED":
      return "audit";
    default:
      return "create";
  }
}

export type WorkflowSnapshot = Pick<
  AppState,
  "transfers" | "auditLog" | "policy" | "lastTransferId" | "workflowStep" | "policySummary"
>;

export function buildWorkflowSnapshot(input: {
  settlements: SettlementRow[];
  auditLogs: AuditLogRow[];
  policy: PolicyRow | null;
}): WorkflowSnapshot {
  const transfers = input.settlements.map(mapSettlementRow);
  const auditLog = input.auditLogs.map(mapAuditLogRow);
  const policy = input.policy ? mapPolicyRow(input.policy) : { approvalThreshold: 10000, whitelistedAddresses: [] };
  const lastTransfer = transfers[0] ?? null;

  return {
    transfers,
    auditLog,
    policy,
    lastTransferId: lastTransfer?.id ?? null,
    workflowStep: deriveWorkflowStep(lastTransfer),
    policySummary: input.settlements[0]?.policy_summary ?? null,
  };
}
