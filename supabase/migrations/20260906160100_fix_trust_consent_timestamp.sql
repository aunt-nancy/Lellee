-- The production Trust Center RPC failed with 42703: created_at does not exist.
-- user_consents stores recorded_at. Preserve the UI's created_at JSON key.
-- Exact guarded replacement only; no frontend or unrelated function rewrite.
do $migration$
declare
  d text;
  old_fragment text := $old$'created_at',created_at
    ) order by created_at desc),'[]'::jsonb)
    into consent_rows
    from public.user_consents$old$;
  new_fragment text := $new$'created_at',recorded_at
    ) order by recorded_at desc),'[]'::jsonb)
    into consent_rows
    from public.user_consents$new$;
  before_acl text;
begin
  if not exists(select 1 from information_schema.columns where table_schema='public'
     and table_name='user_consents' and column_name='recorded_at') then
    raise exception 'Expected user_consents.recorded_at is missing';
  end if;
  select replace(pg_get_functiondef(oid),E'\r\n',E'\n'),proacl::text into strict d,before_acl
    from pg_proc where oid='public.get_my_trust_center()'::regprocedure;
  if length(d)-length(replace(d,old_fragment,''))<>length(old_fragment) then
    raise exception 'Expected exactly one consent timestamp fragment; review instead of replaying';
  end if;
  execute replace(d,old_fragment,new_fragment);
  if (select proacl::text from pg_proc where oid='public.get_my_trust_center()'::regprocedure) is distinct from before_acl then
    raise exception 'Unexpected grant change; rolling back';
  end if;
end
$migration$;
