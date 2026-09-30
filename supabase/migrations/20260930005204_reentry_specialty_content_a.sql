begin;
update public.professional_course_modules
 set content_md='# Reentry Context, Systems & Coaching Scope

Reentry is the transition from incarceration back into the community. Research from the National Institute of Justice shows that successful reentry is more likely when support is individualized, holistic, matched to actual needs, and coordinated across domains such as behavioral health, housing, employment, family, physical health, and supervision.

Lellee Reentry Specialty teaches coaches to support organization, planning, motivation, communication, practical problem-solving, and connection to resources. It does not authorize the coach to act as an attorney, probation or parole officer, clinical provider, housing case manager, benefits adjudicator, or correctional risk assessor.

Risk-Need-Responsivity principles are important to understand because many justice agencies use validated risk and needs assessments to guide services. A Lellee coach should not create a home-made criminogenic-risk score or reinterpret a formal assessment beyond their training. When an authorized agency has already identified needs, the coach may help the participant translate appropriate goals into manageable actions while respecting the agency''s role.

NIJ emphasizes that reentry is not one-size-fits-all. People may face different combinations of behavioral-health needs, substance-use concerns, housing instability, employment barriers, family disruption, financial obligations, transportation problems, identification/document needs, and supervision requirements. The coach should avoid assuming that a justice history tells them what a person needs.

Supervision conditions and court requirements matter, but interpreting their legal meaning is outside coaching scope. Coaches may help participants organize dates, reminders, documents, transportation, questions, and follow-up plans. Questions about legal rights, sentencing, supervision terms, record relief, immigration, or court strategy should be referred to qualified legal resources.

The reentry relationship should be strengths-based and respectful. Criminal history does not define the participant''s identity or future. Goals should recognize skills, work experience, education, family roles, treatment progress, community connections, and protective factors alongside barriers.',source_refs='[{"title":"NIJ Five Things About Reentry","url":"https://nij.ojp.gov/topics/articles/five-things-about-reentry"},{"title":"NIJ Second Chance Act: Screening and Assessment","url":"https://nij.ojp.gov/library/publications/second-chance-act-adult-offender-reentry-demonstration-projects-evidence-based"},{"title":"National Reentry Resource Center: Use Evidence-Based Practices","url":"https://nationalreentryresourcecenter.org/resources/toolkits/reentry/part1/reducing-recidivism/use-evidence-based-practices"},{"title":"National Reentry Resource Center: Collaborative Comprehensive Case Plans","url":"https://nationalreentryresourcecenter.org/resources/collaborative-comprehensive-case-plans"}]'::jsonb,practice_requirements='["Classify twelve reentry requests as coaching, agency/supervision, legal, clinical, housing-placement, or emergency matters and explain the boundary.","Create a strengths-and-needs reentry map that uses existing authorized assessment information without creating a new risk score."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='reentry_scope_systems'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_course_modules
 set content_md='# Documents, Benefits, Collateral Consequences & Referral Boundaries

Reentry often requires rebuilding administrative access. Identification, Social Security documents, birth records, driver''s licensing or state identification, health coverage, benefits, court paperwork, supervision information, and other records can affect whether a participant can access work, housing, treatment, transportation, banking, education, and family services.

A coach can help turn an administrative problem into a sequence: identify the missing document, locate the responsible agency, list what proof is required, prepare questions, identify transportation or digital-access barriers, and schedule follow-up. The coach should not create false documents, submit information without authorization, or claim that an application will be approved.

Benefits and eligibility rules vary by program and jurisdiction. Coaches may help participants locate official eligibility information and organize application tasks, but should not make final eligibility determinations. When a question depends on legal status, conviction type, immigration status, disability determination, family law, or another specialized rule, refer to the appropriate qualified agency or legal resource.

Collateral consequences are laws and regulations that can affect employment, occupational licensing, housing, benefits, civic participation, and other opportunities after a conviction. The National Inventory of Collateral Consequences of Conviction tracks these rules across U.S. jurisdictions. It is a research and navigation resource, not a substitute for individualized legal advice.

Record clearance, sealing, expungement, certificates of rehabilitation, licensing relief, and similar remedies differ significantly across jurisdictions. A coach may help a participant find official or legal-aid resources and organize documents but should not tell them they are eligible unless a qualified source has confirmed it.

Administrative coaching should be practical and precise. Keep a task list, contact log, document checklist, deadlines, and backup plan. When a participant hits a denial, help identify the stated reason and the appropriate appeal, legal, or agency resource rather than assuming discrimination or legal error without evidence.',source_refs='[{"title":"National Inventory of Collateral Consequences of Conviction","url":"https://niccc.nationalreentryresourcecenter.org/consequences"},{"title":"National Reentry Resource Center","url":"https://nationalreentryresourcecenter.org/about-national-reentry-resource-center"},{"title":"SAMHSA Intercept 4: ReEntry","url":"https://www.samhsa.gov/communities/criminal-juvenile-justice/sequential-intercept-model/intercept-4"}]'::jsonb,practice_requirements='["Build a 30-day administrative reentry checklist for identification, health coverage, supervision documents, benefits questions, and referrals.","Given six hypothetical collateral-consequence questions, identify which can be handled by organization/coaching and which require legal or official eligibility guidance."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='documents_benefits_referral'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_course_modules
 set content_md='# Employment, Education & Economic Mobility After Reentry

Employment and education can support stability, purpose, income, and community integration, but research does not support the claim that employment services alone reliably solve reentry. The U.S. Department of Labor''s evidence review found mixed results across adult reentry employment programs, partly because program models, implementation quality, and participant needs vary. Lellee therefore teaches employment as one part of an integrated reentry plan.

A coach can help identify transferable skills from prior work, military service, caregiving, education, vocational training, incarceration-based work or programs, volunteering, and lived experience. The participant may need a short-term income plan and a longer-term career plan; those are not always the same job.

Practical employment support can include resume development, job-search organization, interview practice, transportation planning, scheduling, digital literacy, email/voicemail setup, references, clothing needs, credential research, and follow-up routines. Coaches should avoid making promises about hiring or telling employers what they must legally do.

Background checks, occupational licensing, disclosure rules, and fair-chance protections vary by jurisdiction and occupation. Coaches may help participants identify the question to research and connect with official or legal resources. Legal interpretation belongs with qualified professionals.

Education and training may improve access to better jobs, especially when linked to realistic labor-market opportunities. A coach can help compare cost, time, entry requirements, credential value, transportation, childcare, and whether a program is accredited or recognized.

Employment planning should account for other reentry needs. A person may have difficulty maintaining work without stable housing, behavioral-health care, medication continuity, family arrangements, transportation, or manageable supervision requirements. Integrated planning is more consistent with the reentry evidence than treating a job as the only outcome that matters.',source_refs='[{"title":"U.S. Department of Labor: Supporting Reentry Employment and Success","url":"https://www.dol.gov/index.php/resource-library/supporting-reentry-employment-and-success-summary-evidence-adults-and-young-adults"},{"title":"NIJ Five Things About Reentry","url":"https://nij.ojp.gov/topics/articles/five-things-about-reentry"},{"title":"National Reentry Resource Center: Improving Reentry Education and Employment Outcomes","url":"https://nationalreentryresourcecenter.org/second-chance-act/program-tracks/improving-reentry-education-and-employment-outcomes"},{"title":"National Reentry Resource Center: Reentry Through the Lens of the Returning Individual","url":"https://nationalreentryresourcecenter.org/reentry-through-lens-returning-individual/summary"}]'::jsonb,practice_requirements='["Create a two-stage employment plan separating immediate income needs from a longer-term career pathway.","Compare three training options using cost, time, accreditation/recognition, labor-market fit, barriers, and participant preference."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='employment_education_reentry'
   and course_id=(select id from public.professional_courses where course_key='specialty_reentry');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_reentry';
commit;