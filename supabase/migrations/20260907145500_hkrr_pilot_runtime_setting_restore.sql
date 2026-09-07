-- Restore the Pilot Runtime setting expected by Platform Health.
-- Keep the runtime disabled during Admin review; activation is a later release decision.
insert into public.app_public_settings(key,value,updated_at)
values ('pilot_program_runtime_enabled','false',now())
on conflict (key) do update
set value=excluded.value,
    updated_at=now();
