-- Task removal uses the same owner isolation as reads and edits.
grant delete on public.workspace_items to authenticated;

create policy workspace_delete on public.workspace_items
  for delete to authenticated
  using (user_id = (select auth.uid()));
