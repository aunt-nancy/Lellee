-- Private multi-person Caregiving coordination.
-- This stores organization records only; it does not provide medical advice.

begin;

create table if not exists public.caregiving_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  relationship_label text check (relationship_label is null or char_length(relationship_label) <= 120),
  important_details text check (important_details is null or char_length(important_details) <= 4000),
  color_key text not null default 'sage'
    check (color_key in ('sage','lavender','sky','gold','rose','navy')),
  active boolean not null default true,
  sort_order integer not null default 100 check (sort_order between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,id)
);

create table if not exists public.caregiving_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null,
  record_type text not null
    check (record_type in ('appointment','medication','note','routine','contact')),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  details text check (details is null or char_length(details) <= 8000),
  scheduled_for timestamptz,
  schedule_text text check (schedule_text is null or char_length(schedule_text) <= 500),
  phone text check (phone is null or char_length(phone) <= 80),
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caregiving_records_owned_recipient_fk
    foreign key (user_id,recipient_id)
    references public.caregiving_recipients(user_id,id)
    on delete cascade
);

create index if not exists idx_caregiving_recipients_user_active
  on public.caregiving_recipients(user_id,active,sort_order,created_at);
create index if not exists idx_caregiving_records_user_recipient
  on public.caregiving_records(user_id,recipient_id,record_type,created_at desc);
create index if not exists idx_caregiving_records_user_schedule
  on public.caregiving_records(user_id,scheduled_for)
  where scheduled_for is not null and is_complete=false;

alter table public.caregiving_recipients enable row level security;
alter table public.caregiving_records enable row level security;

drop policy if exists caregiving_recipients_own on public.caregiving_recipients;
create policy caregiving_recipients_own
on public.caregiving_recipients
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid())=user_id)
with check ((select auth.uid()) is not null and (select auth.uid())=user_id);

drop policy if exists caregiving_records_own on public.caregiving_records;
create policy caregiving_records_own
on public.caregiving_records
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid())=user_id)
with check ((select auth.uid()) is not null and (select auth.uid())=user_id);

-- New public-schema tables are no longer exposed automatically by Supabase.
revoke all on table public.caregiving_recipients from public,anon;
revoke all on table public.caregiving_records from public,anon;
grant select,insert,update,delete on table public.caregiving_recipients to authenticated;
grant select,insert,update,delete on table public.caregiving_records to authenticated;

create or replace function public.caregiving_touch_updated_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog','public'
as $$
begin
  new.updated_at=statement_timestamp();
  return new;
end;
$$;

revoke all on function public.caregiving_touch_updated_at() from public,anon,authenticated;

drop trigger if exists caregiving_recipients_touch_updated_at on public.caregiving_recipients;
create trigger caregiving_recipients_touch_updated_at
before update on public.caregiving_recipients
for each row execute function public.caregiving_touch_updated_at();

drop trigger if exists caregiving_records_touch_updated_at on public.caregiving_records;
create trigger caregiving_records_touch_updated_at
before update on public.caregiving_records
for each row execute function public.caregiving_touch_updated_at();

comment on table public.caregiving_recipients is
  'Private care-recipient profiles owned by one Lellee user.';
comment on table public.caregiving_records is
  'Private appointments, medication organization, notes, routines, and contacts for a care-recipient profile.';
comment on column public.caregiving_records.record_type is
  'Organizational category only. Lellee does not prescribe or change medication or treatment.';

commit;
