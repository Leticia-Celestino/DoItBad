create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intentions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 240),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index intentions_owner_updated_idx on public.intentions (owner_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.intentions enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "intentions_select_own" on public.intentions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "intentions_insert_own" on public.intentions for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "intentions_update_own" on public.intentions for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "intentions_delete_own" on public.intentions for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.profiles, public.intentions from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.intentions to authenticated;
