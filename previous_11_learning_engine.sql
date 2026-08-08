-- LELLEE PERSONALIZED LEARNING ENGINE
begin;

alter table public.content_items
  add column if not exists tags text[] not null default '{}',
  add column if not exists tap21_domains text[] not null default '{}',
  add column if not exists printable boolean not null default false;

-- Allow worksheet content type if older check constraint does not include it.
do $$
declare c_name text;
begin
  select conname into c_name
  from pg_constraint
  where conrelid='public.content_items'::regclass
    and contype='c'
    and pg_get_constraintdef(oid) ilike '%content_type%';

  if c_name is not null then
    execute format('alter table public.content_items drop constraint %I',c_name);
  end if;
end $$;

alter table public.content_items
  add constraint content_items_content_type_check
  check (content_type in (
    'lesson','exercise','reflection','prompt','tool','safety',
    'resource','inspiration','worksheet'
  ));

create table if not exists public.saved_learning (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,content_item_id)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  status text not null default 'started' check (status in ('started','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,content_item_id)
);

alter table public.saved_learning enable row level security;
alter table public.learning_progress enable row level security;

drop policy if exists "saved_learning_own" on public.saved_learning;
create policy "saved_learning_own" on public.saved_learning
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

drop policy if exists "learning_progress_own" on public.learning_progress;
create policy "learning_progress_own" on public.learning_progress
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

grant select,insert,delete on public.saved_learning to authenticated;
grant select,insert,update,delete on public.learning_progress to authenticated;

drop trigger if exists set_updated_at on public.learning_progress;
create trigger set_updated_at before update on public.learning_progress
for each row execute function public.set_updated_at();

commit;
