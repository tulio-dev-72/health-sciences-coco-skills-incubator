import type { UserRole } from "@/lib/types";
import { DEMO_ACCOUNTS } from "@/data/demo-accounts";

export type SandboxRoleDefinition = {
  role: UserRole;
  title: string;
  description: string;
  responsibility: string;
  actionLabel: string;
};

export const ACCESS_PORTAL_TITLE = "Treasury Control Center";

export const ACCESS_PORTAL_SUBTITLE =
  "Operational sandbox for institutional stablecoin settlement governance built around Fireblocks infrastructure.";

export const SANDBOX_FOOTER_NOTE =
  "Sandbox environment using Fireblocks test infrastructure and test settlement assets.";

export const SANDBOX_ROLES: SandboxRoleDefinition[] = [
  {
    role: "analyst",
    title: "Treasury Analyst",
    description: "Initiates and reviews high-value settlement workflows.",
    responsibility: "Settlement request initiation · operational review",
    actionLabel: "Enter as Analyst",
  },
  {
    role: "treasury_manager",
    title: "Treasury Manager",
    description:
      "Authorizes settlement requests and releases transactions to Fireblocks infrastructure.",
    responsibility: "Authorization queue · custody release",
    actionLabel: "Enter as Manager",
  },
  {
    role: "admin",
    title: "Platform Admin",
    description: "Manages governance controls, integration state, and operational policies.",
    responsibility: "Policy administration · integration oversight",
    actionLabel: "Enter as Admin",
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

export const SANDBOX_ACCESS_LABEL = "Institutional role access";
