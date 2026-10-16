-- Resume events distinguish returning from starting, without relying on clients.
alter table public.activity_events drop constraint activity_events_event_type_check;
alter table public.activity_events add constraint activity_events_event_type_check
  check (event_type in (
    'task_created', 'task_completed', 'step_completed',
    'focus_started', 'focus_resumed', 'focus_completed', 'mood_logged'
  ));

create or replace function public.capture_focus_resume()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_ref uuid;
begin
  if new.kind = 'focus'
    and new.payload->>'status' = 'active'
    and old.payload->>'status' = 'active'
    and (old.payload->'runningSince') = 'null'::jsonb
    and jsonb_typeof(new.payload->'runningSince') = 'number' then
    task_ref := case
      when nullif(new.payload->>'taskId', '') is not null
        then (new.payload->>'taskId')::uuid
      else null
    end;
    insert into public.activity_events
      (user_id, event_type, workspace_item_id, task_id, metadata)
    values
      (new.user_id, 'focus_resumed', new.id, task_ref,
       jsonb_build_object('title', new.payload->>'title', 'step', new.payload->>'step'));
  end if;
  return new;
end;
$$;

create trigger workspace_focus_resume_event
after update of payload on public.workspace_items
for each row execute function public.capture_focus_resume();
