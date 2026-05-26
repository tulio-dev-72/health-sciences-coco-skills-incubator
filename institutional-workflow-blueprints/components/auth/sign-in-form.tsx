"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSupabaseAuth, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const next = searchParams.get("next") ?? "/";

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
      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupabaseAuth) {
    return (
      <Card variant="elevated">
        <SectionHeader
          title="Supabase not configured"
          subtitle="Use Demo Mode for local development, or add Supabase env vars."
        />
        {isDemoModeEnabled() ? (
          <Link
            href="/demo/login"
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-xs font-semibold text-white"
          >
            Continue in Demo Mode
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        label="Authentication"
        title="Sign in"
        subtitle="Access the USDC settlement workflow with your institutional account."
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
            {submitting ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
      </Card>

      <p className="text-center text-xs text-ops-text-secondary">
        No account?{" "}
        <Link href="/auth/sign-up" className="font-medium text-ops-primary hover:underline">
          Create one
        </Link>
      </p>

      {isDemoModeEnabled() ? (
        <Card variant="ghost" className="border-ops-border-subtle bg-ops-overlay/30">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
            Local development
          </p>
          <p className="mt-1 text-xs text-ops-text-secondary">
            Demo Mode skips Supabase and uses role-based session buttons.
          </p>
          <Link
            href="/demo/login"
            className="mt-3 inline-block text-xs font-medium text-ops-primary hover:underline"
          >
            Continue in Demo Mode →
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
