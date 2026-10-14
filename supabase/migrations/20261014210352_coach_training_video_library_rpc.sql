create or replace function public.get_my_coach_training_video_library()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog, auth
as $$
declare
  uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Sign in required'; end if;

  return jsonb_build_object(
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',m.id,
        'title',m.title,
        'description',m.description,
        'video_url',m.video_url,
        'video_minutes',m.video_minutes,
        'sequence',m.sequence,
        'review_status',m.review_status,
        'content_status',m.content_status
      ) order by m.sequence)
      from public.coach_ethics_microlearning m
      where m.active=true
        and nullif(trim(coalesce(m.video_url,'')),'') is not null
        and m.review_status='approved'
    ),'[]'::jsonb),
    'planned', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',m.id,
        'title',m.title,
        'description',m.description,
        'video_minutes',m.video_minutes,
        'sequence',m.sequence,
        'review_status',m.review_status
      ) order by m.sequence)
      from public.coach_ethics_microlearning m
      where m.active=true
        and nullif(trim(coalesce(m.video_url,'')),'') is null
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_coach_training_video_library() from public, anon;
grant execute on function public.get_my_coach_training_video_library() to authenticated, service_role;
