begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_caregiving'
   and m.module_key in ('caregiving_roles_scope','stress_burnout_compassion','routines_communication_boundaries')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   1,'multiple_choice','Which task is appropriate for a caregiving-support coach?','["Changing a medication dose","Helping organize appointments, routines, questions, and support resources","Diagnosing dementia","Determining legal guardianship"]'::jsonb,'{"index":1}'::jsonb,'Coaches can support organization and planning but should not practice medicine or law.','NIA caregiving scope','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   2,'scenario','A caregiver asks whether a new symptom means the care recipient has a specific disease. What should the coach do?','["Give a diagnosis","Encourage appropriate medical evaluation and help the caregiver prepare observations and questions","Search online and decide","Tell the caregiver not to worry"]'::jsonb,'{"index":1}'::jsonb,'Diagnosis belongs with qualified health professionals.','Caregiving medical boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   3,'multiple_choice','Which statement about family caregiving authority is most accurate?','["Being an adult child automatically gives legal decision-making authority","Family relationship alone does not necessarily create legal authority","The primary caregiver always controls medical care","A coach can assign legal authority"]'::jsonb,'{"index":1}'::jsonb,'Legal authority depends on applicable law and documents, not simply family relationship.','Caregiving legal boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   4,'scenario','A caregiver is performing a health task they do not understand. What is the strongest response?','["Tell them to improvise","Encourage instruction from the relevant clinician or qualified care professional","Have them ask a neighbor","Tell them to stop all care"]'::jsonb,'{"index":1}'::jsonb,'Caregivers should receive appropriate instruction for health-related tasks.','NIA caregiving guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   5,'multiple_choice','Why should a caregiving plan be revisited over time?','["Because caregiving needs and caregiver capacity can change","Because all care plans expire every week","Because legal authority always changes","Because coaches should continuously add tasks"]'::jsonb,'{"index":0}'::jsonb,'Care needs and caregiver capacity may change as conditions and circumstances evolve.','NIA caregiving','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   6,'scenario','A caregiver is doing transportation, meals, finances, personal care, and appointment coordination alone. What should the coach do?','["Assume the caregiver can handle it","Help map tasks, identify which can be shared or referred, and assess where backup is missing","Tell the caregiver to quit","Take over the tasks personally"]'::jsonb,'{"index":1}'::jsonb,'Making the caregiving workload visible supports safer planning and shared responsibility.','NIA/ACL caregiving support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   7,'multiple_choice','Which is outside Lellee caregiving coaching scope?','["Resource navigation","Task organization","Treatment selection","Boundary planning"]'::jsonb,'{"index":2}'::jsonb,'Treatment selection is a clinical decision.','Caregiving scope','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='caregiving_roles_scope'),
   8,'scenario','The care recipient disagrees with the caregiver''s preferred daily routine and can make their own decisions. What should the coach prioritize?','["The caregiver''s convenience only","The care recipient''s preferences and autonomy while helping both parties plan workable support","The coach''s personal opinion","A rigid schedule regardless of consent"]'::jsonb,'{"index":1}'::jsonb,'Care recipients retain dignity, preferences, and autonomy to the greatest extent possible.','Person-centered caregiving','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   1,'multiple_choice','What is one NIA-recommended caregiver self-care strategy?','["Never ask for help","Use support, breaks, or respite and attend to the caregiver''s own health","Ignore sleep loss","Stop all enjoyable activity"]'::jsonb,'{"index":1}'::jsonb,'NIA encourages caregivers to care for their own health and seek support.','NIA caregiver self-care','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   2,'scenario','A caregiver says they have skipped several of their own medical appointments because nobody can cover care. What is a useful coaching response?','["Tell them self-care is selfish","Help identify specific backup coverage, respite, or task-sharing options so they can attend their own care","Diagnose caregiver burnout","Tell them to cancel all future appointments"]'::jsonb,'{"index":1}'::jsonb,'Practical support is more useful than generic self-care advice.','NIA/ACL caregiver support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   3,'multiple_choice','Respite care is:','["A punishment for overwhelmed caregivers","Short-term relief for primary caregivers","A legal document","A permanent nursing-home placement"]'::jsonb,'{"index":1}'::jsonb,'NIA describes respite as short-term relief for caregivers.','NIA caregiving FAQ','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   4,'scenario','A caregiver reports severe exhaustion and says they are not sure they can safely continue providing care tonight. What should happen?','["Continue ordinary goal coaching","Shift to immediate safety and appropriate backup, crisis, medical, or respite resources","Tell them to try harder","Schedule follow-up next month"]'::jsonb,'{"index":1}'::jsonb,'When safety is at risk, immediate support and escalation take priority.','Caregiver safety boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   5,'multiple_choice','Why should Lellee avoid claiming that its coaching is clinically proven to reduce caregiver depression?','["Because caregiving is never stressful","Because evidence for caregiver interventions varies, and AHRQ found limited/low-strength evidence for some multicomponent interventions","Because no caregiver interventions have ever been studied","Because coaches cannot discuss caregiver wellbeing"]'::jsonb,'{"index":1}'::jsonb,'The evidence base is heterogeneous and should not be overstated.','AHRQ caregiver interventions','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   6,'multiple_choice','Which is a realistic caregiver-support strategy?','["Specific task-sharing with named people","Respite or adult-day options","Scheduling the caregiver''s own health appointments","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Caregiver support often requires practical, multi-part solutions.','NIA/ACL caregiver support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   7,'scenario','A caregiver feels guilty about using respite. What is the strongest coaching response?','["Agree that respite means failing","Explore the guilt while reinforcing that planned breaks and support can help sustain caregiving safely","Tell them guilt is a mental disorder","Cancel respite"]'::jsonb,'{"index":1}'::jsonb,'Respite and support can help caregivers continue safely without framing help as failure.','NIA caregiving FAQ','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='stress_burnout_compassion'),
   8,'multiple_choice','Which sign suggests a caregiving arrangement may need more support?','["Chronic sleep loss","Increasing isolation","Inability to complete essential tasks safely","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Accumulating strain may signal that the current caregiving arrangement is not sustainable.','Caregiver strain planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   1,'multiple_choice','Which task can a coach help organize without giving medical advice?','["Medication pickup reminders","Medication dose changes","Diagnosis","Treatment selection"]'::jsonb,'{"index":0}'::jsonb,'Coaches may support logistics while medical decisions remain with clinicians.','Caregiving communication boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   2,'scenario','A caregiver is confused by two sets of medical instructions. What should the coach advise?','["Guess which instruction is correct","Contact the qualified health team for clarification and write down the resolved instructions","Combine both instructions","Ignore the difference"]'::jsonb,'{"index":1}'::jsonb,'Conflicting medical instructions should be clarified by qualified providers.','NIA caregiving communication','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   3,'multiple_choice','Under HIPAA, a provider may share relevant information with a family member involved in care when:','["The patient agrees or does not object, subject to the rule''s conditions","The family member demands the entire record","The coach authorizes it","The caregiver pays a bill once"]'::jsonb,'{"index":0}'::jsonb,'HHS permits relevant sharing in specified circumstances while preserving patient privacy.','HHS HIPAA family/friends','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   4,'scenario','A caregiver assumes they are entitled to the care recipient''s entire medical record because they are family. What should the coach do?','["Agree automatically","Explain that privacy and access depend on the person''s choices, legal authority, and provider rules; encourage clarification with the provider","Ask the hospital to bypass its process","Download records secretly"]'::jsonb,'{"index":1}'::jsonb,'Family status alone does not automatically create unlimited access.','HHS HIPAA guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   5,'multiple_choice','A useful appointment-preparation tool is:','["A list of questions, current concerns, and follow-up tasks","A diagnosis written by the coach","A new medication schedule invented by the coach","A legal demand letter"]'::jsonb,'{"index":0}'::jsonb,'Organized questions and follow-up support communication without exceeding scope.','NIA caregiver planning','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   6,'scenario','The care recipient says certain health information should not be shared with one relative. What should the caregiving coach do?','["Ignore the preference","Respect the privacy preference and help clarify authorized sharing through appropriate channels","Tell the relative anyway","Post the information in a shared family group"]'::jsonb,'{"index":1}'::jsonb,'The care recipient''s privacy choices should be respected within applicable law and care arrangements.','HHS privacy guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   7,'multiple_choice','Why are caregiver boundaries important?','["They help identify tasks the caregiver cannot safely or sustainably perform","They make caregivers less caring","They eliminate all family responsibility","They allow coaches to make medical decisions"]'::jsonb,'{"index":0}'::jsonb,'Boundaries help protect both caregiver and care recipient from unsafe or unsustainable expectations.','Caregiving support principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_caregiving' and m.module_key='routines_communication_boundaries'),
   8,'scenario','A caregiver is asked to perform a procedure they have never been taught. What is the best coaching step?','["Coach them through it from memory","Help them contact the qualified care team for instruction or alternative support","Tell them to search social media","Tell them they must comply"]'::jsonb,'{"index":1}'::jsonb,'Clinical task instruction belongs with appropriately qualified professionals.','Medical-scope boundary','internal_review',true
  );
commit;