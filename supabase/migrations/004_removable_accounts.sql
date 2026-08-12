-- Run in the Supabase SQL editor. Lets an admin/ceo delete a user's account
-- (auth.users row, which cascades to profiles) without that failing due to
-- tasks/task_updates they authored — those rows are kept, just with
-- created_by / author_id set to null instead of blocking the delete.

alter table tasks drop constraint if exists tasks_created_by_fkey;
alter table tasks
  add constraint tasks_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

alter table task_updates drop constraint if exists task_updates_author_id_fkey;
alter table task_updates
  add constraint task_updates_author_id_fkey
  foreign key (author_id) references profiles(id) on delete set null;
