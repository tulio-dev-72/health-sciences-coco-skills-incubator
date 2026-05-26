-- Seed demo users for Treasury Control Center
-- Run in Supabase Dashboard → SQL Editor ONLY (SQL, not TypeScript).
-- Do NOT paste data/demo-accounts.ts into the SQL Editor.
--
-- Creates 9 accounts (3 roles × 3 people):
--   Scott Harvey    — analyst, treasury_manager, admin
--   Karthik Iyer    — analyst, treasury_manager, admin
--   Tulio Quinones  — analyst, treasury_manager, admin
--
-- Password for ALL accounts: Demo1234!
-- Emails are fake (@demo.local / @demo.com) — no inbox required if Confirm email is OFF.

create extension if not exists pgcrypto;

create or replace function public.seed_demo_user(
  p_email text,
  p_password text,
  p_role text,
  p_display_name text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := gen_random_uuid();
begin
  if p_role not in ('analyst', 'treasury_manager', 'admin') then
    raise exception 'Invalid role: %', p_role;
  end if;

  if exists (select 1 from auth.users where email = p_email) then
    raise notice 'User already exists, skipping: %', p_email;
    return;
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('display_name', p_display_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_user_id,
    p_email,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.user_profiles (id, email, role, display_name)
  values (v_user_id, p_email, p_role, p_display_name);
end;
$$;

-- Scott Harvey
select public.seed_demo_user('scott.analyst@demo.local', 'Demo1234!', 'analyst', 'Scott Harvey');
select public.seed_demo_user('scott.treasury@demo.local', 'Demo1234!', 'treasury_manager', 'Scott Harvey');
select public.seed_demo_user('scott.admin@demo.local', 'Demo1234!', 'admin', 'Scott Harvey');

-- Karthik Iyer
select public.seed_demo_user('karthik.analyst@demo.local', 'Demo1234!', 'analyst', 'Karthik Iyer');
select public.seed_demo_user('karthik.treasury@demo.local', 'Demo1234!', 'treasury_manager', 'Karthik Iyer');
select public.seed_demo_user('karthik.admin@demo.local', 'Demo1234!', 'admin', 'Karthik Iyer');

-- Tulio Quinones
select public.seed_demo_user('tulio.analyst@demo.local', 'Demo1234!', 'analyst', 'Tulio Quinones');
select public.seed_demo_user('tulio.treasury@demo.local', 'Demo1234!', 'treasury_manager', 'Tulio Quinones');
select public.seed_demo_user('tulio.admin@demo.local', 'Demo1234!', 'admin', 'Tulio Quinones');

-- Generic role-based demo accounts (shown in Demo Accounts menu)
select public.seed_demo_user('analyst@demo.com', 'Demo1234!', 'analyst', 'Demo Analyst');
select public.seed_demo_user('manager@demo.com', 'Demo1234!', 'treasury_manager', 'Demo Treasury Manager');
select public.seed_demo_user('admin@demo.com', 'Demo1234!', 'admin', 'Demo Admin');

-- Optional: remove helper after seeding
-- drop function if exists public.seed_demo_user(text, text, text, text);

-- Verify
select up.display_name, up.email, up.role
from public.user_profiles up
order by up.display_name, up.role;
