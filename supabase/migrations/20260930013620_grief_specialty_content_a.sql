begin;
update public.professional_course_modules
 set content_md='# Understanding Grief, Mourning & Individual Variation

Grief is a natural response to loss. People may experience sadness, anger, guilt, numbness, relief, confusion, fear, loneliness, changes in sleep or appetite, difficulty concentrating, and shifts in identity or routine. These reactions can come and go. There is no single correct sequence, no universal timetable, and no one “right way” to grieve.

The National Institute on Aging and the VA both emphasize that grief varies widely. Culture, religion, family expectations, the relationship to the person who died, the circumstances of the death, prior losses, trauma history, health, financial pressure, caregiving history, and social support can all shape grief. Lellee coaches should avoid imposing stage models as if everyone must progress through the same steps.

Grief and mourning are related but not identical. Grief refers broadly to the internal response to loss; mourning includes the ways people express and adapt to loss, often within family, cultural, spiritual, or community traditions. A coach should ask what the loss means to the participant and what practices or beliefs matter to them rather than assuming a preferred ritual or worldview.

Most bereaved people do not require formal mental-health treatment simply because they are grieving. Many benefit from ordinary social support, practical help, faith or cultural community, peer support, support groups, counseling, or time. A coach should not medicalize normal grief or treat sadness itself as pathology.

At the same time, “normal grief” does not mean “easy grief.” A participant may have severe pain, disrupted concentration, poor sleep, or temporary difficulty making decisions and still be within an expected grief response. The coach can help reduce unnecessary demands, organize routines, identify support, and make goals smaller while the person adapts.

Lellee uses grief-informed coaching to support functioning, connection, meaning, routines, and participant-chosen next steps. It does not diagnose grief disorders, depression, PTSD, or another mental-health condition.',source_refs='[{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"},{"title":"VA Grief: Different Reactions and Timelines","url":"https://www.ptsd.va.gov/understand/related/related_list_grief.asp"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"},{"title":"CDC Grief","url":"https://www.cdc.gov/howrightnow/emotion/grief/index.html"}]'::jsonb,practice_requirements='["Compare six grief scenarios and identify why different emotional, cultural, spiritual, and practical responses may all be understandable without ranking one response as correct.","Rewrite ten statements based on rigid grief-stage assumptions into language that allows individual timing, culture, and participant choice."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_variation'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_course_modules
 set content_md='# When Grief Needs Additional Support: Prolonged Grief, Trauma, Depression & Referral

Coaches need to recognize when ordinary supportive coaching may not be enough. This does not mean diagnosing the participant. It means noticing patterns that should lead to a qualified mental-health, medical, grief-treatment, or crisis referral.

The American Psychiatric Association recognizes prolonged grief disorder as a mental-health diagnosis characterized by persistent, intense grief that causes substantial distress or impairment and lasts beyond expected cultural, social, or religious norms. In adults, diagnosis requires that the death occurred at least 12 months earlier. Diagnosis also depends on a specific pattern of symptoms and impairment. A Lellee coach should never diagnose prolonged grief disorder or administer diagnostic criteria as a substitute for clinical evaluation.

Referral becomes especially important when grief is persistently interfering with basic functioning, the participant is unable to carry out essential daily activities, there is severe or worsening depression, trauma symptoms dominate the presentation, substance use is escalating, the participant feels persistently unable to move forward, or the participant requests clinical help.

Some losses are traumatic or occur under sudden, violent, stigmatized, or otherwise complex circumstances. Grief can coexist with PTSD, depression, substance use disorder, anxiety, or medical problems. The coach should avoid deciding which diagnosis explains the participant''s experience. Instead, identify the impact and connect the person with qualified care.

AHRQ''s 2025 systematic review found moderate-strength evidence that psychotherapy can improve grief-disorder severity, grief symptoms, and depressive symptoms in bereaved populations, and moderate evidence that expert-facilitated support groups can improve grief symptoms. Evidence for many other bereavement interventions remains limited or insufficient. This supports an important Lellee boundary: professional treatment should not be replaced by generic coaching when significant grief-related impairment or a grief disorder may be present.

If the participant is in behavioral-health crisis, ordinary coaching pauses. Use 988 or another appropriate crisis resource when indicated, and use emergency services when there is immediate physical danger or a medical emergency. The coach''s role is recognition, support, and routing—not diagnosis or crisis treatment.',source_refs='[{"title":"APA Prolonged Grief Disorder","url":"https://www.psychiatry.org/patients-families/prolonged-grief-disorder"},{"title":"AHRQ Interventions to Improve Care of Bereaved Persons","url":"https://effectivehealthcare.ahrq.gov/products/bereaved-persons/research"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"},{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"}]'::jsonb,practice_requirements='["Classify ten grief situations as supportive coaching, grief counseling/therapy referral, medical referral, substance-use treatment referral, crisis support, or emergency response.","Create a referral conversation that names observed impact and available support without labeling or diagnosing prolonged grief disorder."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_risk_referral'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_course_modules
 set content_md='# Supportive Communication After Loss

People who are grieving usually do not need a coach to fix grief. They need to be heard, respected, supported, and helped with the parts of life that feel difficult to manage. The VA''s grief guidance emphasizes presence, direct expressions of empathy, practical support, acknowledgement of the loss, and taking cues from the grieving person.

Avoid clichés and certainty about what the participant “should” feel. Statements such as “everything happens for a reason,” “you need to move on,” “at least they lived a long life,” or “you should be over this by now” can minimize the participant''s experience. Even well-meant reassurance can feel distancing when it predicts that everything will be okay.

Use simple, direct language. Acknowledge the loss. If the participant uses the deceased person''s name, it is generally appropriate to use the name as well. Ask what support would be most useful today: listening, practical organization, company, help identifying resources, a routine, a memorial activity, or a smaller goal.

Do not force disclosure. Some people want to talk repeatedly about the person who died; others want periods of ordinary conversation and activity. Some want spiritual discussion; others do not. Some find memorial rituals meaningful; others prefer private reflection. Support should be participant-led.

Practical support can matter as much as conversation. Grief may temporarily reduce concentration and decision-making capacity. Coaches can help create short lists, organize bills or appointments, plan meals, identify transportation, prioritize urgent paperwork, and postpone nonessential demands.

A coach should also recognize their own discomfort with grief. Talking too much, changing the subject, offering excessive advice, or avoiding the participant can be ways helpers manage their own anxiety. Professional presence means tolerating some uncertainty and sadness without making the participant care for the coach''s emotions.

When the participant needs clinical grief treatment, trauma therapy, medical care, substance-use treatment, or crisis services, supportive communication should continue while an appropriate referral is made.',source_refs='[{"title":"VA Helping Someone Else After a Loss","url":"https://www.ptsd.va.gov/family/how_help_grief.asp"},{"title":"SAMHSA Coping with Bereavement and Grief","url":"https://www.samhsa.gov/communities/coping-bereavement-grief"},{"title":"NIA Coping With Grief and Loss","url":"https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss"},{"title":"CDC Grief","url":"https://www.cdc.gov/howrightnow/emotion/grief/index.html"}]'::jsonb,practice_requirements='["Rewrite ten minimizing, overly reassuring, or directive grief statements into validating, participant-led responses.","Practice a short grief-support conversation that includes acknowledgment, listening, participant choice, practical support, and an appropriate referral when needed."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='grief_communication_support'
   and course_id=(select id from public.professional_courses where course_key='specialty_grief_life_after_loss');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_grief_life_after_loss';
commit;