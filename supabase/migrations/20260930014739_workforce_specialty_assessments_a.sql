begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_workforce_new_beginnings'
   and m.module_key in ('strengths_transferable_skills','job_search_resume','interviews_disclosure')
);
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   1,'multiple_choice','Which is an example of a transferable skill?','["Communication","Problem solving","Time management","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Transferable skills can be used across occupations and industries.','O*NET Transferable Skills','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   2,'scenario','A participant has several years of unpaid caregiving and little recent paid work. What should the coach do?','["Tell them the caregiving years have no workforce value.","Help identify transferable skills such as scheduling, coordination, communication, budgeting, advocacy, and problem solving.","Invent a paid job title for the caregiving work.","Tell them to hide the experience."]'::jsonb,'{"index":1}'::jsonb,'Unpaid experience can contain real skills even when it is not paid employment.','Skills translation principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   3,'multiple_choice','What is a good use of O*NET?','["Guaranteeing a job offer","Exploring occupation requirements, skills, work context, and opportunities","Issuing professional licenses","Determining a person''s legal eligibility for employment"]'::jsonb,'{"index":1}'::jsonb,'O*NET is a career-exploration and job-analysis resource.','O*NET OnLine','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   4,'scenario','A participant likes a career title but the job requires a schedule and commute they cannot realistically manage. What should the coach do?','["Ignore the practical barriers","Compare the full fit, including schedule, transportation, requirements, and participant priorities","Tell them passion is all that matters","Apply without discussing fit"]'::jsonb,'{"index":1}'::jsonb,'Career fit involves more than job title or interest.','Career exploration principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   5,'multiple_choice','Which source of experience may produce transferable skills?','["Volunteering","Caregiving","Military or community service","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Transferable skills can come from many kinds of work and life experience.','O*NET/CareerOneStop','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   6,'multiple_choice','What does DOL research suggest about career-pathway programs on average?','["They guarantee large long-term earnings gains","They often improve educational progress and industry-specific employment, while overall employment and earnings effects can be smaller or mixed","They never help anyone","They eliminate the need for employer engagement"]'::jsonb,'{"index":1}'::jsonb,'DOL''s meta-analysis found strong educational and industry-employment gains but smaller earnings/general employment effects.','DOL career pathways meta-analysis','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   7,'scenario','A participant is choosing between two training programs. Which question matters most?','["Which has the flashiest website?","Whether the credential is recognized, connected to real employers, affordable, completable, and aligned with local demand and participant goals","Which program promises the highest salary in an advertisement","Which one requires the least research"]'::jsonb,'{"index":1}'::jsonb,'Training quality and labor-market connection should be examined rather than assumed.','Career-pathway due diligence','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='strengths_transferable_skills'),
   8,'multiple_choice','Who decides what a better career means for the participant?','["The coach","The participant, informed by realistic information and tradeoffs","The training provider","The participant''s former employer"]'::jsonb,'{"index":1}'::jsonb,'Career planning should remain participant-led.','Participant-centered workforce coaching','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   1,'multiple_choice','A targeted job search means:','["Applying to every opening with the same resume","Focusing on selected occupations/employers and aligning materials with actual job requirements","Only applying through social media","Waiting for employers to contact you"]'::jsonb,'{"index":1}'::jsonb,'Targeting improves relevance and helps the participant learn from results.','CareerOneStop Job Search','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   2,'scenario','A resume has a gap in paid employment. What should the coach do?','["Create a fake employer to fill the gap","Help present relevant skills, training, caregiving, volunteer, or other experience accurately without falsifying history","Tell the participant the gap makes employment impossible","Change dates from prior jobs"]'::jsonb,'{"index":1}'::jsonb,'Resumes should be accurate while highlighting relevant skills and experience.','CareerOneStop resume guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   3,'multiple_choice','Which resume statement is strongest?','["Responsible for things","Helped customers","Resolved an average of 20 customer requests per shift while maintaining accurate records","Hard worker"]'::jsonb,'{"index":2}'::jsonb,'Concrete examples and results provide clearer evidence of experience.','CareerOneStop resume guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   4,'scenario','A participant wants to exaggerate a software skill because the job posting lists it. What should the coach do?','["Encourage exaggeration to get the interview","Keep the resume accurate and identify a fast way to build or document the actual skill","List expert proficiency anyway","Remove all skills from the resume"]'::jsonb,'{"index":1}'::jsonb,'Job-search materials should be truthful and supportable.','Resume integrity principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   5,'multiple_choice','What can American Job Centers provide?','["Free job-search and career assistance","Resume and interview workshops","Training and labor-market information","All of the above"]'::jsonb,'{"index":3}'::jsonb,'AJCs offer a broad range of free workforce services, varying by location.','CareerOneStop American Job Centers','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   6,'scenario','A participant submits many applications but receives no interviews. What is a useful coaching response?','["Tell them to double the number without reviewing anything","Review targeting, resume alignment, qualifications, and application quality for patterns","Tell them they are unemployable","Invent credentials"]'::jsonb,'{"index":1}'::jsonb,'Job-search results can be used as feedback to improve targeting and materials.','Job-search tracking principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   7,'multiple_choice','An informational interview is primarily used to:','["Demand a job","Learn about an occupation, employer, or career path from someone with relevant experience","Negotiate salary before applying","Replace a resume"]'::jsonb,'{"index":1}'::jsonb,'Informational interviews help career exploration and networking.','CareerOneStop networking guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='job_search_resume'),
   8,'scenario','A job application asks for exact employment dates. The participant is unsure. What should the coach do?','["Guess confidently","Help verify records and use accurate information rather than inventing dates","Use different dates on each application","Leave every field blank automatically"]'::jsonb,'{"index":1}'::jsonb,'Applications should be accurate and consistent.','Application integrity principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   1,'multiple_choice','A strong behavioral interview answer usually includes:','["A vague statement that you work hard","A specific situation, action, and result","A long personal history","Criticism of a prior supervisor"]'::jsonb,'{"index":1}'::jsonb,'Specific examples make skills and behavior easier for an employer to evaluate.','Interview preparation principle','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   2,'scenario','A participant asks whether they must disclose a disability before an interview. What should the coach do?','["Tell them disclosure is always mandatory","Explain that disclosure and accommodation questions can involve legal rights and personal choice; use current EEOC guidance and refer legal questions as needed","Tell them never to disclose under any circumstances","Tell the employer on the participant''s behalf"]'::jsonb,'{"index":1}'::jsonb,'Disability disclosure is context-dependent and should not be dictated by a coach.','EEOC disability guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   3,'multiple_choice','Before a conditional job offer, employers generally may not:','["Ask whether the applicant can perform job duties","Ask disability-related questions or require a medical examination, subject to limited exceptions","Ask about relevant work experience","Explain essential job functions"]'::jsonb,'{"index":1}'::jsonb,'EEOC limits pre-offer disability-related inquiries and medical examinations.','EEOC pre-employment disability guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   4,'scenario','An interviewer asks a participant a question that may implicate employment-discrimination law. What should the coach do afterward?','["Declare the employer guilty","Preserve the details and help the participant find EEOC or qualified legal guidance rather than issuing a legal conclusion","Post the employer''s name publicly","Tell the participant to threaten a lawsuit"]'::jsonb,'{"index":1}'::jsonb,'Coaches can document and refer without making legal determinations.','EEOC referral boundary','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   5,'multiple_choice','Federal laws enforced by EEOC protect covered applicants and employees from discrimination based on:','["Race, color, religion, sex, national origin, age 40+, disability, and genetic information","Any personal disagreement","Education level in every circumstance","Credit score in every circumstance"]'::jsonb,'{"index":0}'::jsonb,'These are among the federal protected bases enforced by EEOC.','EEOC Overview','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   6,'scenario','A participant needs an accommodation for the interview process. What can the coach appropriately do?','["Tell the employer which accommodation is legally required","Help the participant identify the access barrier and prepare a request for an accommodation","Pretend to be the participant''s attorney","Tell the participant accommodations are only for current employees"]'::jsonb,'{"index":1}'::jsonb,'Applicants may be entitled to reasonable accommodation in the hiring process.','EEOC ADA employment rights','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   7,'multiple_choice','What is a useful interview-preparation step?','["Practice concise examples of skills and accomplishments","Memorize false answers","Avoid learning anything about the employer","Criticize prior employers"]'::jsonb,'{"index":0}'::jsonb,'Practice improves recall and clarity under interview pressure.','CareerOneStop interview guidance','internal_review',true
  );
insert into public.professional_assessment_items(
   module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active
  ) values (
   (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id
    where c.course_key='specialty_workforce_new_beginnings' and m.module_key='interviews_disclosure'),
   8,'scenario','A participant wants to explain a long caregiving gap in an interview. What is a good coaching approach?','["Tell them to disclose private medical details about the family member","Help prepare a brief, truthful explanation and pivot to relevant skills and readiness for the role","Tell them to deny the gap","Tell them employers are legally required to ignore all gaps"]'::jsonb,'{"index":1}'::jsonb,'Participants can explain work history accurately while protecting unnecessary private details.','Interview coaching principle','internal_review',true
  );
commit;