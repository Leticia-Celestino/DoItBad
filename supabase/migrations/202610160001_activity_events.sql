-- A durable, append-only history of presence. Clients can read it; workspace
-- mutations create events centrally so web and mobile cannot drift apart.
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'task_created', 'task_completed', 'step_completed',
    'focus_started', 'focus_resumed', 'focus_completed', 'mood_logged'
  )),
  workspace_item_id uuid references public.workspace_items(id) on delete set null,
  task_id uuid,
  project_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index activity_events_owner_time
  on public.activity_events(user_id, occurred_at desc);
create index activity_events_owner_task
  on public.activity_events(user_id, task_id, occurred_at desc)
  where task_id is not null;

alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon, authenticated;
grant select on public.activity_events to authenticated;
create policy activity_events_read on public.activity_events
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.capture_workspace_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_index text;
  task_ref uuid;
  project_ref uuid;
begin
  task_ref := case
    when new.kind = 'task' then new.id
    when new.kind = 'focus' and nullif(new.payload->>'taskId', '') is not null
      then (new.payload->>'taskId')::uuid
    else null
  end;
  project_ref := case
    when new.kind = 'task' and nullif(new.payload->>'projectId', '') is not null
      then (new.payload->>'projectId')::uuid
    else null
  end;

  if tg_op = 'INSERT' then
    if new.kind = 'task' then
      insert into public.activity_events
        (user_id, event_type, workspace_item_id, task_id, project_id, occurred_at, metadata)
      values
        (new.user_id, 'task_created', new.id, new.id, project_ref, new.created_at,
         jsonb_build_object('title', new.payload->>'title'));
    elsif new.kind = 'focus' then
      insert into public.activity_events
        (user_id, event_type, workspace_item_id, task_id, occurred_at, metadata)
      values
        (new.user_id, 'focus_started', new.id, task_ref, new.created_at,
         jsonb_build_object('title', new.payload->>'title', 'step', new.payload->>'step'));
      if new.payload->>'status' = 'complete' then
        insert into public.activity_events
          (user_id, event_type, workspace_item_id, task_id, occurred_at, metadata)
        values
          (new.user_id, 'focus_completed', new.id, task_ref, now(),
           jsonb_build_object('title', new.payload->>'title', 'step', new.payload->>'step',
             'seconds', coalesce((new.payload->>'elapsed')::numeric, 0)));
      end if;
    elsif new.kind = 'mood' then
      insert into public.activity_events
        (user_id, event_type, workspace_item_id, occurred_at, metadata)
      values
        (new.user_id, 'mood_logged', new.id, new.created_at,
         jsonb_build_object('value', new.payload->'value', 'note', new.payload->>'note'));
    end if;
    return new;
  end if;

  if new.kind = 'task' then
    if coalesce((old.payload->>'done')::boolean, false) = false
      and coalesce((new.payload->>'done')::boolean, false) = true then
      insert into public.activity_events
        (user_id, event_type, workspace_item_id, task_id, project_id, metadata)
      values
        (new.user_id, 'task_completed', new.id, new.id, project_ref,
         jsonb_build_object('title', new.payload->>'title'));
    end if;
    for completed_index in
      select value
      from jsonb_array_elements_text(coalesce(new.payload->'completedSteps', '[]'::jsonb))
      except
      select value
      from jsonb_array_elements_text(coalesce(old.payload->'completedSteps', '[]'::jsonb))
    loop
      insert into public.activity_events
        (user_id, event_type, workspace_item_id, task_id, project_id, metadata)
      values
        (new.user_id, 'step_completed', new.id, new.id, project_ref,
         jsonb_build_object(
           'title', new.payload->>'title',
           'stepIndex', completed_index::integer,
           'step', new.payload->'steps'->(completed_index::integer)
         ));
    end loop;
  elsif new.kind = 'focus'
    and old.payload->>'status' <> 'complete'
    and new.payload->>'status' = 'complete' then
    insert into public.activity_events
      (user_id, event_type, workspace_item_id, task_id, metadata)
    values
      (new.user_id, 'focus_completed', new.id, task_ref,
       jsonb_build_object('title', new.payload->>'title', 'step', new.payload->>'step',
         'seconds', coalesce((new.payload->>'elapsed')::numeric, 0)));
  end if;
  return new;
end;
$$;

create trigger workspace_activity_events
after insert or update of payload on public.workspace_items
for each row execute function public.capture_workspace_activity();

-- Seed one honest historical event per existing record. Old microaction completion
-- timestamps are not reconstructed because the source data never stored them.
insert into public.activity_events
  (user_id, event_type, workspace_item_id, task_id, project_id, occurred_at, metadata)
select
  user_id,
  case
    when kind = 'task' and coalesce((payload->>'done')::boolean, false) then 'task_completed'
    when kind = 'task' then 'task_created'
    when kind = 'focus' and payload->>'status' = 'complete' then 'focus_completed'
    when kind = 'focus' then 'focus_started'
    else 'mood_logged'
  end,
  id,
  case
    when kind = 'task' then id
    when kind = 'focus' and nullif(payload->>'taskId', '') is not null
      then (payload->>'taskId')::uuid
    else null
  end,
  case
    when kind = 'task' and nullif(payload->>'projectId', '') is not null
      then (payload->>'projectId')::uuid
    else null
  end,
  created_at,
  jsonb_strip_nulls(jsonb_build_object(
    'title', payload->>'title',
    'step', payload->>'step',
    'seconds', payload->'elapsed',
    'value', payload->'value',
    'historical', true
  ))
from public.workspace_items
where kind in ('task', 'focus', 'mood');
