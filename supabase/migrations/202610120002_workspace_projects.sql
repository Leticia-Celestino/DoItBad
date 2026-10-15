-- Projects are shared records so web and native clients use the same name and color.
alter table public.workspace_items drop constraint workspace_items_kind_check;
alter table public.workspace_items drop constraint workspace_payload_shape;

alter table public.workspace_items add constraint workspace_items_kind_check
  check (kind in ('task', 'focus', 'mood', 'project'));

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
    else false
  end
);
