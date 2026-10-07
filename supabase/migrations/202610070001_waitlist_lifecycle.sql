alter table public.waitlist_signups
  add column if not exists status text not null default 'pending',
  add column if not exists confirmation_token_hash text,
  add column if not exists unsubscribe_token_hash text,
  add column if not exists confirmation_reserved_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_status_check;
alter table public.waitlist_signups
  add constraint waitlist_signups_status_check
  check (status in ('pending', 'confirmed', 'unsubscribed'));

create unique index if not exists waitlist_confirmation_token_unique
  on public.waitlist_signups (confirmation_token_hash)
  where confirmation_token_hash is not null;
create unique index if not exists waitlist_unsubscribe_token_unique
  on public.waitlist_signups (unsubscribe_token_hash)
  where unsubscribe_token_hash is not null;

create table if not exists public.waitlist_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);
alter table public.waitlist_rate_limits enable row level security;
revoke all on public.waitlist_rate_limits from anon, authenticated;

create or replace function public.consume_waitlist_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare current_attempts integer;
begin
  insert into public.waitlist_rate_limits as limits (key, window_started_at, attempts)
  values (p_key, now(), 1)
  on conflict (key) do update
    set attempts = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else limits.attempts + 1
    end,
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else limits.window_started_at
    end
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;

create or replace function public.register_waitlist_signup(
  p_name text,
  p_email text,
  p_locale text,
  p_confirmation_token_hash text,
  p_unsubscribe_token_hash text
) returns table(result text, signup_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  signup public.waitlist_signups%rowtype;
  inserted boolean := false;
begin
  select * into signup from public.waitlist_signups where email = lower(p_email) for update;
  if not found then
    begin
      insert into public.waitlist_signups (
        name, email, locale, status, confirmation_token_hash, unsubscribe_token_hash,
        confirmation_reserved_at
      ) values (
        p_name, lower(p_email), p_locale, 'pending', p_confirmation_token_hash,
        p_unsubscribe_token_hash, now()
      ) returning id into signup_id;
      inserted := true;
    exception when unique_violation then
      select * into signup from public.waitlist_signups where email = lower(p_email) for update;
    end;
    if inserted then
      result := 'created';
      return next;
      return;
    end if;
  end if;

  signup_id := signup.id;
  if signup.status = 'confirmed' then
    result := 'already_subscribed';
    return next;
    return;
  end if;
  if signup.status = 'pending' and signup.confirmation_reserved_at > now() - interval '15 minutes' then
    result := 'pending_recent';
    return next;
    return;
  end if;

  update public.waitlist_signups set
    name = p_name,
    locale = p_locale,
    status = 'pending',
    confirmation_token_hash = p_confirmation_token_hash,
    unsubscribe_token_hash = p_unsubscribe_token_hash,
    confirmation_reserved_at = now(),
    confirmed_at = null,
    unsubscribed_at = null
  where id = signup.id;
  result := 'renewed';
  return next;
end;
$$;

create or replace function public.release_waitlist_email_reservation(
  p_signup_id uuid,
  p_confirmation_token_hash text
) returns void
language sql
security definer
set search_path = public
as $$
  update public.waitlist_signups
  set confirmation_reserved_at = null
  where id = p_signup_id and confirmation_token_hash = p_confirmation_token_hash and status = 'pending';
$$;

create or replace function public.confirm_waitlist_signup(p_token_hash text) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update public.waitlist_signups set
    status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()),
    confirmation_token_hash = null, confirmation_reserved_at = null
  where confirmation_token_hash = p_token_hash and status = 'pending';
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.unsubscribe_waitlist_signup(p_token_hash text) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update public.waitlist_signups set
    status = 'unsubscribed', unsubscribed_at = now(), confirmation_token_hash = null,
    confirmation_reserved_at = null
  where unsubscribe_token_hash = p_token_hash and status <> 'unsubscribed';
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.consume_waitlist_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.register_waitlist_signup(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.release_waitlist_email_reservation(uuid, text) from public, anon, authenticated;
revoke all on function public.confirm_waitlist_signup(text) from public, anon, authenticated;
revoke all on function public.unsubscribe_waitlist_signup(text) from public, anon, authenticated;
grant execute on function public.consume_waitlist_rate_limit(text, integer, integer) to service_role;
grant execute on function public.register_waitlist_signup(text, text, text, text, text) to service_role;
grant execute on function public.release_waitlist_email_reservation(uuid, text) to service_role;
grant execute on function public.confirm_waitlist_signup(text) to service_role;
grant execute on function public.unsubscribe_waitlist_signup(text) to service_role;
