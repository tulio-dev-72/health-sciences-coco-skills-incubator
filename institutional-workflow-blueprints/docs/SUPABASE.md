# Supabase Auth setup

## 1. Create a Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Copy **Project URL** and **anon public key**

## 2. Run database schema

In Supabase → **SQL Editor**, run:

`supabase/schema.sql`

Creates `user_profiles` with RLS and roles: `analyst`, `treasury_manager`, `admin`.

## 3. Environment variables

Copy `.env.example` → `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional — force demo auth locally even with Supabase configured:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

## 4. Auth flow

| Step | Route |
|------|--------|
| Sign up | `/auth/sign-up` |
| Sign in | `/auth/sign-in` |
| Select role (stored in `user_profiles`) | `/auth/role` |
| Settlement workflow | `/` (requires auth + role) |

## 5. Demo Mode (local development only)

When **no Supabase env vars** are set in development, or `NEXT_PUBLIC_DEMO_MODE=true`:

- Role buttons at `/demo/login`
- Cookie-based session (`iwb_role`)
- No Supabase required

Production should always use Supabase credentials and leave `NEXT_PUBLIC_DEMO_MODE` unset.

## 6. Disable email confirmation (optional for demos)

Supabase → **Authentication → Providers → Email** → disable “Confirm email” for faster sandbox signup.
