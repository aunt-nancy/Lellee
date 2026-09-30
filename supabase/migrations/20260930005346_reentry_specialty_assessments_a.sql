begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_reentry'
   and m.module_key in ('reentry_scope_systems','documents_benefits_referral','employment_education_reentry')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   1,'multiple_choice','Which statement best reflects evidence-based reentry practice?','["One standard plan should be used for everyone.","Support should be individualized and address multiple needs such as housing, health, employment, family, and supervision.","Employment should always be the only priority.","Only correctional agencies affect reentry outcomes."]'::jsonb,'{"index":1}'::jsonb,'NIJ emphasizes individualized and holistic reentry planning.','NIJ Five Things About Reentry','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   2,'scenario','A participant asks the coach to interpret whether a supervision condition is legally valid. What should the coach do?','["Give a legal interpretation.","Help the participant organize the question and connect with the supervising agency or qualified legal help.","Tell the participant to ignore the condition.","Contact the court and speak as the participant''s lawyer."]'::jsonb,'{"index":1}'::jsonb,'Legal interpretation is outside coaching scope.','Reentry role boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   3,'multiple_choice','What is the coach''s role with formal risk/needs assessments?','["Create a new criminal-risk score from personal observations.","Use authorized assessment information only within scope to support planning, without replacing validated assessment or trained interpretation.","Ignore all assessment information.","Change the assessment score when the participant disagrees."]'::jsonb,'{"index":1}'::jsonb,'Validated assessments require appropriate training and authorized use.','NIJ screening and assessment','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   4,'scenario','A participant has housing, treatment, transportation, and employment needs at the same time. What is the strongest approach?','["Focus only on the job search.","Build a sequenced plan that addresses interacting needs and urgent barriers.","Tell the participant to solve everything in one week.","Choose the easiest need and ignore the others."]'::jsonb,'{"index":1}'::jsonb,'Holistic reentry planning recognizes interacting needs.','NIJ/NRRC holistic reentry','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   5,'multiple_choice','Which is within a reentry coach''s scope?','["Interpreting a sentencing order","Diagnosing a substance use disorder","Helping organize appointments, transportation, documents, goals, and referrals","Changing supervision conditions"]'::jsonb,'{"index":2}'::jsonb,'Coaching can support practical organization and follow-through.','Reentry coaching scope','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   6,'multiple_choice','Why should criminal history not be treated as the participant''s identity?','["Because history never matters.","Because strengths-based reentry recognizes skills, goals, protective factors, and future possibilities alongside justice history.","Because all convictions have the same impact.","Because coaches should avoid discussing barriers."]'::jsonb,'{"index":1}'::jsonb,'Strengths and protective factors are important in reentry planning.','NRRC case planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   7,'scenario','A participant says an agency requirement conflicts with a work schedule. What can the coach appropriately do?','["Tell the participant which requirement can legally be ignored.","Help the participant prepare questions, identify scheduling options, and contact the appropriate agency about possible accommodations or changes.","Call the agency pretending to be an attorney.","Advise the participant not to report to supervision."]'::jsonb,'{"index":1}'::jsonb,'Coaches can support communication and planning but not make legal determinations.','Role boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='reentry_scope_systems'),
   8,'multiple_choice','Which phrase best describes Risk-Need-Responsivity in this course?','["A diagnostic tool Lellee coaches administer to everyone.","An evidence-informed correctional framework coaches should understand, while formal assessment and treatment decisions remain with authorized professionals.","A method for predicting employment success.","A legal standard for sentence modification."]'::jsonb,'{"index":1}'::jsonb,'RNR is a correctional framework, not a self-administered Lellee coaching test.','NIJ/NRRC evidence-based practice','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   1,'multiple_choice','Which administrative task is appropriate for coaching?','["Creating identification documents","Helping list required documents, agencies, deadlines, and transportation needs","Determining legal eligibility for expungement","Submitting false information to speed up an application"]'::jsonb,'{"index":1}'::jsonb,'Coaches can organize legitimate administrative tasks without making legal determinations or falsifying documents.','Administrative coaching boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   2,'scenario','A participant asks whether a conviction automatically disqualifies them from a professional license. What should the coach do?','["Guess based on another participant''s experience.","Use official resources to identify the question and refer the participant to the licensing authority or qualified legal help for an eligibility determination.","Tell them the conviction definitely disqualifies them.","Submit an application without their permission."]'::jsonb,'{"index":1}'::jsonb,'Collateral consequences vary by jurisdiction and occupation.','NICCC','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   3,'multiple_choice','What is the National Inventory of Collateral Consequences of Conviction useful for?','["Replacing individualized legal advice","Researching statutes and regulations that may affect rights, benefits, licensing, and opportunities after conviction","Guaranteeing a person''s eligibility","Changing a conviction record"]'::jsonb,'{"index":1}'::jsonb,'NICCC is a research database of collateral consequences, not individualized legal advice.','NICCC','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   4,'scenario','A benefits application is denied. What should the coach do first?','["Assume discrimination and threaten the agency.","Help the participant identify the stated reason, preserve documents, and locate the appropriate agency, appeal, or legal resource.","Tell the participant to submit a different identity.","Ignore the denial."]'::jsonb,'{"index":1}'::jsonb,'Coaching can support organized follow-up without inventing legal conclusions.','Administrative support principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   5,'multiple_choice','Why is a document checklist useful in reentry?','["It guarantees benefits approval.","It helps sequence identification, agency, application, and follow-up tasks that affect access to multiple services.","It replaces agency instructions.","It eliminates the need for participant consent."]'::jsonb,'{"index":1}'::jsonb,'Administrative organization can reduce practical barriers across reentry domains.','SAMHSA/NRRC transition planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   6,'multiple_choice','Which statement about eligibility is correct?','["The coach should make final eligibility decisions.","Eligibility often depends on program and jurisdiction rules, so coaches should rely on official or qualified sources.","Eligibility rules are the same nationwide.","A participant''s prior denial always predicts a future denial."]'::jsonb,'{"index":1}'::jsonb,'Eligibility can vary substantially and should not be guessed.','Referral boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   7,'scenario','A participant needs replacement identification before starting work. What is the strongest coaching response?','["Tell the employer to ignore identification requirements.","Help identify the issuing agency, required proof, cost, transportation, and timeline.","Create a temporary ID in a document editor.","Tell the participant to wait until someone else solves it."]'::jsonb,'{"index":1}'::jsonb,'Administrative coaching supports legitimate steps and sequencing.','Reentry planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='documents_benefits_referral'),
   8,'multiple_choice','Which question most clearly requires qualified legal guidance?','["What documents should I bring to an appointment?","What bus route gets me to the agency?","Am I legally eligible to seal this conviction under my state''s law?","When is my next appointment?"]'::jsonb,'{"index":2}'::jsonb,'Record-clearing eligibility is a legal question and varies by jurisdiction.','NICCC/NRRC legal-resource boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   1,'multiple_choice','What does the Department of Labor evidence review suggest about reentry employment programs?','["Employment services always reduce recidivism.","Results are mixed, so employment support should be implemented carefully and integrated with other needs.","Employment support has no value.","Only education matters."]'::jsonb,'{"index":1}'::jsonb,'DOL found inconsistent impacts across adult employment reentry programs.','DOL SRESS review','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   2,'scenario','A participant needs immediate income but also wants a skilled trade career. What is a strong plan?','["Choose only the fastest job and abandon the career goal.","Separate an immediate-income plan from a longer-term training and career pathway.","Enroll in the most expensive school without research.","Wait to work until every long-term goal is solved."]'::jsonb,'{"index":1}'::jsonb,'Short-term income and long-term mobility may require different steps.','Integrated workforce planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   3,'multiple_choice','Which can be a transferable skill source?','["Prior employment","Caregiving or volunteering","Education or correctional programming","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Transferable skills can come from many legitimate experiences.','Workforce coaching principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   4,'scenario','A participant asks whether an employer''s background-check question is legal in their state. What should the coach do?','["Give a legal ruling.","Help the participant identify the exact question and connect with official fair-chance or legal guidance.","Tell them to lie on the application.","Contact the employer as a lawyer."]'::jsonb,'{"index":1}'::jsonb,'Employment-law interpretation is outside coaching scope.','Legal boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   5,'multiple_choice','Which factor should be included when comparing training programs?','["Cost and time","Credential recognition or accreditation","Labor-market fit and barriers","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Training decisions should account for quality, cost, time, recognition, and fit.','Workforce planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   6,'multiple_choice','Why can employment planning fail when other needs are ignored?','["Because jobs are never helpful.","Because housing, treatment, transportation, family obligations, or supervision demands can affect job retention.","Because employment is unrelated to reentry.","Because employers control treatment access."]'::jsonb,'{"index":1}'::jsonb,'NIJ emphasizes holistic support rather than isolated service delivery.','NIJ Five Things About Reentry','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   7,'scenario','A participant has an interview but lacks transportation and reliable phone service. What should the coach do?','["Focus only on interview answers.","Include transportation and communication logistics in the employment plan.","Tell the employer the participant is unreliable.","Cancel the job search."]'::jsonb,'{"index":1}'::jsonb,'Practical barriers can determine whether employment opportunities are usable.','Integrated reentry planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='employment_education_reentry'),
   8,'multiple_choice','Which claim should Lellee avoid?','["Employment can contribute to stability and purpose.","Job readiness can be part of reentry support.","Getting a job by itself is proven to solve reentry for everyone.","Education and training may support longer-term mobility."]'::jsonb,'{"index":2}'::jsonb,'Evidence does not support overselling employment as a universal stand-alone solution.','DOL SRESS review','internal_review',true
  );
commit;