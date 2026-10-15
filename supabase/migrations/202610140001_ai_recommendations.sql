create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.workspace_items(id) on delete set null,
  task_revision integer not null check (task_revision > 0),
  microaction text not null check (length(trim(microaction)) between 3 and 180),
  reason text not null check (length(trim(reason)) between 3 and 220),
  estimated_minutes integer not null check (estimated_minutes between 1 and 15),
  source text not null check (source in ('llama', 'deterministic')),
  model text,
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index ai_recommendations_owner_created
  on public.ai_recommendations(user_id, created_at desc);

alter table public.ai_recommendations enable row level security;
revoke all on public.ai_recommendations from anon;
grant select, insert, update on public.ai_recommendations to authenticated;

create policy ai_recommendations_read on public.ai_recommendations
  for select to authenticated using (user_id = (select auth.uid()));
create policy ai_recommendations_insert on public.ai_recommendations
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.workspace_items
      where id = task_id and user_id = (select auth.uid()) and kind = 'task'
    )
  );
create policy ai_recommendations_update on public.ai_recommendations
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
