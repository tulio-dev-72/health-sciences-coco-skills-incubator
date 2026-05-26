"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { LaunchOperationalSandbox } from "@/components/auth/launch-operational-sandbox";
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
import { useAppStore } from "@/lib/store";

function HomePageInner() {
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
        router.push("/auth/sign-in?next=/");
        return false;
      }
      if (!profile?.role) {
        router.push("/auth/role");
        return false;
      }
      return true;
    }

    if (isDemoMode) {
      if (!effectiveRole) {
        router.push("/demo/login?next=/");
        return false;
      }
      return true;
    }

    router.push("/auth/sign-in?next=/");
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

  const startPrimaryWorkflow = useCallback(() => {
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

  const isAuthenticated = isSupabaseAuth ? Boolean(user) : Boolean(effectiveRole);

  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <AppHeader
        onSignOut={() => setWorkflowActive(false)}
        actions={
          !workflowActive ? (
            <PrimaryButton
              type="button"
              className="w-full sm:w-auto"
              onClick={startPrimaryWorkflow}
              disabled={loading}
            >
              <span className="sm:hidden">Start workflow</span>
              <span className="hidden sm:inline">Start USDC Settlement Workflow</span>
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
              label="Operational scenario"
              title="High-value USDC settlement authorization"
              subtitle="Workflow Layer → Fireblocks MPC Custody Layer → Blockchain Settlement Rail. This app orchestrates enterprise workflow — Fireblocks provides MPC-secured custody and signing."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
              {primaryBlueprint ? (
                <BlueprintLibraryCard
                  blueprint={primaryBlueprint}
                  variant="primary"
                  onStartPrimaryWorkflow={startPrimaryWorkflow}
                />
              ) : null}

              <SecondaryModulesSection blueprints={secondaryBlueprints} />
            </div>

            <div className="mt-8 space-y-4 border-t border-ops-border-subtle pt-8">
              {!isAuthenticated && !workflowActive ? (
                <LaunchOperationalSandbox nextPath="/" />
              ) : null}

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
                Infrastructure reference
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

export function HomePageContent() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
