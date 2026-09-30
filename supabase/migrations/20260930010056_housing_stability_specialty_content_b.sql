begin;
update public.professional_course_modules
 set content_md='# Tenancy Sustainability, Communication & Problem Solving

Housing stability continues after move-in. Rent, utilities, maintenance, communication, household expectations, transportation, health needs, benefits, and income changes can all affect whether housing remains workable.

A housing-stability coach can help participants build simple routines for rent and utility due dates, document storage, maintenance requests, communication, household budgeting, and follow-up. The coach can also help a participant prepare for conversations with a landlord or property manager by clarifying the issue, desired outcome, facts, questions, and documents.

Written records are useful. Participants may benefit from keeping copies of leases, notices, payment records, receipts, maintenance requests, inspection information, emails, and other important communications. Coaches can help organize records without telling participants that a document proves a legal claim.

When money becomes tight, early communication and accurate information may create more options than waiting until a crisis. CFPB renter guidance encourages people struggling with rent to seek rental assistance, housing counseling, and communication about repayment options where appropriate. A coach can help prepare a repayment discussion but should not negotiate legal rights or promise that a landlord must accept a proposed arrangement.

Maintenance problems should be documented factually: what is happening, when it began, photographs if appropriate and safe, prior notices, and the impact on daily use. Whether the condition violates a housing code or lease is a legal or regulatory question that may require a housing authority, code agency, attorney, or other qualified resource.

Accessibility and disability-related requests may involve fair-housing or disability law. Coaches can help participants organize what barrier they are experiencing and locate HUD, housing-counseling, disability-rights, or legal resources. Coaches should not decide whether an accommodation is legally required.

Conflict can escalate when communication becomes accusatory. Coaching can support concise, factual, respectful communication focused on the problem and requested next step. When there is harassment, threats, discrimination, lockout, utility shutoff, eviction filing, or another potentially unlawful or dangerous situation, shift from ordinary coaching to appropriate professional or emergency referral.',source_refs='[{"title":"CFPB Help for Renters","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/"},{"title":"CFPB Get Help Paying Rent and Bills","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/get-help-paying-rent-and-bills/"},{"title":"HUD Housing Counseling","url":"https://www.hud.gov/stat/sfh/housing-counseling"},{"title":"HUD Fair Housing Rights and Obligations","url":"https://www.hud.gov/stat/fheo/rights-obligations"}]'::jsonb,practice_requirements='["Create a tenancy-stability calendar covering rent, utilities, benefits, maintenance follow-up, inspections, document storage, and backup contacts.","Rewrite six emotionally charged landlord or property-manager messages into factual, respectful communication that preserves the participant''s concerns without making legal claims."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='tenancy_sustainability'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_course_modules
 set content_md='# Housing Crisis, Eviction Prevention & Referral Boundaries

Housing crises move quickly. A participant may be behind on rent, receive a demand for payment, face an eviction notice or lawsuit, lose access to utilities, experience unsafe conditions, or have nowhere safe to stay. The coach''s job is to help the participant act quickly and connect with qualified help—not to become the participant''s lawyer.

USICH''s federal homelessness-prevention framework emphasizes preventing housing loss before homelessness occurs and coordinating across housing, health, human services, justice, employment, education, and other systems. Its eviction-prevention work highlights the importance of rental assistance, legal assistance, and cross-system strategies. The evidence for specific prevention models continues to develop, so coaches should use current local resources rather than assume one intervention always works.

When a participant receives an eviction-related notice, preserve the document and record the date received. Help the participant identify deadlines, court information, contact information, rent records, assistance applications, and questions. CFPB guidance specifically directs renters facing eviction to seek rental assistance, communicate where appropriate, understand state/local protections, and obtain legal help for rights questions.

Do not tell the participant whether a notice is legally valid, whether a landlord followed the correct procedure, whether rent is legally owed, whether an eviction defense will succeed, or whether the participant should ignore a court date. Those are legal matters. Refer promptly to legal aid, a tenant attorney, court self-help, fair-housing resources, HUD-approved housing counseling, or other appropriate local services.

If the participant has already lost housing, shift toward immediate safety and stabilization: shelter or temporary options, transportation, medication and health continuity, family or caregiver needs, school stability, documents, communication access, benefits, and coordinated rehousing resources.

Housing emergencies can also include violence, stalking, trafficking, medical danger, unsafe buildings, or other immediate threats. Ordinary coaching stops when immediate safety is at risk. Use emergency services, domestic-violence resources, trafficking resources, crisis services, or other appropriate specialized systems according to the situation and Lellee policy.

The best housing-crisis coaching is calm, factual, fast, and connected. The coach does not promise a result. The coach helps the participant preserve options and get to the right professional or system quickly.',source_refs='[{"title":"USICH Federal Homelessness Prevention Framework","url":"https://www.usich.gov/prevention"},{"title":"USICH Spotlight on Eviction Prevention","url":"https://www.usich.gov/guidance-reports-data/federal-guidance-resources/homelessness-prevention-series-spotlight-eviction"},{"title":"CFPB What to Do if You''re Facing Eviction","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/what-to-do-if-youre-facing-eviction/"},{"title":"CFPB Help if You''ve Lost Housing","url":"https://www.consumerfinance.gov/housing/housing-insecurity/lost-housing/"},{"title":"HUD Housing Counseling","url":"https://www.hud.gov/stat/sfh/housing-counseling"}]'::jsonb,practice_requirements='["Build a 48-hour housing-crisis checklist covering notices, deadlines, documents, rental assistance, housing counseling, legal aid, transportation, and immediate safety.","Classify ten housing crises by the correct response path: ordinary coaching, housing counselor, legal aid/court help, fair-housing complaint resource, or emergency/safety service."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='housing_crisis_referral'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_course_modules
 set content_md='# Housing Stability Specialty Applied Capstone

This capstone requires human review.

## Scenario

Dana is an adult renter with two children. Work hours were recently reduced, and Dana is behind on rent and utilities. Dana received a written notice from the landlord, has also been conditionally approved for a different apartment with a larger deposit after a tenant-screening report was used, and believes the screening report contains an old eviction record that is inaccurate. One child has a disability, and Dana says the current building layout makes daily access difficult. Dana asks the coach to tell them whether the landlord''s notice is legally valid, whether the larger deposit is discrimination, whether the housing provider must approve a requested disability-related change, and whether the coach can call the landlord and threaten legal action.

## Required response

Prepare a housing-stability coaching plan that covers immediate safety, document preservation, rent and utility stabilization, housing counseling, screening-report rights and dispute steps, housing search, budgeting, fair-housing awareness, disability-related referral, communication planning, and legal referral boundaries.

Separate what the coach can help Dana do from what requires a HUD-certified housing counselor, legal aid or attorney, fair-housing resource, government agency, consumer-reporting dispute process, or emergency service. Include a prioritized 48-hour plan and a 30-day housing-stability plan.

The reviewer should not approve a response that interprets the eviction notice, gives a legal conclusion about discrimination or accommodation rights, threatens a housing provider as legal representative, promises rental assistance or housing placement, or ignores screening-report and legal-referral options.',source_refs='[{"title":"CFPB What to Do if You''re Facing Eviction","url":"https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/what-to-do-if-youre-facing-eviction/"},{"title":"CFPB Rental Application Denied Because of Tenant Screening","url":"https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-my-rental-application-is-denied-because-of-a-tenant-screening-report-en-2105/"},{"title":"HUD Fair Housing Act Overview","url":"https://www.hud.gov/helping-americans/fair-housing-act-overview"},{"title":"HUD Fair Housing Rights and Obligations","url":"https://www.hud.gov/stat/fheo/rights-obligations"},{"title":"HUD Housing Counseling","url":"https://www.hud.gov/stat/sfh/housing-counseling"},{"title":"USICH Federal Homelessness Prevention Framework","url":"https://www.usich.gov/prevention"}]'::jsonb,practice_requirements='["Submit a structured 48-hour and 30-day plan separating coaching actions, housing counseling, screening-report dispute, legal/fair-housing referral, and emergency actions.","Identify at least six points in the scenario where a coach could accidentally overstep into legal interpretation, property management, eligibility determination, or advocacy beyond authorization."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='housing_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_housing_stability');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_housing_stability';
commit;