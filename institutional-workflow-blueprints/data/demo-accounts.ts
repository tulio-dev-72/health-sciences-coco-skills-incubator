/**
 * DEMO AUTH CONFIG — TypeScript only (Next.js app).
 *
 * ⚠️  DO NOT run this file in Supabase SQL Editor.
 *     SQL Editor expects SQL, not `export const ...`.
 *
 * To create demo users in Supabase, run:
 *   supabase/seed-users.sql
 * or
 *   supabase/seed-demo-accounts-only.sql
 *
 * See supabase/README.md
 */

/** Shared sandbox demo credentials — not production authentication. */

export const DEMO_SANDBOX_PASSWORD = "Demo1234!";

export const DEMO_SANDBOX_LABEL =
  "Sandbox demo credentials — not production authentication.";

export type DemoAccount = {
  roleLabel: string;
  email: string;
  password: string;
  description: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleLabel: "Analyst",
    email: "analyst@demo.com",
    password: DEMO_SANDBOX_PASSWORD,
    description: "Initiates the $250,000 USDC settlement request.",
  },
  {
    roleLabel: "Treasury Manager",
    email: "manager@demo.com",
    password: DEMO_SANDBOX_PASSWORD,
    description: "Authorizes the settlement and releases it to Fireblocks.",
  },
  {
    roleLabel: "Admin",
    email: "admin@demo.com",
    password: DEMO_SANDBOX_PASSWORD,
    description: "Reviews policy, webhooks, and audit configuration.",
  },
];

// Demo auth accounts only — run supabase/seed-users.sql or seed-demo-accounts-only.sql in SQL Editor.
// Do NOT paste this TypeScript file into Supabase.
