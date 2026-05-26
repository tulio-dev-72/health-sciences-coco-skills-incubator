import type { AuditEvent, Blueprint, PolicySettings, Transfer, VaultBalance } from "@/lib/types";
import { AUDIT_ACTIONS, APPROVAL_THRESHOLD } from "@/lib/audit";

export const blueprintLibrary: Blueprint[] = [
  {
    id: "stablecoin-payouts",
    title: "Primary Operational Scenario",
    description:
      "High-value USDC settlement authorization — analyst initiation, policy evaluation, and treasury manager release to Fireblocks custody.",
    useCase:
      "$250,000 vendor settlement to a whitelisted counterparty. High-value authorization required before Fireblocks signs and settles.",
    buyer: "Corporate treasury",
  },
  {
    id: "treasury-approval",
    title: "Treasury Approval",
    description:
      "Dual-authorization governance for high-value outbound treasury movements — orchestrate approver routing, amount thresholds, and release to Fireblocks custody.",
    useCase:
      "Corporate treasury teams enforce manager sign-off and audit-ready authorization before high-value disbursements settle.",
    buyer: "Corporate treasury & CFO",
    emphasis: [
      "Approval governance",
      "High-value treasury controls",
      "Authorization orchestration",
    ],
  },
  {
    id: "exchange-withdrawal-review",
    title: "Exchange Withdrawal Review",
    description:
      "Exchange-linked withdrawal review — apply policy enforcement, operational risk assessment, and institutional approval before assets leave omnibus custody.",
    useCase:
      "Trading desks gate withdrawals to external venues through governance review before Fireblocks signs and broadcasts.",
    buyer: "Trading desk & liquidity",
    emphasis: [
      "Exchange operations",
      "Withdrawal governance",
      "Policy enforcement",
      "Operational risk review",
    ],
  },
];

export const defaultPolicy: PolicySettings = {
  approvalThreshold: APPROVAL_THRESHOLD,
  whitelistedAddresses: [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  ],
};

export const initialVaultBalances: VaultBalance[] = [
  {
    asset: "USDC",
    label: "Treasury Main",
    balance: 12500000,
    available: 12500000,
    pendingOut: 0,
  },
  {
    asset: "USD",
    label: "Settlement Reserve",
    balance: 9100000,
    available: 9100000,
    pendingOut: 0,
  },
  {
    asset: "USDT",
    label: "Payout Vault",
    balance: 1650000,
    available: 1650000,
    pendingOut: 0,
  },
];

export const supportedAssets = initialVaultBalances.map((vault) => vault.asset);

export const destinationPresets = [
  {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    label: "Acme Liquidity LLC",
  },
  {
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    label: "Partner settlement wallet",
  },
  {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    label: "Exchange omnibus wallet",
  },
];

export const transferReasonPresets = [
  "Vendor invoice — Acme Corp (April services)",
  "Vendor payout — monthly services",
  "Treasury rebalance to approved counterparty",
  "High-value disbursement requiring manager approval",
];

export function getAmountPresets(asset: string): { value: string; label: string }[] {
  if (asset.includes("ETH") || asset.includes("BTC")) {
    return [
      { value: "0.001", label: "Small test (0.001)" },
      { value: "0.01", label: "Medium test (0.01)" },
    ];
  }

  return [
    { value: "5000", label: "Below threshold ($5,000)" },
    { value: "12000", label: "Requires approval ($12,000)" },
  ];
}

const demoPendingCreatedAt = "2026-05-23T18:30:00.000Z";

/** Non-whitelisted Sepolia address — routes payout through manager approval. */
export const fireblocksDemoDestination = {
  address: "0x3aA2B78417d7BB9649E72e215E504EAa012e72f6",
  label: "Acme Corp vendor wallet (new address)",
};

export function getFireblocksDemoVaultBalances(): VaultBalance[] {
  return [
    {
      asset: "ETH_TEST5",
      label: "Sepolia Vault Account 0 (Fireblocks)",
      balance: 0.05,
      available: 0.05,
      pendingOut: 0,
    },
  ];
}

export const demoPendingTransfer: Transfer = {
  id: "TRX-DEMO-001",
  asset: "ETH_TEST5",
  amount: 0.002,
  destination: fireblocksDemoDestination.address,
  destinationLabel: fireblocksDemoDestination.label,
  reason: "Vendor invoice — Acme Corp (April services)",
  status: "PENDING_APPROVAL",
  riskLevel: "high",
  requiresApproval: true,
  createdBy: "Analyst",
  createdByRole: "analyst",
  createdAt: demoPendingCreatedAt,
  updatedAt: demoPendingCreatedAt,
};

export const demoPendingAuditLog: AuditEvent[] = [
  {
    id: "AUD-DEMO-001",
    action: AUDIT_ACTIONS.settlementRequestCreated,
    actor: "Analyst",
    role: "analyst",
    timestamp: demoPendingCreatedAt,
    details: "TRX-DEMO-001 submitted — vendor invoice for Acme Corp (April services).",
  },
  {
    id: "AUD-DEMO-002",
    action: AUDIT_ACTIONS.policyWorkflowEvaluated,
    actor: "Policy Engine",
    role: "admin",
    timestamp: demoPendingCreatedAt,
    details:
      "TRX-DEMO-001 evaluated as HIGH RISK. Destination is not on the approved vendor list.",
  },
  {
    id: "AUD-DEMO-003",
    action: AUDIT_ACTIONS.authorizationSubmitted,
    actor: "Analyst",
    role: "analyst",
    timestamp: demoPendingCreatedAt,
    details: "TRX-DEMO-001 routed to the Payout Review Queue for manager approval.",
  },
];

export function applyDemoPendingApproval(state: {
  transfers: Transfer[];
  auditLog: AuditEvent[];
  vaultBalances: VaultBalance[];
}): {
  transfers: Transfer[];
  auditLog: AuditEvent[];
  vaultBalances: VaultBalance[];
} {
  const { asset, amount } = demoPendingTransfer;
  const vaultBalances =
    state.vaultBalances.some((vault) => vault.asset === asset)
      ? state.vaultBalances.map((vault) => ({ ...vault }))
      : getFireblocksDemoVaultBalances();

  return {
    transfers: [demoPendingTransfer, ...state.transfers],
    auditLog: [...demoPendingAuditLog, ...state.auditLog],
    vaultBalances: vaultBalances.map((vault) => {
      if (vault.asset !== asset) {
        return vault;
      }

      return {
        ...vault,
        available: vault.available - amount,
        pendingOut: vault.pendingOut + amount,
      };
    }),
  };
}
