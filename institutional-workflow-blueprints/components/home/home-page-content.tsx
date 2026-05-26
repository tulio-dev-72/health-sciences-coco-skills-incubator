"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BlueprintLibraryCard } from "@/components/blueprint-library-card";
import { PrimarySettlementWorkflow } from "@/components/home/primary-settlement-workflow";
import { SectionHeader, PrimaryButton } from "@/components/ui/primitives";
import { blueprintLibrary } from "@/data/initial-data";
import { productPitch } from "@/data/demo-guide";
import { PRIMARY_BLUEPRINT_ID } from "@/data/primary-scenario";
import { useAppStore } from "@/lib/store";

function HomePageInner() {
  const router = useRouter();
  const { user, profile, loading, isSupabaseAuth, isDemoMode, signOut } = useAuth();
  const { setActiveBlueprint, setRole, setWorkflowStep, effectiveRole, sessionReady, clearRole } =
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

  const authLabel = isSupabaseAuth
    ? user
      ? profile?.role
        ? getRoleLabelSafe(profile.role)
        : "Complete profile"
      : "Sign in"
    : isDemoMode
      ? effectiveRole
        ? getRoleLabelSafe(effectiveRole)
        : "Demo login"
      : "Sign in";

  const authHref = isSupabaseAuth
    ? user
      ? profile?.role
        ? "/"
        : "/auth/role"
      : "/auth/sign-in"
    : isDemoMode
      ? "/demo/login"
      : "/auth/sign-in";

  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <header className="border-b border-ops-border bg-ops-surface/90 shadow-[var(--ops-shadow-sm)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ops-accent" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ops-text-dim">
                  Digital asset operations
                </p>
                {isDemoMode ? (
                  <span className="rounded-md bg-ops-warning-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ops-warning">
                    Demo Mode
                  </span>
                ) : null}
              </div>
              <h1 className="mt-1 text-lg font-semibold sm:text-xl">Treasury Control Center</h1>
              <p className="mt-1 max-w-2xl text-xs text-ops-text-secondary">
                {productPitch.subline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!workflowActive ? (
                <PrimaryButton type="button" onClick={startPrimaryWorkflow} disabled={loading}>
                  Start USDC Settlement Workflow
                </PrimaryButton>
              ) : null}
              {isSupabaseAuth && user ? (
                <button
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      clearRole();
                      setWorkflowActive(false);
                    });
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-ops-border bg-ops-surface px-3.5 py-2 text-xs font-medium text-ops-text-secondary transition hover:text-ops-text"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href={authHref}
                  className="inline-flex items-center justify-center rounded-lg border border-ops-border bg-ops-elevated px-3.5 py-2 text-xs font-medium text-ops-text transition hover:border-ops-text-dim"
                >
                  {authLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {workflowActive ? (
          <PrimarySettlementWorkflow onBack={() => setWorkflowActive(false)} />
        ) : (
          <>
            <SectionHeader
              label="Operational scenario"
              title="High-value USDC settlement authorization"
              subtitle="Single primary workflow — analyst initiation, policy evaluation, treasury manager authorization, Fireblocks custody release."
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              {primaryBlueprint ? (
                <BlueprintLibraryCard
                  blueprint={primaryBlueprint}
                  variant="primary"
                  onStartPrimaryWorkflow={startPrimaryWorkflow}
                />
              ) : null}

              <div className="grid content-start gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
                  Secondary modules
                </p>
                {secondaryBlueprints.map((blueprint) => (
                  <BlueprintLibraryCard key={blueprint.id} blueprint={blueprint} variant="secondary" />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function getRoleLabelSafe(role: string): string {
  switch (role) {
    case "analyst":
      return "Analyst";
    case "treasury_manager":
      return "Treasury Manager";
    case "admin":
      return "Admin";
    default:
      return "Account";
  }
}

export function HomePageContent() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
