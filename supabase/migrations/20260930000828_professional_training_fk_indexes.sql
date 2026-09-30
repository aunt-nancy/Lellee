begin;
create index if not exists professional_assessment_attempts_module_fk_idx
  on public.professional_assessment_attempts(module_id);
create index if not exists professional_capstone_submissions_reviewer_fk_idx
  on public.professional_capstone_submissions(reviewer_id);
create index if not exists professional_course_modules_reviewed_by_fk_idx
  on public.professional_course_modules(reviewed_by);
create index if not exists professional_enrollments_training_record_fk_idx
  on public.professional_enrollments(training_record_id);
create index if not exists professional_enrollments_verified_by_fk_idx
  on public.professional_enrollments(verified_by);
create index if not exists professional_module_progress_reviewed_by_fk_idx
  on public.professional_module_progress(reviewed_by);
commit;