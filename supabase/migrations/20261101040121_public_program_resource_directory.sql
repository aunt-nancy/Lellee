begin;

-- Deliberately public directory projection. No direct table grant, RLS change,
-- publication, resource seed, saved item, referral or contact sharing is added.
create function public.get_public_program_resources(p_program_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  selected_program public.programs%rowtype;
  rows jsonb;
  requested_slug text := case p_program_slug
    when 'work-new-beginnings' then 'workforce-reentry'
    when 'grief-loss' then 'grief'
    when 'family-support' then 'family-recovery'
    when 'financial-stability' then 'financial-recovery'
    else p_program_slug end;
begin
  select * into selected_program from public.programs p
  where p.slug=requested_slug
    and p.status in ('active','pilot','planned','paused');
  if selected_program.id is null then
    raise exception using errcode='22023',message='Choose a valid support program';
  end if;

  select coalesce(jsonb_agg(item order by sponsored desc,name,source,id),'[]'::jsonb)
  into rows
  from (
    select r.id,r.name,r.sponsored,'service'::text as source,
      jsonb_build_object(
        'id',r.id,'source','service','resource_type',r.category_key,
        'category_label',c.label,'name',r.name,'description',r.description,
        'city',r.city,'state',r.state,'website_url',r.website_url,'phone',r.phone,
        'cost_level',r.cost_level,'virtual_available',r.virtual_available,
        'sponsored',r.sponsored,'sponsor_label',r.sponsor_label,
        'verified_at',r.verified_at,'pathways','[]'::jsonb
      ) as item
    from public.service_resources r
    join public.resource_categories c on c.category_key=r.category_key and c.active=true
    where r.published=true
      -- The existing service directory treats a NULL program as shared.
      and (r.program_id=selected_program.id or r.program_id is null)

    union all

    select r.id,r.name,r.sponsored,'local'::text as source,
      jsonb_build_object(
        'id',r.id,'source','local','resource_type',r.resource_type,
        'name',r.name,'description',r.description,'city',r.city,'state',r.state,
        'website_url',r.website_url,'phone',r.phone,'cost_level',r.cost_level,
        'virtual_available',r.virtual_available,'sponsored',r.sponsored,
        'sponsor_label',r.sponsor_label,'verified_at',r.verified_at,
        'pathways',to_jsonb(r.pathways)
      ) as item
    from public.local_resources r
    where selected_program.slug='recovery' and r.published=true
      -- Legacy unscoped local entries belong to the existing Recovery directory,
      -- not every program. Explicitly other-program entries are never included.
      and (r.program_id=selected_program.id or r.program_id is null)
  ) directory;

  return jsonb_build_object(
    'program',jsonb_build_object('id',selected_program.id,'slug',selected_program.slug,'name',selected_program.name),
    'resources',rows
  );
end;
$$;
revoke all on function public.get_public_program_resources(text) from public;
grant execute on function public.get_public_program_resources(text) to anon,authenticated;

commit;
