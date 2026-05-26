"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import { useAuth } from "@/components/auth/auth-provider";
import { getRoleLabel, useAppStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["analyst", "treasury_manager", "admin"];

const roleDescriptions: Record<UserRole, string> = {
  analyst: "Submit settlement requests. Cannot authorize queue releases.",
  treasury_manager: "Review and authorize pending settlements before custody release.",
  admin: "Configure policy rules, approved vendors, and Fireblocks integration.",
};

function DemoLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { isDemoMode, isSupabaseAuth, loading } = useAuth();
  const { effectiveRole, sessionReady } = useAppStore();

  useEffect(() => {
    if (!loading && isSupabaseAuth && !isDemoMode) {
      router.replace("/auth/sign-in");
    }
  }, [isSupabaseAuth, isDemoMode, loading, router]);

  if (loading || (isSupabaseAuth && !isDemoMode)) {
    return null;
  }

  function roleHref(role: UserRole): string {
    const separator = next.includes("?") ? "&" : "?";
    return `${next}${separator}role=${role}`;
  }

  return (
    <div className="px-3 py-4">
      <Link href="/" className="text-xs text-ops-text-dim hover:text-ops-primary">
        ← System home
      </Link>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-text-dim">
          Demo Mode
        </p>
        <h1 className="mt-1 text-base font-semibold text-ops-text">Select operational role</h1>
        <p className="mt-1 text-xs text-ops-text-secondary">
          Local development only. Roles are stored in browser session — not Supabase.
        </p>

        {sessionReady && effectiveRole ? (
          <Card variant="elevated" className="mt-3">
            <p className="text-xs text-ops-text-secondary">
              Active session:{" "}
              <span className="font-medium text-ops-text">{getRoleLabel(effectiveRole)}</span>
            </p>
          </Card>
        ) : null}
      </div>

      {!isDemoModeEnabled() ? (
        <Card variant="accent" className="mt-4">
          <p className="text-xs text-ops-warning">Demo Mode is disabled in this environment.</p>
          <Link href="/auth/sign-in" className="mt-2 inline-block text-xs font-medium text-ops-primary">
            Sign in with Supabase →
          </Link>
        </Card>
      ) : (
        <div className="mt-4 space-y-2">
          {roles.map((role) => (
            <Card key={role} variant="elevated">
              <h2 className="text-sm font-semibold text-ops-text">{getRoleLabel(role)}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">
                {roleDescriptions[role]}
              </p>
              <Link
                href={roleHref(role)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-xs font-semibold text-white"
              >
                Continue as {getRoleLabel(role)}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemoLoginPage() {
  return (
    <Suspense fallback={null}>
      <DemoLoginInner />
    </Suspense>
  );
}
