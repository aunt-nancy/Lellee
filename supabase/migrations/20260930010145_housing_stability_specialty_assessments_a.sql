begin;
delete from public.professional_assessment_items
where module_id in (
 select m.id from public.professional_course_modules m
 join public.professional_courses c on c.id=m.course_id
 where c.course_key='specialty_housing_stability'
   and m.module_key in ('housing_scope_instability','housing_readiness_budget','search_applications_fair_housing')
);
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    1,'multiple_choice','Which statement best describes housing stability?','["Having any roof for one night","Housing that can be obtained and sustained in a way that works with affordability, safety, accessibility, income, and other needs","Owning a home","Living without any public assistance"]'::jsonb,'{"index":1}'::jsonb,'Housing stability involves both obtaining and sustaining workable housing.','Housing stability principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    2,'scenario','A participant asks the coach to decide whether an eviction notice is legally valid. What should the coach do?','["Interpret the notice","Help preserve the notice and organize questions while referring legal interpretation to qualified legal help","Tell the participant to ignore it","Call the landlord as legal counsel"]'::jsonb,'{"index":1}'::jsonb,'Legal interpretation is outside coaching scope.','HUD/CFPB referral boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    3,'multiple_choice','What is one role of a HUD-approved housing counselor?','["Issuing court orders","Providing independent housing advice and helping address housing barriers","Guaranteeing rental assistance","Approving every accommodation request"]'::jsonb,'{"index":1}'::jsonb,'HUD-approved counselors provide specialized housing counseling.','HUD Housing Counseling','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    4,'multiple_choice','Which statement about homelessness prevention evidence is most accurate?','["Every prevention strategy has equally strong evidence","The federal prevention framework identifies promising practices, while prevention evidence is still developing","There is no research on homelessness","Only emergency shelter is evidence-based"]'::jsonb,'{"index":1}'::jsonb,'USICH notes that prevention research remains less developed than some rehousing evidence.','USICH Prevention/Research','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    5,'scenario','A participant has housing, transportation, caregiving, and health barriers. What is the best coaching approach?','["Focus only on rent","Build an integrated plan that recognizes how the needs interact","Tell the participant to solve health first no matter what","Ignore non-housing issues"]'::jsonb,'{"index":1}'::jsonb,'Housing stability often depends on connected practical systems.','Cross-system prevention principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    6,'multiple_choice','Which task is appropriate for a housing-stability coach?','["Promising placement","Organizing documents, deadlines, budgets, questions, and referrals","Issuing a legal opinion","Determining voucher eligibility"]'::jsonb,'{"index":1}'::jsonb,'Practical planning is within coaching scope; legal and eligibility decisions are not.','Housing coaching scope','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    7,'multiple_choice','Housing First is best described as:','["A coaching technique","An evidence-supported housing system/program approach that reduces unnecessary preconditions to permanent housing","A legal right to any requested apartment","A budgeting worksheet"]'::jsonb,'{"index":1}'::jsonb,'Housing First is a program/system model, not an individual coaching credential.','USICH Housing First evidence','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_scope_instability'),
    8,'scenario','A participant asks whether a building is required to approve a disability accommodation. What should the coach do?','["Give a legal yes/no answer","Help organize the barrier and request, and refer legal/right-to-accommodation questions to appropriate HUD, disability-rights, housing-counseling, or legal resources","Tell the participant accommodations are never required","Approve it on behalf of the landlord"]'::jsonb,'{"index":1}'::jsonb,'Accommodation rights are legal questions outside coaching scope.','HUD fair-housing boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    1,'multiple_choice','A housing-readiness file may include:','["Identification and income documentation","References and prior addresses","Application-fee and transportation planning","All of the above"]'::jsonb,'{"index":3}'::jsonb,'Organized application information reduces avoidable search friction.','Housing readiness principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    2,'scenario','A participant can afford rent on paper but has high transportation and childcare costs. What should the coach do?','["Ignore those costs","Include actual recurring expenses when evaluating sustainability","Use a fixed national rent percentage and stop there","Tell them to eliminate childcare"]'::jsonb,'{"index":1}'::jsonb,'A realistic housing budget should reflect the participant''s actual obligations.','Budgeting principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    3,'multiple_choice','Why should a coach avoid guaranteeing that a budget means an application will be approved?','["Because budgets are illegal","Because landlords and programs use their own criteria and other factors may affect decisions","Because income never matters","Because only lawyers can use budgets"]'::jsonb,'{"index":1}'::jsonb,'Budgeting supports planning but does not determine eligibility or approval.','Housing readiness boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    4,'scenario','A participant wants to apply to ten apartments with application fees in one week. What is a useful coaching step?','["Encourage paying every fee immediately","Help verify basic criteria first when possible and plan the search budget","Tell them never to apply","Pay the fees for them"]'::jsonb,'{"index":1}'::jsonb,'Application costs can become a material housing-search barrier.','Housing search planning','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    5,'multiple_choice','Which is a good reason to use a HUD-approved housing counselor?','["To receive independent help with rental barriers, budgeting, credit, or housing options","To guarantee a lease","To override landlord decisions","To issue legal judgments"]'::jsonb,'{"index":0}'::jsonb,'HUD counseling can provide specialized housing guidance.','HUD Housing Counseling','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    6,'multiple_choice','What is the purpose of a backup housing plan?','["To assume the preferred housing will fail","To preserve alternatives if the first option is unavailable or delayed","To replace participant choice","To avoid all applications"]'::jsonb,'{"index":1}'::jsonb,'Alternative options reduce disruption when housing searches change.','Housing readiness principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    7,'scenario','A participant has inconsistent income. What is the strongest budgeting approach?','["Use the highest recent paycheck as guaranteed income","Build a conservative budget using reliable income and identify variability and backup resources","Ignore income variability","Assume assistance will cover the difference"]'::jsonb,'{"index":1}'::jsonb,'Sustainability planning should use realistic, supportable numbers.','Budgeting principle','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='housing_readiness_budget'),
    8,'multiple_choice','Which item should generally be tracked during a housing search?','["Deposit and application fee","Utilities and transportation","Eligibility questions and status","All of the above"]'::jsonb,'{"index":3}'::jsonb,'A complete housing-search picture includes total costs and application status.','Housing search planning','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    1,'multiple_choice','A tenant screening report may contain:','["Credit information","Rental or eviction history","Employment or criminal-history data","All of the above"]'::jsonb,'{"index":3}'::jsonb,'CFPB identifies several types of information that may appear in tenant screening reports.','CFPB Tenant Screening','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    2,'scenario','A rental application is denied because of a tenant screening report. What right may the applicant have under the FCRA?','["No right to know anything","An adverse-action notice with the screening company''s information and a right to request a free report and dispute inaccuracies","A guaranteed lease","Automatic deletion of all negative information"]'::jsonb,'{"index":1}'::jsonb,'FCRA protections include notice and dispute rights when a consumer report affects a decision.','CFPB/FTC tenant screening','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    3,'multiple_choice','Which current federal protected classes are listed under the Fair Housing Act?','["Race, color, national origin, religion, sex, familial status, disability","Age, income, education, employment, credit score","Only race and disability","Any characteristic a renter chooses"]'::jsonb,'{"index":0}'::jsonb,'HUD lists these seven protected classes under the Fair Housing Act.','HUD Fair Housing Act overview','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    4,'scenario','A participant believes a rental denial was discriminatory. What should the coach do?','["Declare that discrimination occurred","Help document what happened and refer the participant to HUD/FHEO, fair-housing, or legal resources for evaluation","Threaten the landlord","Post the allegation publicly"]'::jsonb,'{"index":1}'::jsonb,'Coaches can preserve facts and connect to qualified fair-housing resources without making legal findings.','HUD FHEO boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    5,'multiple_choice','What should a participant do if a screening report contains inaccurate information?','["Ignore it","Use the consumer-report dispute process and preserve supporting documents","Alter the report themselves","Tell the coach to contact the court as an attorney"]'::jsonb,'{"index":1}'::jsonb,'FCRA provides dispute rights for inaccurate consumer-report information.','CFPB/FTC tenant screening','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    6,'scenario','A landlord requires a larger deposit after relying on a tenant screening report. Under FCRA guidance, this can be:','["Never an adverse action","A form of adverse action that may trigger notice requirements","A criminal offense in every case","Proof of housing discrimination"]'::jsonb,'{"index":1}'::jsonb,'CFPB/FTC describe less favorable terms such as larger deposits as possible adverse actions.','CFPB/FTC tenant screening','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    7,'multiple_choice','Why should coaches use current official sources for screening and housing-rights questions?','["Because housing rules and guidance can change by law and jurisdiction","Because old rules are always correct","Because social media is more authoritative","Because no laws apply to rentals"]'::jsonb,'{"index":0}'::jsonb,'Current official information is important because legal rules vary and change.','Legal-information boundary','internal_review',true
  );
insert into public.professional_assessment_items(module_id,item_order,item_type,prompt,choices,correct_answer,rationale,source_note,review_status,active)
  values(
    (select m.id from public.professional_course_modules m join public.professional_courses c on c.id=m.course_id where c.course_key='specialty_housing_stability' and m.module_key='search_applications_fair_housing'),
    8,'scenario','A participant asks the coach to remove an accurate negative item from a screening report. What should the coach say?','["Promise it can be deleted","Explain that dispute processes address inaccurate or outdated information and refer legal questions about other remedies to qualified resources","Create a false correction letter","Tell the screening company the item is inaccurate without evidence"]'::jsonb,'{"index":1}'::jsonb,'Coaches should support legitimate dispute processes without misrepresentation.','CFPB tenant screening','internal_review',true
  );
commit;