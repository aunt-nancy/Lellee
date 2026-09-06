-- Bounded security repair for client-selected coaching shares.
-- No journal access, new coaching roles, frontend changes, billing or Auth changes.
-- Preserve active business-member recipient scope; verify that membership separately.
-- Applied only after reproducing the revoked/ended/mismatched relationship defects
-- with rollback-only synthetic records. Run once after the inspected platform schema.

do $migration$
declare
  before_hash text;
  after_hash text;
  col text;
  priv text;
begin
  perform set_config('lock_timeout','5s',true);
  lock table public.coach_shared_items in access exclusive mode;
  if (select count(*) from pg_policies where schemaname='public' and tablename='coach_shared_items')<>2
     or not exists(select 1 from pg_policies where schemaname='public' and tablename='coach_shared_items'
       and policyname='coach_shared_client_manage' and cmd='ALL'
       and qual='(client_user_id = auth.uid())' and with_check='(client_user_id = auth.uid())')
     or not exists(select 1 from pg_policies where schemaname='public' and tablename='coach_shared_items'
       and policyname='coach_shared_coach_read' and cmd='SELECT'
       and qual='is_coach_relationship_participant(relationship_id)') then
    raise exception 'Unexpected sharing policies; review before applying this one-time migration';
  end if;
  if exists(select 1 from pg_attribute where attrelid='public.coach_shared_items'::regclass
            and attnum>0 and not attisdropped and attacl is not null) then
    raise exception 'Column privilege overrides need separate review';
  end if;
  if exists(select 1 from pg_trigger where tgrelid='public.coach_shared_items'::regclass and not tgisinternal) then
    raise exception 'Unexpected share triggers require review';
  end if;
  if exists(select 1 from public.coach_shared_items s where not exists(
    select 1 from public.coach_client_relationships r
    where r.id=s.relationship_id and r.client_user_id=s.client_user_id and r.program_id=s.program_id)) then
    raise exception 'Existing mismatched shared records require review; nothing is deleted or reassigned';
  end if;
  select md5(coalesce(string_agg(md5(to_jsonb(s)::text),'' order by id),''))
    into before_hash from public.coach_shared_items s;

  alter table public.coach_shared_items enable row level security;
  drop policy coach_shared_client_manage on public.coach_shared_items;
  drop policy coach_shared_coach_read on public.coach_shared_items;
  revoke all on table public.coach_shared_items from public, anon, authenticated;
  grant select, delete on table public.coach_shared_items to authenticated;
  grant insert(id,relationship_id,client_user_id,program_id,share_type,title,shared_content,source_reference)
    on public.coach_shared_items to authenticated;
  grant update(share_type,title,shared_content,source_reference)
    on public.coach_shared_items to authenticated;

  create policy coach_share_owner_read on public.coach_shared_items for select to authenticated
    using(client_user_id=(select auth.uid()));
  create policy coach_share_current_recipient_read on public.coach_shared_items for select to authenticated
    using(revoked_at is null and shared_at<=now() and exists(
      select 1 from public.coach_client_relationships r
      where r.id=coach_shared_items.relationship_id
        and r.client_user_id=coach_shared_items.client_user_id
        and r.program_id=coach_shared_items.program_id
        and r.status='active' and r.ended_at is null
        and r.started_at<=coach_shared_items.shared_at
        and r.client_consented_at<=coach_shared_items.shared_at
        and public.is_coach_business_member(r.business_id)
    ));
  create policy coach_share_owner_insert on public.coach_shared_items for insert to authenticated
    with check(client_user_id=(select auth.uid()) and revoked_at is null and shared_at<=now() and exists(
      select 1 from public.coach_client_relationships r
      where r.id=coach_shared_items.relationship_id
        and r.client_user_id=(select auth.uid())
        and r.program_id=coach_shared_items.program_id
        and r.status='active' and r.ended_at is null
        and r.started_at<=coach_shared_items.shared_at
        and r.client_consented_at<=coach_shared_items.shared_at
    ));
  create policy coach_share_owner_update on public.coach_shared_items for update to authenticated
    using(client_user_id=(select auth.uid()) and revoked_at is null and exists(
      select 1 from public.coach_client_relationships r
      where r.id=coach_shared_items.relationship_id and r.client_user_id=(select auth.uid())
        and r.program_id=coach_shared_items.program_id and r.status='active' and r.ended_at is null
        and r.started_at<=coach_shared_items.shared_at and r.client_consented_at<=coach_shared_items.shared_at
    ))
    with check(client_user_id=(select auth.uid()) and revoked_at is null and exists(
      select 1 from public.coach_client_relationships r
      where r.id=coach_shared_items.relationship_id and r.client_user_id=(select auth.uid())
        and r.program_id=coach_shared_items.program_id and r.status='active' and r.ended_at is null
        and r.started_at<=coach_shared_items.shared_at and r.client_consented_at<=coach_shared_items.shared_at
    ));
  create policy coach_share_owner_delete on public.coach_shared_items for delete to authenticated
    using(client_user_id=(select auth.uid()));

  -- Revocation continues through revoke_my_shared_item(uuid), which authenticates
  -- ownership server-side. Clients cannot edit revoked_at or move an existing share.
  foreach col in array array['id','client_user_id','relationship_id','program_id','shared_at','revoked_at'] loop
    if has_column_privilege('authenticated','public.coach_shared_items',col,'UPDATE') then
      raise exception 'Protected share column still client-editable: %',col;
    end if;
  end loop;
  if has_table_privilege('anon','public.coach_shared_items','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     or has_any_column_privilege('anon','public.coach_shared_items','SELECT,INSERT,UPDATE,REFERENCES') then
    raise exception 'Anonymous share privilege remains';
  end if;
  foreach priv in array array['SELECT','INSERT','UPDATE','DELETE'] loop
    if not has_table_privilege('service_role','public.coach_shared_items',priv) then
      raise exception 'Trusted service privilege missing: %',priv;
    end if;
  end loop;
  if has_function_privilege('anon','public.revoke_my_shared_item(uuid)','EXECUTE')
     or not has_function_privilege('authenticated','public.revoke_my_shared_item(uuid)','EXECUTE') then
    raise exception 'Unexpected revocation RPC permissions';
  end if;
  select md5(coalesce(string_agg(md5(to_jsonb(s)::text),'' order by id),''))
    into after_hash from public.coach_shared_items s;
  if after_hash is distinct from before_hash then raise exception 'Share data changed; aborting'; end if;
end
$migration$;
