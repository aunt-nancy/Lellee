begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_reentry'
   and m.module_key in ('housing_financial_reentry','family_social_reintegration')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   1,'multiple_choice','Why is housing considered a core reentry issue?','["Because housing is unrelated to other goals.","Stable housing can support employment, treatment continuity, family stability, and overall reintegration.","Because all participants qualify for the same housing programs.","Because coaches should provide housing placement directly."]'::jsonb,'{"index":1}'::jsonb,'Housing interacts with several reentry outcomes and should be integrated with broader planning.','NIJ/NRRC reentry evidence','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   2,'scenario','A participant believes a housing denial was unlawful because of a conviction history. What should the coach do?','["Give a legal ruling.","Help preserve the denial notice, identify the stated reason, and connect the participant with appropriate housing or legal resources.","Tell the participant the provider definitely broke the law.","Contact the provider as legal counsel."]'::jsonb,'{"index":1}'::jsonb,'Coaches can help organize documentation and referral without providing legal conclusions.','Housing/legal boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   3,'multiple_choice','A realistic first-step reentry budget should focus on:','["Luxury spending targets","Actual income, essential expenses, obligations, transportation, food, communication, and urgent costs","Long-term investment products only","Ignoring irregular income"]'::jsonb,'{"index":1}'::jsonb,'Early reentry budgeting should reflect immediate, real-world obligations and resources.','Financial stability coaching','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   4,'scenario','A participant has a job offer but transportation is unreliable. What should the coach do?','["Tell them transportation is a personal failure.","Build transportation options and backups into the employment and housing plan.","Tell the employer the participant cannot handle work.","Ignore transportation because it is not an employment issue."]'::jsonb,'{"index":1}'::jsonb,'Practical logistics can determine whether other reentry goals are sustainable.','Integrated reentry planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   5,'multiple_choice','Which statement about housing placement is correct?','["A Lellee coach can promise a unit if the participant completes training.","A coach may help search and prepare applications but should not promise placement or misrepresent eligibility.","A coach should decide which landlord must accept the participant.","A coach can waive housing-provider screening rules."]'::jsonb,'{"index":1}'::jsonb,'Housing placement and eligibility depend on provider and program rules.','Housing coaching boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   6,'multiple_choice','Why should budgeting avoid shame-based language?','["Because finances never matter.","Because irregular income and competing obligations are common in reentry, and judgment does not improve planning.","Because participants should never review spending.","Because coaches must approve all purchases."]'::jsonb,'{"index":1}'::jsonb,'Practical financial coaching should focus on accurate planning rather than moral judgment.','Strengths-based coaching','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   7,'scenario','A participant is facing several application fees and supervision-related costs with limited income. What is the best coaching response?','["Tell them to pay everything immediately regardless of consequences.","Help prioritize urgent obligations, identify possible assistance, and create a realistic short-term plan.","Tell them to ignore official obligations.","Borrow money on their behalf."]'::jsonb,'{"index":1}'::jsonb,'Sequencing and realistic budgeting are appropriate coaching tasks.','Reentry financial planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='housing_financial_reentry'),
   8,'multiple_choice','Which factor can destabilize housing even after move-in?','["Unmanaged rent or utility deadlines","Transportation barriers","Communication problems with providers or landlords","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Housing stability depends on ongoing practical routines and communication.','NRRC housing/reentry guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   1,'multiple_choice','Which statement best reflects evidence-informed family reentry practice?','["Family involvement is always required.","Family support can help, but involvement should be safe, voluntary, and responsive to the needs of everyone affected.","The coach should automatically contact relatives.","Family reunification should happen immediately."]'::jsonb,'{"index":1}'::jsonb,'Family support can be important, but reentry affects the whole family and requires individualized planning.','NRRC family/reentry guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   2,'scenario','A participant wants to reconnect with a child but has a court-ordered visitation arrangement. What should the coach do?','["Interpret the order and change the schedule.","Help organize dates, transportation, questions, and goals while referring legal interpretation to qualified sources.","Tell the participant to ignore the order.","Contact the child without permission."]'::jsonb,'{"index":1}'::jsonb,'Coaching can support logistics but not legal interpretation.','Family/legal boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   3,'multiple_choice','A prosocial network may include:','["Family and mentors","Treatment or peer supports","Employers, education, faith, recreation, or volunteering","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Reentry support can draw on multiple healthy community connections.','NIJ/NRRC reentry evidence','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   4,'scenario','A participant says returning home is creating conflict about money and household expectations. What can the coach do?','["Take sides and decide who is right.","Help prepare a structured conversation about expectations, boundaries, responsibilities, and realistic next steps.","Threaten the family member.","Provide family therapy."]'::jsonb,'{"index":1}'::jsonb,'Coaches can support communication and planning while avoiding therapy or coercion.','Reentry coaching scope','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   5,'multiple_choice','Why might immediate family reunification not always be appropriate?','["Because family never helps.","Because some relationships may be unsafe, legally restricted, strained, or not desired by the participant.","Because coaches should prevent all family contact.","Because only supervision officers may discuss family."]'::jsonb,'{"index":1}'::jsonb,'Family involvement should be individualized, safe, and voluntary.','NRRC family guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   6,'multiple_choice','What is a strong way to support identity during reentry?','["Define the participant by their conviction history.","Recognize strengths, roles, goals, and community identities beyond the justice history.","Avoid all discussion of future goals.","Pressure the participant to prove change immediately."]'::jsonb,'{"index":1}'::jsonb,'Strengths-based reentry emphasizes dignity and future-oriented identity.','NRRC lived-experience guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   7,'scenario','A family situation becomes threatening or unsafe. What should the coach do?','["Continue normal family-goal coaching only.","Shift to safety and appropriate specialized referral rather than trying to mediate beyond scope.","Tell the participant to solve it alone.","Assume all family conflict is normal."]'::jsonb,'{"index":1}'::jsonb,'Unsafe or highly complex family situations require appropriate specialized support.','Safety/scope boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_reentry' and m.module_key='family_social_reintegration'),
   8,'multiple_choice','Which is the best principle for social reintegration?','["Immediate perfection","Gradual rebuilding of healthy roles, relationships, routines, and community connections","Avoiding all community activity","Replacing all prior relationships regardless of quality"]'::jsonb,'{"index":1}'::jsonb,'Reentry is an adjustment process that benefits from realistic pacing and supportive connections.','NRRC reentry through lived experience','internal_review',true
  );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_reentry';
commit;