-- Lellee coaching engagement and training payment-plan policy
-- Approved 2026-09-07: Lellee Coaching may use both W-2 and 1099 engagements.
-- Lower-cost training pays in full; higher-cost training may use installments.

alter table public.lellee_staff_coaches
  drop constraint if exists lellee_staff_coaches_employment_class_check;

alter table public.lellee_staff_coaches
  add constraint lellee_staff_coaches_employment_class_check
  check (employment_class in ('w2','1099'));

alter table public.lellee_staff_coach_applications
  add column if not exists engagement_preference text not null default 'either';

alter table public.lellee_staff_coach_applications
  drop constraint if exists lellee_staff_coach_applications_engagement_preference_check;

alter table public.lellee_staff_coach_applications
  add constraint lellee_staff_coach_applications_engagement_preference_check
  check (engagement_preference in ('w2','1099','either'));

alter table public.lellee_training_catalog
  add column if not exists payment_plan_eligible boolean not null default false;

alter table public.lellee_training_catalog
  add column if not exists minimum_down_percent integer;

alter table public.lellee_training_catalog
  drop constraint if exists lellee_training_catalog_minimum_down_percent_check;

alter table public.lellee_training_catalog
  add constraint lellee_training_catalog_minimum_down_percent_check
  check (minimum_down_percent is null or minimum_down_percent between 1 and 100);

-- Current catalog distinction: $79 specialties are lower-cost/pay-in-full.
-- Courses above $79 may offer the existing 40% down installment structure.
update public.lellee_training_catalog
set payment_plan_eligible = case when coalesce(price_cents,0) > 7900 then true else false end,
    minimum_down_percent = case when coalesce(price_cents,0) > 7900 then 40 else null end
where active = true;
