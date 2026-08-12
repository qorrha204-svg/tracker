-- 영업조직 핵심과제 Tracker schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against a fresh project.
-- After running, sign up through the app once, then promote that account to admin:
--   update profiles set role = 'admin' where email = 'you@wonandone.co.kr';

create extension if not exists pgcrypto;

-- ============================== profiles ==============================
-- Mirrors auth.users 1:1. role governs what a signed-in user can do:
--   ceo    - same rights as admin; a distinct tier for the CEO specifically
--   admin  - manage roles + full edit rights
--   viewer - default for every new signup; can create tasks and edit tasks
--            they created themselves, but not other people's tasks
-- ("editor" is still accepted by the check constraint for backward
-- compatibility, but the app no longer assigns or exposes it.)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  department text,
  role text not null default 'viewer' check (role in ('admin', 'ceo', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- Company email domain enforcement also happens client-side (see lib/auth.js)
-- but is repeated here so it holds even if that check is bypassed.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email !~* '@wonandone\.co\.kr$' then
    raise exception '사내 이메일(@wonandone.co.kr)만 가입할 수 있습니다.';
  end if;

  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Helper used by RLS policies below. security definer so it can read
-- profiles regardless of the caller's own row-level access.
create or replace function current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ============================== tasks ==============================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  board text not null default 'core' check (board in ('core', 'department')), -- 핵심 vs 부서별 탭
  seq int, -- No.
  priority smallint not null default 1 check (priority between 1 and 3), -- 우선과제 (★ 개수)
  business_unit text not null, -- 사업부
  category text, -- 구분
  title text not null, -- 핵심과제
  purpose text, -- 목적 (Why)
  plan text, -- 목표·실행방안 (What·How)
  status text not null default 'on_track' check (status in ('done', 'on_track', 'hold', 'delayed')),
  progress_pct int check (progress_pct between 0 and 100),
  due_date date,
  owner_dept text, -- Task Owner
  collab_depts text, -- 협업부서
  decision_risk_flag text, -- 의사결정·리스크 Flag
  ceo_comment text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_board on tasks(board);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_business_unit on tasks(business_unit);

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();

-- ============================== task_updates ==============================
-- Structured, append-only replacement for the free-text "업무진행이력" column
-- in the spreadsheet — each edit becomes a dated log entry instead of one
-- ever-growing cell.
create table if not exists task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  note text not null,
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_updates_task on task_updates(task_id);

-- ============================== RLS ==============================
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_updates enable row level security;

-- profiles: everyone signed in can see the directory (needed for owner
-- pickers etc). Only admin/ceo can change roles/department; users can update
-- their own display name.
create policy profiles_select_authenticated on profiles
  for select to authenticated
  using (true);

create policy profiles_update_admin on profiles
  for update to authenticated
  using (current_user_role() in ('admin', 'ceo'))
  with check (current_user_role() in ('admin', 'ceo'));

create policy profiles_update_self_name on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- tasks: full read for any signed-in user (전체 열람). Any signed-in user —
-- including the default "viewer" tier — can create a task; editing an
-- existing task is restricted to whoever created it, plus admin/ceo.
create policy tasks_select_authenticated on tasks
  for select to authenticated
  using (true);

create policy tasks_insert_authenticated on tasks
  for insert to authenticated
  with check (true);

create policy tasks_update_owner_or_admin on tasks
  for update to authenticated
  using (current_user_role() in ('admin', 'ceo') or created_by = auth.uid())
  with check (current_user_role() in ('admin', 'ceo') or created_by = auth.uid());

create policy tasks_delete_owner_or_admin on tasks
  for delete to authenticated
  using (current_user_role() in ('admin', 'ceo') or created_by = auth.uid());

-- task_updates: same read shape as tasks, append-only (no update/delete
-- policy). Any signed-in user can post a progress note, even on tasks they
-- don't own — this is an activity log, not a field edit.
create policy task_updates_select_authenticated on task_updates
  for select to authenticated
  using (true);

create policy task_updates_insert_authenticated on task_updates
  for insert to authenticated
  with check (true);
