CREATE OR REPLACE FUNCTION public.get_public_coach_cards(p_program_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
select case
  when not coalesce((select value='true' from public.app_public_settings where key='coach_public_marketplace_enabled'),false)
    then '[]'::jsonb
  else coalesce((
    select jsonb_agg(jsonb_build_object(
      'profile_id',cp.id,
      'public_name',cp.public_name,
      'headline',cp.headline,
      'bio',cp.bio,
      'photo_url',cp.photo_url,
      'languages',cp.languages,
      'coaching_approaches',cp.coaching_approaches,
      'credential_summary',cp.credential_summary,
      'credential_review_status',cp.credential_review_status,
      'accepting_status',cp.accepting_status,
      'business_name',b.public_name,
      'programs',coalesce((
        select jsonb_agg(jsonb_build_object(
          'slug',p.slug,'name',p.name,'specialty_label',cpp.specialty_label,
          'primary',cpp.primary_specialty
        ) order by cpp.primary_specialty desc,cpp.display_order,p.name)
        from public.coach_profile_programs cpp
        join public.programs p on p.id=cpp.program_id
        where cpp.profile_id=cp.id
      ),'[]'::jsonb),
      'badges',coalesce((
        select jsonb_agg(jsonb_build_object('key',cb.badge_key,'label',cb.badge_label) order by cb.badge_label)
        from public.coach_public_badges cb
        where cb.profile_id=cp.id and cb.status='approved'
      ),'[]'::jsonb)
    ) order by cp.public_name)
    from public.coach_public_profiles cp
    join public.coach_businesses b on b.id=cp.business_id
    where cp.profile_status='approved'
      and cp.public_visible=true
      and b.status='approved'
      and b.public_profile_enabled=true
      and b.marketplace_visible=true
      and (p_program_slug is null or exists(
        select 1 from public.coach_profile_programs cpp
        join public.programs p on p.id=cpp.program_id
        where cpp.profile_id=cp.id and p.slug=p_program_slug
      ))
  ),'[]'::jsonb)
end;
$function$;