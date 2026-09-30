begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_housing_stability'
   and m.module_key in ('tenancy_sustainability','housing_crisis_referral')
);
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    1,'multiple_choice','Which record can help a renter manage tenancy issues?','["Lease and notices","Payment receipts","Maintenance requests and communications","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Organized housing records support accurate follow-up and referrals.','Tenancy documentation principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    2,'scenario','A participant is struggling to pay full rent this month. What is an appropriate coaching action?','["Tell them to stop paying rent","Help them review assistance options, housing counseling, and prepare a factual conversation about possible repayment arrangements","Tell them the landlord must accept a payment plan","Give legal advice about withholding rent"]'::jsonb,'{"index":1}'::jsonb,'CFPB renter guidance supports early help-seeking, rental assistance, housing counseling, and communication where appropriate.','CFPB Help for Renters','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    3,'multiple_choice','Why should maintenance requests be documented factually?','["So the coach can decide whether housing law was violated","To preserve dates, conditions, prior notices, and follow-up without making legal conclusions","Because photos always prove a legal case","To embarrass the housing provider"]'::jsonb,'{"index":1}'::jsonb,'Objective records support communication and professional/legal referral when needed.','Tenancy documentation principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    4,'scenario','A participant asks whether a mold problem legally violates the lease. What should the coach do?','["Give a legal ruling","Help document the condition and connect the participant with appropriate code, housing, health, or legal resources","Tell them to stop paying rent","Inspect the property as an official"]'::jsonb,'{"index":1}'::jsonb,'Legal and code interpretations are outside coaching scope.','Housing/legal boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    5,'multiple_choice','What is a good tenancy-stability routine?','["Tracking rent, utilities, notices, maintenance, and important deadlines","Ignoring notices until a crisis","Keeping all records only in memory","Calling the landlord repeatedly without documentation"]'::jsonb,'{"index":0}'::jsonb,'Regular tracking helps prevent missed tasks and preserves information.','Tenancy sustainability principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    6,'scenario','A participant wants a disability-related housing change. What is the coach''s appropriate role?','["Approve the accommodation","Help organize the barrier, request, and documentation questions, then refer legal/right-to-accommodation issues to qualified resources","Tell the landlord the law requires approval","Tell the participant disability rights do not apply to housing"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support organization but should not make legal accommodation determinations.','HUD fair-housing boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    7,'multiple_choice','Which communication style is generally most useful for a housing problem?','["Threatening and accusatory","Factual, concise, respectful, and clear about the requested next step","Vague and emotional only","Publicly posting the dispute first"]'::jsonb,'{"index":1}'::jsonb,'Clear factual communication helps problem-solving and preserves the record.','Communication principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='tenancy_sustainability'),
    8,'scenario','A housing conflict includes threats or immediate safety concerns. What should happen?','["Continue normal budgeting coaching only","Shift to appropriate safety, emergency, domestic-violence, legal, or other specialized resources based on the situation","Tell the participant to negotiate alone","Assume all landlord conflict is harmless"]'::jsonb,'{"index":1}'::jsonb,'Immediate safety concerns require specialized or emergency response rather than ordinary coaching.','Safety boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    1,'multiple_choice','What should happen first when a participant receives an eviction-related notice?','["Throw it away","Preserve the notice, record the date received, and identify deadlines and next steps","Tell them the notice is invalid","Wait until the court date passes"]'::jsonb,'{"index":1}'::jsonb,'Preserving documents and deadlines helps protect options while legal questions are referred.','CFPB eviction guidance','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    2,'scenario','A participant asks whether an eviction notice follows state law. What should the coach do?','["Interpret the statute","Refer the legal question to legal aid, court self-help, or a qualified attorney while helping organize documents and deadlines","Tell them to ignore the notice","Call the court as the participant''s lawyer"]'::jsonb,'{"index":1}'::jsonb,'Eviction-law interpretation is outside coaching scope.','CFPB legal-help guidance','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    3,'multiple_choice','Which resource can help a renter facing housing instability make a housing plan?','["HUD-approved housing counselor","Only a landlord","Only social media groups","A credit card company"]'::jsonb,'{"index":0}'::jsonb,'HUD housing counselors provide housing advice and planning support.','HUD Housing Counseling','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    4,'scenario','A participant has already lost housing and needs medication, transportation, and school continuity for children. What is the best coaching approach?','["Focus only on finding any bed tonight","Address immediate safety while coordinating practical continuity needs and appropriate rehousing resources","Ignore health and school needs","Promise permanent housing within a week"]'::jsonb,'{"index":1}'::jsonb,'Housing loss often requires cross-system stabilization, not a single referral.','USICH cross-system prevention/response','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    5,'multiple_choice','What does USICH''s prevention framework emphasize?','["Cross-system coordination and preventing housing loss before homelessness","Only emergency shelter","One national program for everyone","Replacing legal aid with coaching"]'::jsonb,'{"index":0}'::jsonb,'The federal framework emphasizes coordinated upstream prevention across systems.','USICH Prevention Framework','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    6,'scenario','A participant is behind on rent and there is no immediate safety emergency. Which is an appropriate action?','["Tell them eviction is inevitable","Help identify rental assistance, housing counseling, legal resources if needed, and a rapid document/deadline plan","Advise them to hide from the landlord","Promise a grant"]'::jsonb,'{"index":1}'::jsonb,'Early coordinated action may preserve options without guaranteeing an outcome.','CFPB/USICH prevention guidance','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    7,'multiple_choice','Which statement about eviction-prevention evidence is most accurate?','["Every prevention method is equally proven","Eviction prevention is an important federal strategy, but evidence for specific prevention approaches continues to develop","There is no relationship between eviction and homelessness","Legal assistance is never relevant"]'::jsonb,'{"index":1}'::jsonb,'USICH identifies eviction prevention as important while noting the broader prevention evidence base is still developing.','USICH Prevention Framework/Research Agenda','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_crisis_referral'),
    8,'scenario','A participant asks the coach to threaten a landlord with a lawsuit unless the eviction is stopped. What should the coach do?','["Do it immediately","Decline legal representation, help the participant prepare facts and documents, and connect them with qualified legal help","Pretend to be an attorney","Post threats publicly"]'::jsonb,'{"index":1}'::jsonb,'A coach should not act as legal counsel or make litigation threats on a participant''s behalf.','Legal-scope boundary','internal_review',true
  );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_housing_stability';
commit;