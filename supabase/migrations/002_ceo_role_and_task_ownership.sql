-- Run this in the Supabase SQL editor against the already-provisioned
-- project (schema.sql already ran once). Adds:
--   1. A 'ceo' role — identical permissions to 'admin', separate label only.
--   2. Task edit/delete restricted to the task's creator or admin/ceo.
--      (Existing imported tasks have no created_by, so only admin/ceo can
--      edit them until that's intentionally changed.)

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'ceo', 'editor', 'viewer'));

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update to authenticated
  using (current_user_role() in ('admin', 'ceo'))
  with check (current_user_role() in ('admin', 'ceo'));

drop policy if exists tasks_write_editor on tasks;

create policy tasks_insert_editor on tasks
  for insert to authenticated
  with check (current_user_role() in ('editor', 'admin', 'ceo'));

create policy tasks_update_owner_or_admin on tasks
  for update to authenticated
  using (current_user_role() in ('admin', 'ceo') or created_by = auth.uid())
  with check (current_user_role() in ('admin', 'ceo') or created_by = auth.uid());

create policy tasks_delete_owner_or_admin on tasks
  for delete to authenticated
  using (current_user_role() in ('admin', 'ceo') or created_by = auth.uid());

drop policy if exists task_updates_insert_editor on task_updates;
create policy task_updates_insert_editor on task_updates
  for insert to authenticated
  with check (current_user_role() in ('editor', 'admin', 'ceo'));
