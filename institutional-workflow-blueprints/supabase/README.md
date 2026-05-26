# Supabase SQL scripts

**Do not run TypeScript files in the SQL Editor.**

These files are app code — they will fail with `syntax error at or near "export"`:

- `data/demo-accounts.ts`
- Any file under `components/`, `lib/`, etc.

## What to run

Open **Supabase Dashboard → SQL Editor** and run one of:

| File | Purpose |
|------|---------|
| `schema.sql` | Tables, RLS, workflow schema (run once) |
| `seed-users.sql` | Full demo users (all roles + `@demo.com` accounts) |
| `seed-demo-accounts-only.sql` | Just the 3 Demo Accounts menu users |

## Demo Accounts menu credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Analyst | `analyst@demo.com` | `Demo1234!` |
| Treasury Manager | `manager@demo.com` | `Demo1234!` |
| Admin | `admin@demo.com` | `Demo1234!` |

## Quick seed (copy into SQL Editor)

If `seed_demo_user()` already exists from a prior `seed-users.sql` run:

```sql
select public.seed_demo_user('analyst@demo.com', 'Demo1234!', 'analyst', 'Demo Analyst');
select public.seed_demo_user('manager@demo.com', 'Demo1234!', 'treasury_manager', 'Demo Treasury Manager');
select public.seed_demo_user('admin@demo.com', 'Demo1234!', 'admin', 'Demo Admin');
```

If that function does not exist yet, run the full `seed-users.sql` file first.
