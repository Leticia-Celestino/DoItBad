create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es', 'de')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create unique index waitlist_signups_email_unique on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from anon, authenticated;
