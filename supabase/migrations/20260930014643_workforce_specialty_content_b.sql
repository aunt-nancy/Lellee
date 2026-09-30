begin;
update public.professional_course_modules
 set content_md='# Workplace Communication, Feedback, Accommodations & Employment Rights

Getting hired is only one part of workforce stability. Employees also need to understand expectations, communicate with supervisors and coworkers, respond to feedback, manage conflict, ask questions, and know when a workplace issue may require specialized support.

Effective workplace communication is usually specific, timely, and focused on the work problem. A participant can prepare for a conversation by identifying what happened, what impact it had, what outcome they want, what information they need, and what next step they are requesting. Coaches can practice wording and role-play conversations without pretending to be the participant''s attorney or HR representative.

Feedback should be separated from identity. A supervisor''s correction about a task is not automatically a judgment about the employee as a person. Coaching can help the participant ask clarifying questions, repeat back expectations, identify what is within their control, and create a follow-up plan. At the same time, coaching should not normalize harassment, discrimination, unsafe conditions, wage problems, or retaliation.

Federal laws enforced by the EEOC prohibit discrimination in covered employment settings on specified protected bases and also prohibit retaliation for exercising protected rights. A coach should know the basic categories and know how to refer participants to EEOC or qualified legal resources, but should not issue legal conclusions about whether a specific workplace event is unlawful.

Reasonable accommodation is one area where accurate guidance matters. EEOC explains that qualified applicants and employees with disabilities may be entitled to reasonable accommodation unless it would impose undue hardship on the employer. Accommodations may include changes to equipment, schedules, job structure, training, communication, leave, or workplace accessibility depending on the situation.

The participant generally needs to make the employer aware that an accommodation is needed. A formal legal phrase is not always required, but the exact process can vary by employer and situation. Coaches can help the participant identify the work barrier, describe what change may help, organize documentation questions, and prepare for the interactive process. They should not determine whether someone legally qualifies as disabled, decide what accommodation the employer must provide, or advise on litigation.

If a participant reports discrimination, harassment, retaliation, or an accommodation dispute, preserve relevant communications, policies, dates, names, and facts, and help connect them with HR, union representation where applicable, EEOC, vocational rehabilitation, disability-rights resources, or legal advice depending on the issue.',source_refs='[{"title":"EEOC Disability Discrimination and Employment Decisions","url":"https://www.eeoc.gov/disability-discrimination-and-employment-decisions"},{"title":"EEOC ADA Employment Rights","url":"https://www.eeoc.gov/publications/ada-your-employment-rights-individual-disability"},{"title":"EEOC Prohibited Employment Policies and Practices","url":"https://www.eeoc.gov/prohibited-employment-policiespractices"},{"title":"EEOC Know Your Rights: Workplace Discrimination Is Illegal","url":"https://www.eeoc.gov/know-your-rights-workplace-discrimination-illegal"}]'::jsonb,practice_requirements='["Role-play four workplace conversations involving feedback, scheduling, performance expectations, and conflict using factual, specific language.","Given eight accommodation or discrimination scenarios, identify what belongs in coaching, HR/workplace process, vocational rehabilitation, EEOC, or legal referral."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='workplace_communication_accommodations'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_course_modules
 set content_md='# Job Retention, Scheduling, Financial Stability & Career Growth

A job becomes useful only if it can be sustained and supports the participant''s goals. Retention may depend on transportation, childcare, caregiving, health, sleep, work schedule, treatment appointments, technology, workplace relationships, attendance routines, and whether the job provides enough stability to meet basic needs.

Help the participant build a first-30-days work plan. Include start time, commute, backup transportation, uniform or equipment needs, meals, childcare, medication or health routines, phone access, emergency contacts, payroll setup, and how to report an absence or delay. Small logistics can have large effects on whether employment lasts.

Job quality also matters. The U.S. Departments of Labor and Commerce identify Good Jobs principles that include fair recruitment and hiring, benefits, worker voice, job security, safe working conditions, equitable pay, and opportunities to build skills and advance. Lellee coaches can use these principles as a discussion framework when participants compare opportunities, while recognizing that people sometimes need short-term work that does not meet every ideal.

Financial planning should connect employment to real life. CFPB defines financial well-being in terms of day-to-day control, ability to absorb financial shocks, progress toward goals, and freedom of choice. A simple monthly budget can compare income with housing, utilities, food, transportation, health costs, childcare, communication, debt, and other spending.

Do not assume a higher hourly wage always produces a better overall outcome. A schedule may reduce childcare access, increase transportation costs, affect benefits, or create other tradeoffs. Coaches can help participants list these tradeoffs and identify questions for benefits counselors, tax professionals, HR, or financial counselors when the issue becomes specialized.

Career growth should be intentional rather than automatic. Ask what the participant wants to learn, what credential or experience is actually valued in the target industry, whether training is recognized, what it costs, how long it takes, and what evidence exists that it connects to real jobs.

DOL research on career pathways shows meaningful educational and industry-specific employment gains on average, but smaller effects on overall employment and earnings and mixed results across programs. Participants should compare training quality, employer links, completion requirements, costs, support services, and local demand rather than assuming any credential will produce advancement.

Retention and advancement are different goals. First stabilize the current job if appropriate; then build a next-step plan for skills, wages, responsibility, schedule, benefits, or a better-fit role.',source_refs='[{"title":"DOL and Commerce Good Jobs Principles","url":"https://www.dol.gov/newsroom/releases/osec/osec20220621"},{"title":"DOL Meta-Analysis of 46 Career Pathways Impact Evaluations","url":"https://www.dol.gov/resource-library/meta-analysis-46-career-pathways-impact-evaluations-final-report"},{"title":"CFPB Monthly Budget","url":"https://files.consumerfinance.gov/f/documents/cfpb_well-being_monthly-budget.pdf"},{"title":"CFPB Financial Well-Being","url":"https://www.consumerfinance.gov/consumer-tools/financial-well-being/about/"},{"title":"CareerOneStop American Job Centers","url":"https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx"}]'::jsonb,practice_requirements='["Build a first-30-days job-retention plan covering transportation, schedule, health, childcare/caregiving, communication, payroll, and backup options.","Compare two job offers using wage, hours, benefits, commute, job security, working conditions, advancement, training, and total household impact."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='retention_budget_career'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_course_modules
 set content_md='# Workforce & New Beginnings Specialty Applied Capstone

This capstone requires human review.

## Scenario

Monique is returning to the workforce after several years spent caregiving for family. She has strong organization, budgeting, scheduling, conflict-resolution, and customer-service skills but little recent paid employment. She is considering three options: an entry-level office job with predictable hours and benefits, a higher-paying warehouse job with an overnight schedule and long commute, and a six-month training program that advertises a pathway into health-care administration.

Monique also has a disability that sometimes requires schedule flexibility for treatment. She is unsure whether to disclose the disability during interviews. At one interview, a hiring manager asks detailed questions about her medical history. She later receives an offer from another employer but is unsure whether the schedule will work with her caregiving obligations. The training program costs several thousand dollars and claims graduates “usually double their income,” but provides limited public outcome data.

Monique asks the coach to tell her whether the interview question was illegal, whether the employer is legally required to give her the exact schedule accommodation she wants, and whether the training program''s advertising guarantees a good financial return.

## Required response

Prepare a workforce-coaching plan that addresses transferable skills, resume positioning, targeted job search, interview preparation, disability-disclosure and accommodation boundaries, job-quality comparison, caregiving/schedule fit, budgeting, training-program due diligence, retention planning, and career advancement.

Separate what belongs in coaching from what requires HR, EEOC, vocational-rehabilitation, legal, benefits, financial, or other qualified professional guidance. Include a 30-day job-search plan and a 90-day career-development plan.

The reviewer should not approve a response that makes legal conclusions about discrimination or accommodation entitlement, guarantees training ROI, tells Monique she must disclose disability during interviewing, ignores caregiving or transportation realities, or treats the highest hourly wage as automatically the best job.',source_refs='[{"title":"O*NET OnLine","url":"https://www.onetonline.org/"},{"title":"CareerOneStop Job Search","url":"https://www.careeronestop.org/JobSearch/job-search.aspx"},{"title":"EEOC Disability Discrimination and Employment Decisions","url":"https://www.eeoc.gov/disability-discrimination-and-employment-decisions"},{"title":"EEOC Pre-Employment Inquiries and Disability","url":"https://www.eeoc.gov/pre-employment-inquiries-and-disability"},{"title":"DOL and Commerce Good Jobs Principles","url":"https://www.dol.gov/newsroom/releases/osec/osec20220621"},{"title":"DOL Meta-Analysis of 46 Career Pathways Impact Evaluations","url":"https://www.dol.gov/resource-library/meta-analysis-46-career-pathways-impact-evaluations-final-report"},{"title":"CFPB Financial Well-Being","url":"https://www.consumerfinance.gov/consumer-tools/financial-well-being/about/"}]'::jsonb,practice_requirements='["Submit a structured response comparing the three options and separating coaching, employment-rights, accommodation, financial, and training-program questions.","Identify at least six places where a workforce coach could accidentally overstep into legal advice, HR authority, disability determination, benefits counseling, or financial guarantees."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='workforce_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_workforce_new_beginnings';
commit;