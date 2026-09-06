-- One-time, atomic security migration for the three inspected legacy tables.
-- Preserves every pre-existing column/value, including placement timestamps.
-- Aborts on ambiguous/unmatched owners, unexpected triggers, or data changes.
-- No frontend, Stripe, Auth URL, or current-entitlement behavior changes.

do $migration$
declare
  t text;
  r record;
  n bigint;
  before_hashes jsonb := '{}'::jsonb;
  row_hash text;
begin
  perform set_config('lock_timeout','5s',true);
  execute 'lock table public.placements, public.user_progress, public.user_subscriptions in access exclusive mode';
  if to_regprocedure('public.lellee_bind_legacy_owner()') is not null then
    raise exception 'Legacy ownership helper already exists; review migration history';
  end if;
  if exists (select 1 from auth.users where email_confirmed_at is not null and deleted_at is null
             group by lower(btrim(email)) having count(*) > 1) then
    raise exception 'Ambiguous confirmed account email; no changes applied';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.placements'::regclass
                 and tgname='placements_updated_at' and tgenabled='O' and not tgisinternal) then
    raise exception 'Unexpected placement timestamp trigger configuration';
  end if;
  if exists (select 1 from pg_trigger where tgrelid in ('public.placements'::regclass,
                'public.user_progress'::regclass,'public.user_subscriptions'::regclass)
             and not tgisinternal and not (tgrelid='public.placements'::regclass and tgname='placements_updated_at')) then
    raise exception 'Additional legacy triggers require review before backfill';
  end if;

  foreach t in array array['placements','user_progress','user_subscriptions'] loop
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='user_id') then
      raise exception '%.user_id already exists; do not replay this migration',t;
    end if;
    execute format('select count(*) from public.%I x where not exists
      (select 1 from auth.users u where lower(btrim(u.email))=lower(btrim(x.user_email))
       and u.email_confirmed_at is not null and u.deleted_at is null)',t) into n;
    if n<>0 then raise exception '% has unmatched legacy owners; no records will be guessed or deleted',t; end if;
    execute format('select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'''' order by id),'''')) from public.%I x',t) into row_hash;
    before_hashes := before_hashes || jsonb_build_object(t,row_hash);
    if exists(select 1 from pg_policies where schemaname='public' and tablename=t
              and (roles::text<>'{public}' or coalesce(qual,'true')<>'true' or coalesce(with_check,'true')<>'true')) then
      raise exception 'Unexpected legacy policies on %; review before replacing',t;
    end if;
    if not has_table_privilege('service_role',format('public.%I',t),'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'Expected trusted service privileges missing on %',t;
    end if;
    execute format('alter table public.%I add column user_id uuid references auth.users(id) on delete cascade',t);
  end loop;

  -- Prevent the existing timestamp trigger from changing data during owner binding.
  execute 'alter table public.placements disable trigger placements_updated_at';
  foreach t in array array['placements','user_progress','user_subscriptions'] loop
    execute format('update public.%I x set user_id=u.id from auth.users u
      where lower(btrim(u.email))=lower(btrim(x.user_email))
        and u.email_confirmed_at is not null and u.deleted_at is null',t);
    execute format('alter table public.%I alter column user_id set not null',t);
    execute format('create index %I on public.%I(user_id)',t||'_account_owner_idx',t);
  end loop;
  execute 'alter table public.placements enable trigger placements_updated_at';

  -- Compatibility for existing callers that send user_email but not user_id.
  -- Binding occurs only on INSERT; subsequent email changes never reassign rows.
  execute $ddl$
    create function public.lellee_bind_legacy_owner()
    returns trigger language plpgsql security definer set search_path = ''
    as $fn$
    declare owner_id uuid;
    begin
      if TG_OP <> 'INSERT' or TG_TABLE_SCHEMA <> 'public'
         or TG_TABLE_NAME not in ('placements','user_progress','user_subscriptions') then
        raise exception 'Invalid legacy ownership trigger use';
      end if;
      begin
        select u.id into strict owner_id from auth.users u
        where lower(btrim(u.email))=lower(btrim(NEW.user_email))
          and u.email_confirmed_at is not null and u.deleted_at is null;
      exception when no_data_found or too_many_rows then
        raise exception using errcode='42501',message='A verified account is required for this record';
      end;
      if NEW.user_id is not null and NEW.user_id<>owner_id then
        raise exception using errcode='42501',message='Record ownership does not match the verified account';
      end if;
      NEW.user_id := owner_id;
      return NEW;
    end
    $fn$
  $ddl$;
  execute 'revoke all on function public.lellee_bind_legacy_owner() from public, anon, authenticated';
  execute 'grant execute on function public.lellee_bind_legacy_owner() to service_role';

  foreach t in array array['placements','user_progress','user_subscriptions'] loop
    execute format('create trigger legacy_bind_account_owner before insert on public.%I
                    for each row execute function public.lellee_bind_legacy_owner()',t);
    execute format('alter table public.%I enable row level security',t);
    for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',r.policyname,t);
    end loop;
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    if t='user_subscriptions' then
      execute format('create policy legacy_account_owner on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
    else
      execute format('create policy legacy_account_owner on public.%I for all to authenticated
                      using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',t);
    end if;
  end loop;
  execute 'grant insert(id,user_id,user_email,data,created_at,updated_at), update(data,updated_at), delete on public.placements to authenticated';
  execute 'grant insert(id,user_id,user_email,module_id,started_at,completed_at,reflection_responses,assignment_response,assignment_submitted_at),
                 update(module_id,started_at,completed_at,reflection_responses,assignment_response,assignment_submitted_at)
           on public.user_progress to authenticated';
  -- No client can issue certificates, reassign ownership, or write subscriptions.

  foreach t in array array['placements','user_progress','user_subscriptions'] loop
    execute format('select md5(coalesce(string_agg(md5((to_jsonb(x)-''user_id'')::text),'''' order by id),'''')) from public.%I x',t) into row_hash;
    if row_hash is distinct from before_hashes->>t then
      raise exception 'Legacy data preservation check failed on %; rolling back',t;
    end if;
    if has_table_privilege('anon',format('public.%I',t),'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege('anon',format('public.%I',t),'SELECT,INSERT,UPDATE,REFERENCES') then
      raise exception 'Anonymous privilege remains on %',t;
    end if;
    if has_column_privilege('authenticated',format('public.%I',t),'user_id','UPDATE')
       or has_column_privilege('authenticated',format('public.%I',t),'user_email','UPDATE') then
      raise exception 'Client ownership reassignment remains possible on %',t;
    end if;
  end loop;
  if has_any_column_privilege('authenticated','public.user_subscriptions','INSERT,UPDATE,REFERENCES')
     or has_table_privilege('authenticated','public.user_subscriptions','DELETE,TRUNCATE,TRIGGER')
     or has_column_privilege('authenticated','public.user_progress','certificate_issued','INSERT,UPDATE')
     or has_column_privilege('authenticated','public.user_progress','certificate_issued_at','INSERT,UPDATE')
     or has_function_privilege('anon','public.lellee_bind_legacy_owner()','EXECUTE') then
    raise exception 'Sensitive privilege postflight failed; rolling back';
  end if;
end
$migration$;
