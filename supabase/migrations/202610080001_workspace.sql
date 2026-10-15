-- Shared records for web and native clients. Existing intentions are preserved.
create table public.workspace_items (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('task', 'focus', 'mood')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  constraint workspace_payload_shape check (
    case kind
      when 'task' then
        payload ?& array['title','project','date','done','steps']
        and jsonb_typeof(payload->'title') = 'string'
        and length(trim(payload->>'title')) between 1 and 240
        and jsonb_typeof(payload->'done') = 'boolean'
        and jsonb_typeof(payload->'steps') = 'array'
      when 'focus' then
        payload ?& array['title','step','target','elapsed','status','runningSince','note','blockers']
        and length(trim(payload->>'title')) between 1 and 240
        and length(trim(payload->>'step')) between 1 and 240
        and (payload->>'status') in ('active','complete')
        and jsonb_typeof(payload->'target') = 'number'
        and (payload->>'target')::numeric between 60 and 7200
        and jsonb_typeof(payload->'elapsed') = 'number'
        and (payload->>'elapsed')::numeric between 0 and (payload->>'target')::numeric
        and jsonb_typeof(payload->'blockers') = 'array'
        and length(payload->>'note') <= 1000
      when 'mood' then
        payload ?& array['value','note']
        and jsonb_typeof(payload->'value') = 'number'
        and (payload->>'value')::numeric in (1,2,3,4,5)
        and jsonb_typeof(payload->'note') = 'string'
        and length(payload->>'note') <= 1000
      else false
    end
  )
);
create index workspace_items_owner_kind on public.workspace_items(user_id, kind, created_at desc);
create unique index workspace_one_active_focus on public.workspace_items(user_id)
  where kind = 'focus' and payload->>'status' = 'active';
alter table public.workspace_items enable row level security;
revoke all on public.workspace_items from anon;
grant select, insert, update on public.workspace_items to authenticated;
create policy workspace_read on public.workspace_items for select to authenticated using (user_id = (select auth.uid()));
create policy workspace_insert on public.workspace_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy workspace_update on public.workspace_items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
