import type { SupabaseClient } from "@supabase/supabase-js";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { formatCurrency } from "@/lib/format";
import { mapFireblocksToSettlementLifecycle } from "@/lib/fireblocks/lifecycle";
import { evaluateTransferPolicy } from "@/lib/policy";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import {
  buildWorkflowSnapshot,
  mapSettlementRow,
  type AuditLogRow,
  type PolicyRow,
  type SettlementRow,
  type WorkflowSnapshot,
} from "@/lib/supabase/workflow/mappers";
import {
  createExternalSettlementId,
  insertAuditLog,
  insertFireblocksEvent,
  roleLabel,
} from "@/lib/supabase/workflow/audit";
import type { PolicySettings, Transfer, UserRole } from "@/lib/types";

const DEFAULT_POLICY_ID = "00000000-0000-0000-0000-000000000001";

export async function loadWorkflowState(supabase: SupabaseClient): Promise<WorkflowSnapshot> {
  const [settlementsResult, auditResult, policyResult] = await Promise.all([
    supabase
      .from("settlement_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("policies").select("*").eq("id", DEFAULT_POLICY_ID).maybeSingle(),
  ]);

  if (settlementsResult.error) {
    throw new Error(settlementsResult.error.message);
  }
  if (auditResult.error) {
    throw new Error(auditResult.error.message);
  }
  if (policyResult.error) {
    throw new Error(policyResult.error.message);
  }

  return buildWorkflowSnapshot({
    settlements: (settlementsResult.data ?? []) as SettlementRow[],
    auditLogs: (auditResult.data ?? []) as AuditLogRow[],
    policy: (policyResult.data as PolicyRow | null) ?? null,
  });
}

async function getDefaultPolicy(supabase: SupabaseClient): Promise<PolicySettings> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("id", DEFAULT_POLICY_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { approvalThreshold: 10000, whitelistedAddresses: [] };
  }

  const row = data as PolicyRow;
  return {
    approvalThreshold: Number(row.approval_threshold),
    whitelistedAddresses: row.whitelisted_addresses ?? [],
  };
}

async function getSettlementByExternalId(
  supabase: SupabaseClient,
  externalId: string,
): Promise<SettlementRow | null> {
  const { data, error } = await supabase
    .from("settlement_requests")
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SettlementRow | null) ?? null;
}

export type CreateSettlementInput = {
  asset: string;
  amount: number;
  destination: string;
  destinationLabel: string;
  reason: string;
  sourceVault?: string;
  settlementRail?: string;
  counterparty?: string;
  blueprintId?: string | null;
};

export async function createSettlement(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  input: CreateSettlementInput,
): Promise<{ transfer: Transfer; policySummary: string }> {
  const profile = await fetchUserProfile(supabase, userId);
  const actor = profile?.display_name ?? roleLabel(role);
  const policy = await getDefaultPolicy(supabase);
  const evaluation = evaluateTransferPolicy({
    amount: input.amount,
    destination: input.destination,
    policy,
  });

  const externalId = createExternalSettlementId();
  const now = new Date().toISOString();
  const status = evaluation.requiresApproval ? "PENDING_APPROVAL" : "SETTLED";
  const policySummary = evaluation.requiresApproval
    ? evaluation.policyTrigger
      ? `${evaluation.policyTrigger} triggered. ${evaluation.requiredApprover ?? "Treasury Manager"} approval required.`
      : `Approval required. ${evaluation.reasons.join(" ")}`
    : "Transfer auto-approved below threshold and settled.";

  const { data, error } = await supabase
    .from("settlement_requests")
    .insert({
      external_id: externalId,
      created_by: userId,
      blueprint_id: input.blueprintId ?? null,
      asset: input.asset,
      amount: input.amount,
      destination: input.destination,
      destination_label: input.destinationLabel,
      reason: input.reason,
      source_vault: input.sourceVault ?? null,
      settlement_rail: input.settlementRail ?? null,
      counterparty: input.counterparty ?? null,
      policy_trigger: evaluation.policyTrigger,
      required_approver: evaluation.requiredApprover,
      status,
      risk_level: evaluation.riskLevel,
      requires_approval: evaluation.requiresApproval,
      created_by_name: actor,
      created_by_role: role,
      reviewed_by_name: evaluation.requiresApproval ? null : "Policy Engine",
      reviewed_by_role: evaluation.requiresApproval ? null : "admin",
      policy_summary: policySummary,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create settlement request.");
  }

  const settlement = data as SettlementRow;

  await insertAuditLog(supabase, {
    settlementRequestId: settlement.id,
    action: AUDIT_ACTIONS.settlementInitiated,
    actor,
    role,
    details: `${formatCurrency(input.amount, input.asset)} USDC settlement to ${input.counterparty ?? input.destinationLabel}.`,
    createdAt: now,
  });

  await insertAuditLog(supabase, {
    settlementRequestId: settlement.id,
    action: AUDIT_ACTIONS.policyEvaluated,
    actor: "Policy Engine",
    role: "admin",
    details: evaluation.policyTrigger
      ? `${evaluation.policyTrigger} triggered. Required approver: ${evaluation.requiredApprover ?? "Treasury Manager"}.`
      : evaluation.reasons.join(" ") || "Within policy limits.",
    createdAt: now,
  });

  if (evaluation.requiresApproval) {
    await insertAuditLog(supabase, {
      settlementRequestId: settlement.id,
      action: AUDIT_ACTIONS.authorizationQueued,
      actor: "Policy Engine",
      role: "admin",
      details: `Status: Pending Authorization. Routed to ${evaluation.requiredApprover ?? "Treasury Manager"}.`,
      createdAt: now,
    });
  } else {
    await insertAuditLog(supabase, {
      settlementRequestId: settlement.id,
      action: AUDIT_ACTIONS.managerAuthorized,
      actor: "Policy Engine",
      role: "admin",
      details: `${externalId} auto-approved below $${policy.approvalThreshold.toLocaleString()} threshold.`,
      createdAt: now,
    });
  }

  return { transfer: mapSettlementRow(settlement), policySummary };
}

export async function approveSettlement(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  externalId: string,
  fireblocks?: { fireblocksTxId?: string; fireblocksStatus?: string },
): Promise<Transfer> {
  const settlement = await getSettlementByExternalId(supabase, externalId);
  if (!settlement || settlement.status !== "PENDING_APPROVAL") {
    throw new Error("Settlement is not pending authorization.");
  }

  const profile = await fetchUserProfile(supabase, userId);
  const actor = profile?.display_name ?? roleLabel(role);
  const now = new Date().toISOString();
  const fireblocksTxId = fireblocks?.fireblocksTxId ?? settlement.fireblocks_tx_id;

  const { data, error } = await supabase
    .from("settlement_requests")
    .update({
      status: "APPROVED",
      reviewed_by_name: actor,
      reviewed_by_role: role,
      fireblocks_tx_id: fireblocksTxId,
      fireblocks_status: fireblocks?.fireblocksStatus ?? settlement.fireblocks_status,
      policy_summary: `${externalId} authorized. Fireblocks transaction created — awaiting webhook lifecycle.`,
      updated_at: now,
    })
    .eq("id", settlement.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to approve settlement.");
  }

  await supabase.from("approvals").insert({
    settlement_request_id: settlement.id,
    approver_id: userId,
    approver_name: actor,
    approver_role: role,
    decision: "approved",
    fireblocks_tx_id: fireblocksTxId,
    fireblocks_status: fireblocks?.fireblocksStatus ?? null,
  });

  await insertAuditLog(supabase, {
    settlementRequestId: settlement.id,
    action: AUDIT_ACTIONS.managerAuthorized,
    actor,
    role,
    details: `${formatCurrency(Number(settlement.amount), settlement.asset)} settlement authorized for Fireblocks release.`,
    createdAt: now,
  });

  if (fireblocksTxId) {
    await insertAuditLog(supabase, {
      settlementRequestId: settlement.id,
      action: AUDIT_ACTIONS.fireblocksTransactionCreated,
      actor: "Fireblocks API",
      role: "admin",
      details: `fireblocksTxId: ${fireblocksTxId} · Vault Account: ${settlement.source_vault ?? "Treasury Main"} · POST /v1/transactions`,
      createdAt: now,
    });
  }

  return mapSettlementRow(data as SettlementRow);
}

export async function rejectSettlement(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  externalId: string,
): Promise<Transfer> {
  const settlement = await getSettlementByExternalId(supabase, externalId);
  if (!settlement || settlement.status !== "PENDING_APPROVAL") {
    throw new Error("Settlement is not pending authorization.");
  }

  const profile = await fetchUserProfile(supabase, userId);
  const actor = profile?.display_name ?? roleLabel(role);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("settlement_requests")
    .update({
      status: "REJECTED",
      reviewed_by_name: actor,
      reviewed_by_role: role,
      policy_summary: `${externalId} rejected. Review the audit trail.`,
      updated_at: now,
    })
    .eq("id", settlement.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to reject settlement.");
  }

  await supabase.from("approvals").insert({
    settlement_request_id: settlement.id,
    approver_id: userId,
    approver_name: actor,
    approver_role: role,
    decision: "rejected",
  });

  await insertAuditLog(supabase, {
    settlementRequestId: settlement.id,
    action: AUDIT_ACTIONS.settlementRejected,
    actor,
    role,
    details: `${externalId} rejected by ${roleLabel(role)}.`,
    createdAt: now,
  });

  return mapSettlementRow(data as SettlementRow);
}

export async function updateSettlementFireblocksStatus(
  supabase: SupabaseClient,
  input: {
    externalTxId?: string | null;
    fireblocksTxId?: string | null;
    status: string;
    subStatus?: string | null;
    eventType?: string;
    payload?: Record<string, unknown>;
  },
): Promise<Transfer | null> {
  let settlement: SettlementRow | null = null;

  if (input.externalTxId) {
    settlement = await getSettlementByExternalId(supabase, input.externalTxId);
  }

  if (!settlement && input.fireblocksTxId) {
    const { data } = await supabase
      .from("settlement_requests")
      .select("*")
      .eq("fireblocks_tx_id", input.fireblocksTxId)
      .maybeSingle();
    settlement = (data as SettlementRow | null) ?? null;
  }

  if (!settlement) {
    return null;
  }

  const lifecycle = mapFireblocksToSettlementLifecycle(input.status, settlement.status);
  const completed = lifecycle.fireblocksStatus === "COMPLETED";
  const previousStatus = settlement.fireblocks_status;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("settlement_requests")
    .update({
      fireblocks_tx_id: input.fireblocksTxId ?? settlement.fireblocks_tx_id,
      fireblocks_status: lifecycle.fireblocksStatus,
      status: lifecycle.settlementStatus,
      policy_summary: completed
        ? "Settlement completed. Review the operational audit timeline."
        : settlement.policy_summary,
      updated_at: now,
    })
    .eq("id", settlement.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update Fireblocks status.");
  }

  await insertFireblocksEvent(supabase, {
    settlementRequestId: settlement.id,
    fireblocksTxId: input.fireblocksTxId ?? settlement.fireblocks_tx_id,
    externalId: settlement.external_id,
    eventType: input.eventType ?? "TRANSACTION_STATUS_UPDATED",
    status: lifecycle.fireblocksStatus,
    subStatus: input.subStatus ?? null,
    payload: input.payload ?? {},
  });

  await insertAuditLog(supabase, {
    settlementRequestId: settlement.id,
    action: AUDIT_ACTIONS.webhookStatusUpdated,
    actor: "Fireblocks Webhook",
    role: "admin",
    details: `${lifecycle.fireblocksStatus}${completed ? " — settlement completed" : ""}`,
    createdAt: now,
  });

  if (completed && previousStatus !== "COMPLETED") {
    await insertAuditLog(supabase, {
      settlementRequestId: settlement.id,
      action: AUDIT_ACTIONS.settlementCompleted,
      actor: "Fireblocks Webhook",
      role: "admin",
      details: `${formatCurrency(Number(settlement.amount), settlement.asset)} settlement completed on ${settlement.settlement_rail ?? "Ethereum"}.`,
      createdAt: now,
    });
  }

  return mapSettlementRow(data as SettlementRow);
}

export async function updatePolicySettings(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  patch: Partial<PolicySettings>,
): Promise<PolicySettings> {
  const current = await getDefaultPolicy(supabase);
  const next = { ...current, ...patch };
  const profile = await fetchUserProfile(supabase, userId);
  const actor = profile?.display_name ?? roleLabel(role);

  const { error } = await supabase
    .from("policies")
    .update({
      approval_threshold: next.approvalThreshold,
      whitelisted_addresses: next.whitelistedAddresses,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", DEFAULT_POLICY_ID);

  if (error) {
    throw new Error(error.message);
  }

  if (patch.approvalThreshold !== undefined) {
    await insertAuditLog(supabase, {
      action: AUDIT_ACTIONS.tapPolicyUpdated,
      actor,
      role,
      details: `Authorization threshold set to $${next.approvalThreshold.toLocaleString()}.`,
    });
  }

  if (patch.whitelistedAddresses !== undefined) {
    await insertAuditLog(supabase, {
      action: AUDIT_ACTIONS.allowlistUpdated,
      actor,
      role,
      details: "Destination allowlist updated.",
    });
  }

  return next;
}

export async function addWhitelistAddress(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  address: string,
): Promise<PolicySettings> {
  const current = await getDefaultPolicy(supabase);
  const normalized = address.trim();
  if (!normalized || current.whitelistedAddresses.includes(normalized)) {
    return current;
  }

  const next = {
    ...current,
    whitelistedAddresses: [...current.whitelistedAddresses, normalized],
  };

  await updatePolicySettings(supabase, userId, role, next);

  const profile = await fetchUserProfile(supabase, userId);
  await insertAuditLog(supabase, {
    action: AUDIT_ACTIONS.allowlistUpdated,
    actor: profile?.display_name ?? roleLabel(role),
    role,
    details: `Added ${normalized} to destination allowlist.`,
  });

  return next;
}

export async function removeWhitelistAddress(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  address: string,
): Promise<PolicySettings> {
  const current = await getDefaultPolicy(supabase);
  const next = {
    ...current,
    whitelistedAddresses: current.whitelistedAddresses.filter((item) => item !== address),
  };

  await updatePolicySettings(supabase, userId, role, next);

  const profile = await fetchUserProfile(supabase, userId);
  await insertAuditLog(supabase, {
    action: AUDIT_ACTIONS.allowlistUpdated,
    actor: profile?.display_name ?? roleLabel(role),
    role,
    details: `Removed ${address} from destination allowlist.`,
  });

  return next;
}
