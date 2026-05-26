-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null check (role in ('analyst', 'treasury_manager', 'admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

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
