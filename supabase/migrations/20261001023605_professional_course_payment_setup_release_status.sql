begin;

create or replace function private.get_admin_professional_release_controls()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'is_key_administrator',private.is_professional_key_admin(uid),
    'courses',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'course_key',c.course_key,
          'status',c.status,
          'checkout_enabled',c.checkout_enabled,
          'issues',private.professional_course_release_issues(c.id),
          'publish_ready',
            c.status<>'published'
            and jsonb_array_length(private.professional_course_release_issues(c.id))=0,
          'payment_link_configured',
            exists(
              select 1
              from public.app_public_settings aps
              where aps.key=c.payment_setting_key
                and aps.value ~ '^https://buy\.stripe\.com/'
            ),
          'stripe_setup_status',
            coalesce((
              select ps.setup_status
              from public.professional_course_payment_setup ps
              where ps.course_id=c.id
            ),case
              when exists(
                select 1 from public.app_public_settings aps
                where aps.key=c.payment_setting_key
                  and aps.value ~ '^https://buy\.stripe\.com/'
              ) then 'prepared'
              else 'not_tracked'
            end),
          'stripe_product_id',(
            select ps.stripe_product_id
            from public.professional_course_payment_setup ps
            where ps.course_id=c.id
          ),
          'stripe_price_id',(
            select ps.stripe_price_id
            from public.professional_course_payment_setup ps
            where ps.course_id=c.id
          ),
          'stripe_payment_link_id',(
            select ps.stripe_payment_link_id
            from public.professional_course_payment_setup ps
            where ps.course_id=c.id
          ),
          'auto_generated',
            exists(
              select 1
              from public.professional_journey_training_links l
              where l.course_id=c.id and l.auto_generated=true
            ),
          'evidence_total',
            (
              select count(*)
              from public.professional_training_evidence_requirements er
              where er.course_id=c.id
            ),
          'evidence_approved',
            (
              select count(*)
              from public.professional_training_evidence_requirements er
              where er.course_id=c.id and er.status='approved'
            ),
          'checkout_ready',
            c.status='published'
            and not c.checkout_enabled
            and jsonb_array_length(private.professional_course_release_issues(c.id))=0
            and exists(
              select 1
              from public.app_public_settings aps
              where aps.key=c.payment_setting_key
                and aps.value ~ '^https://buy\.stripe\.com/'
            )
        )
        order by case when c.category='foundation' then 0 else 1 end,c.title
      )
      from public.professional_courses c
    ),'[]'::jsonb)
  );
end;
$$;

commit;