-- Run in the Supabase SQL editor. The default "viewer" tier can now create
-- tasks and post progress notes (editing still requires being the creator,
-- or admin/ceo — see migration 002).

drop policy if exists tasks_insert_editor on tasks;
create policy tasks_insert_authenticated on tasks
  for insert to authenticated
  with check (true);

drop policy if exists task_updates_insert_editor on task_updates;
create policy task_updates_insert_authenticated on task_updates
  for insert to authenticated
  with check (true);
