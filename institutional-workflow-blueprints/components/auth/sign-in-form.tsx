"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { ACCESS_PORTAL_SUBTITLE, ACCESS_PORTAL_TITLE } from "@/data/sandbox-roles";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/profiles";
import { ACCESS_PORTAL, AUTH_ROLE, OPERATIONS_HOME } from "@/lib/supabase/routes";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSupabaseAuth, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const next = searchParams.get("next") ?? OPERATIONS_HOME;

  useEffect(() => {
    if (!isSupabaseAuth) {
      router.replace(ACCESS_PORTAL);
    }
  }, [isSupabaseAuth, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      await refreshSession();

      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();

      if (signedInUser) {
        const userProfile = await fetchUserProfile(supabase, signedInUser.id);
        router.push(userProfile?.role ? next : AUTH_ROLE);
      } else {
        router.push(next);
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupabaseAuth) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        label="Institutional credentials"
        title="Authenticate"
        subtitle="Sign in with organization credentials, or return to the access portal for sandbox role entry."
      />

      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <InputLabel htmlFor="email">Email</InputLabel>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <InputLabel htmlFor="password">Password</InputLabel>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-xs text-ops-danger">{error}</p> : null}
          <PrimaryButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Authenticating…" : "Authenticate"}
          </PrimaryButton>
        </form>
      </Card>

      <p className="text-center text-xs text-ops-text-secondary">
        <Link href={ACCESS_PORTAL} className="font-medium text-ops-primary hover:underline">
          ← Return to {ACCESS_PORTAL_TITLE}
        </Link>
      </p>

      {isDemoModeEnabled() ? (
        <p className="text-center text-[10px] text-ops-text-dim">{ACCESS_PORTAL_SUBTITLE}</p>
      ) : null}
    </div>
  );
}
