-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS where needed.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null check (role in ('analyst', 'treasury_manager', 'admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_updated_at on public.user_profiles;

create trigger user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Workflow persistence
-- ---------------------------------------------------------------------------

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  approval_threshold numeric not null default 10000,
  whitelisted_addresses jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlement_requests (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  created_by uuid not null references auth.users (id),
  blueprint_id text,
  asset text not null,
  amount numeric not null check (amount > 0),
  destination text not null,
  destination_label text,
  reason text not null,
  source_vault text,
  settlement_rail text,
  counterparty text,
  policy_trigger text,
  required_approver text,
  status text not null check (
    status in ('CREATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SETTLED')
  ),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  requires_approval boolean not null default false,
  created_by_name text not null,
  created_by_role text not null,
  reviewed_by_name text,
  reviewed_by_role text,
  fireblocks_tx_id text,
  fireblocks_status text,
  policy_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  settlement_request_id uuid not null references public.settlement_requests (id) on delete cascade,
  approver_id uuid not null references auth.users (id),
  approver_name text not null,
  approver_role text not null,
  decision text not null check (decision in ('approved', 'rejected')),
  fireblocks_tx_id text,
  fireblocks_status text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  settlement_request_id uuid references public.settlement_requests (id) on delete set null,
  action text not null,
  actor text not null,
  role text not null,
  details text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fireblocks_events (
  id uuid primary key default gen_random_uuid(),
  settlement_request_id uuid references public.settlement_requests (id) on delete set null,
  fireblocks_tx_id text,
  external_id text,
  event_type text not null,
  status text not null,
  sub_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists settlement_requests_created_by_idx on public.settlement_requests (created_by);
create index if not exists settlement_requests_status_idx on public.settlement_requests (status);
create index if not exists audit_logs_settlement_idx on public.audit_logs (settlement_request_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists fireblocks_events_external_id_idx on public.fireblocks_events (external_id);

alter table public.policies enable row level security;
alter table public.settlement_requests enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.fireblocks_events enable row level security;

-- Policies
drop policy if exists "Authenticated users can read policies" on public.policies;
create policy "Authenticated users can read policies"
  on public.policies for select to authenticated using (true);

drop policy if exists "Admins can update policies" on public.policies;
create policy "Admins can update policies"
  on public.policies for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can insert policies" on public.policies;
create policy "Admins can insert policies"
  on public.policies for insert to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Settlement requests
drop policy if exists "Authenticated users can read settlements" on public.settlement_requests;
create policy "Authenticated users can read settlements"
  on public.settlement_requests for select to authenticated using (true);

drop policy if exists "Authenticated users can create settlements" on public.settlement_requests;
create policy "Authenticated users can create settlements"
  on public.settlement_requests for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Authenticated users can update settlements" on public.settlement_requests;
create policy "Authenticated users can update settlements"
  on public.settlement_requests for update to authenticated using (true);

-- Approvals
drop policy if exists "Authenticated users can read approvals" on public.approvals;
create policy "Authenticated users can read approvals"
  on public.approvals for select to authenticated using (true);

drop policy if exists "Authenticated users can create approvals" on public.approvals;
create policy "Authenticated users can create approvals"
  on public.approvals for insert to authenticated
  with check (approver_id = auth.uid());

-- Audit logs
drop policy if exists "Authenticated users can read audit logs" on public.audit_logs;
create policy "Authenticated users can read audit logs"
  on public.audit_logs for select to authenticated using (true);

drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert to authenticated
  with check (true);

-- Fireblocks events (read for app; inserts via service role / API)
drop policy if exists "Authenticated users can read fireblocks events" on public.fireblocks_events;
create policy "Authenticated users can read fireblocks events"
  on public.fireblocks_events for select to authenticated using (true);

drop policy if exists "Authenticated users can insert fireblocks events" on public.fireblocks_events;
create policy "Authenticated users can insert fireblocks events"
  on public.fireblocks_events for insert to authenticated with check (true);

-- Default TAP policy row
insert into public.policies (id, name, approval_threshold, whitelisted_addresses)
values (
  '00000000-0000-0000-0000-000000000001',
  'default',
  10000,
  '["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063","0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"]'::jsonb
)
on conflict (id) do nothing;

drop trigger if exists policies_updated_at on public.policies;
create trigger policies_updated_at
before update on public.policies
for each row
execute function public.handle_updated_at();

drop trigger if exists settlement_requests_updated_at on public.settlement_requests;
create trigger settlement_requests_updated_at
before update on public.settlement_requests
for each row
execute function public.handle_updated_at();

-- Webhook delivery tracking (safe to re-run)
alter table public.fireblocks_events add column if not exists delivery_status text not null default 'received';
alter table public.fireblocks_events add column if not exists processing_error text;
alter table public.fireblocks_events add column if not exists signature_valid boolean;
alter table public.fireblocks_events add column if not exists settlement_matched boolean not null default false;

create index if not exists fireblocks_events_created_at_idx on public.fireblocks_events (created_at desc);
create index if not exists fireblocks_events_delivery_status_idx on public.fireblocks_events (delivery_status);

