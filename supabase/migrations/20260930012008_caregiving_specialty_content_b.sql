begin;
update public.professional_course_modules
 set content_md='# Family Systems, Shared Care & Coordination Boundaries

Caregiving often involves several people with different roles, expectations, availability, finances, and opinions. The National Institute on Aging recommends dividing tasks according to each person''s skills and capacity and, when appropriate, identifying a primary caregiver who coordinates day-to-day responsibilities.

A coach can help a family make the work visible. List the recurring tasks, who currently performs them, which tasks require special training, which tasks are overdue, and where backup coverage is missing. This turns vague conflict such as “nobody helps me” into a clearer coordination problem that can be discussed.

Shared caregiving should not erase the care recipient''s voice. When the person receiving care can participate in decisions, their preferences should be included. Family members may disagree, but the coach should avoid deciding who has legal authority. Questions about powers of attorney, guardianship, conservatorship, health-care proxies, financial authority, or legal decision-making belong with qualified legal or health professionals.

Family meetings work better when the purpose is specific. Examples include dividing transportation, arranging weekend coverage, planning meals, managing bills, coordinating appointments, or setting boundaries around phone calls. The coach can help prepare an agenda, identify decisions that need to be made, document agreed tasks, and schedule follow-up.

Conflict may reflect grief, exhaustion, old family patterns, money, distance, or different beliefs about care. Coaching can support respectful communication, but high-conflict family situations, abuse, coercion, complex legal disputes, or major mental-health concerns may require mediation, therapy, legal help, adult protective services, or other specialized resources.

Coordination also includes professionals and community services. The caregiver may interact with doctors, nurses, social workers, home-care agencies, adult day programs, respite providers, transportation services, benefits programs, and community organizations. A coach can help organize contacts and questions without acting as the formal care manager unless separately authorized and trained.',source_refs='[{"title":"NIA Sharing Caregiving Responsibilities","url":"https://www.nia.nih.gov/health/caregiving/sharing-caregiving-responsibilities"},{"title":"NIA Getting Started With Caregiving","url":"https://www.nia.nih.gov/health/caregiving/getting-started-caregiving"},{"title":"ACL National Family Caregiver Support Program","url":"https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program"},{"title":"ACL National Strategy to Support Family Caregivers","url":"https://acl.gov/CaregiverStrategy"}]'::jsonb,practice_requirements='["Create a shared-care matrix listing each recurring task, current owner, backup person, training needs, and follow-up date.","Plan a 30-minute family caregiving meeting with a clear purpose, agenda, boundaries, decisions, and referral triggers."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='family_systems_coordination'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_course_modules
 set content_md='# Transitions, Grief, Advance-Care Conversations & Resource Navigation

Caregiving changes over time. Health may improve, stabilize, or decline. A caregiver may face hospitalization, rehabilitation, new disability, dementia progression, long-term care decisions, hospice discussions, or the end of a caregiving role. These changes can bring grief before, during, and after a major loss.

A coach can acknowledge grief, uncertainty, guilt, anger, relief, fear, or role changes without diagnosing a grief disorder or providing psychotherapy. The goal is to help the caregiver identify what support is needed now, what decisions belong with qualified professionals, and what practical next steps are manageable.

Advance care planning involves discussing and documenting a person''s wishes for future medical care. NIA encourages families to discuss preferences early so decisions can better reflect what matters to the person. A Lellee coach may help a caregiver prepare questions and organize conversations but should not interpret advance directives, determine legal capacity, select treatments, or make medical decisions.

Resource navigation is a core caregiving skill. ACL''s National Family Caregiver Support Program supports information, help accessing services, counseling/support groups, caregiver training, respite, and limited supplemental services through state and local systems. Eligibility and availability vary, so a coach should help locate the correct local resource rather than promise a service.

Resources may include Area Agencies on Aging, Aging and Disability Resource Centers, Medicaid programs, respite programs, adult day services, home-care agencies, transportation, meal programs, support groups, disease-specific organizations, veterans'' programs, benefits counseling, and legal resources. The coach should be accurate about what is known and clear when eligibility must be confirmed by the program.

Caregiving transitions can also affect identity. After a move to long-term care or after a death, the caregiver may suddenly have fewer tasks but more grief, uncertainty, or isolation. The coach can support routine rebuilding, social connection, practical organization, and referral to grief or mental-health support when needed.',source_refs='[{"title":"NIA Advance Care Planning and Health Care Decisions: Tips for Caregivers and Families","url":"https://www.nia.nih.gov/health/advance-care-planning/advance-care-planning-and-health-care-decisions-tips-caregivers-and"},{"title":"NIA Caregiving","url":"https://www.nia.nih.gov/health/caregiving"},{"title":"ACL National Family Caregiver Support Program","url":"https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program"},{"title":"ACL National Strategy to Support Family Caregivers","url":"https://acl.gov/CaregiverStrategy"}]'::jsonb,practice_requirements='["Build a resource-navigation map that distinguishes information, respite, transportation, benefits, home-care, legal, mental-health, and grief resources.","Create an advance-care conversation preparation worksheet that contains questions and participant preferences but does not interpret legal documents or make medical decisions."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='caregiving_grief_resources'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_course_modules
 set content_md='# Caregiving Specialty Applied Capstone

This capstone requires human review.

## Scenario

Renee is caring for an older parent with several chronic medical conditions. Renee works part time, has been missing sleep, and has begun skipping her own medical appointments. Two siblings disagree about how much help they should provide. The parent wants to remain at home and has said that only certain medical information may be shared with family members. A physician has recommended discussing future-care preferences. Renee asks the coach which medication should be stopped because the parent seems tired, whether Renee automatically has legal authority to make health-care decisions, and whether the coach can tell the siblings they are legally required to contribute money.

Renee is also considering respite care but feels guilty about taking a break. The family is unsure how to divide transportation, meals, appointment support, finances, and weekend coverage.

## Required response

Prepare a caregiving-support plan that addresses caregiver wellbeing, respite, shared responsibilities, care-recipient autonomy and privacy, health-team communication, advance-care conversation preparation, family boundaries, resource navigation, and escalation/referral.

Separate what belongs in coaching from medical decisions, legal authority questions, financial/legal obligations, formal care management, and mental-health treatment. Include an immediate caregiver-stability plan, a shared-care plan, and a 30-day resource-navigation plan.

The reviewer should not approve a response that recommends medication changes, assumes family relationship creates legal authority, overrides the care recipient''s privacy preferences, tells relatives they have legal financial duties without qualified advice, or ignores signs that the caregiver''s own health and safety need attention.',source_refs='[{"title":"NIA Getting Started With Caregiving","url":"https://www.nia.nih.gov/health/caregiving/getting-started-caregiving"},{"title":"NIA Sharing Caregiving Responsibilities","url":"https://www.nia.nih.gov/health/caregiving/sharing-caregiving-responsibilities"},{"title":"NIA Take Care of Yourself as a Caregiver","url":"https://www.nia.nih.gov/health/caregiving/take-care-yourself-caregiver"},{"title":"HHS HIPAA: Family Members and Friends","url":"https://www.hhs.gov/hipaa/for-individuals/family-members-friends/index.html"},{"title":"NIA Advance Care Planning and Health Care Decisions","url":"https://www.nia.nih.gov/health/advance-care-planning/advance-care-planning-and-health-care-decisions-tips-caregivers-and"},{"title":"ACL National Family Caregiver Support Program","url":"https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program"}]'::jsonb,practice_requirements='["Submit a structured plan covering caregiver wellbeing, privacy, family coordination, health-team communication, respite, advance-care preparation, and referrals.","Identify at least six points where a coach could overstep into medicine, legal authority, formal case management, or family adjudication."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='caregiving_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_caregiving';
commit;