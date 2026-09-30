begin;
update public.professional_course_modules
 set content_md='# Housing Instability, Stability & Coaching Scope

Housing stability is more than having a roof for one night. It includes the ability to obtain, sustain, and retain housing that is safe enough, affordable enough, accessible enough, and workable with the participant''s income, health, transportation, family responsibilities, and other needs.

Federal homelessness policy distinguishes between helping people exit homelessness and preventing housing loss before homelessness occurs. USICH''s current homelessness-prevention framework emphasizes cross-system prevention, coordination, lived-experience input, and practical connections across housing, health, human services, justice, education, employment, and emergency systems. The evidence base is not equally strong for every prevention strategy, so Lellee teaches coaches to use established housing-support practices without claiming that every intervention is proven to prevent homelessness.

Housing First has a strong evidence base for helping many people experiencing homelessness access permanent housing without requiring treatment compliance or sobriety as a precondition. A Lellee coach should understand the principle of reducing unnecessary barriers, while recognizing that Housing First is a system/program model and not something an individual coach independently delivers.

The Lellee housing-stability coach helps with practical planning: clarifying housing goals, organizing documents, estimating affordability, building application routines, preparing questions, improving communication, tracking deadlines, identifying housing counseling or rental-assistance resources, and helping participants act on accurate information.

The coach does not provide legal advice, represent a participant in eviction court, promise housing placement, make eligibility decisions for subsidized housing, approve reasonable accommodations, decide whether discrimination occurred, or act as a property manager. Questions about legal rights, eviction defenses, lease interpretation, fair-housing violations, disability accommodations, or program eligibility should be referred to qualified legal, housing-counseling, or official agency resources.

Housing instability often overlaps with health, employment, caregiving, reentry, disability, family conflict, and financial stress. Effective coaching recognizes those interactions instead of treating housing as a single isolated problem.',source_refs='[{"title":"USICH Federal Homelessness Prevention Framework","url":"https://www.usich.gov/prevention"},{"title":"USICH Evidence Behind Approaches That Drive an End to Homelessness","url":"https://www.usich.gov/guidance-reports-data/federal-guidance-resources/evidence-behind-approaches-drive-end-homelessness"},{"title":"HUD Housing Counseling","url":"https://www.hud.gov/stat/sfh/housing-counseling"},{"title":"CFPB Help for Renters","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/"}]'::jsonb,practice_requirements='["Classify twelve housing requests as coaching, HUD housing counseling, legal, property-management, program-eligibility, or emergency matters.","Create a housing-stability map showing housing, income, transportation, health, family, accessibility, and other interacting needs without turning it into a predictive score."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='housing_scope_instability'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_course_modules
 set content_md='# Housing Readiness, Documents, Budgeting & Affordability

A strong housing search begins before the first application. Housing-readiness coaching helps a participant organize the information and practical resources needed to apply efficiently and compare options realistically.

A housing-readiness file may include identification, contact information, income documentation, benefits statements, employment information, references, prior addresses, rental history, application-fee planning, transportation, accessibility needs, household composition, and questions for the housing provider. Required documents vary by provider and program, so the coach should help the participant obtain accurate instructions rather than assume every application is the same.

Budgeting should be based on actual income and actual recurring obligations. Review rent, utilities, transportation, food, phone, childcare, health costs, debt payments, supervision or court-related obligations where applicable, and other recurring expenses. The goal is not to declare what someone “should” be able to afford based on a generic percentage; the goal is to identify what is sustainable for that participant and what tradeoffs or assistance may be necessary.

HUD-approved housing counseling agencies can provide independent advice about housing barriers, rental issues, financial management, budgeting, credit, and other housing needs. A Lellee coach should know when the participant would benefit from specialized housing counseling rather than trying to become a substitute housing counselor.

Credit and tenant-screening information can affect rental access. Before applying, participants may benefit from reviewing credit information and, when available, tenant-screening information for errors. Coaches can help build a checklist and dispute workflow, but should not promise that correcting a report will guarantee approval.

Application costs matter. Repeated application fees, deposits, transportation, document fees, and time off work can make a housing search expensive. Help participants plan where and when to apply, verify basic criteria before paying fees when possible, keep copies of submissions, and track outcomes.

Housing readiness should also include a backup plan. If the preferred option is unavailable, identify alternative neighborhoods, unit types, household arrangements, assistance programs, housing counselors, shelters or temporary options when appropriate, and the next contact to make.',source_refs='[{"title":"HUD About Housing Counseling","url":"https://www.hud.gov/hud-partners/single-family-about-housing-counseling"},{"title":"CFPB Help for Renters","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/"},{"title":"CFPB Tenant Background Checks","url":"https://www.consumerfinance.gov/rules-policy/tenant-background-checks/"},{"title":"CFPB Review Your Rental Background Check","url":"https://www.consumerfinance.gov/rules-policy/tenant-background-checks/review-your-rental-background-check/"}]'::jsonb,practice_requirements='["Build a rental-readiness file checklist and a one-month housing-search budget including application costs, deposits, transportation, utilities, and backup options.","Review three fictional budgets and identify which questions should be explored before calling a unit financially sustainable."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='housing_readiness_budget'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_course_modules
 set content_md='# Housing Search, Applications, Tenant Screening & Fair-Housing Awareness

A housing search works better when it is organized. Participants can track the property, address, rent, utilities, deposit, application fee, eligibility criteria, accessibility needs, contact person, application date, screening company, response, and next step. This reduces duplicate work and makes it easier to follow up.

Tenant screening reports may include credit history, rental history, eviction filings, employment verification, criminal-history information, and other data. CFPB and FTC guidance explain that the Fair Credit Reporting Act gives renters rights when a consumer report influences a negative rental decision. An adverse action may include denial, a larger deposit, a co-signer requirement, or another less favorable term. The applicant generally has a right to learn which reporting company supplied the information, request a free copy within the applicable period, and dispute inaccurate information.

A coach can help a participant request the report, organize supporting documents, write down disputed items, and track the dispute. The coach should not alter records, tell the screening company what it is legally required to remove beyond official guidance, or guarantee a different housing decision.

Fair-housing awareness is also important. The Fair Housing Act prohibits housing discrimination because of race, color, national origin, religion, sex, familial status, and disability. Other federal, state, and local laws may provide additional protections. A coach should know these basic protected classes and recognize when a participant''s concern needs referral to HUD, a fair-housing organization, legal aid, or another qualified resource.

Do not turn fair-housing awareness into amateur legal practice. A coach may help document what happened, preserve notices, identify dates and witnesses, and locate the appropriate complaint or legal resource. Whether a particular action violates the law depends on facts and applicable law.

Criminal-history, eviction-history, credit, and screening rules are especially complex and can change. Use current official guidance and refer legal questions rather than relying on remembered rules, social media, or another participant''s experience.',source_refs='[{"title":"HUD Fair Housing Act Overview","url":"https://www.hud.gov/helping-americans/fair-housing-act-overview"},{"title":"HUD Fair Housing Rights and Obligations","url":"https://www.hud.gov/stat/fheo/rights-obligations"},{"title":"CFPB Rental Application Denied Because of Tenant Screening","url":"https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-my-rental-application-is-denied-because-of-a-tenant-screening-report-en-2105/"},{"title":"FTC Tenant Background Checks and Your Rights","url":"https://consumer.ftc.gov/articles/tenant-background-checks-and-your-rights"},{"title":"CFPB What Is a Tenant Screening Report?","url":"https://www.consumerfinance.gov/ask-cfpb/what-is-a-tenant-screening-report-en-2102/"}]'::jsonb,practice_requirements='["Create a rental-search tracker that includes screening, fees, eligibility questions, accessibility needs, application status, and follow-up.","Given six hypothetical denials or screening problems, identify which steps are document organization, consumer-report dispute, fair-housing referral, or legal referral."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='search_applications_fair_housing'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_housing_stability';
commit;