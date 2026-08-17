-- LELLEE R9 — REMINDERS TABLE RLS
-- Apply only if the `reminders` table exists with `user_id`.

alter table if exists public.reminders enable row level security;

drop policy if exists "users_read_own_reminders" on public.reminders;
create policy "users_read_own_reminders"
on public.reminders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_insert_own_reminders" on public.reminders;
create policy "users_insert_own_reminders"
on public.reminders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_update_own_reminders" on public.reminders;
create policy "users_update_own_reminders"
on public.reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_reminders" on public.reminders;
create policy "users_delete_own_reminders"
on public.reminders
for delete
to authenticated
using (auth.uid() = user_id);