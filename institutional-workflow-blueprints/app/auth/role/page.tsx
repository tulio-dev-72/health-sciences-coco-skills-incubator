"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Card, PrimaryButton, SectionHeader } from "@/components/ui/primitives";
import { getRoleDestination } from "@/lib/auth/role-destinations";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertUserProfile } from "@/lib/supabase/profiles";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["analyst", "treasury_manager", "admin"];

const roleDescriptions: Record<UserRole, string> = {
  analyst: "Initiate settlement requests. Cannot authorize queue releases.",
  treasury_manager: "Review and authorize settlements before Fireblocks custody release.",
  admin: "Configure policy rules and Fireblocks integration settings.",
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, isSupabaseAuth, loading, refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<UserRole | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!isSupabaseAuth || !user) {
      router.replace("/auth/sign-in");
    }
  }, [isSupabaseAuth, user, loading, router]);

  if (loading || !isSupabaseAuth || !user) {
    return <PageLoadingState label="Loading role selection…" />;
  }

  async function handleSelectRole(role: UserRole) {
    setError(null);
    setSubmitting(role);

    try {
      const supabase = createSupabaseBrowserClient();
      const { profile, error: profileError } = await upsertUserProfile(supabase, {
        id: user!.id,
        email: user!.email ?? null,
        role,
      });

      if (profileError || !profile) {
        setError(profileError ?? "Unable to save operational role.");
        return;
      }

      await refreshSession();
      router.push(getRoleDestination(role));
      router.refresh();
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Unable to save role.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        label="Profile setup"
        title="Select operational role"
        subtitle="Your role is stored in user_profiles and controls settlement workflow permissions."
      />

      {error ? (
        <Card variant="accent">
          <p className="text-xs text-ops-danger">{error}</p>
        </Card>
      ) : null}

      <div className="space-y-2">
        {roles.map((role) => (
          <Card key={role} variant="elevated">
            <h2 className="text-sm font-semibold text-ops-text">{getRoleLabel(role)}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">
              {roleDescriptions[role]}
            </p>
            <PrimaryButton
              type="button"
              className="mt-3 w-full"
              disabled={submitting !== null}
              onClick={() => handleSelectRole(role)}
            >
              {submitting === role ? "Saving…" : `Continue as ${getRoleLabel(role)}`}
            </PrimaryButton>
          </Card>
        ))}
      </div>
    </div>
  );
}
