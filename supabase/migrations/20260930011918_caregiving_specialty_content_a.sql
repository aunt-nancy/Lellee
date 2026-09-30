begin;
update public.professional_course_modules
 set content_md='# Caregiving Roles, Needs & Coaching Scope

Caregiving can include help with personal care, household tasks, meals, transportation, appointments, medication organization, finances, and communication with health professionals. The National Institute on Aging emphasizes that caregiving can be meaningful and rewarding while also demanding, stressful, and complex.

Lellee Caregiving Specialty teaches coaches to support organization, communication, boundaries, routines, resource navigation, and caregiver wellbeing. It does not authorize the coach to diagnose illness, provide nursing care, direct medication changes, make treatment decisions, determine legal authority, act as a case manager, or replace licensed health professionals.

Start by clarifying who is involved and what the caregiver is actually doing. The person receiving care may have their own preferences, decision-making authority, privacy rights, and support network. A caregiver may be a spouse, adult child, sibling, friend, neighbor, grandparent, kinship caregiver, or another person. Do not assume that family relationship automatically creates legal authority.

A good coaching plan distinguishes tasks the caregiver can reasonably manage from tasks that require medical, legal, financial, social-service, or home-care professionals. If the caregiver is unsure how to perform a health-related task safely, the coach should encourage instruction from the relevant clinician or qualified care provider rather than improvise.

Caregiving often changes over time. A person may begin with transportation and shopping, then gradually take on appointments, personal care, finances, or supervision. Revisit the plan as needs change. What was manageable two months ago may no longer be safe or realistic.

The coach''s role is to help the caregiver see the whole picture, identify priorities, organize support, and protect both the caregiver''s and care recipient''s dignity and autonomy.',source_refs='[{"title":"NIA Caregiving","url":"https://www.nia.nih.gov/health/caregiving"},{"title":"NIA Getting Started With Caregiving","url":"https://www.nia.nih.gov/health/caregiving/getting-started-caregiving"},{"title":"ACL National Strategy to Support Family Caregivers","url":"https://acl.gov/CaregiverStrategy"},{"title":"ACL National Family Caregiver Support Program","url":"https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program"}]'::jsonb,practice_requirements='["Create a caregiving role map separating caregiver tasks, care-recipient choices, professional responsibilities, and tasks that require referral.","Classify twelve requests as caregiving support, medical, legal, financial, social-service, emergency, or home-care matters."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='caregiving_roles_scope'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_course_modules
 set content_md='# Caregiver Stress, Burnout, Respite & Self-Care

Caregiving can create sustained physical, emotional, financial, and time demands. NIA advises caregivers to care for their own health, ask for help, use support groups, and take breaks. Respite care can provide short-term relief ranging from a few hours to longer periods depending on the service.

Caregiver stress is not a moral failure. A caregiver may be balancing employment, parenting, sleep disruption, medical appointments, transportation, money, household responsibilities, and grief while trying to protect someone they care about. Coaching should normalize the need for support without diagnosing depression, anxiety, compassion fatigue, or another condition.

Warning signs that the caregiving arrangement may be becoming unsustainable can include chronic sleep loss, missed medical care for the caregiver, frequent conflict, inability to complete essential tasks, increasing isolation, financial crisis, or feeling unable to continue safely. These signs should lead to more support and, when needed, professional evaluation—not shame.

Self-care should be realistic. Telling an exhausted caregiver to “take a spa day” may be useless when the actual barrier is that nobody can cover the care recipient. Effective planning may involve asking siblings to take specific tasks, using respite, arranging adult day services, simplifying meals, sharing transportation, using delivery services, scheduling the caregiver''s own appointments, or accepting help from a trusted community.

Evidence on caregiver interventions varies. AHRQ''s systematic review of dementia-care interventions found that some intensive multicomponent caregiver-support programs may improve caregiver depression, but the strength of evidence was low and interventions differed substantially. Lellee therefore teaches multicomponent support principles while avoiding claims that its coaching is a clinical treatment.

A caregiver who reports severe emotional distress, inability to keep themselves or the care recipient safe, or another urgent risk should be connected promptly with appropriate clinical, crisis, emergency, respite, or protective resources.',source_refs='[{"title":"NIA Take Care of Yourself as a Caregiver","url":"https://www.nia.nih.gov/health/caregiving/take-care-yourself-caregiver"},{"title":"NIA Frequently Asked Questions About Caregiving","url":"https://www.nia.nih.gov/health/caregiving/frequently-asked-questions-about-caregiving"},{"title":"ACL National Family Caregiver Support Program","url":"https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program"},{"title":"AHRQ Care Interventions for People Living With Dementia and Their Caregivers","url":"https://effectivehealthcare.ahrq.gov/products/care-interventions-pwd/report"}]'::jsonb,practice_requirements='["Build a caregiver-load map that identifies sleep, work, finances, health, transportation, household tasks, personal care, and backup coverage.","Create a realistic respite and help-request plan using specific tasks, people, services, and backup options rather than generic self-care advice."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='stress_burnout_compassion'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_course_modules
 set content_md='# Care Routines, Health Communication & Boundaries

Caregiving often depends on routines: meals, transportation, appointments, medication pickup, household tasks, personal care, paperwork, and communication with health professionals. A clear routine can reduce missed tasks, but it should remain flexible enough to respond to changing health and preferences.

The coach can help the caregiver organize a calendar, task list, medication pickup reminders, appointment questions, transportation, and communication logs. The coach should not tell the caregiver what medication dose to give, whether to stop a medication, how to perform a clinical procedure, or what treatment decision to make. Those questions belong with qualified health professionals.

Privacy also matters. HHS explains that HIPAA-covered providers may share relevant health information with family, friends, or others involved in care when the patient agrees, does not object, or in certain circumstances when professional judgment supports sharing. The information shared should generally be relevant to the person''s involvement in care. A caregiver should not assume they are automatically entitled to all medical information.

A practical coaching step is to help the care recipient and caregiver clarify what information may be shared, with whom, and for what purpose. When appropriate, encourage them to ask the health provider what forms or authorization processes are available.

Boundaries protect both people. Caregivers may need to say no to tasks they cannot safely perform, request professional help, limit financially unsustainable commitments, or ask other family members to contribute. The person receiving care also retains dignity, privacy, preferences, and as much autonomy as possible.

Communication should be factual and organized. Prepare appointment questions in advance, write down instructions, clarify who will follow up, and avoid relying on memory for complex care plans. When instructions are confusing or appear inconsistent, contact the qualified health team rather than guessing.',source_refs='[{"title":"NIA Getting Started With Caregiving","url":"https://www.nia.nih.gov/health/caregiving/getting-started-caregiving"},{"title":"HHS HIPAA: Family Members and Friends","url":"https://www.hhs.gov/hipaa/for-individuals/family-members-friends/index.html"},{"title":"HHS HIPAA: Sharing Information With Family and Friends","url":"https://www.hhs.gov/hipaa/for-professionals/faq/does-hipaa-allow-a-health-care-provider-to-communicate-with-a-patients-family-friends-or-other-persons-who-are-involved-in-the-patient-care.html"},{"title":"NIA Caregiving Toolkit","url":"https://www.nia.nih.gov/toolkits/caregiving"}]'::jsonb,practice_requirements='["Build a one-week caregiving routine that includes appointments, transportation, caregiver breaks, medication pickup reminders, household tasks, and backup coverage without giving medical instructions.","Draft a privacy-and-communication plan identifying what information the care recipient wants shared, with whom, and what questions should go back to the health team."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='routines_communication_boundaries'
   and course_id=(select id from public.professional_courses where course_key='specialty_caregiving');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_caregiving';
commit;