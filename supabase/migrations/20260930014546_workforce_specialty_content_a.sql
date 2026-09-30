begin;
update public.professional_course_modules
 set content_md='# Strengths, Transferable Skills & Career Direction

A strong workforce plan starts with what the participant can already do, not only with what they lack. Transferable skills are abilities that can be useful across occupations, such as communication, problem solving, teamwork, coordination, time management, customer service, technical skills, caregiving skills, supervision, planning, and resource management.

O*NET provides occupation information covering skills, work activities, abilities, interests, work values, work context, education, and other job requirements. CareerOneStop offers skills and interest tools designed to help job seekers connect their existing strengths to occupations worth exploring. Lellee coaches can use these resources to improve career exploration without pretending that an assessment can determine the one “correct” career.

Experience comes from more than paid employment. Participants may have developed useful skills through caregiving, parenting, military service, volunteering, education, community leadership, recovery, reentry, self-employment, informal work, household management, creative work, training programs, or prior jobs. The coach should help the participant translate those experiences into concrete skills and examples that employers can understand.

Career direction should consider interests, skills, required credentials, local demand, wages, schedule, transportation, physical requirements, accessibility, family responsibilities, values, and growth potential. A job that looks attractive by title may be a poor fit if the schedule, commute, physical demands, or training cost are unrealistic.

Career pathways can help some workers enter and advance in an industry, especially when training leads to recognized credentials and is linked with employers. However, Department of Labor research shows that program impacts vary. A meta-analysis found strong educational gains and gains in industry-specific employment, but only small gains in overall employment and short-term earnings and no meaningful average medium/long-term earnings gains. Lellee therefore does not promise that training alone guarantees better pay.

The coach''s role is to help the participant compare options and build an informed plan. The participant decides what tradeoffs are acceptable and what “better work” means for them.',source_refs='[{"title":"O*NET OnLine","url":"https://www.onetonline.org/"},{"title":"O*NET Transferable Skills","url":"https://www.onetonline.org/find/descriptor/browse/2.B"},{"title":"CareerOneStop","url":"https://www.careeronestop.org/"},{"title":"DOL Meta-Analysis of 46 Career Pathways Impact Evaluations","url":"https://www.dol.gov/resource-library/meta-analysis-46-career-pathways-impact-evaluations-final-report"}]'::jsonb,practice_requirements='["Create a transferable-skills inventory using examples from work, caregiving, education, volunteering, lived experience, and informal responsibilities.","Compare three occupations using required skills, training, wage range, schedule, job outlook, transportation, accessibility, and participant priorities."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='strengths_transferable_skills'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_course_modules
 set content_md='# Targeted Job Search, Resume, Applications & Networking

A job search works better when it is targeted and trackable. CareerOneStop organizes effective job-search work into planning, employer research, networking, finding openings, resumes/applications, and interview preparation. The goal is not to apply to the largest possible number of jobs; it is to improve the fit and quality of applications while maintaining enough activity to create opportunities.

Start with a target. Identify one or two job families or occupations that match the participant''s current skills and near-term goals. Research actual job postings to see recurring duties, skills, credentials, schedules, software, and physical requirements. Use those patterns to shape the resume and application rather than sending the same generic materials everywhere.

A resume should be accurate, relevant, and easy to scan. CareerOneStop recommends highlighting job-relevant skills, accomplishments, training, and experience. Where possible, use concrete examples or results rather than vague descriptions. Do not invent dates, credentials, job titles, references, or accomplishments. Employment gaps can be handled honestly without turning the resume into a detailed explanation of personal history.

Applications require attention to detail. Keep a master record of employment dates, addresses, supervisors where needed, credentials, references, and other facts so applications remain consistent. Before submitting, review job requirements and application instructions. A coach may help organize and proofread but should not falsify answers.

Networking is not asking strangers for favors. It includes reconnecting with prior coworkers, friends, classmates, community contacts, professional associations, alumni, service providers, and employers to learn about opportunities and industries. Informational interviews can help a participant understand a role without asking directly for a job.

American Job Centers provide free job-search assistance, including career counseling, skills assessment, resume help, interview practice, training information, labor-market information, workshops, computers, and other supportive services that vary by location. Coaches should know how to connect participants with these resources rather than duplicating every workforce-system service.

Track applications with the employer, position, date, contact, source, required follow-up, interview status, and outcome. Review patterns over time. If many applications produce no interviews, improve targeting or materials. If interviews occur but offers do not, focus on interview practice and fit. Treat results as data for improvement, not proof of personal worth.',source_refs='[{"title":"CareerOneStop Job Search","url":"https://www.careeronestop.org/JobSearch/job-search.aspx"},{"title":"CareerOneStop Resume Guide","url":"https://www.careeronestop.org/JobSearch/Resumes/resumes.aspx"},{"title":"CareerOneStop American Job Centers","url":"https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx"},{"title":"O*NET OnLine","url":"https://www.onetonline.org/"}]'::jsonb,practice_requirements='["Build a targeted job-search tracker for ten opportunities and record fit, required skills, application date, follow-up, and outcome.","Rewrite a generic resume summary and three duty statements so they reflect a specific job target and concrete evidence without exaggeration."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='job_search_resume'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_course_modules
 set content_md='# Interviews, Personal Information, Disclosure & Employment-Rights Boundaries

Interview preparation should help a participant explain skills, experience, reliability, and fit in clear examples. Practice common questions, short accomplishment stories, questions for the employer, and logistics such as location, transportation, technology, clothing, documents, and arrival time.

One useful structure for behavioral questions is to describe the situation, the task or goal, the action taken, and the result. The point is not to memorize perfect scripts; it is to help the participant retrieve specific examples under pressure.

Disclosure questions can be complicated. Participants may wonder whether to disclose disability, health history, recovery, caregiving responsibilities, criminal history, pregnancy, family circumstances, or another personal matter. Coaches should not make legal decisions for participants or tell them they are required to disclose information without checking applicable law and the actual application question.

Federal employment-discrimination laws enforced by the EEOC prohibit discrimination in covered employment settings on specified bases, including race, color, religion, sex, national origin, age 40 or older, disability, and genetic information. Other federal, state, and local protections may also apply.

For disability specifically, EEOC guidance generally prohibits pre-offer disability-related questions and medical examinations. Employers may ask whether an applicant can perform job duties, with or without reasonable accommodation, and applicants may request accommodation for the hiring process. The exact rules depend on context, so coaches should use current official guidance and refer legal disputes to EEOC, legal aid, an attorney, or another qualified resource.

A participant may choose to disclose information for many reasons, including requesting an accommodation or explaining a work history. Coaching can help them clarify what they want the employer to know, what question is actually being asked, and what wording is accurate. It should not pressure disclosure or concealment.

If a participant believes discrimination occurred, preserve the job posting, application, communications, dates, names, and relevant facts. Help them find official information and appropriate complaint or legal resources. Do not tell them that discrimination definitely occurred unless a qualified authority has made that determination.',source_refs='[{"title":"CareerOneStop Interview Resources","url":"https://www.careeronestop.org/JobSearch/Interview/interview.aspx"},{"title":"EEOC Overview","url":"https://www.eeoc.gov/overview"},{"title":"EEOC Disability Discrimination and Employment Decisions","url":"https://www.eeoc.gov/disability-discrimination-and-employment-decisions"},{"title":"EEOC Pre-Employment Inquiries and Disability","url":"https://www.eeoc.gov/pre-employment-inquiries-and-disability"}]'::jsonb,practice_requirements='["Practice five interview responses using specific examples of skills, problem solving, teamwork, reliability, and learning.","Classify ten disclosure or discrimination questions as interview coaching, accommodation process, official HR inquiry, or legal/EEOC referral."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='interviews_disclosure'
   and course_id=(select id from public.professional_courses where course_key='specialty_workforce_new_beginnings');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_workforce_new_beginnings';
commit;