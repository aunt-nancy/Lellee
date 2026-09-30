begin;

create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;

alter function public.get_my_professional_training_context() security invoker;

alter function public.get_my_professional_module(uuid) set schema private;
alter function public.start_my_professional_module(uuid) set schema private;
alter function public.submit_my_professional_assessment(uuid,jsonb,text) set schema private;
alter function public.submit_my_professional_capstone(uuid,jsonb) set schema private;

alter function public.admin_publish_professional_course(text) set schema private;
alter function public.admin_enable_professional_course_checkout(text) set schema private;
alter function public.admin_review_professional_capstone(uuid,text,text) set schema private;
alter function public.admin_verify_professional_course_completion(uuid) set schema private;

revoke all on function private.get_my_professional_module(uuid) from public,anon;
revoke all on function private.start_my_professional_module(uuid) from public,anon;
revoke all on function private.submit_my_professional_assessment(uuid,jsonb,text) from public,anon;
revoke all on function private.submit_my_professional_capstone(uuid,jsonb) from public,anon;
revoke all on function private.admin_publish_professional_course(text) from public,anon;
revoke all on function private.admin_enable_professional_course_checkout(text) from public,anon;
revoke all on function private.admin_review_professional_capstone(uuid,text,text) from public,anon;
revoke all on function private.admin_verify_professional_course_completion(uuid) from public,anon;

grant execute on function private.get_my_professional_module(uuid) to authenticated;
grant execute on function private.start_my_professional_module(uuid) to authenticated;
grant execute on function private.submit_my_professional_assessment(uuid,jsonb,text) to authenticated;
grant execute on function private.submit_my_professional_capstone(uuid,jsonb) to authenticated;
grant execute on function private.admin_publish_professional_course(text) to authenticated;
grant execute on function private.admin_enable_professional_course_checkout(text) to authenticated;
grant execute on function private.admin_review_professional_capstone(uuid,text,text) to authenticated;
grant execute on function private.admin_verify_professional_course_completion(uuid) to authenticated;

create or replace function public.get_my_professional_module(p_module_id uuid)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_my_professional_module(p_module_id) $$;
revoke all on function public.get_my_professional_module(uuid) from public,anon;
grant execute on function public.get_my_professional_module(uuid) to authenticated;

create or replace function public.start_my_professional_module(p_module_id uuid)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.start_my_professional_module(p_module_id) $$;
revoke all on function public.start_my_professional_module(uuid) from public,anon;
grant execute on function public.start_my_professional_module(uuid) to authenticated;

create or replace function public.submit_my_professional_assessment(p_module_id uuid,p_answers jsonb,p_reflection text default null)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.submit_my_professional_assessment(p_module_id,p_answers,p_reflection) $$;
revoke all on function public.submit_my_professional_assessment(uuid,jsonb,text) from public,anon;
grant execute on function public.submit_my_professional_assessment(uuid,jsonb,text) to authenticated;

create or replace function public.submit_my_professional_capstone(p_module_id uuid,p_response jsonb)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.submit_my_professional_capstone(p_module_id,p_response) $$;
revoke all on function public.submit_my_professional_capstone(uuid,jsonb) from public,anon;
grant execute on function public.submit_my_professional_capstone(uuid,jsonb) to authenticated;

create or replace function public.admin_publish_professional_course(p_course_key text)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_publish_professional_course(p_course_key) $$;
revoke all on function public.admin_publish_professional_course(text) from public,anon;
grant execute on function public.admin_publish_professional_course(text) to authenticated;

create or replace function public.admin_enable_professional_course_checkout(p_course_key text)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_enable_professional_course_checkout(p_course_key) $$;
revoke all on function public.admin_enable_professional_course_checkout(text) from public,anon;
grant execute on function public.admin_enable_professional_course_checkout(text) to authenticated;

create or replace function public.admin_review_professional_capstone(p_submission_id uuid,p_status text,p_notes text default null)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_review_professional_capstone(p_submission_id,p_status,p_notes) $$;
revoke all on function public.admin_review_professional_capstone(uuid,text,text) from public,anon;
grant execute on function public.admin_review_professional_capstone(uuid,text,text) to authenticated;

create or replace function public.admin_verify_professional_course_completion(p_enrollment_id uuid)
returns uuid
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_verify_professional_course_completion(p_enrollment_id) $$;
revoke all on function public.admin_verify_professional_course_completion(uuid) from public,anon;
grant execute on function public.admin_verify_professional_course_completion(uuid) to authenticated;

commit;