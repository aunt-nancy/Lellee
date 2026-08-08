-- LELLEE GUIDED RECOVERY JOURNEY ENGINE
-- Adds metadata to guided responses plus journey state and phase transitions.
begin;

alter table public.guided_responses
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists uq_guided_response_day_prompt
  on public.guided_responses(user_id,response_date,prompt_key);

create table if not exists public.journey_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_phase_key text,
  last_guided_date date,
  last_guided_prompt_key text,
  daily_guidance_enabled boolean not null default true,
  maintenance_guidance_enabled boolean not null default true,
  long_term_guidance_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phase_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_phase_key text,
  to_phase_key text not null,
  recovery_day integer not null,
  transition_date date not null default current_date,
  reflection text,
  created_at timestamptz not null default now(),
  unique(user_id,to_phase_key)
);

alter table public.journey_state enable row level security;
alter table public.phase_transitions enable row level security;

drop policy if exists "journey_state_own" on public.journey_state;
create policy "journey_state_own" on public.journey_state
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

drop policy if exists "phase_transitions_own" on public.phase_transitions;
create policy "phase_transitions_own" on public.phase_transitions
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

grant select,insert,update,delete on public.journey_state,public.phase_transitions to authenticated;

drop trigger if exists set_updated_at on public.journey_state;
create trigger set_updated_at before update on public.journey_state
for each row execute function public.set_updated_at();

commit;
