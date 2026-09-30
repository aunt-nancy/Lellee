begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_recovery'
   and m.module_key in ('recurrence_coping_support','family_peer_community')
);
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     1,'scenario','A participant reports a return to substance use after several months of progress. What should the coach do first?','["Shame them so they take it seriously.","Check for immediate safety concerns, maintain connection, and ask what support they want next.","Tell them all previous progress is lost.","End coaching automatically."]'::jsonb,'{"index":1}'::jsonb,'Safety and connection come before punishment or judgment.','Recovery-oriented support','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     2,'multiple_choice','Which term is generally less stigmatizing than relapse when the participant has not chosen another term?','["Failure","Return to use","Backsliding addict","Noncompliance"]'::jsonb,'{"index":1}'::jsonb,'Neutral language can reduce shame and stigma.','NIDA Words Matter','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     3,'scenario','A participant reports increased use but no immediate emergency. Which response best fits recovery coaching?','["Conduct a clinical diagnosis.","Explore warning signs, supports, current risks, and a realistic next action while encouraging appropriate treatment or peer support.","Prescribe medication.","Demand a written confession."]'::jsonb,'{"index":1}'::jsonb,'Coaching can support planning and connection without performing clinical assessment or treatment.','Recovery coaching boundary','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     4,'multiple_choice','A participant-led coping plan may include:','["Early warning signs and support contacts","Transportation and treatment connection","Chosen strategies for reducing isolation","All of the above"]'::jsonb,'{"index":3}'::jsonb,'A practical plan can include warning signs, supports, logistics, and participant-chosen protective actions.','Recovery planning','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     5,'scenario','A participant says shame is making them avoid treatment after a return to use. What is the best coaching response?','["Tell them shame will motivate them.","Use nonjudgmental language, recognize prior progress, and help identify a manageable reconnection step.","Tell them treatment failed.","Tell them to hide the return to use."]'::jsonb,'{"index":1}'::jsonb,'Shame can reduce help-seeking; respectful reconnection supports recovery.','SAMHSA stigma/recovery principles','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     6,'multiple_choice','Which statement about recurrence planning is most accurate?','["A plan guarantees no future substance use.","A plan can improve awareness, support, and response options but cannot guarantee outcomes.","The coach should decide all triggers.","Only clinical providers may discuss practical support plans."]'::jsonb,'{"index":1}'::jsonb,'Plans support preparedness without guaranteeing outcomes.','Recovery planning principle','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     7,'scenario','A participant wants to avoid a high-risk social setting for the next week. What can the coach do?','["Tell them they must avoid it forever.","Help them make a participant-chosen plan for alternative activities, support, transportation, and follow-up.","Contact everyone at the setting without consent.","Tell them the choice is meaningless."]'::jsonb,'{"index":1}'::jsonb,'The coach can support participant-chosen environmental and social planning.','Recovery-oriented coaching','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recurrence_coping_support'),
     8,'multiple_choice','What is inappropriate after a return to use?','["Reviewing what happened without judgment","Reconnecting supports","Treating the event as information for planning","Using essential safety support as punishment for the participant''s behavior"]'::jsonb,'{"index":3}'::jsonb,'Safety support should never be withheld as punishment.','Ethical recovery support','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     1,'multiple_choice','Which statement about recovery support groups is most accurate?','["One fellowship is appropriate for everyone.","Different groups have different philosophies and formats; participants should choose what fits.","Medication-supported participants should be excluded.","Online groups are never useful."]'::jsonb,'{"index":1}'::jsonb,'SAMHSA recognizes multiple community and peer-support options.','SAMHSA support resources','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     2,'scenario','A participant wants family involved in recovery but only wants the coach to share appointment reminders, not substance-use details. What should the coach do?','["Share everything because family support is helpful.","Respect the specific consent boundary and share only what was authorized.","Refuse all family involvement.","Ask the family to decide what they need to know."]'::jsonb,'{"index":1}'::jsonb,'Family involvement should be consent-based and purpose-limited.','Privacy and family-support principle','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     3,'multiple_choice','Completing Lellee Recovery Specialty automatically makes someone a certified peer specialist.','["True","False"]'::jsonb,'{"index":1}'::jsonb,'Formal peer certifications have separate requirements; Lellee course completion does not create external certification.','SAMHSA peer competencies','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     4,'scenario','A participant dislikes 12-step groups and wants secular alternatives. What should the coach do?','["Insist on 12-step participation.","Provide accurate information about available alternatives and let the participant choose.","Tell them support groups are required.","Choose a group for them without discussion."]'::jsonb,'{"index":1}'::jsonb,'Recovery support should respect multiple pathways and participant choice.','SAMHSA recovery/support principles','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     5,'multiple_choice','Which can contribute to community and purpose in recovery?','["Employment or education","Volunteering","Cultural or faith community","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Recovery is holistic and can include meaningful activity, relationships, and community.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     6,'scenario','A participant''s family says they will only support recovery if the participant stops prescribed medication. What should the coach do?','["Agree with the family.","Support participant autonomy, avoid medication advice, reinforce that treatment decisions belong with qualified clinicians, and help clarify family boundaries.","Tell the participant to stop medication temporarily.","Tell the family the participant''s confidential treatment details."]'::jsonb,'{"index":1}'::jsonb,'Medication decisions belong with clinicians; family support should not override participant autonomy or privacy.','SAMHSA treatment/recovery principles','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     7,'multiple_choice','A recovery coach acting as a connector should:','["Guarantee a referral will accept the participant.","Help identify appropriate treatment, peer, family, and community resources while being accurate about limits and availability.","Make eligibility decisions for every program.","Enroll participants in services without consent."]'::jsonb,'{"index":1}'::jsonb,'Coaches can link to resources without promising availability or eligibility.','SAMHSA peer competencies','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='family_peer_community'),
     8,'scenario','A participant wants to reconnect with a faith community but has also had harmful experiences there. What is the strongest coaching response?','["Tell them faith is always good for recovery.","Explore what safety, boundaries, and choice would make spiritual or community support useful, if they still want it.","Tell them to avoid all spirituality.","Contact the faith leader without permission."]'::jsonb,'{"index":1}'::jsonb,'Recovery support should be culturally responsive, voluntary, and participant-directed.','SAMHSA recovery principles','internal_review',true
   );
update public.professional_courses
set assessment_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_recovery';
commit;