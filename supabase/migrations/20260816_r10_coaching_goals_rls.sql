-- LELLEE R10 — COACHING GOALS RLS
-- Assumes coaching_goals has: user_id, shared_with_coach

alter table if exists public.coaching_goals enable row level security;

drop policy if exists "users_read_own_coaching_goals" on public.coaching_goals;
create policy "users_read_own_coaching_goals"
on public.coaching_goals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_insert_own_coaching_goals" on public.coaching_goals;
create policy "users_insert_own_coaching_goals"
on public.coaching_goals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_update_own_coaching_goals" on public.coaching_goals;
create policy "users_update_own_coaching_goals"
on public.coaching_goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);