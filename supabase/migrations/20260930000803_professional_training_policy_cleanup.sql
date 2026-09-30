begin;

drop policy if exists professional_courses_admin_write on public.professional_courses;
create policy professional_courses_admin_insert on public.professional_courses
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_courses_admin_update on public.professional_courses
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_courses_admin_delete on public.professional_courses
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_modules_admin_write on public.professional_course_modules;
create policy professional_modules_admin_insert on public.professional_course_modules
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_modules_admin_update on public.professional_course_modules
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_modules_admin_delete on public.professional_course_modules
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_assessment_items_admin on public.professional_assessment_items;
create policy professional_assessment_items_admin_select on public.professional_assessment_items
for select to authenticated using (public.is_lellee_admin());
create policy professional_assessment_items_admin_insert on public.professional_assessment_items
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_assessment_items_admin_update on public.professional_assessment_items
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_assessment_items_admin_delete on public.professional_assessment_items
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_enrollments_admin_write on public.professional_enrollments;
create policy professional_enrollments_admin_insert on public.professional_enrollments
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_enrollments_admin_update on public.professional_enrollments
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_enrollments_admin_delete on public.professional_enrollments
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_progress_admin_write on public.professional_module_progress;
create policy professional_progress_admin_insert on public.professional_module_progress
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_progress_admin_update on public.professional_module_progress
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_progress_admin_delete on public.professional_module_progress
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_attempts_admin_write on public.professional_assessment_attempts;
create policy professional_attempts_admin_insert on public.professional_assessment_attempts
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_attempts_admin_update on public.professional_assessment_attempts
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_attempts_admin_delete on public.professional_assessment_attempts
for delete to authenticated using (public.is_lellee_admin());

drop policy if exists professional_capstones_admin_write on public.professional_capstone_submissions;
create policy professional_capstones_admin_insert on public.professional_capstone_submissions
for insert to authenticated with check (public.is_lellee_admin());
create policy professional_capstones_admin_update on public.professional_capstone_submissions
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());
create policy professional_capstones_admin_delete on public.professional_capstone_submissions
for delete to authenticated using (public.is_lellee_admin());

commit;