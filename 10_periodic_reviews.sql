-- LELLEE PERIODIC REVIEWS
begin;
create table if not exists public.periodic_reviews (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 review_key text not null,
 review_type text not null check (review_type in ('weekly','monthly','quarterly','annual')),
 period_start date not null,
 period_end date not null,
 recovery_day integer,
 helped jsonb not null default '[]'::jsonb,
 challenges jsonb not null default '[]'::jsonb,
 reflection text,
 next_focus text,
 allow_recovery_story boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,review_key)
);
alter table public.periodic_reviews enable row level security;
drop policy if exists "periodic_reviews_own" on public.periodic_reviews;
create policy "periodic_reviews_own" on public.periodic_reviews for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.periodic_reviews to authenticated;
drop trigger if exists set_updated_at on public.periodic_reviews;
create trigger set_updated_at before update on public.periodic_reviews for each row execute function public.set_updated_at();
commit;
