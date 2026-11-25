-- Apply before releasing clients that save rhythm preferences.
-- No changes to owners, RLS policies or the one-active-session constraint.
create or replace function public.valid_rhythm_config(c jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  return coalesce(
    jsonb_typeof(c) = 'object'
    and c ?& array['mode','focusMinutes','breakMinutes','blocks','eyeCare']
    and c->>'mode' in ('cycles','free','none')
    and jsonb_typeof(c->'eyeCare') = 'boolean'
    and jsonb_typeof(c->'focusMinutes') = 'number'
    and (c->>'focusMinutes')::numeric between 1 and 120
    and (c->>'focusMinutes')::numeric = trunc((c->>'focusMinutes')::numeric)
    and jsonb_typeof(c->'breakMinutes') = 'number'
    and (c->>'breakMinutes')::numeric between 1 and 60
    and (c->>'breakMinutes')::numeric = trunc((c->>'breakMinutes')::numeric)
    and jsonb_typeof(c->'blocks') = 'number'
    and (c->>'blocks')::numeric between 1 and 12
    and (c->>'blocks')::numeric = trunc((c->>'blocks')::numeric), false);
exception when others then return false;
end;
$$;
create or replace function public.valid_rhythm_state(p jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare r jsonb := p->'rhythm'; field text; amount numeric;
begin
  if r is null then return true; end if;
  if not coalesce(
    jsonb_typeof(r) = 'object'
    and r ?& array['version','config','phase','block','phaseSeconds','phaseTarget','focusSeconds','breakSeconds','eyeSeconds','eyeRemaining','eyeDueIn','paused','lastAt']
    and r->>'version' = '1' and p->>'purpose' = 'rhythm'
    and public.valid_rhythm_config(r->'config')
    and r->'config'->>'mode' <> 'none'
    and r->>'phase' in ('focus','break','checkin','ready','finished')
    and jsonb_typeof(r->'paused') = 'boolean'
    and (p->>'status' = 'complete') = (r->>'phase' = 'finished'), false)
    then return false; end if;
  foreach field in array array['block','phaseSeconds','phaseTarget','focusSeconds','breakSeconds','eyeSeconds','eyeRemaining','eyeDueIn','lastAt'] loop
    if jsonb_typeof(r->field) is distinct from 'number' then return false; end if;
    amount := (r->>field)::numeric;
    if amount < 0 or amount > 9007199254740991 or amount <> trunc(amount) then return false; end if;
  end loop;
  return (r->>'block')::numeric between 1 and (r->'config'->>'blocks')::numeric
    and (r->>'phaseTarget')::numeric >= 60
    and (r->>'eyeRemaining')::numeric <= 20
    and (r->>'eyeDueIn')::numeric <= 1200;
exception when others then return false;
end;
$$;
-- Optional rhythm configuration; existing two-minute sessions remain valid.
alter table public.workspace_items drop constraint workspace_items_kind_check;
alter table public.workspace_items drop constraint workspace_payload_shape;

alter table public.workspace_items add constraint workspace_items_kind_check
  check (kind in ('task', 'focus', 'mood', 'project', 'rhythm_preferences'));

alter table public.workspace_items add constraint workspace_payload_shape check (
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
    when 'project' then
      payload ?& array['title','color']
      and jsonb_typeof(payload->'title') = 'string'
      and length(trim(payload->>'title')) between 1 and 80
      and jsonb_typeof(payload->'color') = 'string'
      and payload->>'color' ~ '^#[0-9A-Fa-f]{6}$'
    when 'rhythm_preferences' then public.valid_rhythm_config(payload->'config')
    else false
  end
);

alter table public.workspace_items add constraint workspace_rhythm_shape check (
  case
    when kind = 'task' then payload->'rhythm' is null or payload->'rhythm' = 'null'::jsonb or public.valid_rhythm_config(payload->'rhythm')
    when kind = 'focus' then public.valid_rhythm_state(payload)
    else true
  end
);
create unique index workspace_one_rhythm_preference on public.workspace_items(user_id)
  where kind = 'rhythm_preferences';

-- Starting a break must not appear as returning to work.
create or replace function public.capture_focus_resume()
returns trigger language plpgsql security definer set search_path = '' as $$
declare task_ref uuid;
begin
  if new.kind = 'focus' and new.payload->>'status' = 'active'
    and old.payload->>'status' = 'active'
    and ((old.payload->'runningSince') = 'null'::jsonb)
    and jsonb_typeof(new.payload->'runningSince') = 'number'
    and (new.payload->'rhythm' is null or new.payload->'rhythm'->>'phase' = 'focus') then
    task_ref := nullif(new.payload->>'taskId','')::uuid;
    insert into public.activity_events (user_id,event_type,workspace_item_id,task_id,metadata)
    values (new.user_id,'focus_resumed',new.id,task_ref,
      jsonb_build_object('title',new.payload->>'title','step',new.payload->>'step'));
  end if;
  return new;
end;
$$;

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
             'seconds', coalesce((new.payload->'rhythm'->>'focusSeconds')::numeric, (new.payload->>'elapsed')::numeric, 0),
             'purpose', coalesce(new.payload->>'purpose', 'start'),
             'breakSeconds', coalesce((new.payload->'rhythm'->>'breakSeconds')::numeric, 0),
             'eyeSeconds', coalesce((new.payload->'rhythm'->>'eyeSeconds')::numeric, 0)));
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
         'seconds', coalesce((new.payload->'rhythm'->>'focusSeconds')::numeric, (new.payload->>'elapsed')::numeric, 0),
             'purpose', coalesce(new.payload->>'purpose', 'start'),
             'breakSeconds', coalesce((new.payload->'rhythm'->>'breakSeconds')::numeric, 0),
             'eyeSeconds', coalesce((new.payload->'rhythm'->>'eyeSeconds')::numeric, 0)));
  end if;
  return new;
end;
$$;
