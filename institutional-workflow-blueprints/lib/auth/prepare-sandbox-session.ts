"use client";

import { PRIMARY_BLUEPRINT_ID } from "@/data/primary-scenario";
import { getRoleDestination, getRoleWorkflowStep } from "@/lib/auth/role-destinations";
import { commitDemoLogin } from "@/lib/storage";
import type { UserRole } from "@/lib/types";

type SandboxStoreActions = {
  setRole: (role: UserRole) => void;
  setActiveBlueprint: (blueprintId: string) => void;
  setWorkflowStep: (step: ReturnType<typeof getRoleWorkflowStep>) => void;
};

export function prepareSandboxSession(role: UserRole, actions: SandboxStoreActions): void {
  commitDemoLogin(role);
  actions.setRole(role);
  actions.setActiveBlueprint(PRIMARY_BLUEPRINT_ID);
  actions.setWorkflowStep(getRoleWorkflowStep(role));
}

export function resolveSandboxNavigation(role: UserRole, nextPath?: string | null): string {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }
  return getRoleDestination(role);
}
