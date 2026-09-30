begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_workforce_new_beginnings'
   and m.module_key in ('workplace_communication_accommodations','retention_budget_career')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   1,'multiple_choice','Which workplace communication style is generally strongest?','["Vague and emotional","Specific, factual, timely, and focused on the work issue and requested next step","Public criticism first","Avoid all communication"]'::jsonb,'{"index":1}'::jsonb,'Clear factual communication supports problem-solving and follow-through.','Workplace communication principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   2,'scenario','A supervisor gives corrective feedback that the participant does not understand. What should the coach help them do?','["Assume the supervisor is hostile","Prepare clarifying questions, restate the expectation, and identify a follow-up plan","Ignore the feedback","File a legal complaint immediately"]'::jsonb,'{"index":1}'::jsonb,'Clarification and a concrete improvement plan are appropriate coaching tools.','Workplace coaching principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   3,'multiple_choice','Which statement about reasonable accommodation is accurate?','["Employers must always provide the exact accommodation requested","Qualified applicants or employees with disabilities may be entitled to an effective reasonable accommodation unless it creates undue hardship","Only current employees can request accommodation","Accommodation is the same as special treatment"]'::jsonb,'{"index":1}'::jsonb,'EEOC explains the ADA accommodation standard for covered employers.','EEOC ADA rights','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   4,'scenario','A participant wants a modified schedule because of a disability. What can the coach do?','["Determine whether the employer legally must approve the exact schedule","Help identify the work barrier, prepare an accommodation request, and refer legal disputes to EEOC or qualified counsel","Tell the participant to hide the disability","Promise approval"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support the process without making legal entitlement decisions.','EEOC accommodation boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   5,'multiple_choice','EEOC-enforced federal laws generally prohibit retaliation for:','["Asserting protected discrimination rights or participating in an investigation","Asking a coworker for lunch","Changing career goals","Applying for a different job"]'::jsonb,'{"index":0}'::jsonb,'Federal EEO laws prohibit retaliation for protected activity.','EEOC employment discrimination','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   6,'scenario','A participant reports repeated offensive comments related to a protected characteristic. What should the coach do?','["Declare the conduct legally unlawful","Help document facts and connect the participant with internal reporting, union, EEOC, or legal resources as appropriate","Tell them to retaliate against coworkers","Post the allegations publicly"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support documentation and referral without making a legal finding.','EEOC referral boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   7,'multiple_choice','Which is NOT the coach''s role in an accommodation dispute?','["Helping organize facts","Practicing a request conversation","Determining definitively what accommodation the law requires","Helping locate EEOC or disability-rights resources"]'::jsonb,'{"index":2}'::jsonb,'Legal accommodation determinations are outside ordinary coaching scope.','EEOC accommodation boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='workplace_communication_accommodations'),
   8,'scenario','A participant receives criticism and immediately concludes they should quit. What is a useful coaching step?','["Tell them to resign immediately","Separate the feedback from identity, clarify the issue, and consider options before making a decision","Tell them all supervisors are unfair","Contact HR as the participant without consent"]'::jsonb,'{"index":1}'::jsonb,'Coaching can help slow down decisions and clarify expectations without dismissing real workplace concerns.','Workplace communication principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   1,'multiple_choice','Which belongs in a first-30-days job-retention plan?','["Transportation and backup commute","Schedule and attendance procedures","Childcare/caregiving and health routines","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Retention often depends on practical logistics outside the job task itself.','Retention planning principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   2,'scenario','A higher-paying job has a long commute, unstable schedule, and much higher childcare cost. What should the coach do?','["Assume the higher wage makes it the best choice","Compare total household impact, stability, schedule, benefits, commute, and participant priorities","Tell the participant to refuse it automatically","Ignore childcare because it is not a workplace issue"]'::jsonb,'{"index":1}'::jsonb,'Job quality and total household impact matter, not hourly wage alone.','DOL Good Jobs/CFPB planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   3,'multiple_choice','Which is one of the federal Good Jobs themes?','["Skills and career advancement","Unpredictable pay","Avoiding worker voice","Eliminating benefits"]'::jsonb,'{"index":0}'::jsonb,'DOL/Commerce include skills and career advancement among Good Jobs principles.','DOL Good Jobs Principles','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   4,'scenario','A participant is considering an expensive training program that promises they will double their income. What should the coach do?','["Treat the promise as guaranteed","Review recognition, outcomes data, employer connections, cost, completion, local demand, and financing before deciding","Tell the participant all training is a scam","Enroll them immediately"]'::jsonb,'{"index":1}'::jsonb,'Training outcomes vary; due diligence is appropriate.','DOL career pathways evidence','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   5,'multiple_choice','What did DOL''s meta-analysis of career pathways find on average?','["Large long-term earnings gains in every program","Large educational and industry-specific employment gains, with smaller general employment/short-term earnings effects and no meaningful average medium/long-term earnings gain","No educational gains","Guaranteed promotion"]'::jsonb,'{"index":1}'::jsonb,'The DOL meta-analysis found meaningful gains in some outcomes but not universally large earnings effects.','DOL career pathways meta-analysis','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   6,'scenario','A participant''s first paycheck is larger than expected but expenses are also higher because of work transportation and meals. What should the coach do?','["Focus only on gross pay","Update the actual monthly budget using income and work-related expenses","Tell them they are financially secure now","Recommend an investment product"]'::jsonb,'{"index":1}'::jsonb,'CFPB budgeting compares actual income and expenses rather than assuming higher income solves all financial pressure.','CFPB monthly budget','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   7,'multiple_choice','CFPB describes financial well-being partly as:','["Having the highest possible salary","Control over day-to-day finances, ability to absorb shocks, progress toward goals, and freedom of choice","Owning a home","Never using credit"]'::jsonb,'{"index":1}'::jsonb,'CFPB defines financial well-being in terms of security and freedom of choice, not income alone.','CFPB Financial Well-Being','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='retention_budget_career'),
   8,'scenario','A participant has stabilized in a job and wants to advance. What is a strong next step?','["Assume seniority will automatically produce advancement","Identify the next role, required skills/credentials, evidence the training is valued, cost/time, and a realistic development plan","Enroll in any course with the word leadership","Quit before researching options"]'::jsonb,'{"index":1}'::jsonb,'Career growth is stronger when linked to concrete occupational requirements and recognized skills.','O*NET/Career pathways planning','internal_review',true
  );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_workforce_new_beginnings';
commit;