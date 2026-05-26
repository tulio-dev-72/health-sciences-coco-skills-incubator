import type { UserRole } from "@/lib/types";
import { DEMO_ACCOUNTS } from "@/data/demo-accounts";

export type SandboxRoleDefinition = {
  role: UserRole;
  title: string;
  description: string;
  responsibility: string;
  actionLabel: string;
};

export const SANDBOX_ROLES: SandboxRoleDefinition[] = [
  {
    role: "analyst",
    title: "Treasury Analyst",
    description: "Initiates high-value USDC settlement requests and operational reviews.",
    responsibility: "Settlement request initiation · policy review input",
    actionLabel: "Launch as Analyst",
  },
  {
    role: "treasury_manager",
    title: "Treasury Manager",
    description:
      "Authorizes settlement workflows and releases transactions to Fireblocks custody infrastructure.",
    responsibility: "Authorization queue · custody release approval",
    actionLabel: "Launch as Manager",
  },
  {
    role: "admin",
    title: "Platform Admin",
    description: "Manages governance controls, policies, and integration configuration.",
    responsibility: "Policy administration · integration oversight",
    actionLabel: "Launch as Admin",
  },
];

const ROLE_TO_ACCOUNT_INDEX: Record<UserRole, number> = {
  analyst: 0,
  treasury_manager: 1,
  admin: 2,
};

export function getSandboxAccountForRole(role: UserRole) {
  const account = DEMO_ACCOUNTS[ROLE_TO_ACCOUNT_INDEX[role]];
  if (!account) {
    throw new Error(`No sandbox account configured for role: ${role}`);
  }
  return account;
}

export const SANDBOX_ACCESS_LABEL = "Sandbox role access";

export const LAUNCH_SANDBOX_TITLE = "Launch Operational Sandbox";

export const LAUNCH_SANDBOX_SUBTITLE =
  "Use preconfigured institutional roles to explore the live Fireblocks-backed settlement workflow.";
