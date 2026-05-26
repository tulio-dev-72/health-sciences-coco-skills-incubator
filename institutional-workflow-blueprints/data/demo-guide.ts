export type BlueprintGtm = {
  buyer: string;
  problem: string;
  outcome: string;
  fireblocksRole: string;
};

export const DEFAULT_BLUEPRINT_ID = "stablecoin-payouts";

export const blueprintGtm: Record<string, BlueprintGtm> = {
  "stablecoin-payouts": {
    buyer: "Finance ops & AP teams",
    problem: "Vendor payouts in USDC need speed without losing control.",
    outcome: "Approved vendors pay instantly; exceptions go to a manager before funds leave.",
    fireblocksRole: "Fireblocks executes approved stablecoin payouts from custody.",
  },
  "treasury-approval": {
    buyer: "Corporate treasury & CFO office",
    problem: "High-value outbound transfers need dual authorization before settlement.",
    outcome: "Every disbursement has a requester, an approver, and an audit trail.",
    fireblocksRole: "Fireblocks holds assets and settles once the manager approves.",
  },
  "exchange-withdrawal-review": {
    buyer: "Trading desk & liquidity teams",
    problem: "Withdrawals to external venues carry operational and counterparty risk.",
    outcome: "Review queue before assets leave the omnibus account.",
    fireblocksRole: "Fireblocks signs and broadcasts approved withdrawals.",
  },
};

export const demoWalkthrough = [
  {
    step: 1,
    title: "Vendor payout waiting in queue",
    detail:
      "Acme Corp invoice is queued — 0.002 ETH_TEST5 to a wallet not on the approved vendor list.",
    href: "/demo/approvals",
  },
  {
    step: 2,
    title: "Policy flags the exception",
    detail: "Non-whitelisted destination requires manager sign-off before Fireblocks settles.",
    href: "/demo/approvals",
  },
  {
    step: 3,
    title: "Manager approves the payout",
    detail: "One tap releases custody signing and on-chain settlement through Fireblocks.",
    href: "/demo/approvals",
  },
  {
    step: 4,
    title: "Audit the decision",
    detail: "Full timeline: who requested, who approved, when Fireblocks completed settlement.",
    href: "/demo/audit",
  },
];

export const productPitch = {
  headline: "Treasury & payout controls on Fireblocks custody",
  subline:
    "Operational sandbox modeling how enterprise treasury teams govern high-value stablecoin settlement workflows on top of Fireblocks infrastructure.",
  layers: [
    {
      label: "Your app",
      points: [
        "Role-based access control",
        "Transaction authorization queue",
        "Policy & approval workflow rules",
        "Mobile authorization UX",
        "Audit logs",
      ],
    },
    {
      label: "Fireblocks",
      points: [
        "Vault Accounts (MPC custody)",
        "Create Transaction API",
        "Webhook transaction lifecycle",
        "TAP / co-signer policy",
      ],
    },
  ],
};
