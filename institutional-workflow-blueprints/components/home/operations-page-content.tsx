"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { BlueprintLibraryCard } from "@/components/blueprint-library-card";
import { SecondaryModulesSection } from "@/components/home/secondary-modules-section";
import { InfrastructureMappingCard } from "@/components/demo/infrastructure-mapping-card";
import { DemoWorkflowGuide } from "@/components/home/demo-workflow-guide";
import { PrimarySettlementWorkflow } from "@/components/home/primary-settlement-workflow";
import { AppHeader } from "@/components/layout/app-header";
import { SectionHeader, PrimaryButton } from "@/components/ui/primitives";
import { blueprintLibrary } from "@/data/initial-data";
import { PRIMARY_BLUEPRINT_ID } from "@/data/primary-scenario";
import { useAuth } from "@/components/auth/auth-provider";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { useAppStore } from "@/lib/store";
import { ACCESS_PORTAL, AUTH_ROLE, buildSignInUrl } from "@/lib/supabase/routes";

function OperationsPageInner() {
  const router = useRouter();
  const { user, profile, loading, isSupabaseAuth, isDemoMode } = useAuth();
  const { setActiveBlueprint, setRole, setWorkflowStep, effectiveRole, sessionReady } =
    useAppStore();
  const [workflowActive, setWorkflowActive] = useState(false);

  const primaryBlueprint = blueprintLibrary.find((item) => item.id === PRIMARY_BLUEPRINT_ID);
  const secondaryBlueprints = blueprintLibrary.filter((item) => item.id !== PRIMARY_BLUEPRINT_ID);

  const ensureWorkflowAccess = useCallback(() => {
    if (!sessionReady || loading) {
      return false;
    }

    if (isSupabaseAuth) {
      if (!user) {
        router.push(buildSignInUrl("/operations"));
        return false;
      }
      if (!profile?.role) {
        router.push(AUTH_ROLE);
        return false;
      }
      return true;
    }

    if (isDemoMode) {
      if (!effectiveRole) {
        router.push(ACCESS_PORTAL);
        return false;
      }
      return true;
    }

    router.push(ACCESS_PORTAL);
    return false;
  }, [
    sessionReady,
    loading,
    isSupabaseAuth,
    isDemoMode,
    user,
    profile?.role,
    effectiveRole,
    router,
  ]);

  const openSettlementWorkflow = useCallback(() => {
    if (!ensureWorkflowAccess()) {
      return;
    }

    setActiveBlueprint(PRIMARY_BLUEPRINT_ID);
    if (isDemoMode && effectiveRole) {
      setRole(effectiveRole);
    } else if (profile?.role) {
      setRole(profile.role);
    }
    setWorkflowStep("create");
    setWorkflowActive(true);
  }, [
    ensureWorkflowAccess,
    setActiveBlueprint,
    setRole,
    setWorkflowStep,
    isDemoMode,
    effectiveRole,
    profile?.role,
  ]);

  const displayRole = isSupabaseAuth ? profile?.role ?? null : effectiveRole;

  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <AppHeader
        onSignOut={() => setWorkflowActive(false)}
        actions={
          !workflowActive ? (
            <PrimaryButton
              type="button"
              className="w-full sm:w-auto"
              onClick={openSettlementWorkflow}
              disabled={loading}
            >
              Open settlement workflow
            </PrimaryButton>
          ) : null
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {workflowActive ? (
          <PrimarySettlementWorkflow onBack={() => setWorkflowActive(false)} />
        ) : (
          <>
            <SectionHeader
              label="Operations console"
              title="Settlement authorization workspace"
              subtitle={
                displayRole
                  ? `Active session: ${getRoleLabel(displayRole)} · USDC settlement governance on Fireblocks infrastructure`
                  : "USDC settlement governance on Fireblocks infrastructure"
              }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
              {primaryBlueprint ? (
                <BlueprintLibraryCard
                  blueprint={primaryBlueprint}
                  variant="primary"
                  onStartPrimaryWorkflow={openSettlementWorkflow}
                />
              ) : null}

              <SecondaryModulesSection blueprints={secondaryBlueprints} />
            </div>

            <div className="mt-8 space-y-4 border-t border-ops-border-subtle pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
                Architecture reference
              </p>
              <InfrastructureMappingCard compact />
              <DemoWorkflowGuide />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export function OperationsPageContent() {
  return (
    <Suspense fallback={null}>
      <OperationsPageInner />
    </Suspense>
  );
}
