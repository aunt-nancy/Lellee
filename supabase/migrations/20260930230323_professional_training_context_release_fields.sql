create or replace function public.get_my_professional_training_context()
returns jsonb
language sql
stable
security invoker
set search_path=public,pg_catalog
as $$
with me as (
  select auth.uid() as uid
), courses as (
  select c.*,
    exists(
      select 1 from public.user_entitlements ue, me
      where ue.user_id=me.uid
        and ue.entitlement_key=c.entitlement_key
        and ue.status in ('active','trialing')
    ) as entitled,
    case when c.checkout_enabled then (
      select aps.value
      from public.app_public_settings aps
      where aps.key=c.payment_setting_key
        and aps.value ~ '^https://buy\.stripe\.com/'
      limit 1
    ) else null end as checkout_url
  from public.professional_courses c
  where c.status='published'
), enroll as (
  select e.*
  from public.professional_enrollments e, me
  where e.user_id=me.uid
)
select jsonb_build_object(
  'authenticated',(select uid is not null from me),
  'published_course_count',(select count(*) from courses),
  'courses',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',c.id,
      'course_key',c.course_key,
      'title',c.title,
      'category',c.category,
      'description',c.description,
      'audience',c.audience,
      'price_cents',c.price_cents,
      'billing_mode',c.billing_mode,
      'estimated_hours',c.estimated_hours,
      'module_pass_score',c.module_pass_score,
      'capstone_required',c.capstone_required,
      'checkout_enabled',c.checkout_enabled,
      'checkout_url',c.checkout_url,
      'certificate_title',c.certificate_title,
      'certificate_scope_note',c.certificate_scope_note,
      'entitled',c.entitled,
      'enrollment',case when e.id is null then null else jsonb_build_object(
        'id',e.id,
        'status',e.status,
        'started_at',e.started_at,
        'completed_at',e.completed_at,
        'verified_at',e.verified_at,
        'final_score',e.final_score,
        'training_record_id',e.training_record_id
      ) end,
      'progress',case when e.id is null then '[]'::jsonb else coalesce((
        select jsonb_agg(jsonb_build_object(
          'module_id',m.id,
          'module_key',m.module_key,
          'sequence',m.sequence,
          'title',m.title,
          'module_type',m.module_type,
          'estimated_minutes',m.estimated_minutes,
          'status',p.status,
          'best_score',p.best_score,
          'attempts',p.attempts,
          'reviewer_status',p.reviewer_status,
          'completed_at',p.completed_at
        ) order by m.sequence)
        from public.professional_course_modules m
        left join public.professional_module_progress p
          on p.module_id=m.id and p.enrollment_id=e.id
        where m.course_id=c.id and m.required=true
      ),'[]'::jsonb) end
    ) order by case when c.category='foundation' then 0 else 1 end,c.title)
    from courses c
    left join enroll e on e.course_id=c.id
  ),'[]'::jsonb)
);
$$;

revoke all on function public.get_my_professional_training_context() from public,anon;
grant execute on function public.get_my_professional_training_context() to authenticated;