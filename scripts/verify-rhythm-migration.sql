-- Disposable PostgreSQL database only. Creates mock auth objects; never run on a real project.
\set ON_ERROR_STOP on
create schema auth;
create role anon;
create role authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
grant usage on schema public, auth to authenticated;
\i /repo/supabase/migrations/202610080001_workspace.sql
\i /repo/supabase/migrations/202610120002_workspace_projects.sql
\i /repo/supabase/migrations/202610160001_activity_events.sql
\i /repo/supabase/migrations/202610160002_focus_resume_events.sql
-- Legacy row exists before the additive migration.
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into public.workspace_items(id,user_id,kind,payload) values
('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','focus',
'{"title":"Começar","step":"Abrir livro","target":120,"elapsed":120,"status":"complete","runningSince":null,"note":"","blockers":[]}');
\i /repo/supabase/migrations/202611250001_rhythm.sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
insert into public.workspace_items(id,kind,payload) values
('00000000-0000-0000-0000-000000000020','rhythm_preferences',
'{"config":{"mode":"cycles","focusMinutes":50,"breakMinutes":10,"blocks":2,"eyeCare":true}}');
insert into public.workspace_items(id,kind,payload) values
('00000000-0000-0000-0000-000000000030','focus',
'{"taskId":null,"title":"Química","step":"Questão 8","purpose":"rhythm","target":3000,"elapsed":0,"status":"active","runningSince":1000000,"note":"","blockers":[],"rhythm":{"version":1,"config":{"mode":"cycles","focusMinutes":50,"breakMinutes":10,"blocks":2,"eyeCare":true},"phase":"focus","block":1,"phaseSeconds":0,"phaseTarget":3000,"focusSeconds":0,"breakSeconds":0,"eyeSeconds":0,"eyeRemaining":0,"eyeDueIn":1200,"paused":false,"lastAt":1000000}}');
do $$ begin
  begin
    insert into public.workspace_items(id,kind,payload)
    select '00000000-0000-0000-0000-000000000031','focus',payload from public.workspace_items where id='00000000-0000-0000-0000-000000000030';
    raise exception 'second active session was accepted';
  exception when unique_violation then null; end;
  begin
    update public.workspace_items set payload=jsonb_set(payload,'{rhythm,focusSeconds}','null') where id='00000000-0000-0000-0000-000000000030';
    raise exception 'invalid state was accepted';
  exception when check_violation then null; end;
  begin
    update public.workspace_items set payload=jsonb_set(payload,'{config,focusMinutes}','0') where kind='rhythm_preferences';
    raise exception 'invalid configuration was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.workspace_items(id,kind,payload)
    select '00000000-0000-0000-0000-000000000021','rhythm_preferences',payload from public.workspace_items where kind='rhythm_preferences';
    raise exception 'duplicate preferences were accepted';
  exception when unique_violation then null; end;
end $$;
-- Completing a long session uses actual focus seconds, not the capped legacy elapsed field.
update public.workspace_items set payload =
  jsonb_set(jsonb_set(jsonb_set(jsonb_set(payload,'{status}','"complete"'),'{rhythm,phase}','"finished"'),'{rhythm,focusSeconds}','5960'),'{elapsed}','3000')
where id='00000000-0000-0000-0000-000000000030';
do $$ begin
  if (select (metadata->>'seconds')::integer from public.activity_events where workspace_item_id='00000000-0000-0000-0000-000000000030' and event_type='focus_completed') <> 5960 then
    raise exception 'history counted the wrong duration';
  end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
  if exists(select 1 from public.workspace_items) then raise exception 'cross-account read'; end if;
  if exists(select 1 from public.activity_events) then raise exception 'cross-account event read'; end if;
  begin
    insert into public.workspace_items(id,user_id,kind,payload) values
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000001','rhythm_preferences','{"config":{"mode":"free","focusMinutes":50,"breakMinutes":10,"blocks":1,"eyeCare":false}}');
    raise exception 'forged owner accepted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Rhythm migration, legacy compatibility, uniqueness, history and RLS passed' as result;
