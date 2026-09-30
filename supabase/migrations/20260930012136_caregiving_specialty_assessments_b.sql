begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_caregiving'
   and m.module_key in ('family_systems_coordination','caregiving_grief_resources')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   1,'multiple_choice','What is a useful first step when several people share caregiving?','["Assume the oldest relative is in charge","List recurring tasks and clarify who is responsible, who can back up, and what training is needed","Let everyone do whatever they want","Have the coach assign legal authority"]'::jsonb,'{"index":1}'::jsonb,'Making roles and gaps visible supports safer coordination.','NIA sharing responsibilities','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   2,'scenario','Two siblings disagree about who should handle transportation and bills. What can the coach do?','["Decide who is legally responsible","Facilitate a structured discussion of tasks, capacity, boundaries, and follow-up without making legal rulings","Tell one sibling they must pay","End all family involvement"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support coordination without adjudicating legal duties.','Family coordination boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   3,'multiple_choice','Why should the care recipient''s preferences remain part of shared-care planning?','["Because family caregivers have no role","Because person-centered care should preserve the individual''s voice and autonomy as much as possible","Because the coach needs permission to speak","Because every task must be done exactly as requested"]'::jsonb,'{"index":1}'::jsonb,'Caregiving coordination should not erase the care recipient''s autonomy.','Person-centered caregiving','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   4,'scenario','A family asks the coach who legally has authority to make medical decisions. What should the coach do?','["Choose the primary caregiver","Refer the question to appropriate legal or health professionals and help the family organize the relevant documents and questions","Tell them the spouse always decides","Tell them the oldest child always decides"]'::jsonb,'{"index":1}'::jsonb,'Legal decision-making authority depends on law and documents, not coaching judgment.','Legal authority boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   5,'multiple_choice','A family meeting works best when it has:','["A specific purpose, agenda, decisions, task assignments, and follow-up","No structure","Only the loudest family member speaking","A promise that all conflict will disappear"]'::jsonb,'{"index":0}'::jsonb,'Structured meetings make coordination clearer and more actionable.','NIA sharing caregiving responsibilities','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   6,'scenario','Family conflict becomes coercive and threatening. What should happen?','["Continue normal task planning only","Shift to appropriate safety and specialized support such as legal, protective, domestic-violence, mediation, or mental-health resources depending on the situation","Tell the caregiver to ignore it","Have the coach mediate beyond their competence"]'::jsonb,'{"index":1}'::jsonb,'Unsafe or highly complex conflict requires specialized support.','Safety and scope boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   7,'multiple_choice','Which can be part of a shared-care matrix?','["Task","Primary person","Backup person and training needs","All of the above"]'::jsonb,'{"index":3}'::jsonb,'A shared-care matrix makes responsibilities and gaps visible.','Care coordination principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='family_systems_coordination'),
   8,'scenario','The caregiver is coordinating doctors, transportation, meals, and home-care agencies. What is an appropriate coaching contribution?','["Become the formal care manager without authorization","Help organize contacts, questions, calendars, and follow-up while referring formal care-management tasks to the appropriate professionals","Make treatment decisions","Sign agency contracts for the caregiver"]'::jsonb,'{"index":1}'::jsonb,'Coaching can support organization without assuming a formal professional role.','Care coordination boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   1,'multiple_choice','Advance care planning is primarily about:','["Choosing future medical preferences and documenting or communicating them appropriately","Having a coach decide treatment","Replacing legal documents","Guaranteeing a specific medical outcome"]'::jsonb,'{"index":0}'::jsonb,'NIA describes advance care planning as preparation for future health-care decisions based on the person''s wishes.','NIA advance care planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   2,'scenario','A caregiver asks the coach to interpret an advance directive and decide whether a treatment should be accepted. What should the coach do?','["Interpret it and decide","Help prepare questions and connect the caregiver with the appropriate health or legal professional","Tell the caregiver to ignore the document","Choose the treatment based on personal experience"]'::jsonb,'{"index":1}'::jsonb,'Legal and medical interpretation of advance directives is outside coaching scope.','NIA advance care planning boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   3,'multiple_choice','Which service is part of ACL''s National Family Caregiver Support Program?','["Respite care","Caregiver training","Help accessing services","All of the above"]'::jsonb,'{"index":3}'::jsonb,'NFCSP funds information, access assistance, counseling/support groups, training, respite, and limited supplemental services.','ACL NFCSP','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   4,'scenario','A caregiver''s role ends after the care recipient moves to long-term care, and the caregiver feels lost and isolated. What is an appropriate coaching response?','["Tell them they should feel relieved only","Support routine rebuilding, connection, resource use, and referral to grief or mental-health support when needed","Diagnose a grief disorder","Tell them to immediately become another person''s caregiver"]'::jsonb,'{"index":1}'::jsonb,'Role transitions may involve grief and identity change; coaching can support practical adjustment and referral.','Caregiving transition principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   5,'multiple_choice','Which resource-navigation statement is most accurate?','["A coach can promise respite if the participant qualifies","A coach can help locate programs and confirm how to apply, but availability and eligibility must be determined by the program","Every state has the same caregiver benefits","A coach can approve Medicaid services"]'::jsonb,'{"index":1}'::jsonb,'Caregiver services vary by jurisdiction and program.','ACL/NIA resource navigation','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   6,'scenario','A caregiver wants help preparing for a conversation about future care wishes. What can the coach do?','["Make medical choices for the family","Help organize the person''s stated values, questions, and topics to discuss with the health team and legal professionals","Draft binding legal documents","Tell the family which treatment is best"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support conversation preparation without making legal or medical decisions.','NIA advance care planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   7,'multiple_choice','Which statement about grief in caregiving is most appropriate?','["All caregivers experience grief the same way","Caregiving transitions can involve grief, relief, uncertainty, or role changes, and support should be individualized","Relief after caregiving always means the caregiver did not care","Coaches should diagnose prolonged grief"]'::jsonb,'{"index":1}'::jsonb,'Caregiving transitions are individualized and can involve mixed emotions.','Caregiving transition principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_grief_resources'),
   8,'scenario','A caregiver needs respite, transportation help, and support groups. What is the strongest coaching action?','["Promise the services will be free","Use local aging/disability and caregiver-support systems to locate options and help the caregiver verify eligibility and availability","Tell them only family can help","Enroll them without consent"]'::jsonb,'{"index":1}'::jsonb,'Resource navigation should connect caregivers to appropriate local systems without promising availability.','ACL caregiver support','internal_review',true
  );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_caregiving';
commit;