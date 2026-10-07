alter table public.intentions
  alter column owner_id set default auth.uid();
