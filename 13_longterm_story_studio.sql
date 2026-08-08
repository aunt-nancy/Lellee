-- LELLEE LONG-TERM STORY STUDIO
-- Safe enhancement migration for Milestones, Then & Now, and Recovery Story.
begin;

create table if not exists public.recovery_story_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  edition text not null check (edition in ('two_year','five_year','ten_year','custom')),
  title text not null default 'My Recovery Story',
  opening_message text,
  status text not null default 'draft' check (status in ('draft','ready_for_review','approved','archived')),
  include_milestones boolean not null default true,
  include_then_now boolean not null default true,
  include_goals boolean not null default true,
  include_guided_responses boolean not null default false,
  include_journal boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recovery_story_selections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.recovery_story_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  custom_text text,
  sort_order integer not null default 0,
  included boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_recovery_story_projects_user
  on public.recovery_story_projects(user_id, created_at desc);
create index if not exists idx_recovery_story_selections_project
  on public.recovery_story_selections(project_id, sort_order);

alter table public.recovery_story_projects enable row level security;
alter table public.recovery_story_selections enable row level security;

drop policy if exists "recovery_story_projects_own" on public.recovery_story_projects;
create policy "recovery_story_projects_own" on public.recovery_story_projects
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

drop policy if exists "recovery_story_selections_own" on public.recovery_story_selections;
create policy "recovery_story_selections_own" on public.recovery_story_selections
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

grant select,insert,update,delete on public.recovery_story_projects,public.recovery_story_selections to authenticated;

drop trigger if exists set_updated_at on public.recovery_story_projects;
create trigger set_updated_at before update on public.recovery_story_projects
for each row execute function public.set_updated_at();

-- Milestone reviews should already exist from guided-response migration.
-- Create them here too so this feature remains safe if that migration was skipped.
create table if not exists public.milestone_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_key text not null,
  milestone_date date not null default current_date,
  recovery_day integer,
  title text not null,
  comparison_snapshot jsonb not null default '{}'::jsonb,
  selected_observations jsonb not null default '[]'::jsonb,
  reflection text,
  allow_recovery_story boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,milestone_key)
);

alter table public.milestone_reviews enable row level security;
drop policy if exists "milestone_reviews_select_own" on public.milestone_reviews;
create policy "milestone_reviews_select_own" on public.milestone_reviews
for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "milestone_reviews_insert_own" on public.milestone_reviews;
create policy "milestone_reviews_insert_own" on public.milestone_reviews
for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "milestone_reviews_update_own" on public.milestone_reviews;
create policy "milestone_reviews_update_own" on public.milestone_reviews
for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "milestone_reviews_delete_own" on public.milestone_reviews;
create policy "milestone_reviews_delete_own" on public.milestone_reviews
for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.milestone_reviews to authenticated;

drop trigger if exists set_updated_at on public.milestone_reviews;
create trigger set_updated_at before update on public.milestone_reviews
for each row execute function public.set_updated_at();

commit;
