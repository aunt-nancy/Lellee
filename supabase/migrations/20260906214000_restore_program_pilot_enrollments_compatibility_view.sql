-- Read-only compatibility for the legacy pilot runtime.
-- Canonical enrollment storage remains public.program_enrollments.
-- security_invoker=true preserves the underlying own-row RLS policy.

create or replace view public.program_pilot_enrollments
with (security_invoker=true)
as
select id,user_id,program_id,status,enrolled_at
from public.program_enrollments;

grant select on public.program_pilot_enrollments to authenticated;
revoke all on public.program_pilot_enrollments from anon;
