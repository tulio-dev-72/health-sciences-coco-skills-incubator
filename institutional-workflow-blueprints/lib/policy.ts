import type { PolicySettings, RiskLevel, Transfer } from "./types";
import { APPROVAL_THRESHOLD, HIGH_VALUE_THRESHOLD } from "./audit";
import { PRIMARY_SETTLEMENT } from "@/data/primary-scenario";

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isWhitelistedDestination(
  destination: string,
  policy: PolicySettings,
): boolean {
  const normalized = normalizeAddress(destination);
  return policy.whitelistedAddresses.some(
    (entry) => normalizeAddress(entry) === normalized,
  );
}

export function evaluateTransferPolicy(input: {
  amount: number;
  destination: string;
  policy: PolicySettings;
}): {
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  autoApprove: boolean;
  policyTrigger: string | null;
  requiredApprover: string | null;
  reasons: string[];
} {
  const reasons: string[] = [];
  const whitelisted = isWhitelistedDestination(input.destination, input.policy);
  const aboveThreshold = input.amount > input.policy.approvalThreshold;
  const highValue = input.amount >= HIGH_VALUE_THRESHOLD;

  let riskLevel: RiskLevel = "low";
  let policyTrigger: string | null = null;
  let requiredApprover: string | null = null;

  if (!whitelisted) {
    riskLevel = "high";
    reasons.push("Counterparty is not on the approved destination allowlist.");
  } else if (highValue) {
    riskLevel = "medium";
    policyTrigger = PRIMARY_SETTLEMENT.policyTrigger;
    requiredApprover = PRIMARY_SETTLEMENT.requiredApprover;
    reasons.push(
      `Settlement amount exceeds the $${HIGH_VALUE_THRESHOLD.toLocaleString()} high-value authorization threshold.`,
    );
  } else if (aboveThreshold) {
    riskLevel = "medium";
    policyTrigger = "Manager Approval Threshold";
    requiredApprover = PRIMARY_SETTLEMENT.requiredApprover;
    reasons.push(
      `Transfer amount exceeds the $${APPROVAL_THRESHOLD.toLocaleString()} manager approval threshold.`,
    );
  }

  const requiresApproval = aboveThreshold || highValue || !whitelisted;
  const autoApprove = whitelisted && !aboveThreshold && !highValue;

  if (requiresApproval && !requiredApprover) {
    requiredApprover = PRIMARY_SETTLEMENT.requiredApprover;
  }

  if (requiresApproval && !policyTrigger && highValue) {
    policyTrigger = PRIMARY_SETTLEMENT.policyTrigger;
  }

  return {
    requiresApproval,
    riskLevel,
    autoApprove,
    policyTrigger,
    requiredApprover,
    reasons,
  };
}

export function getSettlementEvaluation(transfer: Transfer, policy?: PolicySettings) {
  const whitelisted = policy
    ? isWhitelistedDestination(transfer.destination, policy)
    : transfer.riskLevel !== "high";

  return {
    settlementAmount: transfer.amount,
    asset: transfer.asset,
    vaultAccount: transfer.sourceVault ?? "Treasury Main",
    settlementRail: transfer.settlementRail ?? "Ethereum",
    counterparty: transfer.counterparty ?? transfer.destinationLabel,
    counterpartyStatus: whitelisted ? "Whitelisted" : "Not whitelisted",
    riskLevel: transfer.riskLevel,
    policyTrigger: transfer.policyTrigger ?? PRIMARY_SETTLEMENT.policyTrigger,
    requiredApprover: transfer.requiredApprover ?? PRIMARY_SETTLEMENT.requiredApprover,
    status:
      transfer.status === "PENDING_APPROVAL"
        ? "Pending Authorization"
        : transfer.status.replaceAll("_", " "),
  };
}

export function canApproveTransfers(role: string | null): boolean {
  return role === "treasury_manager" || role === "admin";
}

export function canManagePolicy(role: string | null): boolean {
  return role === "admin";
}
