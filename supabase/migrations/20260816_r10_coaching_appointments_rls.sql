-- LELLEE R10 — COACHING APPOINTMENTS RLS
-- Assumes coaching_appointments has user_id.

alter table if exists public.coaching_appointments enable row level security;

drop policy if exists "users_read_own_coaching_appointments" on public.coaching_appointments;
create policy "users_read_own_coaching_appointments"
on public.coaching_appointments
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_insert_own_coaching_appointments" on public.coaching_appointments;
create policy "users_insert_own_coaching_appointments"
on public.coaching_appointments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_update_own_coaching_appointments" on public.coaching_appointments;
create policy "users_update_own_coaching_appointments"
on public.coaching_appointments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);