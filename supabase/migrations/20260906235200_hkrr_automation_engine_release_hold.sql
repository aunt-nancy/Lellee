-- Canonical hkrr release checkpoint: no approved automation engine schema exists yet.
-- Keep every automation surface fail-closed until the engine is separately designed, migrated and audited.
-- No changes to pricing, Stripe, journal, Auth, logo or layout.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then raise exception 'Wrong Lellee runtime project'; end if;
end $check$;

insert into public.app_public_settings(key,value,updated_at)
values('automation_engine_enabled','false',clock_timestamp())
on conflict(key) do update set value='false',updated_at=excluded.updated_at;

do $verify$
begin
  if not exists(select 1 from public.app_public_settings where key='automation_engine_enabled' and value='false') then
    raise exception 'Automation engine must remain explicitly off';
  end if;
end $verify$;
