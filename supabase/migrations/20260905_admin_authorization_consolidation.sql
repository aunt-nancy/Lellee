-- LELLEE SITEWIDE ADMIN AUTHORIZATION CONSOLIDATION
-- Canonical source of truth for administrator/editor authorization.
-- Safe to rerun. Does not grant any user a role by itself.

create table if not exists public.admin_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_user_roles enable row level security;

-- No ordinary authenticated client receives direct table privileges.
revoke all on table public.admin_user_roles from anon;
revoke all on table public.admin_user_roles from authenticated;

create or replace function public.is_lellee_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_user_roles aur
    where aur.user_id = auth.uid()
      and aur.active = true
      and aur.role in ('admin','editor')
  );
$$;

revoke all on function public.is_lellee_admin() from public;
grant execute on function public.is_lellee_admin() to authenticated;

comment on function public.is_lellee_admin() is
  'Canonical sitewide Lellee admin/editor authorization check. Uses auth.uid(); no role table rows are exposed to clients.';

-- Admin role assignment/revocation must be performed through trusted
-- server/service-role operations or the Supabase SQL editor, never client JS.
