begin;

update public.professional_assessment_items a
set prompt='Which combination is most consistent with evidence-informed eviction-prevention practice?',
    choices='["Rental assistance, legal assistance, housing counseling, and coordinated problem-solving when appropriate","Emergency shelter only","Telling every renter to negotiate without support","Assuming one national intervention works for everyone"]'::jsonb,
    correct_answer='{"index":0}'::jsonb,
    rationale='Eviction prevention often combines financial, legal, counseling, and cross-system supports rather than relying on one intervention.',
    source_note='USICH eviction-prevention and prevention framework',
    updated_at=now()
from public.professional_course_modules m
join public.professional_courses c on c.id=m.course_id
where a.module_id=m.id
  and c.course_key='specialty_housing_stability'
  and m.module_key='housing_crisis_referral'
  and a.item_order=7;

update public.professional_assessment_items a
set prompt='What should determine whether family involvement belongs in a reentry plan?',
    choices='["Participant choice, safety, legal restrictions, relationship quality, and whether involvement supports the participant’s goals","A rule that every family must be involved","The coach’s personal preference","Whether the family member offers housing, regardless of safety or consent"]'::jsonb,
    correct_answer='{"index":0}'::jsonb,
    rationale='Family involvement can be valuable but should be individualized, safe, lawful, and participant-centered.',
    source_note='NRRC family and reentry guidance',
    updated_at=now()
from public.professional_course_modules m
join public.professional_courses c on c.id=m.course_id
where a.module_id=m.id
  and c.course_key='specialty_reentry'
  and m.module_key='family_social_reintegration'
  and a.item_order=1;

update public.professional_assessment_items a
set prompt='How should a Lellee-trained recovery coach use formal peer-support competency standards?',
    choices='["Treat them as a guide for role clarity, ethics, mutuality, and referral while accurately representing any separate certification they actually hold","Assume course completion automatically grants every state peer credential","Ignore them because coaching and peer work never overlap","Use them to diagnose substance use disorders"]'::jsonb,
    correct_answer='{"index":0}'::jsonb,
    rationale='Formal peer competencies can inform ethical role behavior, but external peer certification has separate jurisdiction-specific requirements.',
    source_note='SAMHSA Core Competencies for Peer Workers',
    updated_at=now()
from public.professional_course_modules m
join public.professional_courses c on c.id=m.course_id
where a.module_id=m.id
  and c.course_key='specialty_recovery'
  and m.module_key='family_peer_community'
  and a.item_order=3;

commit;