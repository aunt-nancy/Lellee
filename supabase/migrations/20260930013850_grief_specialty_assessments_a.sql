begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_grief_life_after_loss'
   and m.module_key in ('grief_variation','grief_risk_referral','grief_communication_support')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   1,'multiple_choice','Which statement about grief is most accurate?','["Everyone should move through the same five stages in order.","Grief varies widely, and there is no single correct sequence or timetable.","Healthy grief ends within one month.","Strong emotion always indicates a mental disorder."]'::jsonb,'{"index":1}'::jsonb,'NIA, CDC, SAMHSA, and VA all emphasize individual variation in grief.','NIA/CDC/VA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   2,'scenario','A participant feels sadness one day, relief the next, and then anger. What is the best coaching response?','["Tell them the emotions are contradictory and unhealthy.","Normalize that grief can involve changing and mixed emotions while asking what support is useful today.","Tell them they are progressing backward.","Choose the emotion they should focus on."]'::jsonb,'{"index":1}'::jsonb,'Mixed and changing emotions can occur in grief without following a fixed sequence.','NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   3,'multiple_choice','What is the difference between grief and mourning in this course?','["There is no difference at all.","Grief broadly refers to the internal response to loss, while mourning includes ways loss is expressed and adapted to in personal, family, cultural, or spiritual life.","Mourning is a diagnosis.","Grief only happens after death."]'::jsonb,'{"index":1}'::jsonb,'The course distinguishes internal grief responses from broader mourning practices.','Grief education principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   4,'scenario','A participant''s cultural mourning practice is unfamiliar to the coach. What should the coach do?','["Tell them the practice is unhealthy.","Ask respectfully what the practice means and how it supports them rather than imposing the coach''s norms.","Avoid all discussion of culture.","Replace the practice with a standard grief exercise."]'::jsonb,'{"index":1}'::jsonb,'Cultural and religious context should be respected rather than treated as deviation.','AHRQ/NIA grief context','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   5,'multiple_choice','Which reaction can occur during grief without automatically indicating a disorder?','["Difficulty concentrating","Changes in sleep or appetite","Periods of numbness or sadness","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Common grief reactions can affect emotion, sleep, appetite, concentration, and decisions.','NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   6,'scenario','A participant is functioning less efficiently two weeks after a major loss but is still managing essential tasks. What should the coach do?','["Diagnose a grief disorder.","Support smaller goals, practical help, and connection while monitoring whether more professional support becomes necessary.","Tell them to return immediately to full productivity.","Require therapy as a condition of coaching."]'::jsonb,'{"index":1}'::jsonb,'Acute grief can temporarily affect functioning without automatically constituting a disorder.','NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   7,'multiple_choice','Which approach should a Lellee grief coach avoid?','["Participant-led support","Culturally responsive questions","Rigidly applying a stage model as if everyone must progress the same way","Practical organization"]'::jsonb,'{"index":2}'::jsonb,'Grief is nonlinear and individual; rigid stage assumptions can distort support.','AHRQ/VA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_variation'),
   8,'scenario','A participant says they prefer the word “loss” rather than “grief.” What should the coach do?','["Correct them to clinical terminology.","Use the participant''s preferred language when it is safe and clear.","Tell them grief is the only acceptable term.","End the conversation."]'::jsonb,'{"index":1}'::jsonb,'Participant-preferred language supports respectful, person-centered care.','Person-centered grief support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   1,'multiple_choice','Who can diagnose prolonged grief disorder?','["Any Lellee coach","A qualified clinician using appropriate diagnostic standards","A family member","A support-group facilitator automatically"]'::jsonb,'{"index":1}'::jsonb,'PGD is a mental-health diagnosis and is outside ordinary coaching scope.','APA Prolonged Grief Disorder','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   2,'scenario','An adult participant asks whether they have prolonged grief disorder eight months after a death. What should the coach do?','["Diagnose PGD if symptoms are intense.","Explain that diagnosis is outside coaching scope and offer referral for professional evaluation if functioning is significantly impaired or the participant wants help.","Tell them they cannot receive any support until 12 months.","Use an online checklist and give a definitive answer."]'::jsonb,'{"index":1}'::jsonb,'The coach should not diagnose; referral is appropriate when distress or impairment is significant.','APA/NIA referral boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   3,'multiple_choice','For adults, APA diagnostic criteria for prolonged grief disorder require that the death occurred at least:','["One month earlier","Six months earlier","Twelve months earlier","Five years earlier"]'::jsonb,'{"index":2}'::jsonb,'APA describes a 12-month minimum time since loss for adult PGD diagnosis.','APA Prolonged Grief Disorder','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   4,'scenario','A participant''s grief is persistently interfering with work, self-care, and relationships. What is the strongest coaching response?','["Keep coaching only and avoid referral.","Support referral to a qualified mental-health or grief professional while continuing appropriate nonclinical support.","Tell them to try harder.","Diagnose depression."]'::jsonb,'{"index":1}'::jsonb,'Significant persistent impairment is a reason to seek professional evaluation and treatment.','NIA/APA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   5,'multiple_choice','What did AHRQ''s 2025 systematic review find moderate-strength evidence for?','["Generic coaching curing grief disorders","Psychotherapy improving grief-disorder severity/grief symptoms and expert-facilitated support groups improving grief symptoms","Medication curing all grief","A universal grief-stage program"]'::jsonb,'{"index":1}'::jsonb,'AHRQ found moderate evidence for psychotherapy on several grief outcomes and for expert-facilitated groups on grief symptoms.','AHRQ bereavement review','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   6,'scenario','A participant has intense grief plus major trauma symptoms after a violent death. What should the coach do?','["Treat the trauma within coaching.","Recognize the need for qualified trauma/grief evaluation and support appropriate referral while staying within coaching scope.","Tell them trauma is just grief.","Ask for a detailed trauma narrative as an assessment."]'::jsonb,'{"index":1}'::jsonb,'Grief can coexist with trauma and may require specialized clinical care.','APA/VA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   7,'multiple_choice','Why should Lellee avoid using a brief checklist as a stand-alone PGD diagnosis?','["Because questionnaires are always useless.","Because diagnosis requires qualified clinical evaluation, context, impairment, timing, and cultural/social/religious considerations; screening evidence also has limitations.","Because PGD does not exist.","Because coaches cannot ask any questions about functioning."]'::jsonb,'{"index":1}'::jsonb,'AHRQ and APA emphasize diagnostic complexity and current evidence limitations.','AHRQ/APA','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_risk_referral'),
   8,'scenario','A grieving participant enters a behavioral-health crisis during coaching. What should happen?','["Continue the lesson until the session ends.","Pause ordinary coaching and connect to the appropriate crisis resource such as 988, using emergency services if there is immediate physical danger.","Diagnose the crisis.","Tell them grief is normal and do nothing."]'::jsonb,'{"index":1}'::jsonb,'Crisis response supersedes ordinary coaching.','SAMHSA grief/crisis guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   1,'multiple_choice','Which response is generally most supportive after a loss?','["You should be over this by now.","I''m here with you. What would be most helpful today?","Everything happens for a reason.","At least you still have other family."]'::jsonb,'{"index":1}'::jsonb,'Supportive grief communication validates and invites participant choice rather than minimizing.','VA grief support guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   2,'scenario','A participant repeatedly talks about the person who died and uses their name. What should the coach do?','["Avoid the name so the participant forgets.","Follow the participant''s lead and use the name naturally if that is comfortable for them.","Change the topic every time.","Tell them talking about the deceased prevents healing."]'::jsonb,'{"index":1}'::jsonb,'VA guidance notes that acknowledging the deceased and following the grieving person''s cues can be helpful.','VA grief support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   3,'multiple_choice','What should a coach do before offering advice to a grieving participant?','["Assume advice is always wanted.","Ask what kind of support would be useful and whether the participant wants ideas.","Give a long list immediately.","Wait until the participant makes a mistake."]'::jsonb,'{"index":1}'::jsonb,'Participant-led support is preferable to reflexive fixing.','Supportive communication principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   4,'scenario','A participant says they do not want to talk about the death today and would rather organize bills. What is the best response?','["Force grief discussion because it is the specialty topic.","Respect the choice and help with the practical task while remaining open to grief support later.","Tell them they are avoiding grief and diagnose denial.","End the session."]'::jsonb,'{"index":1}'::jsonb,'Support should follow the participant''s current needs rather than force disclosure.','VA/NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   5,'multiple_choice','Which statement is a minimizing grief cliché?','["What do you need today?","I can sit with you while this is hard.","At least they lived a long life.","Would practical help be useful?"]'::jsonb,'{"index":2}'::jsonb,'Platitudes can minimize the person''s loss even when well intended.','VA grief support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   6,'scenario','A coach feels uncomfortable with silence and starts telling long personal stories about their own losses. What is the concern?','["None; the coach should always share more.","The coach may be shifting focus to their own discomfort rather than the participant''s needs.","Silence is prohibited in grief support.","Personal stories are required for empathy."]'::jsonb,'{"index":1}'::jsonb,'Professional presence means tolerating uncertainty without making the participant care for the helper.','Grief-support communication principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   7,'multiple_choice','Practical grief support can include:','["Organizing urgent paperwork","Making a short task list","Planning meals or transportation","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Practical assistance may be valuable when concentration and decision-making are strained.','NIA/VA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_communication_support'),
   8,'scenario','A participant clearly needs grief therapy but trusts the coach. What should the coach do?','["Keep the participant only in coaching to protect the relationship.","Remain supportive while explaining the boundary and helping the participant connect with qualified treatment.","Pretend coaching is therapy.","End all contact immediately."]'::jsonb,'{"index":1}'::jsonb,'Referral can coexist with supportive coaching when roles remain clear.','AHRQ/APA referral principle','internal_review',true
  );
commit;