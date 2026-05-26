"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, InputLabel, PrimaryButton, SectionHeader, TextInput } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const { isSupabaseAuth, loading, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      await refreshSession();
      router.push("/auth/role");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!loading && !isSupabaseAuth) {
      router.replace("/auth/sign-in");
    }
  }, [isSupabaseAuth, loading, router]);

  if (loading || !isSupabaseAuth) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        label="Authentication"
        title="Create account"
        subtitle="Register for treasury operations access. You will select an operational role next."
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div>
            <InputLabel htmlFor="confirmPassword">Confirm password</InputLabel>
            <TextInput
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-xs text-ops-danger">{error}</p> : null}
          <PrimaryButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </form>
      </Card>

      <p className="text-center text-xs text-ops-text-secondary">
        Already registered?{" "}
        <Link href="/auth/sign-in" className="font-medium text-ops-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
