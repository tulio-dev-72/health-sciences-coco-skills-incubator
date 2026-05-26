"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LaunchOperationalSandbox } from "@/components/auth/launch-operational-sandbox";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/primitives";
import Link from "next/link";

function DemoLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { isDemoMode, isSupabaseAuth, loading } = useAuth();

  useEffect(() => {
    if (!loading && isSupabaseAuth && !isDemoMode) {
      router.replace("/auth/sign-in");
    }
  }, [isSupabaseAuth, isDemoMode, loading, router]);

  if (loading || (isSupabaseAuth && !isDemoMode)) {
    return null;
  }

  if (!isDemoModeEnabled()) {
    return (
      <div className="px-3 py-4">
        <Card variant="accent">
          <p className="text-xs text-ops-text-secondary">
            Operational sandbox is disabled in this environment.
          </p>
          <Link href="/auth/sign-in" className="mt-2 inline-block text-xs font-medium text-ops-primary">
            Authenticate →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-3 py-4">
      <LaunchOperationalSandbox nextPath={next} />
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
