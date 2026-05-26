/** Operational settlement lifecycle — app orchestrates; Fireblocks provides MPC custody. */

export const SETTLEMENT_LIFECYCLE_STEPS = [
  {
    step: 1,
    id: "create",
    title: "Settlement Request",
    detail:
      "Analyst submits the outbound settlement from Treasury Main using live Fireblocks vault discovery.",
  },
  {
    step: 2,
    id: "policy",
    title: "Policy Workflow",
    detail:
      "Business rules evaluate thresholds, allowlists, and whether transaction authorization is required.",
  },
  {
    step: 3,
    id: "approval",
    title: "Transaction Authorization",
    detail:
      "Treasury Manager authorizes the payout before it crosses the custody/signing boundary.",
  },
  {
    step: 4,
    id: "custody",
    title: "Fireblocks MPC Custody + Signing",
    detail:
      "Server-side SDK transaction orchestration submits the payout to Fireblocks MPC-secured custody for signing.",
  },
  {
    step: 5,
    id: "webhook",
    title: "Webhook Lifecycle Updates",
    detail:
      "Fireblocks authorization lifecycle events update settlement status via POST /api/webhooks/fireblocks.",
  },
  {
    step: 6,
    id: "audit",
    title: "Audit Timeline",
    detail:
      "Every workflow, custody, and settlement event is recorded for operational and compliance review.",
  },
] as const;

export type SettlementLifecycleStepId = (typeof SETTLEMENT_LIFECYCLE_STEPS)[number]["id"];
