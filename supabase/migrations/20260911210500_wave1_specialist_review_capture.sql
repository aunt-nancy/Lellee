-- Lellee Wave 1 specialist review capture
-- Admin-only evidence storage. Saving review evidence does not publish routes
-- or activate controlled beta access.

create table if not exists public.wave1_specialist_reviews (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  route_id uuid references public.program_safety_routes(id) on delete cascade,
  reviewer_name text not null,
  reviewer_role text not null,
  decision text not null check (decision in ('approve','approve_with_change','block')),
  correction_text text,
  review_reference text,
  reviewed_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  review_scope text not null default 'route' check (review_scope in ('route','program')),
  attestation text
);

create index if not exists wave1_specialist_reviews_program_idx
  on public.wave1_specialist_reviews(program_id, reviewed_at desc);

create index if not exists wave1_specialist_reviews_route_idx
  on public.wave1_specialist_reviews(route_id, reviewed_at desc);

alter table public.wave1_specialist_reviews enable row level security;

drop policy if exists admin_only_wave1_specialist_reviews
  on public.wave1_specialist_reviews;

create policy admin_only_wave1_specialist_reviews
on public.wave1_specialist_reviews
for all
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

comment on table public.wave1_specialist_reviews is
  'Admin-recorded evidence of required human specialist review for Wave 1 safety/accessibility/privacy routes. Saving review evidence does not publish routes or activate beta access.';

comment on column public.wave1_specialist_reviews.review_scope is
  'route = one safety route decision; program = overall safety/accessibility/privacy sign-off for the Program Pack.';