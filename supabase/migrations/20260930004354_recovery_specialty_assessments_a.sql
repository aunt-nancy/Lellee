begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_recovery'
   and m.module_key in ('recovery_orientation','sud_harm_reduction_awareness','readiness_recovery_capital')
);
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     1,'multiple_choice','Which statement best reflects SAMHSA''s recovery model?','["Recovery follows one required pathway.","Recovery is a self-directed process that may involve multiple pathways and supports.","Recovery only counts when no medication is used.","Recovery is complete only when every life problem is solved."]'::jsonb,'{"index":1}'::jsonb,'SAMHSA describes recovery as person-driven and occurring through many pathways.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     2,'scenario','A participant says medication and a faith community are both important to recovery. What should the coach do?','["Tell them they must choose one legitimate pathway.","Support the participant in using the combination that fits their goals and safety needs.","Tell them medication means they are not truly in recovery.","Tell them faith should replace treatment."]'::jsonb,'{"index":1}'::jsonb,'Recovery may include medication, faith, treatment, peer support, family, and other pathways.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     3,'multiple_choice','Which are SAMHSA''s four major recovery dimensions?','["Health, Home, Purpose, Community","Diagnosis, Compliance, Abstinence, Employment","Medication, Therapy, Housing, Court","Mind, Body, Money, Rules"]'::jsonb,'{"index":0}'::jsonb,'SAMHSA identifies Health, Home, Purpose, and Community as major dimensions supporting recovery.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     4,'scenario','A coach uses their own recovery story to insist a participant follow the same approach. What is the problem?','["Nothing; lived experience should determine the participant''s plan.","The coach is replacing participant choice with the coach''s pathway.","The coach is being too hopeful.","The coach should instead avoid all lived experience."]'::jsonb,'{"index":1}'::jsonb,'Lived experience can build connection but should not become a universal prescription.','SAMHSA Peer Competencies','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     5,'multiple_choice','Which language is most recovery-oriented?','["Addict who failed treatment","Person with a substance use disorder who is exploring recovery supports","Drug abuser","Noncompliant user"]'::jsonb,'{"index":1}'::jsonb,'Person-first, non-stigmatizing language reduces bias and preserves dignity.','SAMHSA/NIDA stigma guidance','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     6,'multiple_choice','What is the coach''s role in defining recovery?','["Set the definition for the participant.","Help the participant clarify what recovery or wellness means to them within safe and lawful boundaries.","Require abstinence in every case.","Use the coach''s personal definition."]'::jsonb,'{"index":1}'::jsonb,'Recovery is person-driven and individualized.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     7,'scenario','A participant says their main recovery priority is stable housing, not meetings. What should the coach do?','["Refuse because meetings must come first.","Explore the housing goal and how it may connect with health, purpose, and community supports.","Tell them housing is unrelated to recovery.","Choose a different goal for them."]'::jsonb,'{"index":1}'::jsonb,'Recovery is holistic and includes home as a major dimension.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='recovery_orientation'),
     8,'multiple_choice','Completing Lellee Recovery Specialty makes someone:','["A licensed substance use counselor","A certified peer specialist in every state","A person who completed a Lellee course; it does not itself create a professional license or peer certification","A medical addiction specialist"]'::jsonb,'{"index":2}'::jsonb,'Course completion must not be overstated as licensure or external certification.','Lellee certificate scope','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     1,'multiple_choice','Which statement about medications for opioid use disorder is accurate?','["They are not real treatment.","SAMHSA recognizes medications such as methadone, buprenorphine, and naltrexone as evidence-based treatment options.","Coaches should choose which one a participant takes.","They must always be discontinued quickly."]'::jsonb,'{"index":1}'::jsonb,'SAMHSA identifies these medications as evidence-based OUD treatment options.','SAMHSA Treatment Options','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     2,'scenario','A participant asks whether to stop prescribed buprenorphine because a friend says it is not recovery. What should the coach do?','["Tell them to stop it.","Tell them to double the dose.","Avoid medication instructions, affirm that medication-supported treatment is a legitimate pathway, and direct medication decisions to the prescriber.","Agree that medication disqualifies them from recovery."]'::jsonb,'{"index":2}'::jsonb,'Medication decisions belong with qualified medical professionals; medication-supported recovery is legitimate.','SAMHSA Treatment Options','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     3,'multiple_choice','A central harm-reduction principle is:','["Coercion","Respect for autonomy and accessible, noncoercive support","Punishment for continued use","Requiring one recovery philosophy"]'::jsonb,'{"index":1}'::jsonb,'SAMHSA''s harm-reduction framework emphasizes autonomy, safety, engagement, and noncoercive support.','SAMHSA Harm Reduction Framework','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     4,'scenario','A participant is not ready for abstinence but wants to reduce risk and stay connected to help. What is the most appropriate coaching stance?','["End services until they agree to abstinence.","Support participant-defined positive change, safety, appropriate harm-reduction resources, and continued connection to treatment or recovery supports.","Tell them there is no point trying.","Give medical instructions about substance use."]'::jsonb,'{"index":1}'::jsonb,'Harm reduction can support safety and engagement without requiring abstinence as a precondition.','SAMHSA Harm Reduction Framework','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     5,'multiple_choice','Which is outside a recovery coach''s scope?','["Helping organize a treatment appointment","Discussing participant goals","Changing the dose of a prescribed medication","Helping identify support options"]'::jsonb,'{"index":2}'::jsonb,'Medication dosing is a medical decision.','SAMHSA Treatment Options','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     6,'scenario','A participant appears to have an acute medical emergency related to substance use. What should the coach do?','["Continue ordinary coaching.","Use emergency medical response according to policy rather than trying to manage the condition as a coach.","Ask them to wait until tomorrow.","Recommend a medication dose."]'::jsonb,'{"index":1}'::jsonb,'Acute medical emergencies require emergency response.','SAMHSA crisis and overdose guidance','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     7,'multiple_choice','Which phrase is generally less stigmatizing?','["Dirty drug screen","Positive drug test","Junkie","Drug abuser"]'::jsonb,'{"index":1}'::jsonb,'Neutral, person-first language reduces stigma.','NIDA Words Matter','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='sud_harm_reduction_awareness'),
     8,'multiple_choice','Why should coaches understand treatment options if they cannot prescribe or diagnose?','["So they can replace clinicians.","So they can communicate accurately, reduce stigma, support informed referral, and stay within scope.","So they can tell participants which medication to take.","So they can determine who has an SUD."]'::jsonb,'{"index":1}'::jsonb,'Basic treatment literacy improves referral and support without turning coaching into clinical care.','SAMHSA Treatment Options','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     1,'multiple_choice','Recovery capital refers to:','["A financial investment account","Resources and strengths that can support recovery, such as health, housing, relationships, purpose, routines, and access to services","A clinical severity score","The number of meetings attended"]'::jsonb,'{"index":1}'::jsonb,'Recovery capital is a planning lens for strengths and supports across life domains.','Recovery-oriented support principle','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     2,'scenario','A participant has low confidence in attending treatment because transportation is unreliable. What should the coach do?','["Label them unmotivated.","Explore transportation as a practical recovery-capital barrier and help identify realistic options.","Threaten to close the case.","Tell them treatment does not matter."]'::jsonb,'{"index":1}'::jsonb,'Practical barriers can affect readiness and follow-through.','Recovery capital planning','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     3,'multiple_choice','A strengths-based recovery conversation asks:','["What is wrong with you?","What has helped before, what strengths do you have, and what support is already working?","Why do you keep failing?","Who can force you to change?"]'::jsonb,'{"index":1}'::jsonb,'Strengths-based support identifies existing capacities and resources.','SAMHSA Peer Competencies','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     4,'scenario','A participant says a proposed goal feels like a 2 out of 10 in confidence. What is the best response?','["Increase pressure.","Make the step smaller or revisit whether the goal fits the participant.","Keep the plan unchanged.","Tell them confidence is irrelevant."]'::jsonb,'{"index":1}'::jsonb,'Low confidence suggests the plan may be too large or not sufficiently participant-owned.','Person-centered planning','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     5,'multiple_choice','Which item can be part of recovery capital?','["Safe housing","Supportive relationships","Meaningful work or activity","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Recovery support is holistic and can include home, purpose, community, and health resources.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     6,'multiple_choice','Why should recovery capital not be turned into a score that predicts success?','["Because all data are useless.","Because it is intended as a planning lens, while recovery is individualized and non-linear.","Because coaches cannot discuss strengths.","Because housing and work do not matter."]'::jsonb,'{"index":1}'::jsonb,'Recovery is individualized; resources can guide planning without becoming a deterministic score.','SAMHSA About Recovery','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     7,'scenario','A participant wants to reconnect with a supportive relative but fears judgment. What can the coach do?','["Contact the relative without permission.","Help the participant plan what they want to say, what boundaries they want, and whether contact fits their recovery goals.","Tell the relative the participant''s history.","Force family involvement."]'::jsonb,'{"index":1}'::jsonb,'Connection can support recovery, but participant choice and privacy remain central.','SAMHSA recovery/peer principles','internal_review',true
   );
insert into public.professional_assessment_items(
     module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
   ) values (
     (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
      where c.course_key='specialty_recovery' and m.module_key='readiness_recovery_capital'),
     8,'multiple_choice','Readiness is best understood as:','["A permanent personality trait","Something that can shift across goals, situations, confidence, resources, and time","A reason to deny support","A clinical diagnosis made by the coach"]'::jsonb,'{"index":1}'::jsonb,'Motivation and readiness can change and should be explored rather than judged.','Person-centered change principle','internal_review',true
   );
commit;