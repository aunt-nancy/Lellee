-- Lellee Wave 1 internal QA backend seed
-- 2026-09-11
-- Programs remain public status = planned.
-- Safety routes remain draft. Verified resource candidates remain unpublished
-- until human review approves them for beta/public use.

begin;

insert into public.resource_categories(category_key,label,description,display_order,active)
values
 ('accessibility','Accessibility','Accessibility, accommodations, assistive technology and access supports.',55,true),
 ('basic_needs','Basic Needs','Food, shelter, utilities and other essential-needs support.',65,true),
 ('personal_safety','Personal Safety','Safety planning, urgent support and protective resources.',75,true),
 ('independent_living','Independent Living','Self-direction, community living, advocacy and independent-living supports.',85,true)
on conflict (category_key) do update
set label=excluded.label, description=excluded.description, active=true;

with desired(slug,module_key,label,display_order) as (
 values
 ('caregiving','today','Today',10),('caregiving','journey','Journey',20),('caregiving','help_now','I Need Help',30),('caregiving','journal','Journal / Reflection',40),('caregiving','tools','Tools',50),('caregiving','learn','Learn',60),('caregiving','support','Support / Connection',70),('caregiving','resources','Resources',80),('caregiving','milestones','Milestones',90),('caregiving','appointments','Appointments',120),('caregiving','documents','Documents',130),('caregiving','benefits','Benefits',140),
 ('reentry','today','Today',10),('reentry','journey','Journey',20),('reentry','help_now','I Need Help',30),('reentry','journal','Journal / Reflection',40),('reentry','tools','Tools',50),('reentry','learn','Learn',60),('reentry','support','Support / Connection',70),('reentry','resources','Resources',80),('reentry','milestones','Milestones',90),('reentry','appointments','Appointments',120),('reentry','documents','Documents',130),('reentry','benefits','Benefits',140),('reentry','employment','Employment',150),('reentry','housing','Housing',160),
 ('housing-stability','today','Today',10),('housing-stability','journey','Journey',20),('housing-stability','help_now','I Need Help',30),('housing-stability','journal','Journal / Reflection',40),('housing-stability','tools','Tools',50),('housing-stability','learn','Learn',60),('housing-stability','support','Support / Connection',70),('housing-stability','resources','Resources',80),('housing-stability','milestones','Milestones',90),('housing-stability','documents','Documents',120),('housing-stability','benefits','Benefits',130),('housing-stability','housing','Housing',140),
 ('independent-living','today','Today',10),('independent-living','journey','Journey',20),('independent-living','help_now','I Need Help',30),('independent-living','journal','Journal / Reflection',40),('independent-living','tools','Tools',50),('independent-living','learn','Learn',60),('independent-living','support','Support / Connection',70),('independent-living','resources','Resources',80),('independent-living','milestones','Milestones',90),('independent-living','documents','Documents',120),('independent-living','benefits','Benefits',130),('independent-living','employment','Employment',140),('independent-living','housing','Housing',150)
)
insert into public.program_modules(program_id,module_key,label,enabled,display_order,settings)
select p.id,d.module_key,d.label,true,d.display_order,jsonb_build_object('wave','wave_1','internal_only',true)
from desired d join public.programs p on p.slug=d.slug
on conflict (program_id,module_key) do update
set label=excluded.label, enabled=true, display_order=excluded.display_order;

update public.programs set
 journey_config=coalesce(journey_config,'{}'::jsonb) || case slug
  when 'caregiving' then jsonb_build_object('stages',jsonb_build_array('Get Oriented','Get Organized','Build Support','Find a Rhythm','Adjust to Change','Sustain Yourself'),'wave','wave_1','internal_only',true,'execution_status','internal_qa_shared_tools')
  when 'reentry' then jsonb_build_object('stages',jsonb_build_array('Coming Home','Get Stable','Rebuild Routine','Move Forward','Reconnect','Build the Next Chapter'),'wave','wave_1','internal_only',true,'execution_status','internal_qa_shared_tools')
  when 'housing-stability' then jsonb_build_object('stages',jsonb_build_array('What’s Urgent?','Understand My Situation','Find Options','Get Ready','Get Stable','Stay Stable'),'wave','wave_1','internal_only',true,'execution_status','internal_qa_shared_tools')
  when 'independent-living' then jsonb_build_object('stages',jsonb_build_array('What I Want','Daily Life','Getting Around & Access','Money & Responsibilities','Work, School & Community','My Support, My Choice'),'wave','wave_1','internal_only',true,'execution_status','internal_qa_shared_tools')
  else '{}'::jsonb end,
 privacy_config=coalesce(privacy_config,'{}'::jsonb) || jsonb_build_object('private_by_default',true,'explicit_sharing_required',true,'cross_program_sharing_default',false),
 updated_at=now()
where slug in ('caregiving','reentry','housing-stability','independent-living');

update public.program_safety_profiles_v2 sp
set review_level=case p.slug when 'independent-living' then 'standard' else 'heightened' end,
    status='draft', private_notifications_required=true,
    coach_escalation_default=false, organization_escalation_default=false,
    user_data_logging_level='minimal',
    review_notes=case p.slug
      when 'caregiving' then 'Wave 1 draft: caregiver overwhelm, care changes, health-navigation boundaries and immediate safety wording require human review before beta/public release.'
      when 'reentry' then 'Wave 1 draft: housing, legal/requirements, benefits and immediate-safety routing require human review before beta/public release.'
      when 'housing-stability' then 'Wave 1 draft: eviction/homelessness, legal-information, discrimination and immediate-safety routing require human review before beta/public release.'
      when 'independent-living' then 'Wave 1 draft: accessibility, benefits, self-advocacy and safety routing require accessibility/privacy review before beta/public release.'
    end,
    updated_at=now()
from public.programs p
where sp.program_id=p.id and p.slug in ('caregiving','reentry','housing-stability','independent-living');

with routes(slug,route_key,user_label,urgency,primary_action,guidance_text,action_button_label,display_order) as (
 values
 ('caregiving','overwhelmed_support','I’m overwhelmed or need a break','elevated','support_contact','Reduce the immediate load first. Identify what truly needs attention, what can wait, and whether a trusted person or caregiver resource can help.','Find support',10),
 ('caregiving','care_change','The care situation changed suddenly','elevated','in_app_guidance','Organize the change, upcoming instructions and follow-up questions. Lellee does not diagnose or change treatment instructions.','Review next steps',20),
 ('caregiving','immediate_safety','I am worried about immediate safety','emergency','emergency_care','If someone is in immediate danger or there is a medical emergency, contact 911 or local emergency services now.','Get emergency help',30),
 ('reentry','no_safe_place','I do not have a safe place to stay','urgent','resource_navigation','Prioritize immediate safe housing and basic needs, then organize follow-up steps.','Find housing help',10),
 ('reentry','requirement_deadline','I am worried about a requirement or deadline','elevated','in_app_guidance','Organize the requirement, date and questions. Lellee provides planning support, not individualized legal advice.','Organize next step',20),
 ('reentry','immediate_safety','I am in immediate danger','emergency','emergency_care','If you are in immediate danger, contact 911 or local emergency services now.','Get emergency help',30),
 ('housing-stability','housing_loss_risk','I may lose my housing soon','urgent','resource_navigation','Identify notices and deadlines, gather documents, and connect with qualified housing or legal resources as appropriate.','Find housing help',10),
 ('housing-stability','no_safe_place','I have nowhere safe to stay','urgent','resource_navigation','Prioritize immediate shelter and basic-needs resources, then organize longer-term housing follow-up.','Find shelter help',20),
 ('housing-stability','immediate_safety','I am in immediate danger','emergency','emergency_care','If you are in immediate danger, contact 911 or local emergency services now.','Get emergency help',30),
 ('independent-living','access_barrier','An access barrier is stopping me','elevated','resource_navigation','Identify the barrier and the accommodation, assistive technology, transportation, advocacy or community-living support that may help.','Find access support',10),
 ('independent-living','support_change','I need more or less support','routine','support_contact','Review what you want to do yourself, where support is useful, and who you choose to involve.','Review support',20),
 ('independent-living','immediate_safety','I am in immediate danger','emergency','emergency_care','If you are in immediate danger, contact 911 or local emergency services now.','Get emergency help',30)
)
insert into public.program_safety_routes(program_id,route_key,user_label,urgency,primary_action,guidance_text,action_button_label,display_order,status)
select p.id,r.route_key,r.user_label,r.urgency,r.primary_action,r.guidance_text,r.action_button_label,r.display_order,'draft'
from routes r join public.programs p on p.slug=r.slug
on conflict (program_id,route_key) do update
set user_label=excluded.user_label, urgency=excluded.urgency, primary_action=excluded.primary_action,
    guidance_text=excluded.guidance_text, action_button_label=excluded.action_button_label,
    display_order=excluded.display_order, status='draft', updated_at=now();

with draft_resources(slug,category_key,name,description,eligibility_summary,service_area,phone,website_url,cost_level,virtual_available) as (
 values
 ('caregiving','caregiving','Eldercare Locator','Administration for Community Living service that connects older adults, families and caregivers with local aging and caregiving resources.','For older adults, families and caregivers seeking local services; available programs vary by location.','United States','800-677-1116','https://eldercare.acl.gov/home','free',true),
 ('caregiving','caregiving','National Family Caregiver Support Program','ACL program supporting state and territory caregiver services including information, access assistance, counseling/support groups, caregiver training, respite and limited supplemental services.','Family and informal caregiver supports are delivered through state and local programs; eligibility and availability vary.','United States',null,'https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program','free',true),
 ('reentry','employment','CareerOneStop — Find a Job After Incarceration','U.S. Department of Labor-sponsored guide for justice-impacted job seekers covering local resources, careers, training, job-search preparation and applications.','For people preparing for employment after incarceration or with a criminal record; local programs and eligibility vary.','United States','877-872-5627','https://cloudfront.careeronestop.org/JusticeImpacted/Help/ReEntry/reentry-intro.aspx','free',true),
 ('reentry','benefits','USA.gov Benefit Finder','Official federal benefit finder for exploring government assistance by life event and category, including housing, food, health, disability, education, jobs and cash assistance.','Potential benefits depend on the specific program and individual eligibility; the tool does not itself determine final eligibility.','United States',null,'https://www.usa.gov/benefit-finder','free',true),
 ('housing-stability','housing','HUD Find Shelter','HUD search tool for shelters, food pantries, health clinics, clothing resources and local homelessness assistance.','For people seeking local shelter or related basic-needs resources; services and availability vary by community.','United States',null,'https://www.hud.gov/findshelter','free',true),
 ('housing-stability','housing','HUD Housing Counseling','HUD network of participating housing counseling agencies and certified counselors for rental, eviction, foreclosure, homeownership and other housing concerns.','Housing counseling services vary by agency and need; use HUD search or phone assistance to locate a participating agency.','United States','800-569-4287','https://www.hud.gov/stat/sfh/housing-counseling','free',true),
 ('independent-living','independent_living','Disability Information and Access Locator (DIAL)','Administration for Community Living locator connecting people with disabilities and families to state and local organizations that support independent living.','For people with disabilities and families seeking community-living information and local supports; services vary by location.','United States',null,'https://dial.acl.gov/home','free',true),
 ('independent-living','benefits','USA.gov Benefit Finder','Official federal benefit finder for exploring government assistance, including disability, health, housing, education, jobs and other support categories.','Potential benefits depend on the specific program and individual eligibility; the tool does not itself determine final eligibility.','United States',null,'https://www.usa.gov/benefit-finder','free',true)
)
insert into public.service_resources(program_id,category_key,name,description,eligibility_summary,service_area,phone,website_url,cost_level,virtual_available,referral_supported,published,sponsored,verified_at,created_at,updated_at)
select p.id,d.category_key,d.name,d.description,d.eligibility_summary,d.service_area,d.phone,d.website_url,d.cost_level,d.virtual_available,false,false,false,now(),now(),now()
from draft_resources d join public.programs p on p.slug=d.slug
where not exists (select 1 from public.service_resources r where r.program_id=p.id and r.website_url=d.website_url);

commit;
