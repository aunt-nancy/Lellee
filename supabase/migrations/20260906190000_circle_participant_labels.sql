-- Requires the already-applied Trusted Circle consent and selected-content migrations.
-- A no-argument scoped lookup, not a profiles table or public email directory.
-- Inviting a person displays the inviter's account email in their invitation UI.
do $check$
begin
  if to_regprocedure('public.get_my_supporter_dashboard()') is null then
    raise exception 'Restore and verify the Trusted Circle backend first';
  end if;
  if to_regprocedure('public.get_my_circle_participants()') is not null then
    raise exception 'Participant lookup exists; inspect rather than overwrite';
  end if;
end $check$;

create function public.get_my_circle_participants()
returns jsonb language sql stable security definer set search_path=''
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'relationship_id',r.id,'account_email',u.email,
    'owner_view',r.owner_user_id=auth.uid(),'role_key',r.role_key,
    'program_id',r.program_id,'status',r.status
  ) order by r.invited_at desc),'[]'::jsonb)
  from public.trusted_circle_relationships r
  join auth.users caller on caller.id=auth.uid()
    and caller.email_confirmed_at is not null and caller.deleted_at is null
  join auth.users u on u.id=case when r.owner_user_id=auth.uid()
    then r.supporter_user_id else r.owner_user_id end
    and u.email_confirmed_at is not null and u.deleted_at is null
  where (r.owner_user_id=auth.uid() or r.supporter_user_id=auth.uid())
    and r.status in('invited','active','paused') and r.revoked_at is null
    and r.invited_by=r.owner_user_id;
$fn$;
revoke all on function public.get_my_circle_participants() from public,anon,authenticated;
grant execute on function public.get_my_circle_participants() to authenticated,service_role;
comment on function public.get_my_circle_participants() is
  'Account-email labels only for the verified caller\'s current own/incoming Circle relationships. No arbitrary ID or email parameter; no unrelated Admin bypass; no private content.';
