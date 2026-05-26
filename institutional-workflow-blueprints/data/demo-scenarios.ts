import type { AuditEvent, Transfer, VaultBalance } from "@/lib/types";
import { AUDIT_ACTIONS } from "@/lib/audit";
import {
  destinationPresets,
  fireblocksDemoDestination,
  getFireblocksDemoVaultBalances,
} from "@/data/initial-data";

export type DemoScenario = {
  blueprintId: string;
  headline: string;
  queueSummary: string;
  batchLabel: string;
  transfers: Transfer[];
  auditLog: AuditEvent[];
  vaultBalances: VaultBalance[];
  walkthrough: {
    step: number;
    title: string;
    detail: string;
    href: string;
  }[];
};

const baseTime = "2026-05-24T14:00:00.000Z";
const t1 = "2026-05-24T14:02:00.000Z";
const t2 = "2026-05-24T14:04:00.000Z";
const t3 = "2026-05-24T14:06:00.000Z";

function applyVaultLedger(
  vaults: VaultBalance[],
  transfers: Transfer[],
): VaultBalance[] {
  const asset = vaults[0]?.asset ?? "ETH_TEST5";
  const startingBalance = vaults[0]?.balance ?? 0.05;

  let balance = startingBalance;
  for (const transfer of transfers) {
    if (transfer.status === "SETTLED" || transfer.status === "APPROVED") {
      balance -= transfer.amount;
    }
  }

  const pendingOut = transfers
    .filter(
      (transfer) =>
        transfer.status === "PENDING_APPROVAL" || transfer.status === "CREATED",
    )
    .reduce((sum, transfer) => sum + transfer.amount, 0);

  return vaults.map((vault) =>
    vault.asset === asset
      ? {
          ...vault,
          balance,
          pendingOut,
          available: Math.max(balance - pendingOut, 0),
        }
      : vault,
  );
}

const stablecoinScenario: DemoScenario = {
  blueprintId: "stablecoin-payouts",
  headline: "High-value USDC settlement — authorization required",
  queueSummary:
    "Analyst initiates a $250,000 USDC settlement to Acme Liquidity LLC. Policy triggers high-value authorization before Fireblocks custody release.",
  batchLabel: "Primary operational scenario",
  transfers: [],
  auditLog: [],
  vaultBalances: [
    {
      asset: "USDC",
      label: "Treasury Main",
      balance: 12_500_000,
      available: 12_500_000,
      pendingOut: 0,
    },
  ],
  walkthrough: [
    {
      step: 1,
      title: "Initiate settlement",
      detail: "Analyst submits $250,000 USDC to Acme Liquidity LLC on Ethereum.",
      href: "/demo/create",
    },
    {
      step: 2,
      title: "Policy evaluation",
      detail: "High-value authorization triggered — settlement held pending treasury manager review.",
      href: "/demo/policy",
    },
    {
      step: 3,
      title: "Authorize release",
      detail: "Treasury Manager authorizes settlement — Fireblocks creates the transaction.",
      href: "/demo/approvals",
    },
    {
      step: 4,
      title: "Audit trail",
      detail: "Webhook lifecycle and authorization events recorded for compliance review.",
      href: "/demo/audit",
    },
  ],
};

const treasuryScenario: DemoScenario = {
  blueprintId: "treasury-approval",
  headline: "High-value disbursement awaiting sign-off",
  queueSummary:
    "Treasury analyst requested a $142K-equivalent outbound to a new counterparty wallet. Policy requires CFO office approval before Fireblocks releases from custody.",
  batchLabel: "1 pending approval · 1 cleared today",
  transfers: [
    {
      id: "TRX-DEMO-001",
      asset: "ETH_TEST5",
      amount: 0.012,
      destination: fireblocksDemoDestination.address,
      destinationLabel: "New counterparty treasury wallet",
      reason: "Treasury disbursement — inter-company transfer ($142K equiv.)",
      status: "PENDING_APPROVAL",
      riskLevel: "high",
      requiresApproval: true,
      createdBy: "Analyst",
      createdByRole: "analyst",
      createdAt: t2,
      updatedAt: t2,
    },
    {
      id: "TRX-DEMO-002",
      asset: "ETH_TEST5",
      amount: 0.001,
      destination: destinationPresets[1].address,
      destinationLabel: destinationPresets[1].label,
      reason: "Treasury rebalance — approved counterparty",
      status: "SETTLED",
      riskLevel: "low",
      requiresApproval: false,
      createdBy: "Analyst",
      createdByRole: "analyst",
      fireblocksStatus: "COMPLETED",
      createdAt: t1,
      updatedAt: t1,
    },
  ],
  auditLog: [
    {
      id: "AUD-TREAS-001",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Analyst",
      role: "analyst",
      timestamp: t1,
      details: "TRX-DEMO-002 rebalance submitted and auto-cleared.",
    },
    {
      id: "AUD-TREAS-002",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Policy Engine",
      role: "admin",
      timestamp: t1,
      details: "TRX-DEMO-002 settled via Fireblocks.",
    },
    {
      id: "AUD-TREAS-003",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Analyst",
      role: "analyst",
      timestamp: t2,
      details: "TRX-DEMO-001 submitted — high-value treasury disbursement.",
    },
    {
      id: "AUD-TREAS-004",
      action: AUDIT_ACTIONS.policyWorkflowEvaluated,
      actor: "Policy Engine",
      role: "admin",
      timestamp: t2,
      details:
        "TRX-DEMO-001 requires dual authorization — destination not on approved list.",
    },
    {
      id: "AUD-TREAS-005",
      action: AUDIT_ACTIONS.authorizationSubmitted,
      actor: "Analyst",
      role: "analyst",
      timestamp: t2,
      details: "TRX-DEMO-001 routed to Treasury Manager approval queue.",
    },
  ],
  vaultBalances: getFireblocksDemoVaultBalances(),
  walkthrough: [
    {
      step: 1,
      title: "Treasury dashboard — liquidity + queue",
      detail: "See vault balance, pending disbursement, and what already cleared today.",
      href: "/demo",
    },
    {
      step: 2,
      title: "Review the disbursement request",
      detail: "High-value outbound to a new counterparty — policy blocked auto-release.",
      href: "/demo/approvals",
    },
    {
      step: 3,
      title: "Manager approves from mobile",
      detail: "Dual authorization complete → Fireblocks signs and settles from custody.",
      href: "/demo/approvals",
    },
    {
      step: 4,
      title: "Audit trail for regulators",
      detail: "Requester, approver, policy outcome, and Fireblocks settlement timestamp.",
      href: "/demo/audit",
    },
  ],
};

const withdrawalScenario: DemoScenario = {
  blueprintId: "exchange-withdrawal-review",
  headline: "Exchange withdrawal held for desk review",
  queueSummary:
    "Trading desk requested withdrawal to an external venue. Omnibus-to-exchange transfers auto-clear; this destination is new — manager must approve before Fireblocks broadcasts.",
  batchLabel: "1 withdrawal pending · 1 cleared to omnibus",
  transfers: [
    {
      id: "TRX-DEMO-001",
      asset: "ETH_TEST5",
      amount: 0.008,
      destination: fireblocksDemoDestination.address,
      destinationLabel: "External venue — hot wallet (new)",
      reason: "Exchange withdrawal — liquidity rebalance to external venue",
      status: "PENDING_APPROVAL",
      riskLevel: "high",
      requiresApproval: true,
      createdBy: "Analyst",
      createdByRole: "analyst",
      createdAt: t2,
      updatedAt: t2,
    },
    {
      id: "TRX-DEMO-002",
      asset: "ETH_TEST5",
      amount: 0.003,
      destination: destinationPresets[2].address,
      destinationLabel: destinationPresets[2].label,
      reason: "Exchange withdrawal — approved omnibus route",
      status: "SETTLED",
      riskLevel: "low",
      requiresApproval: false,
      createdBy: "Analyst",
      createdByRole: "analyst",
      fireblocksStatus: "COMPLETED",
      createdAt: t1,
      updatedAt: t1,
    },
  ],
  auditLog: [
    {
      id: "AUD-WD-001",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Analyst",
      role: "analyst",
      timestamp: t1,
      details: "TRX-DEMO-002 withdrawal to exchange omnibus — auto-cleared.",
    },
    {
      id: "AUD-WD-002",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Policy Engine",
      role: "admin",
      timestamp: t1,
      details: "TRX-DEMO-002 settled via Fireblocks.",
    },
    {
      id: "AUD-WD-003",
      action: AUDIT_ACTIONS.settlementRequestCreated,
      actor: "Analyst",
      role: "analyst",
      timestamp: t2,
      details: "TRX-DEMO-001 withdrawal to external venue submitted.",
    },
    {
      id: "AUD-WD-004",
      action: AUDIT_ACTIONS.policyWorkflowEvaluated,
      actor: "Policy Engine",
      role: "admin",
      timestamp: t2,
      details: "TRX-DEMO-001 flagged — destination not on approved venue list.",
    },
    {
      id: "AUD-WD-005",
      action: AUDIT_ACTIONS.authorizationSubmitted,
      actor: "Analyst",
      role: "analyst",
      timestamp: t2,
      details: "TRX-DEMO-001 held for trading desk manager review.",
    },
  ],
  vaultBalances: getFireblocksDemoVaultBalances(),
  walkthrough: [
    {
      step: 1,
      title: "Desk view — what’s moving",
      detail: "One withdrawal cleared to omnibus; one exception waiting on a new venue wallet.",
      href: "/demo",
    },
    {
      step: 2,
      title: "Review withdrawal in queue",
      detail: "Counterparty risk check before assets leave the omnibus account.",
      href: "/demo/approvals",
    },
    {
      step: 3,
      title: "Approve — Fireblocks broadcasts",
      detail: "Manager sign-off releases Fireblocks to sign and send on-chain.",
      href: "/demo/approvals",
    },
    {
      step: 4,
      title: "Full desk audit log",
      detail: "Every withdrawal decision recorded with Fireblocks settlement proof.",
      href: "/demo/audit",
    },
  ],
};

const scenarios: Record<string, DemoScenario> = {
  "stablecoin-payouts": stablecoinScenario,
  "treasury-approval": treasuryScenario,
  "exchange-withdrawal-review": withdrawalScenario,
};

export function getDemoScenario(blueprintId: string | null): DemoScenario {
  const id = blueprintId ?? "stablecoin-payouts";
  const scenario = scenarios[id] ?? stablecoinScenario;
  return {
    ...scenario,
    vaultBalances: applyVaultLedger(scenario.vaultBalances, scenario.transfers),
  };
}

export function applyDemoScenario(
  state: {
    transfers: Transfer[];
    auditLog: AuditEvent[];
    vaultBalances: VaultBalance[];
  },
  blueprintId: string | null,
): {
  transfers: Transfer[];
  auditLog: AuditEvent[];
  vaultBalances: VaultBalance[];
} {
  const scenario = getDemoScenario(blueprintId);
  return {
    transfers: scenario.transfers,
    auditLog: scenario.auditLog,
    vaultBalances: scenario.vaultBalances,
  };
}
