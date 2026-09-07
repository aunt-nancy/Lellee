insert into public.app_public_settings(key,value,updated_at)
values ('recovery_legacy_renderer_enabled','true',now())
on conflict (key) do update
set value=excluded.value,
    updated_at=excluded.updated_at;
