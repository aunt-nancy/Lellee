begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_grief_life_after_loss'
   and m.module_key in ('grief_routines_identity_meaning','grief_substance_use_crisis')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   1,'multiple_choice','Which goal is usually most appropriate early in grief?','["Return immediately to full productivity","A small, manageable action such as one meal, one bill, or one important call","Make every major life decision at once","Avoid all routines"]'::jsonb,'{"index":1}'::jsonb,'Grief can reduce concentration and energy, so smaller goals may be more realistic.','NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   2,'scenario','A participant feels pressured to sell a home immediately after a major loss but says they cannot think clearly. What is a good coaching response?','["Tell them to sell now","Help distinguish urgent from deferrable decisions and encourage appropriate legal/financial consultation before major commitments","Tell them never to sell","Make the decision for them"]'::jsonb,'{"index":1}'::jsonb,'Major decisions may deserve pacing when grief is significantly affecting thinking and functioning.','NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   3,'multiple_choice','Meaning-making after loss should be:','["Prescribed by the coach","Participant-led and culturally/spiritually respectful","Always religious","Avoided completely"]'::jsonb,'{"index":1}'::jsonb,'Meaning and remembrance practices vary by person, culture, and belief.','SAMHSA/NIA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   4,'scenario','A participant no longer finds comfort in a former spiritual ritual. What should the coach do?','["Insist they continue the ritual","Respect the change and explore what, if anything, feels meaningful or supportive now","Tell them spirituality is required for healthy grief","Replace the ritual with the coach''s own practice"]'::jsonb,'{"index":1}'::jsonb,'Grief support should respect changing beliefs and participant choice.','Culturally responsive grief support','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   5,'multiple_choice','Which is a healthy coaching principle around identity after loss?','["The participant should become exactly who they were before the loss","The participant may need to explore changed roles, values, relationships, and future possibilities","Identity work is only for therapy","The coach should define the participant''s new role"]'::jsonb,'{"index":1}'::jsonb,'Loss can alter roles and identity; coaching can support participant-led adaptation.','NIA/VA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   6,'scenario','A participant wants to create a memorial activity but worries it means they are not moving on. What is an appropriate response?','["Tell them memorials prevent healing","Normalize that remembrance can coexist with continued living if it feels meaningful to them","Ban memorial activities","Tell them to remove all reminders"]'::jsonb,'{"index":1}'::jsonb,'Continuing bonds and remembrance can be meaningful for some people without preventing adaptation.','Grief-support principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   7,'multiple_choice','Why can routines be helpful during grief?','["They eliminate grief","They can provide structure when sleep, concentration, appetite, or motivation are disrupted","They force people to recover faster","They replace social support"]'::jsonb,'{"index":1}'::jsonb,'Basic routines can support functioning while grief fluctuates.','NIA/CDC grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_routines_identity_meaning'),
   8,'scenario','A participant has a low-capacity day and cannot complete a larger goal. What should the coach do?','["Label it failure","Adjust expectations, preserve essential tasks, and choose a smaller step","Increase pressure","Cancel all future goals"]'::jsonb,'{"index":1}'::jsonb,'Flexible goals are more appropriate than rigid productivity demands during grief.','Participant-centered grief coaching','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   1,'multiple_choice','Why is increased substance use during grief important to notice?','["Because it always proves addiction","Because it may signal added health, coping, or safety risk and may require additional support","Because all substance use must be punished","Because grief never affects substance use"]'::jsonb,'{"index":1}'::jsonb,'Grief can interact with substance use and other health risks.','NIA/SAMHSA grief guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   2,'scenario','A participant says they are drinking more most evenings to sleep after a loss. What is an appropriate coaching response?','["Give a diagnosis","Explore impact and safety, discuss healthier support options, and offer referral to substance-use or medical support if needed","Recommend a medication","Tell them drinking is the only problem"]'::jsonb,'{"index":1}'::jsonb,'Coaches can identify risk and support referral without diagnosing or prescribing.','SAMHSA/NIA boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   3,'multiple_choice','Which situation should trigger a shift from ordinary grief coaching to crisis support?','["The participant is sad on an anniversary","The participant is in acute behavioral-health crisis","The participant wants to discuss a memory","The participant wants to reduce social obligations"]'::jsonb,'{"index":1}'::jsonb,'Acute crisis requires crisis routing rather than ordinary coaching.','SAMHSA crisis guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   4,'scenario','A participant appears to be in immediate physical danger. What should the coach do?','["Continue the grief exercise","Use emergency services according to policy","Ask them to journal first","Schedule a session next week"]'::jsonb,'{"index":1}'::jsonb,'Immediate physical danger requires emergency response.','SAMHSA emergency boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   5,'multiple_choice','Which is a reasonable low-pressure reconnection step?','["Contact one trusted person or support resource chosen by the participant","Force attendance at a large group","Tell every family member about the participant''s grief","Avoid all human contact"]'::jsonb,'{"index":0}'::jsonb,'Small, participant-chosen connection can reduce isolation without coercion.','CDC/SAMHSA support principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   6,'scenario','A participant''s substance use is escalating and they want help finding treatment. What should the coach do?','["Provide treatment directly","Help connect them with qualified substance-use treatment resources such as FindTreatment.gov or SAMHSA helpline resources","Tell them grief treatment alone will solve it","Tell them to wait until grief is over"]'::jsonb,'{"index":1}'::jsonb,'Substance-use treatment should be provided by appropriate qualified services.','SAMHSA treatment referral','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   7,'multiple_choice','A coach should diagnose whether grief or substance use is the primary disorder.','["True","False"]'::jsonb,'{"index":1}'::jsonb,'Diagnostic formulation belongs to qualified clinicians, not ordinary coaching.','Clinical boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_grief_life_after_loss' and m.module_key='grief_substance_use_crisis'),
   8,'scenario','A participant is isolated but not in crisis and wants to reconnect slowly. What is a good coaching plan?','["Require daily group attendance","Choose one trusted contact, one structured activity, one support resource, and a backup plan if distress worsens","Tell them to stay alone until grief passes","Call family without permission"]'::jsonb,'{"index":1}'::jsonb,'Gradual, participant-led reconnection is more appropriate than coercive social exposure.','Grief-support planning','internal_review',true
  );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_grief_life_after_loss';
commit;