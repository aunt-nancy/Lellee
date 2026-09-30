begin;
update public.professional_course_modules
 set content_md='# Routines, Identity, Meaning & Rebuilding Daily Life

Loss can change routines, roles, identity, relationships, finances, living arrangements, caregiving responsibilities, spiritual practices, and future plans. A person may not only miss someone; they may also be learning how to live in a world where familiar roles and habits have changed.

The National Institute on Aging notes that grief can affect sleep, appetite, concentration, decision-making, and everyday functioning. CDC guidance similarly recommends maintaining basic routines, connecting with supportive people, and using personally meaningful remembrance practices. Lellee coaching can help translate those broad ideas into small, participant-chosen actions.

Early goals should often be modest. Eating one regular meal, walking outside, paying one urgent bill, answering one important message, attending one appointment, or preparing for one difficult anniversary may be more realistic than large productivity goals. The coach should not measure grief recovery by how quickly someone returns to a prior level of functioning.

Identity may shift after the death of a spouse, parent, child, sibling, friend, mentor, coworker, or another important person. The participant may ask, “Who am I now?” A coach can support exploration of roles, values, routines, relationships, and future possibilities without insisting that the person “move on.”

Meaning and remembrance are also individual. Some people find comfort in memorials, rituals, faith or spiritual practices, storytelling, creative work, charitable activity, preserving belongings, or continuing a symbolic connection with the person who died. Others do not. The coach should never prescribe meaning or use spiritual language that the participant has not chosen.

Major decisions sometimes require extra care during acute grief. NIA advises postponing major life decisions when possible if grief is significantly affecting thinking and functioning. A coach can help distinguish urgent decisions from those that can wait and encourage consultation with appropriate legal, financial, medical, or family professionals.

Rebuilding life is not betrayal. Enjoyment, connection, and new goals can coexist with grief. The coach''s role is to support a life that can hold both the loss and continued living.',source_refs='[{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"},{"title":"CDC Grief","url":"https://www.cdc.gov/howrightnow/emotion/grief/index.html"},{"title":"VA Grief: Taking Care of Yourself After a Loss","url":"https://www.ptsd.va.gov/understand/related/related_problems_grief.asp"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"}]'::jsonb,practice_requirements='["Build a two-week grief-support routine with sleep, food, movement, social connection, urgent tasks, memorial/meaning options, and permission for low-capacity days.","Take five large post-loss decisions and classify them as urgent, can-wait, or requires legal/financial/medical consultation."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_routines_identity_meaning'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_course_modules
 set content_md='# Grief, Substance Use, Isolation & Crisis Vulnerability

Grief can disrupt sleep, appetite, concentration, mood, routines, and social connection. Some people may increase alcohol or other substance use while trying to manage pain, numbness, loneliness, or insomnia. NIA specifically warns that drinking too much alcohol or smoking can put health at risk during grief.

A Lellee coach should ask about coping in a nonjudgmental way without conducting a clinical substance-use assessment unless separately trained and authorized. If a participant reports increased use, the coach can explore what the substance is doing for them, whether functioning or safety is changing, what supports are available, and whether the participant wants treatment, peer support, harm-reduction resources, or another professional resource.

Grief after a substance-related death can involve additional stigma, guilt, anger, family conflict, or fear. The coach should avoid blame and avoid speculating about causes or responsibility. Support the participant''s experience and connect them with appropriate grief, peer, substance-use, or mental-health resources.

Isolation can increase vulnerability. SAMHSA, CDC, NIA, and VA all point to social connection, support groups, counseling, and community support as possible resources. A coach can help a participant identify one safe contact, one support resource, or one structured activity rather than pushing them into social situations before they are ready.

Behavioral-health crisis requires a different response from ordinary grief coaching. If the participant is in acute emotional crisis, support connection to 988 or another appropriate crisis resource. If there is immediate physical danger or a medical emergency, use emergency services according to Lellee policy. Do not attempt to provide crisis treatment within coaching.

A participant with persistent functional impairment, escalating substance use, severe depression, trauma symptoms, or other significant clinical concerns should be referred to qualified care. SAMHSA''s National Helpline and FindTreatment.gov can help locate mental-health and substance-use treatment resources.

The goal is not to pathologize grief. The goal is to notice when grief is interacting with health, substance use, isolation, or safety in a way that requires more support than coaching alone can provide.',source_refs='[{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"},{"title":"SAMHSA National Helpline","url":"https://www.samhsa.gov/find-help/helplines/national-helpline"},{"title":"SAMHSA How to Cope","url":"https://www.samhsa.gov/find-support/how-to-cope"},{"title":"CDC Grief","url":"https://www.cdc.gov/howrightnow/emotion/grief/index.html"}]'::jsonb,practice_requirements='["Classify ten post-loss coping situations as ordinary grief support, substance-use referral, mental-health referral, 988/crisis support, or emergency response.","Create a low-pressure reconnection plan with one trusted person, one professional or peer resource, one routine, and one backup crisis resource."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_substance_use_crisis'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_course_modules
 set content_md='# Grief & Life After Loss Specialty Applied Capstone

This capstone requires human review.

## Scenario

Avery is an adult whose spouse died eight months ago after a sudden illness. Avery reports intense grief, difficulty concentrating, missed work, poor sleep, and increasing alcohol use in the evenings. Avery''s family keeps saying it is time to “move on” and wants the coach to insist that Avery donate the spouse''s belongings. Avery has stopped attending a faith community because the rituals no longer feel comforting. Avery says some days feel manageable and other days feel overwhelming. Avery asks the coach to diagnose prolonged grief disorder and tell them whether medication is needed.

Avery also has urgent financial paperwork related to the death, but is considering selling the home immediately even though they feel unable to think clearly about the decision.

## Required response

Prepare a grief-informed coaching plan that addresses normalization without minimizing, role and diagnostic boundaries, functioning, sleep and routines, alcohol-use concerns, supportive communication, family pressure, cultural or spiritual choice, practical paperwork, decision pacing, social connection, referral options, and crisis escalation.

Identify what belongs in supportive coaching, what requires mental-health or grief-treatment evaluation, what may need substance-use support, what decisions may be reasonable to postpone, and what would trigger crisis or emergency routing.

The reviewer should not approve a response that diagnoses prolonged grief disorder, recommends medication, imposes a grief timetable, forces family or spiritual involvement, treats alcohol escalation as merely a bad habit, or misses significant functional and safety concerns.',source_refs='[{"title":"AHRQ Interventions to Improve Care of Bereaved Persons","url":"https://effectivehealthcare.ahrq.gov/products/bereaved-persons/research"},{"title":"APA Prolonged Grief Disorder","url":"https://www.psychiatry.org/patients-families/prolonged-grief-disorder"},{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"},{"title":"VA Helping Someone Else After a Loss","url":"https://www.ptsd.va.gov/family/how_help_grief.asp"},{"title":"SAMHSA National Helpline","url":"https://www.samhsa.gov/find-help/helplines/national-helpline"}]'::jsonb,practice_requirements='["Submit a structured response covering grief normalization, scope, functioning, alcohol-use concern, family pressure, meaning/ritual choice, practical decisions, referrals, and crisis routing.","Identify at least six places where a grief coach could overstep into diagnosis, psychotherapy, medication advice, financial/legal decision-making, or coercion."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_grief_life_after_loss';
commit;