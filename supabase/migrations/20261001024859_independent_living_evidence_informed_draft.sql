begin;

update public.professional_course_modules
set title='Defining Personal Priorities',
    summary='Choose practical areas where the participant wants more control, support, or access.',
    learning_objectives='["Use a person-centered process to identify priorities based on the participant’s own preferences, strengths, needs, and desired outcomes.","Translate broad priorities into realistic next actions without taking over the participant’s decisions.","Recognize when legal, clinical, benefits, or safety questions require referral to a qualified resource."]'::jsonb,
    practice_requirements='["Build a short priority map that separates what matters now, what can wait, and what support or access barrier may affect the next step.","Write one participant-defined goal with a next action, a follow-up point, and a backup plan."]'::jsonb,
    source_refs='[{"title":"Self-Directed Services","url":"https://www.medicaid.gov/medicaid/long-term-services-supports/self-directed-services","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"CMS describes person-centered planning as directed by the individual and focused on strengths, preferences, needs, measurable outcomes, and chosen supports."},{"title":"Person-Centered Planning Grants","url":"https://www.medicaid.gov/medicaid/long-term-services-supports/real-choice-systems-change/person-centered-planning-grants","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"CMS describes person-centered planning as shifting planning toward the individual''s strengths, capacities, preferences, needs, and desired quality-of-life outcomes."},{"title":"Person-Centered Goal Setting: A Systematic Review of Intervention Components and Level of Active Engagement in Rehabilitation Goal-Setting Interventions","url":"https://pubmed.ncbi.nlm.nih.gov/34375632/","source_type":"systematic_review","published_or_reviewed_year":2022,"current_or_recent":true,"claim_supported":"The review found active engagement is commonly encouraged in person-centered goal setting, while important components such as coping plans and follow-up are often missing."},{"title":"Goal setting for adults receiving clinical rehabilitation for disability","url":"https://www.cochrane.org/evidence/CD009727_goal-setting-adults-receiving-clinical-rehabilitation-disability","source_type":"systematic_review","published_or_reviewed_year":2015,"current_or_recent":false,"claim_supported":"The Cochrane review found low or very-low certainty evidence for several goal-setting outcomes and no consistent evidence for broad functional improvement."}]'::jsonb,
    content_md='# Defining Personal Priorities

Independent living starts with **voice, choice, and control**, not with a professional deciding what a person should want. A participant may want more control over transportation, money, routines, housing, communication, community participation, health appointments, education, work, or the way support is organized. The first task is to understand what matters to the participant now.

CMS person-centered planning guidance emphasizes that planning should identify the individual’s strengths, capacities, preferences, needs, and desired outcomes, and that the individual directs the process with help from people they choose. That means a coach or support professional can help organize information, compare options, and break a goal into steps, but should not substitute personal or organizational priorities for the participant’s own priorities.

A useful starting structure is:
1. **What matters most right now?** Ask the participant to name one or two areas that would make daily life easier, safer, more meaningful, or more self-directed.
2. **What is already working?** Identify strengths, routines, people, tools, transportation, technology, or services that can be built on.
3. **What is getting in the way?** Separate barriers the participant can work on directly from barriers that require accommodations, services, professional advice, or systems advocacy.
4. **What is one next action?** Make the action small enough to begin and specific enough to recognize when it is done.
5. **What support is wanted?** Ask what help the participant wants and what help they do not want.
6. **What is the backup plan?** If transportation fails, a support worker cancels, an office does not respond, or a task becomes too difficult, identify the next safe option.
7. **When will the plan be reviewed?** A goal should be revisited, not treated as a permanent instruction.

Person-centered goal-setting research supports active engagement, but it also shows that important components such as coping plans and follow-up are often missing. Older Cochrane evidence found uncertainty about whether goal setting reliably improves broad functional outcomes. For Lellee, this means goals are used to organize participant-defined action—not as a promise that a person will become more independent or reach a specific outcome.

When several priorities compete, avoid pushing the participant to solve everything at once. A good professional response is to help sort items into **now, soon, and later**, identify any urgent safety issue, and then let the participant choose where to begin. A person can also change priorities. Changing direction is not failure.

Documentation should remain objective. Record the participant’s stated priority, the agreed next action, requested support, identified barriers, and review date. Avoid labels such as “unmotivated,” “noncompliant,” or “not independent.” Those labels replace observable information with judgment.

## Scope boundaries

A coach may help clarify questions, prepare for appointments, organize documents, rehearse what the participant wants to say, and locate resources. A coach should not decide legal eligibility, diagnose a condition, determine medical necessity, prescribe treatment, or decide whether a participant has legal decision-making capacity. Those questions require the appropriate licensed, legal, benefits, or public-agency resource.

The goal is not to make the participant do everything alone. The goal is to help the participant make informed choices, use supports intentionally, and keep control over the direction of the plan.',
    review_status='internal_review',
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now()
where id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1);

delete from public.professional_assessment_items where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),1,'scenario','A participant says her support team wants her to focus on employment, but she says unreliable transportation is the issue she most wants to solve first.','["Tell her employment must come first because it is more important","Ask what she wants to prioritize and explore transportation as the first planning target","Create an employment goal without discussing transportation","Ask the support team to decide the priority"]'::jsonb,'{"index":1}'::jsonb,'Person-centered planning begins with the participant’s own preferences and priorities unless an immediate safety issue requires a different response.','CMS Self-Directed Services; CMS Person-Centered Planning','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),2,'multiple_choice','Which feature best matches a person-centered planning process?','["The professional chooses the most efficient goal","The participant directs the process and chooses who is involved","Every participant uses the same goal template","Goals are based mainly on program requirements"]'::jsonb,'{"index":1}'::jsonb,'CMS describes person-centered planning as directed by the individual, with chosen supporters involved as wanted.','CMS Self-Directed Services','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),3,'scenario','A participant identifies six important goals and says he feels overwhelmed by trying to address all of them at once.','["Tell him he must complete all six in order","Choose the goal you think is easiest","Help him sort the goals into now, soon, and later and choose one or two next actions","Close the plan until he can prioritize alone"]'::jsonb,'{"index":2}'::jsonb,'Breaking priorities into manageable, participant-chosen next actions preserves autonomy and reduces unnecessary overload.','Person-Centered Goal Setting systematic review; CMS planning guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),4,'multiple_choice','What is the strongest evidence-based statement about goal setting in adult rehabilitation?','["Goal setting guarantees functional improvement","Structured goal setting has some supportive evidence, but broad outcomes remain uncertain","Goal setting has no useful role in practice","Goal setting replaces the need for follow-up"]'::jsonb,'{"index":1}'::jsonb,'Systematic reviews report some positive psychosocial findings but low-certainty or inconsistent evidence for many broader outcomes.','Cochrane goal-setting review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),5,'scenario','A participant wants to know whether a disability benefits program will legally consider her eligible.','["Tell her whether she qualifies based on your reading","Guess based on similar participants","Help her identify the question and refer her to the appropriate benefits/legal resource","Tell her benefits questions cannot be discussed at all"]'::jsonb,'{"index":2}'::jsonb,'A coach can help organize and refer but should not make individualized legal or eligibility determinations.','Scope boundary standard; CMS person-centered planning','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),6,'multiple_choice','Why should a priority plan include a backup or contingency option?','["To make the plan longer","To prepare for predictable disruptions such as unavailable support or transportation","To allow the professional to override participant choices","To prove the participant is independent"]'::jsonb,'{"index":1}'::jsonb,'CMS self-direction guidance includes contingency planning for disruptions in needed support.','CMS Self-Directed Services','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),7,'scenario','During a review, a participant says a goal that mattered last month is no longer important.','["Keep the original goal because changing it shows poor follow-through","Ask the participant what has changed and revise the plan if they want","Discharge the participant from the program","Have a family member choose a replacement goal"]'::jsonb,'{"index":1}'::jsonb,'Person-centered planning is responsive to current preferences and desired outcomes; priorities can change.','CMS Person-Centered Planning; person-centered goal-setting review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1),8,'multiple_choice','Which documentation example is most objective?','["Participant is unmotivated about transportation","Participant refused to be independent","Participant stated transportation is the current priority and chose to call the transit office before Friday","Participant has poor judgment about priorities"]'::jsonb,'{"index":2}'::jsonb,'Objective documentation records what the participant said and the agreed action without replacing it with judgmental labels.','Person-centered practice and documentation principles','internal_review',true
);

update public.professional_training_evidence_requirements
set status='internal_review',
    mixed_evidence_note='Person-centered goal setting is widely used and promotes active participation, but evidence for broad functional outcomes is inconsistent and often low certainty. The course should therefore teach structured, participant-led planning as a useful practice framework rather than promise that goal setting itself will produce independence or functional gains.',
    claim_strength_note='Claims are limited to person-centered planning principles, participant engagement, structured follow-up, and contingency planning. The module does not claim that goal setting is a treatment or that it guarantees functional improvement, quality-of-life improvement, service eligibility, or independence.',
    source_audit='{"source_count":4,"unique_urls":4,"authoritative_or_systematic":4,"current_or_recent":3,"scenario_items":4,"build_method":"direct_chatgpt_authoritative_web_research_due_external_api_credit_block"}'::jsonb || jsonb_build_object('validated_at',now()),
    reviewer_note='Draft built directly in ChatGPT from current authoritative public sources after the external Evidence Builder worker was blocked by exhausted OpenAI API credits. Human source/curriculum/assessment review is still required.',
    updated_at=now()
where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='personal_priorities' limit 1);

update public.professional_course_modules
set title='Building Daily Systems',
    summary='Break routines and responsibilities into manageable systems and backup options.',
    learning_objectives='["Break daily activities into manageable steps while accounting for accessibility, energy, environment, technology, and support needs.","Use reminders, assistive technology, environmental changes, and backup plans as supports rather than measures of personal worth.","Recognize when difficulty with daily activities warrants occupational therapy, medical, behavioral-health, or other specialized referral."]'::jsonb,
    practice_requirements='["Choose one recurring daily task and map its cue, steps, supports, likely barriers, and backup option.","Compare two system changes—such as a reminder, environmental modification, or assistive technology option—and identify which the participant prefers to test."]'::jsonb,
    source_refs='[{"title":"Centers for Independent Living","url":"https://acl.gov/programs/aging-and-disability-networks/centers-independent-living","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"ACL identifies independent living skills training, information and referral, peer support, advocacy, assistive technology, transportation, and related supports as core or common independent living services."},{"title":"Disability Inclusion Strategies","url":"https://www.cdc.gov/disability-inclusion/strategies/index.html","source_type":"government_guidance","published_or_reviewed_year":2025,"current_or_recent":true,"claim_supported":"CDC describes independent living as voice, choice, and control and notes that assistive technology can support daily tasks and communication."},{"title":"Self-Management Interventions to Improve Activities of Daily Living and Rest and Sleep for Adults With Chronic Conditions: A Systematic Review","url":"https://pubmed.ncbi.nlm.nih.gov/34780611/","source_type":"systematic_review","published_or_reviewed_year":2021,"current_or_recent":true,"claim_supported":"The review evaluated self-management interventions intended to improve activities of daily living and rest/sleep among community-dwelling adults with chronic conditions."},{"title":"Self-Directed Services","url":"https://www.medicaid.gov/medicaid/long-term-services-supports/self-directed-services","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"CMS person-centered self-direction guidance includes individualized supports, risk discussion, and contingency or backup planning when needed services are disrupted."}]'::jsonb,
    content_md='# Building Daily Systems

A daily system is a repeatable way to make an important activity easier to start, remember, complete, or recover when something changes. Independent living does **not** mean completing every task without help. CDC describes independent living in terms of voice, choice, and control, and ACL’s independent living network includes skills training, peer support, advocacy, assistive technology, transportation, and other supports.

Start with one real activity instead of trying to “fix the whole routine.” Examples include getting ready for work, taking documents to an appointment, preparing a meal, paying a bill, doing laundry, remembering transportation, managing a calendar, or asking for assistance.

A practical system can be built with six questions:

1. **What is the task?** Define the activity in observable terms.
2. **What starts it?** Identify a cue such as a time, alarm, location, visual prompt, calendar event, or another activity.
3. **What are the smallest useful steps?** Break the activity into parts. The right level of detail depends on the participant.
4. **What makes the task easier or harder?** Consider mobility, fatigue, pain, attention, memory, communication, sensory needs, transportation, cost, environment, technology, and available support.
5. **What support does the participant want?** Options can include reminders, checklists, labeled storage, calendar tools, assistive technology, transportation planning, peer help, personal assistance, or a different time or location.
6. **What happens if the normal plan fails?** Build a backup for a missed bus, unavailable helper, dead phone battery, inaccessible location, delayed benefit, or low-energy day.

Research on self-management interventions for adults with chronic conditions suggests that some programs can improve daily-living outcomes, but the evidence is heterogeneous. That matters because a professional should not present a routine technique as guaranteed to work. Instead, use a **test–review–adjust** approach: try one small change, observe what happens, ask the participant whether it helps, and adapt.

Assistive technology can be low-tech or high-tech. A visual checklist, pill organizer, adapted utensil, reacher, smartphone reminder, communication device, mobility aid, or other tool may support participation. The professional’s role is not to prescribe specialized equipment outside their competence. When a participant needs individualized assessment of function, positioning, mobility, cognition, swallowing, sensory needs, or specialized equipment, refer to the appropriate licensed or qualified professional.

Avoid turning routine difficulties into character judgments. Missing a step can mean the cue was weak, the task was too complex, the environment was inaccessible, the support arrived late, the participant was fatigued, or the plan simply did not fit. Ask what happened before concluding that the participant “failed.”

Documentation should capture the system being tested, participant preference, support requested, barriers observed, and what will be reviewed next. A good note might say: “Participant chose a phone reminder and written checklist for morning transportation preparation; will test for one week and review whether the reminders are useful.” That is more useful than “participant needs better organization.”

## Scope boundaries

Daily-system coaching can include planning, reminders, resource navigation, problem solving, and participant-chosen supports. It does not replace occupational therapy, physical therapy, medical evaluation, cognitive assessment, or emergency planning by qualified professionals when those services are indicated.

A sustainable system is not the most complicated system. It is the system the participant understands, chooses, can access, and can adjust when real life changes.',
    review_status='internal_review',
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now()
where id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1);

delete from public.professional_assessment_items where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),1,'multiple_choice','What is the best definition of a daily system in this course?','["A rule that must be followed every day","A repeatable way to make an important activity easier to start, complete, or recover when disrupted","A test of whether a person can live without help","A clinical treatment plan"]'::jsonb,'{"index":1}'::jsonb,'The module defines a daily system as a repeatable support for a chosen activity, not as a test of independence or a treatment plan.','ACL independent living guidance; CDC inclusion strategies','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),2,'scenario','A participant repeatedly misses a morning transportation pickup because preparation has many steps.','["Label the participant unmotivated","Break the routine into smaller steps and test a preferred cue or checklist","Tell the driver to wait indefinitely","Take over the entire routine permanently"]'::jsonb,'{"index":1}'::jsonb,'Task analysis and participant-chosen prompts are practical first steps before assuming lack of motivation.','Self-management review; independent living skills guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),3,'multiple_choice','Which statement about assistive technology is most accurate?','["Using assistive technology means a person is less independent","Assistive technology can support daily activities and communication while the participant remains in control","Only expensive electronic devices count as assistive technology","A coach should prescribe any device requested"]'::jsonb,'{"index":1}'::jsonb,'CDC describes both low- and high-tech assistive technology as supports for participation; use of supports is compatible with independence.','CDC Disability Inclusion Strategies','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),4,'scenario','A participant''s usual helper cancels and the participant cannot complete an essential task safely alone.','["Insist the participant complete it alone to build independence","Use the agreed backup plan or help identify an appropriate alternative support","Ignore the problem because helpers are optional","Tell the participant they failed the routine"]'::jsonb,'{"index":1}'::jsonb,'CMS self-direction guidance emphasizes contingency planning when needed services are disrupted.','CMS Self-Directed Services','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),5,'multiple_choice','What does current evidence justify saying about self-management approaches for daily activities?','["They work the same way for everyone","They can help some outcomes, but effects vary and should not be guaranteed","They eliminate the need for professional rehabilitation","They prove a person can live without support"]'::jsonb,'{"index":1}'::jsonb,'Systematic reviews show heterogeneous interventions and outcomes, so claims should remain limited.','Smallfield et al. systematic review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),6,'scenario','A participant has new difficulty swallowing and asks the coach to design a home exercise and eating program.','["Design the program because it is part of daily living","Recommend a specific diet texture","Refer for appropriate clinical evaluation and help the participant organize questions or access","Tell the participant to search social media"]'::jsonb,'{"index":2}'::jsonb,'New swallowing difficulty is a clinical issue outside ordinary coaching scope.','Professional scope boundary','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),7,'multiple_choice','Which approach best follows a test–review–adjust cycle?','["Change five parts of the routine at once","Choose one change, observe whether it helps, ask the participant, and adjust","Keep a system forever once written","Use the same routine for every participant"]'::jsonb,'{"index":1}'::jsonb,'Small, observable changes make it easier to learn whether a chosen support fits the participant.','Self-management and person-centered planning principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1),8,'scenario','A participant misses two tasks during a week because of fatigue.','["Document that the participant is noncompliant","Ask what made the tasks harder and consider timing, energy, supports, or task design","Remove the participant''s decision-making role","Increase the number of tasks"]'::jsonb,'{"index":1}'::jsonb,'Routine difficulty should prompt problem solving around person, task, environment, and supports rather than judgment.','CDC inclusion; self-management evidence','internal_review',true
);

update public.professional_training_evidence_requirements
set status='internal_review',
    mixed_evidence_note='Self-management and routine-support interventions can help some people with daily activities, but effects differ across conditions, interventions, settings, and outcomes. A checklist, reminder, assistive technology, or routine should therefore be treated as a testable support—not as a universally effective intervention or proof of independence.',
    claim_strength_note='The module teaches practical task analysis, environmental supports, reminders, assistive technology awareness, and contingency planning. It does not claim that routines cure disability-related limitations or replace occupational therapy, clinical care, or individualized accessibility assessment.',
    source_audit='{"source_count":4,"unique_urls":4,"authoritative_or_systematic":4,"current_or_recent":4,"scenario_items":4,"build_method":"direct_chatgpt_authoritative_web_research_due_external_api_credit_block"}'::jsonb || jsonb_build_object('validated_at',now()),
    reviewer_note='Draft built directly in ChatGPT from current authoritative public sources after the external Evidence Builder worker was blocked by exhausted OpenAI API credits. Human source/curriculum/assessment review is still required.',
    updated_at=now()
where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='daily_systems' limit 1);

update public.professional_course_modules
set title='Practicing Self-Advocacy',
    summary='Practice asking for information, access, accommodations, or support while staying in control of decisions.',
    learning_objectives='["Help participants prepare clear requests, questions, and follow-up steps while preserving their ownership of decisions.","Use accessible communication and documentation practices without assuming one communication method fits everyone.","Distinguish general rights education and self-advocacy support from individualized legal advice or legal conclusions."]'::jsonb,
    practice_requirements='["Draft a short request using the pattern: what I need, why it helps me access the service or activity, and what response or next step I am asking for.","Role-play a follow-up conversation in which the participant asks a clarifying question, records the response, and decides whether to escalate or seek qualified advice."]'::jsonb,
    source_refs='[{"title":"Centers for Independent Living","url":"https://acl.gov/programs/aging-and-disability-networks/centers-independent-living","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"ACL identifies individual and systems advocacy, peer counseling, independent living skills, and information/referral as core independent living services."},{"title":"Communicating Effectively with People with Disabilities","url":"https://www.ada.gov/topics/effective-communication/","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"ADA guidance explains that effective communication must fit the circumstances and communication needs of the person."},{"title":"State and Local Governments","url":"https://www.ada.gov/topics/title-ii/","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"ADA Title II guidance explains reasonable-modification duties for state and local government programs while recognizing limits such as fundamental alteration."},{"title":"Experiences and perceptions of everyday decision-making in the lives of adults with intellectual disabilities, their care partners and direct care support workers","url":"https://pubmed.ncbi.nlm.nih.gov/37436408/","source_type":"systematic_review","published_or_reviewed_year":2023,"current_or_recent":true,"claim_supported":"The systematic review found that adults with intellectual disabilities want to make everyday decisions and often need support; supported decision-making is important but implementation remains under-researched."}]'::jsonb,
    content_md='# Practicing Self-Advocacy

Self-advocacy means helping a person speak, write, communicate, or otherwise express what they want, what they need to understand, what support they prefer, and what they want to happen next. ACL lists individual advocacy as a core independent living service. Self-advocacy is compatible with receiving help: a participant may prepare independently, use peer support, bring a trusted person, use an interpreter or communication aid, or ask someone to help organize information.

A practical self-advocacy sequence is:

1. **Define the purpose.** What is the participant trying to access, understand, change, or clarify?
2. **Gather the minimum useful facts.** Dates, names, notices, policies, documents, prior requests, and the participant’s preferred communication method may be relevant.
3. **State the request clearly.** Use plain language and focus on what would improve access or participation.
4. **Ask for a response or next step.** Examples: “Who makes this decision?” “What information do you need from me?” “Can you provide that in writing?” or “What is the appeal or complaint process?”
5. **Document the response.** Record what was said or sent, by whom, and when.
6. **Decide what comes next.** The participant may accept the response, ask for clarification, revise the request, seek a supervisor, use a formal process, or consult a qualified legal or advocacy resource.

Effective communication is not one-size-fits-all. ADA guidance explains that the appropriate communication aid or service depends on the nature, length, complexity, and context of the communication and on the person’s usual communication method. In coaching, that translates into asking what format works: spoken explanation, written summary, larger print, captions, sign-language interpretation through the responsible entity, extra processing time, a communication device, or another accessible method.

The ADA also includes legal requirements around reasonable modifications and effective communication in covered settings. A professional can provide general rights education, help a participant prepare questions, and identify official resources. The professional should **not** decide that a particular organization legally violated the ADA, guarantee that a requested modification must be granted, or act as the participant’s attorney unless separately qualified and authorized.

Supported decision-making is another important concept. A systematic review of everyday decision-making among adults with intellectual disabilities found that people want to make decisions and may need support to do so. Support can include explaining options, slowing down the process, checking understanding, gathering information, or involving a chosen supporter. Support should help the person make the decision—not transfer the decision to the supporter.

When family members, staff, or providers disagree with a participant, avoid automatically siding with the most powerful person in the room. Clarify the participant’s preference, identify any immediate safety issue, separate facts from opinions, and determine whether additional professional, legal, clinical, or safeguarding input is needed.

## Documentation and boundaries

Useful documentation includes the participant’s request, preferred communication method, information reviewed, response received, and next step chosen. Avoid writing that a participant “cannot advocate” merely because they use communication support.

A coach can rehearse a conversation, help draft a question, help organize records, locate official complaint or advocacy channels, and support follow-up. A coach does not determine legal rights, represent the participant in court, diagnose cognitive capacity, or guarantee the result of an accommodation or complaint process.

The purpose of self-advocacy practice is not to make every interaction confrontational. It is to help the participant stay informed, communicate clearly, preserve choice, and know when to ask for additional qualified help.',
    review_status='internal_review',
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now()
where id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1);

delete from public.professional_assessment_items where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),1,'multiple_choice','What is the central purpose of self-advocacy practice in this module?','["To win every disagreement","To help the participant communicate preferences, questions, needs, and next steps while retaining decision ownership","To replace legal counsel","To make supporters decide faster"]'::jsonb,'{"index":1}'::jsonb,'Self-advocacy centers the participant’s voice and control rather than guaranteeing a particular outcome.','ACL independent living guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),2,'scenario','A participant wants to request information in writing because spoken instructions are difficult to retain.','["Tell the participant everyone must use the same communication format","Help the participant make a clear request and ask the organization about accessible communication options","Decide that the organization has already violated the ADA","Tell a family member to speak instead"]'::jsonb,'{"index":1}'::jsonb,'Effective communication should fit the circumstances and the person’s communication needs.','ADA Effective Communication guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),3,'multiple_choice','Which action is outside ordinary coaching scope?','["Helping draft a list of questions","Helping locate the official ADA resource","Declaring that a business legally discriminated against the participant","Practicing how to ask for clarification"]'::jsonb,'{"index":2}'::jsonb,'A coach may support self-advocacy and general information but should not make individualized legal conclusions.','ADA guidance; scope boundary','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),4,'scenario','A support worker answers every question for an adult participant even though the participant is trying to respond.','["Continue talking only to the support worker","Address the participant directly and ask what communication support they prefer","Assume the participant lacks decision-making capacity","End the meeting"]'::jsonb,'{"index":1}'::jsonb,'Supported decision-making should assist the person’s decisions rather than substitute another person''s decisions.','Everyday decision-making systematic review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),5,'multiple_choice','Which is a useful follow-up question after making a request?','["Why are you making this difficult?","Who makes this decision and what is the next step?","Will you guarantee approval?","Can I ignore the written policy?"]'::jsonb,'{"index":1}'::jsonb,'Clarifying decision authority and next steps helps the participant understand and document the process.','Self-advocacy practice; ADA communication guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),6,'scenario','A participant receives a denial letter and asks whether the denial is legally valid.','["State that the denial is unlawful","State that the denial is lawful","Help identify the stated reason, the available review process, and an appropriate qualified legal/advocacy resource","Tell the participant there is nothing else to do"]'::jsonb,'{"index":2}'::jsonb,'The coach can organize information and referral but should not make a legal determination.','Scope boundary; ADA official resources','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),7,'multiple_choice','What does effective communication generally require?','["The same format for everyone","A solution appropriate to the communication context and the person’s needs","Only written communication","Only communication through a family member"]'::jsonb,'{"index":1}'::jsonb,'ADA guidance emphasizes context and the individual''s communication needs.','ADA Effective Communication guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1),8,'scenario','A participant wants a sibling present to help understand options but still wants to make the final choice.','["Exclude the sibling because support defeats independence","Allow the participant to choose support while keeping the decision with the participant","Let the sibling make the decision","Require a legal guardian before discussing options"]'::jsonb,'{"index":1}'::jsonb,'Person-selected support can assist understanding while preserving participant control.','Supported decision-making review; CMS person-centered principles','internal_review',true
);

update public.professional_training_evidence_requirements
set status='internal_review',
    mixed_evidence_note='Self-advocacy and supported decision-making are strongly aligned with autonomy and independent-living practice, but the research base varies by population and context. Legal rights also depend on the entity, setting, jurisdiction, facts, and applicable law, so coaching should support communication and referral rather than promise a specific accommodation or legal outcome.',
    claim_strength_note='The module teaches communication preparation, documentation, questions, requesting access, and referral. It does not determine legal entitlement, adjudicate discrimination, assess decision-making capacity, or guarantee that a requested modification or accommodation must be granted.',
    source_audit='{"source_count":4,"unique_urls":4,"authoritative_or_systematic":4,"current_or_recent":4,"scenario_items":4,"build_method":"direct_chatgpt_authoritative_web_research_due_external_api_credit_block"}'::jsonb || jsonb_build_object('validated_at',now()),
    reviewer_note='Draft built directly in ChatGPT from current authoritative public sources after the external Evidence Builder worker was blocked by exhausted OpenAI API credits. Human source/curriculum/assessment review is still required.',
    updated_at=now()
where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='self_advocacy' limit 1);

update public.professional_course_modules
set title='Managing Support and Responsibilities',
    summary='Coordinate support without equating independence with doing everything alone.',
    learning_objectives='["Help participants map support roles, responsibilities, boundaries, and backup plans while preserving choice and control.","Distinguish supported decision-making from substitute decision-making and recognize when consent or privacy limits information sharing.","Identify warning signs that require safeguarding, legal, clinical, or emergency referral rather than ordinary support coordination."]'::jsonb,
    practice_requirements='["Create a support map listing who helps with what, what information each person needs, what the participant wants to keep private, and the backup option if support is unavailable.","Practice a boundary-setting conversation that clarifies a support person’s role without removing the participant from the decision."]'::jsonb,
    source_refs='[{"title":"Self-Directed Services","url":"https://www.medicaid.gov/medicaid/long-term-services-supports/self-directed-services","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"CMS self-direction guidance emphasizes participant authority, person-centered planning, chosen contributors, individualized supports, risk discussion, and backup plans."},{"title":"Self-Directed Personal Assistant Services 1915(j)","url":"https://www.medicaid.gov/medicaid/home-community-based-services/home-community-based-services-authorities/self-directed-personal-assistant-services-1915-j","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"CMS describes person-directed planning that includes participant choice of family, friends, and professionals and individualized backup and risk-management planning."},{"title":"Centers for Independent Living","url":"https://acl.gov/programs/aging-and-disability-networks/centers-independent-living","source_type":"government_guidance","published_or_reviewed_year":2026,"current_or_recent":true,"claim_supported":"ACL identifies peer counseling, information/referral, independent living skills, individual advocacy, transportation, personal assistance, and other supports as part of independent living services."},{"title":"Experiences and perceptions of everyday decision-making in the lives of adults with intellectual disabilities, their care partners and direct care support workers","url":"https://pubmed.ncbi.nlm.nih.gov/37436408/","source_type":"systematic_review","published_or_reviewed_year":2023,"current_or_recent":true,"claim_supported":"The review found that adults with intellectual disabilities want decision-making involvement while supporters often navigate tensions involving safety, capacity concerns, and support roles."}]'::jsonb,
    content_md='# Managing Support and Responsibilities

Independent living does not mean “doing everything alone.” CMS describes self-directed services as a model in which the participant has decision-making authority and manages services with the assistance of available supports. ACL independent living programs likewise include peer counseling, skills training, advocacy, information and referral, transportation assistance, personal assistance, and other community supports.

A useful question is not “How much help does this person need?” but **“What support does the participant choose for this task, and who is responsible for what?”**

Start with a support map:
- **Task or area:** transportation, budgeting, appointments, meals, communication, benefits, housing, work, education, personal care, or another area.
- **Participant role:** what the participant wants to decide, do, monitor, or learn.
- **Support role:** what another person is being asked to do.
- **Information boundary:** what information that supporter needs and what remains private.
- **Timing:** when support is expected.
- **Backup:** what happens if the usual person is unavailable.
- **Escalation:** when ordinary support is no longer enough and a qualified professional, safety resource, legal service, or emergency response is needed.

Supported decision-making means helping a person understand and communicate a decision while keeping the decision with that person. A supporter might explain options in plain language, help compare consequences, take notes, or help the participant ask questions. The supporter should not quietly become the decision-maker just because the participant uses help.

Research on everyday decision-making among adults with intellectual disabilities shows that adults generally want to make decisions and may benefit from support, while supporters can struggle with balancing autonomy and safety concerns. That tension should be acknowledged rather than solved by automatically removing choice. When there is a real safety concern, define the concern specifically, use the least controlling response consistent with safety and applicable law, and involve the appropriate qualified resource.

Support coordination also requires boundaries. Family members, friends, paid workers, peer supporters, coaches, and clinicians may have different roles. Do not assume that being a relative gives someone automatic access to private information or decision-making authority. Confirm participant consent and any applicable legal authority before sharing information beyond what is appropriate.

Backup planning is especially important for essential support. CMS self-direction guidance explicitly includes contingency planning. If a personal assistant calls out, transportation is canceled, a device fails, or a caregiver becomes unavailable, the participant should know the next safe option. A backup plan should not depend on a person agreeing to support they never accepted.

Watch for signs that ordinary coaching is not enough: threats, coercion, financial exploitation, unexplained injuries, immediate danger, medication or medical concerns, legal authority disputes, or situations requiring mandated reporting under applicable rules. Follow organizational policy and use the appropriate safeguarding, clinical, legal, crisis, or emergency pathway.

## A practical responsibility check

Before ending a planning conversation, ask:
1. What did the participant choose?
2. Who agreed to do what?
3. What information may be shared?
4. What is the deadline or timing?
5. What happens if the plan fails?
6. What issue would trigger additional professional help?

The goal is not maximum self-sufficiency. The goal is **maximum appropriate control, access, and clarity** for the participant within real-world supports and safety needs.',
    review_status='internal_review',
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now()
where id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1);

delete from public.professional_assessment_items where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),1,'multiple_choice','Which statement best reflects independent-living principles?','["Independence means never accepting help","A person can use chosen supports and still retain voice, choice, and control","Family members should always make complex decisions","Paid support automatically reduces autonomy"]'::jsonb,'{"index":1}'::jsonb,'Independent living and self-direction focus on participant control, not on eliminating all assistance.','CMS Self-Directed Services; ACL CIL guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),2,'scenario','A participant wants a friend to help compare transportation options but wants to choose the final option herself.','["Tell the friend to decide because the participant requested help","Support the friend’s information role while keeping the final choice with the participant","Exclude all supporters","Require a legal guardian"]'::jsonb,'{"index":1}'::jsonb,'Supported decision-making can involve chosen assistance while preserving the participant’s decision.','Everyday decision-making systematic review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),3,'multiple_choice','What is a key purpose of a support map?','["To rank people by loyalty","To clarify tasks, roles, information boundaries, timing, backup plans, and escalation points","To transfer all responsibility to staff","To document diagnoses"]'::jsonb,'{"index":1}'::jsonb,'Clear roles and contingency planning support self-direction and reduce confusion.','CMS self-direction guidance','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),4,'scenario','A paid helper who normally provides transportation is unexpectedly unavailable for an essential appointment.','["Assume the appointment must be missed","Use the participant’s agreed backup plan or help identify a safe alternative","Tell the participant to travel alone regardless of safety","Blame the helper in the record"]'::jsonb,'{"index":1}'::jsonb,'CMS self-direction models include individualized contingency planning for unavailable services.','CMS Self-Directed Services; 1915(j)','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),5,'multiple_choice','Which statement about privacy is most appropriate?','["Family relationship automatically authorizes access to all information","Share information based on participant consent, role, and applicable authority rather than relationship alone","All supporters should receive the same information","Privacy does not apply to independent-living services"]'::jsonb,'{"index":1}'::jsonb,'Support roles do not automatically create blanket authority over private information.','Person-centered and privacy principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),6,'scenario','A participant reports that a supporter is threatening to take the participant’s money unless the participant follows instructions.','["Treat it as a routine disagreement","Explore the specific safety/exploitation concern and follow appropriate safeguarding or legal referral procedures","Tell the participant to comply","Ask the supporter to manage all finances"]'::jsonb,'{"index":1}'::jsonb,'Possible exploitation or coercion requires a safeguarding response beyond ordinary role coordination.','Safety and scope boundary','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),7,'multiple_choice','What is the key difference between supported and substitute decision-making in this module?','["Supported decision-making helps the person decide; substitute decision-making places the decision with someone else","They are identical","Supported decision-making only applies to financial matters","Substitute decision-making is always preferred"]'::jsonb,'{"index":0}'::jsonb,'The course centers support that assists understanding and expression while preserving participant decision authority whenever applicable.','Supported decision-making systematic review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1),8,'scenario','A family member and participant disagree about whether the participant should join a community activity.','["Automatically follow the family member","Automatically ignore every safety concern","Clarify the participant’s preference, identify any specific safety issue, and use the least controlling appropriate response or referral","Cancel all community activities"]'::jsonb,'{"index":2}'::jsonb,'The professional should preserve autonomy while addressing concrete safety issues rather than treating disagreement as proof the participant cannot decide.','Supported decision-making evidence; person-centered planning','internal_review',true
);

update public.professional_training_evidence_requirements
set status='internal_review',
    mixed_evidence_note='Chosen supports can increase access and participation, but the amount and type of support that is useful varies by person, task, environment, risk, and available resources. Supported decision-making is promising and autonomy-aligned, but implementation evidence is still developing. The course should not equate fewer supports with better outcomes.',
    claim_strength_note='The module supports role clarification, participant consent, support mapping, backup planning, and referral. It does not establish guardianship, determine legal authority, adjudicate abuse allegations, or replace professional safeguarding, clinical, or emergency response.',
    source_audit='{"source_count":4,"unique_urls":4,"authoritative_or_systematic":4,"current_or_recent":4,"scenario_items":4,"build_method":"direct_chatgpt_authoritative_web_research_due_external_api_credit_block"}'::jsonb || jsonb_build_object('validated_at',now()),
    reviewer_note='Draft built directly in ChatGPT from current authoritative public sources after the external Evidence Builder worker was blocked by exhausted OpenAI API credits. Human source/curriculum/assessment review is still required.',
    updated_at=now()
where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='manage_support' limit 1);

update public.professional_course_modules
set title='Reviewing Sustainable Independence',
    summary='Review what is working, what needs support, and what the participant wants to change next.',
    learning_objectives='["Review progress using participant-defined outcomes, access, participation, stability, and recovery from disruptions rather than a single independence score.","Use a repeatable review cycle to keep supports, routines, and backup plans aligned with changing needs and preferences.","Recognize when changes in health, safety, accessibility, legal status, or support availability require qualified reassessment or referral."]'::jsonb,
    practice_requirements='["Complete a sustainability review covering what is working, recurring friction, supports being used, backup reliability, and the participant’s next chosen change.","Revise one existing plan after a hypothetical change in transportation, health, technology, housing, or support availability."]'::jsonb,
    source_refs='[{"title":"Disability Inclusion","url":"https://www.cdc.gov/disability-inclusion/about/","source_type":"government_guidance","published_or_reviewed_year":2025,"current_or_recent":true,"claim_supported":"CDC describes disability inclusion in terms of participation in everyday roles and emphasizes the importance of policies and practices that support participation."},{"title":"Disability, Health, and Well-being","url":"https://www.cdc.gov/disability-and-health/health-well-being/","source_type":"government_guidance","published_or_reviewed_year":2025,"current_or_recent":true,"claim_supported":"CDC emphasizes health, activity, participation, safety, and access to appropriate health care for people with disabilities."},{"title":"Self-Management Programs Within Rehabilitation Yield Positive Health Outcomes at a Small Increased Cost Compared With Usual Care: A Systematic Review and Meta-analysis","url":"https://pubmed.ncbi.nlm.nih.gov/38729404/","source_type":"systematic_review","published_or_reviewed_year":2024,"current_or_recent":true,"claim_supported":"The review synthesized randomized trials of supported self-management in rehabilitation and evaluated health outcomes and cost relative to usual care."},{"title":"Goal setting for adults receiving clinical rehabilitation for disability","url":"https://www.cochrane.org/evidence/CD009727_goal-setting-adults-receiving-clinical-rehabilitation-disability","source_type":"systematic_review","published_or_reviewed_year":2015,"current_or_recent":false,"claim_supported":"The Cochrane review found substantial uncertainty and low-quality evidence for many goal-setting outcomes, supporting cautious claims and regular review rather than guarantees."}]'::jsonb,
    content_md='# Reviewing Sustainable Independence

Sustainable independence is not a finish line and it is not a score. It means that the participant has a workable combination of choice, access, routines, supports, resources, and backup plans that fits the life they want now—and that the system can be adjusted when circumstances change.

CDC describes disability inclusion in terms of participation in everyday roles such as work, education, relationships, community life, health care, transportation, and use of public resources. That broader view matters because “independence” should not be reduced to how many tasks a person performs alone.

A sustainability review can use five areas:

1. **What is working?** Identify routines, supports, tools, environments, relationships, services, and strategies that the participant wants to keep.
2. **Where is friction repeating?** Look for missed transportation, confusing paperwork, inaccessible environments, fatigue, communication barriers, unstable support, financial strain, or tasks that require more effort than expected.
3. **Are supports still reliable and wanted?** A support that worked six months ago may no longer fit. Ask whether the participant wants the same help, different help, more privacy, or a different arrangement.
4. **Can the plan recover from disruption?** Check backup transportation, alternate communication methods, emergency contacts, support-worker coverage, document copies, device charging, medication or health-related plans managed by the appropriate clinical team, and other contingencies relevant to the person.
5. **What does the participant want to change next?** End with a participant-chosen adjustment, not with a professional score.

Systematic reviews of self-management and rehabilitation suggest that supported self-management can improve some outcomes, but effects vary by population, intervention, and outcome. Goal-setting evidence also contains substantial uncertainty. Lellee should therefore use review cycles to learn what fits the participant rather than claiming that a particular routine or planning method will produce lasting independence.

Changes in health or function require special care. If a participant reports new falls, new confusion, new weakness, significant medication concerns, new swallowing difficulty, major mood or behavior changes, or other potentially clinical issues, the professional should help the participant connect with appropriate health care rather than simply redesigning a coaching plan. Similarly, new legal, housing, benefits, or guardianship issues may require qualified legal or agency assistance.

Sustainability also includes **support burden**. A plan that technically works but exhausts the participant, depends on one unreliable person, creates constant conflict, or requires inaccessible technology may not be sustainable. Ask the participant how much effort the plan requires and what tradeoffs they are willing to make.

Avoid “independence scores” that imply people with more support are less successful. Two people may have different levels of assistance and both have strong self-direction. Better review questions are:
- Am I doing more of what matters to me?
- Do I understand my options?
- Can I get the support I choose?
- Are my routines usable?
- Do I know what to do when the normal plan fails?
- Is there something I want to change now?

## Documentation

Record the participant’s own assessment of what is working, recurring barriers, changes in support, any referral made, and the next chosen adjustment. Use observable facts and participant statements rather than global labels such as “fully independent” or “dependent.”

Sustainable independence is an ongoing person-centered process: **choose, try, review, adjust, and refer when the issue exceeds the professional role.**',
    review_status='internal_review',
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now()
where id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1);

delete from public.professional_assessment_items where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),1,'multiple_choice','How does this module define sustainable independence?','["Completing all tasks without help","A workable, adjustable combination of choice, access, routines, supports, resources, and backup plans","Receiving the fewest services possible","Achieving a perfect independence score"]'::jsonb,'{"index":1}'::jsonb,'Sustainability is based on participant-directed functioning and adaptable supports, not on doing everything alone.','CDC disability inclusion; independent-living principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),2,'scenario','A participant’s routine works but depends entirely on one helper who has become unreliable.','["Keep the plan unchanged because it worked before","Review support reliability and build a participant-approved backup option","Tell the participant to stop using support","Score the participant as dependent"]'::jsonb,'{"index":1}'::jsonb,'A sustainable plan should be able to recover from predictable disruption.','CMS contingency-planning principles; sustainability review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),3,'multiple_choice','What is the strongest evidence-consistent claim about supported self-management?','["It guarantees independence","It can improve some outcomes, but effects vary across populations and interventions","It replaces rehabilitation professionals","It works only for people without disabilities"]'::jsonb,'{"index":1}'::jsonb,'Systematic reviews support some benefits but do not justify universal or guaranteed claims.','2024 rehabilitation self-management systematic review','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),4,'scenario','A participant reports several new falls and increasing weakness.','["Only adjust the daily checklist","Help the participant seek appropriate clinical evaluation and address immediate safety needs","Assume the participant needs more motivation","Increase the number of independent tasks"]'::jsonb,'{"index":1}'::jsonb,'New falls and weakness can require clinical evaluation beyond coaching scope.','CDC health and well-being; scope boundary','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),5,'multiple_choice','Which measure is least appropriate for a sustainability review?','["Participant-defined participation goals","Reliability of backup plans","A single score ranking how independent a person is based on amount of help used","Recurring barriers and support fit"]'::jsonb,'{"index":2}'::jsonb,'The course rejects a single independence score because support level does not determine autonomy or worth.','Independent-living and person-centered principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),6,'scenario','A participant says an app-based routine is effective but too tiring and complicated to maintain.','["Keep it because measurable completion matters most","Ask what parts are burdensome and simplify or replace the system based on participant preference","Tell the participant technology is required","Add more reminders"]'::jsonb,'{"index":1}'::jsonb,'Sustainability includes effort and fit; a technically effective system can still be unsuitable.','Person-centered self-management principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),7,'multiple_choice','Why should plans be reviewed when circumstances change?','["Because every plan must be rewritten monthly","Because health, environment, transportation, supports, technology, and preferences can change what is workable","Because the professional should choose new goals","Because change proves the old plan failed"]'::jsonb,'{"index":1}'::jsonb,'Person-centered systems should adapt to changing context rather than treating the original plan as permanent.','CDC inclusion; person-centered planning principles','internal_review',true
);
insert into public.professional_assessment_items(
 module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
) values(
 (select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1),8,'scenario','A participant reaches a goal and says the next priority is social participation rather than another household skill.','["Require another household skill first","Use the participant’s new priority to guide the next planning cycle","End services because the original goal is complete","Ask family to choose the next goal"]'::jsonb,'{"index":1}'::jsonb,'Sustainable planning follows the participant’s current priorities and desired life roles.','CDC disability inclusion; person-centered planning','internal_review',true
);

update public.professional_training_evidence_requirements
set status='internal_review',
    mixed_evidence_note='Self-management and person-centered planning can support participation and some health or psychosocial outcomes, but effects vary and evidence does not justify a single universal independence score or guaranteed trajectory. Changes in environment, health, supports, transportation, technology, and preferences can alter what is sustainable.',
    claim_strength_note='The module teaches ongoing review and adaptation. It does not measure a person’s worth, certify independent-living capacity, predict long-term outcomes, or replace reassessment by licensed or legally authorized professionals when conditions change.',
    source_audit='{"source_count":4,"unique_urls":4,"authoritative_or_systematic":4,"current_or_recent":3,"scenario_items":4,"build_method":"direct_chatgpt_authoritative_web_research_due_external_api_credit_block"}'::jsonb || jsonb_build_object('validated_at',now()),
    reviewer_note='Draft built directly in ChatGPT from current authoritative public sources after the external Evidence Builder worker was blocked by exhausted OpenAI API credits. Human source/curriculum/assessment review is still required.',
    updated_at=now()
where module_id=(select m0.id from public.professional_course_modules m0 join public.professional_courses c0 on c0.id=m0.course_id where c0.course_key='specialty_independent_living' and m0.module_key='sustainable_independence' limit 1);

update public.professional_courses
set status='draft',
    curriculum_review_status='internal_review',
    assessment_review_status='internal_review',
    checkout_enabled=false,
    updated_at=now()
where course_key='specialty_independent_living';

update public.professional_journey_training_links
set build_status='internal_review',updated_at=now()
where course_id=(select id from public.professional_courses where course_key='specialty_independent_living');

update public.agent_tasks t
set status='cancelled',updated_at=now()
where t.id in (
 select er.agent_task_id
 from public.professional_training_evidence_requirements er
 join public.professional_courses c on c.id=er.course_id
 where c.course_key='specialty_independent_living'
   and er.agent_task_id is not null
)
and t.status in ('queued','failed','blocked');

commit;