begin;
update public.professional_course_modules
 set content_md='# Housing, Financial Stability & Daily Reentry Logistics

Safe, stable housing is a central reentry need. NIJ and the National Reentry Resource Center both identify housing as part of successful reintegration, but housing rarely exists in isolation from employment, health care, transportation, family obligations, supervision, and treatment. Lellee therefore treats housing as part of an integrated reentry plan rather than a single referral.

A coach can help a participant organize a housing-readiness file: identification, income information, references, prior addresses, contact information, application fees, transportation, and questions for housing providers. Coaches may help participants identify transitional housing, supportive housing, public or subsidized housing resources, recovery residences, shared housing, or private-market options when appropriate. They must not promise placement or misrepresent eligibility.

Criminal-record screening rules and housing restrictions vary. Coaches should not tell a participant that a housing provider''s decision is lawful or unlawful without qualified legal guidance. If a participant believes discrimination or an incorrect record is involved, the coach can help preserve documents, identify the stated reason, and connect with appropriate legal-aid, fair-housing, or agency resources.

Financial stability after release often begins with basic organization: income, benefits, fees, debt, transportation, food, phone service, clothing, identification costs, child support, restitution or other obligations, and emergency needs. The goal is not sophisticated financial planning; it is a realistic picture of what must be paid, what can be delayed, and where assistance may exist.

Budgeting should use actual numbers and participant priorities. Avoid shaming spending or assuming that every missed payment reflects poor motivation. Reentry frequently includes irregular income and competing obligations. Build a short-term survival budget first, then a more stable monthly plan when income becomes predictable.

Daily logistics are part of reentry success. A job can fail because transportation is unreliable. Treatment can be missed because identification or coverage is incomplete. Housing can destabilize because the participant cannot manage several deadlines at once. Coaches can add practical value by helping participants sequence tasks, set reminders, build backup plans, and communicate early when barriers arise.',source_refs='[{"title":"NIJ Five Things About Reentry","url":"https://nij.ojp.gov/topics/articles/five-things-about-reentry"},{"title":"National Reentry Resource Center: Fundamentals of Reentry","url":"https://nationalreentryresourcecenter.org/resources/toolkits/reentry/Part1"},{"title":"National Reentry Resource Center: Reentry Through the Lens of the Returning Individual","url":"https://nationalreentryresourcecenter.org/reentry-through-lens-returning-individual/summary"},{"title":"National Reentry Resource Center: Building Connections to Housing During Reentry","url":"https://nationalreentryresourcecenter.org/resources/report"}]'::jsonb,practice_requirements='["Create a first-30-days housing and financial stability plan with documents, income, transportation, deadlines, referrals, and backup options.","Given five housing denials or screening issues, identify which are coaching tasks and which require agency or legal follow-up."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='housing_financial_reentry'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_course_modules
 set content_md='# Family, Social Reintegration & Community Connection

Reentry affects more than the individual returning home. Family members, children, partners, caregivers, and community members may also be adjusting to changed roles, expectations, stress, and trust. Research and reentry practice emphasize the importance of family and prosocial support, but family involvement must be safe, voluntary, and responsive to the needs of everyone involved.

A coach should not assume that reunification is always appropriate or that family support is automatically available. Some relationships may be strained, unsafe, legally restricted, or simply not desired. Ask the participant what relationships matter, what contact is permitted, what boundaries are needed, and what support would feel constructive.

Rebuilding trust takes time. Practical coaching can include preparing for difficult conversations, clarifying expectations about money or housing, setting boundaries, identifying shared routines, planning parenting contact, and deciding what information the participant wants to share. Coaches should avoid acting as a family therapist, mediator in high-conflict situations, or legal adviser.

Children and parenting require special care. A parent may have custody, visitation, child-support, or reunification requirements that are legally significant. The coach can help organize dates, paperwork, transportation, questions, and goals, but should not interpret court orders or promise that reunification will occur.

Prosocial networks can include family, mentors, faith communities, peer groups, employers, treatment providers, educational settings, cultural communities, recreation, and volunteering. The goal is not to remove all contact with people who have justice histories; it is to help the participant identify relationships and settings that support their chosen goals and obligations.

Community reintegration also involves identity. People returning from incarceration may experience stigma, role changes, grief, shame, or unrealistic pressure to “catch up.” Coaching should emphasize realistic pacing, strengths, dignity, and gradual rebuilding rather than demanding immediate perfection.

When family or community conflict becomes unsafe, coercive, or highly complex, the coach should refer to appropriate family services, legal resources, behavioral-health care, domestic-violence services, or other specialized supports.',source_refs='[{"title":"NIJ Five Things About Reentry","url":"https://nij.ojp.gov/topics/articles/five-things-about-reentry"},{"title":"National Reentry Resource Center: Reentry Through the Lens of the Returning Individual","url":"https://nationalreentryresourcecenter.org/reentry-through-lens-returning-individual/summary"},{"title":"National Reentry Resource Center: Evidence-Based and Promising Practices for Parents and Families","url":"https://nationalreentryresourcecenter.org/resources/evidence-based-and-promising-programs-and-practices-support-parents-who-are-incarcerated"},{"title":"National Reentry Resource Center: Collaborative Comprehensive Case Plans","url":"https://nationalreentryresourcecenter.org/resources/collaborative-comprehensive-case-plans"}]'::jsonb,practice_requirements='["Build a consent-based family reconnection plan that includes goals, boundaries, safe contact, information-sharing limits, and referral triggers.","Create a prosocial network map that includes personal, treatment, employment, education, community, and cultural supports."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='family_social_reintegration'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_course_modules
 set content_md='# Reentry Specialty Applied Capstone

This capstone requires human review.

## Scenario

Marcus is returning to the community after several years of incarceration. He has identification but no current driver''s license, limited savings, temporary housing with a relative, and a supervision schedule that includes several appointments each month. He wants immediate work but is also interested in a skilled trade that requires licensing. He has a history of substance-use treatment and needs to reconnect with medication and behavioral-health care. A potential employer asks about his conviction history, his relative says he must leave within six weeks, and he is uncertain whether a past conviction affects the trade license he wants.

Marcus asks the coach to tell him whether the employer is legally allowed to ask about the conviction, whether he is legally eligible for the occupational license, and whether his supervision officer can change his appointment schedule. He also asks the coach to call the licensing board and identify themselves as his legal representative.

## Required response

Prepare an integrated reentry-coaching plan covering immediate priorities, administrative documents, employment and education, housing, behavioral-health continuity, family/household expectations, transportation, supervision logistics, and community support.

Identify which questions can be addressed through coaching, which require official agency information, which require legal advice, and which require clinical or treatment providers. Show how you would sequence the first 30 days and then the next 60 days without treating employment as the only outcome.

The reviewer should not approve a response that gives individualized legal conclusions, impersonates a legal representative, promises housing or employment, conducts an unauthorized criminal-risk assessment, ignores treatment continuity, or fails to respect participant choice and strengths.',source_refs='[{"title":"NIJ Five Things About Reentry","url":"https://nij.ojp.gov/topics/articles/five-things-about-reentry"},{"title":"SAMHSA Intercept 4: ReEntry","url":"https://www.samhsa.gov/communities/criminal-juvenile-justice/sequential-intercept-model/intercept-4"},{"title":"U.S. Department of Labor: Supporting Reentry Employment and Success","url":"https://www.dol.gov/index.php/resource-library/supporting-reentry-employment-and-success-summary-evidence-adults-and-young-adults"},{"title":"National Reentry Resource Center: Fundamentals of Reentry","url":"https://nationalreentryresourcecenter.org/resources/toolkits/reentry/Part1"},{"title":"National Inventory of Collateral Consequences of Conviction","url":"https://niccc.nationalreentryresourcecenter.org/consequences"},{"title":"National Reentry Resource Center: Reentry Through the Lens of the Returning Individual","url":"https://nationalreentryresourcecenter.org/reentry-through-lens-returning-individual/summary"}]'::jsonb,practice_requirements='["Submit a 30/60/90-day reentry plan that separates coaching tasks, agency tasks, legal referrals, and clinical/treatment continuity.","Identify at least six points in the scenario where a coach could accidentally overstep into legal, correctional, clinical, or case-management authority."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='reentry_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_reentry';
commit;