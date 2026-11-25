-- Run with: pnpm exec supabase db query --linked --file scripts/verify-workspace-rls.sql
-- All fixtures are rolled back, including profiles created by the auth trigger.
begin;
select set_config('test.user_a', gen_random_uuid()::text, true);
select set_config('test.user_b', gen_random_uuid()::text, true);
select set_config('test.item', gen_random_uuid()::text, true);
insert into auth.users (id, email) values
  (current_setting('test.user_a')::uuid, 'workspace-a@example.invalid'),
  (current_setting('test.user_b')::uuid, 'workspace-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);
insert into public.workspace_items (id, kind, payload) values
  (current_setting('test.item')::uuid, 'task', '{"title":"RLS fixture","project":"","date":"","done":false,"steps":[]}');
do $$
begin
  if (select count(*) from public.workspace_items) <> 1 then
    raise exception 'Owner cannot read own fixture';
  end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.user_b'), true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.workspace_items) then
    raise exception 'Cross-account read allowed';
  end if;
  update public.workspace_items set revision = revision + 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
  delete from public.workspace_items where id = current_setting('test.item')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account delete allowed'; end if;
  begin
    insert into public.workspace_items (id, user_id, kind, payload) values
      (gen_random_uuid(), current_setting('test.user_a')::uuid, 'mood', '{"value":3,"note":""}');
    raise exception 'Cross-account insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);
do $$
declare affected integer;
begin
  delete from public.workspace_items where id = current_setting('test.item')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner cannot delete own fixture'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.user_b'), true);
insert into public.workspace_items (id, kind, payload) values
  (gen_random_uuid(), 'focus', '{"title":"Test","step":"Test","target":120,"elapsed":0,"status":"active","runningSince":null,"note":"","blockers":[]}');
do $$
begin
  begin
    insert into public.workspace_items (id, kind, payload) values
      (gen_random_uuid(), 'focus', '{"title":"Test","step":"Test","target":120,"elapsed":0,"status":"active","runningSince":null,"note":"","blockers":[]}');
    raise exception 'Duplicate active focus allowed';
  exception when unique_violation then null;
  end;
end $$;
set local role anon;
do $$
begin
  begin
    perform 1 from public.workspace_items;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select 'PASS: owner read/delete, account isolation for read/update/delete, spoofed ownership, active focus uniqueness, anonymous denial; fixtures rolled back' as result;
