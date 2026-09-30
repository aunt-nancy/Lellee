begin;

update public.professional_course_reviews
set findings = findings || case review_type
  when 'source' then jsonb_build_object(
    'catalog_source_refs',191,
    'catalog_unique_source_urls',87,
    'source_domains',24,
    'representative_current_pages_validated',true,
    'validated_domains',jsonb_build_array(
      'coachingfederation.org','samhsa.gov','nij.ojp.gov','nationalreentryresourcecenter.org',
      'hud.gov','consumerfinance.gov','nia.nih.gov','acl.gov','effectivehealthcare.ahrq.gov',
      'dol.gov','careeronestop.org','onetonline.org','eeoc.gov','hhs.gov','usich.gov'
    ),
    'automated_review_result','pass_pending_human_signoff'
  )
  when 'curriculum' then jsonb_build_object(
    'catalog_courses',7,
    'catalog_hours',48,
    'catalog_modules',44,
    'content_completeness_check','passed',
    'automated_review_result','pass_pending_human_signoff'
  )
  when 'assessment' then jsonb_build_object(
    'catalog_assessment_items',296,
    'catalog_scenario_items',131,
    'exact_normalized_duplicate_groups',0,
    'near_duplicate_pairs_reviewed',5,
    'near_duplicate_items_rewritten',3,
    'invalid_choice_sets',0,
    'stable_runtime_choice_randomization',true,
    'sample_randomized_correct_position_distribution',jsonb_build_object('0',54,'1',84,'2',88,'3',70),
    'automated_review_result','pass_pending_human_signoff'
  )
  when 'scope' then jsonb_build_object(
    'affirmative_diagnosis_violations',0,
    'affirmative_prescribing_violations',0,
    'affirmative_legal_conclusion_violations',0,
    'guarantee_wording_hits_reviewed_as_guardrails',true,
    'automated_review_result','pass_pending_qualified_human_signoff'
  )
  when 'capstone' then jsonb_build_object(
    'rubric_total_points',100,
    'pass_score',80,
    'critical_failure_can_override_score',true,
    'one_click_approval_disabled',true,
    'scored_human_review_required',true,
    'automated_review_result','pass_pending_human_signoff'
  )
end,
updated_at=now()
where review_type in ('source','curriculum','assessment','scope','capstone');

commit;