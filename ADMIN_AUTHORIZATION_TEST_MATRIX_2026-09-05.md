# Admin Authorization Test Matrix — 2026-09-05

| Area | Non-admin expected | Admin/editor expected |
| --- | --- | --- |
| Program demand | No admin demand load | Demand metrics load |
| Program Builder | Unauthorized state; no save/delete | Full load; save/delete allowed |
| Staff Operations | No admin operations summary or mutations | Summary and admin mutations allowed |
| Revenue Operations | No revenue/admin load or mutations | Revenue/admin tools load and mutations allowed |
| Knowledge Studio | No admin studio load or article creation | Studio loads; article creation allowed |
| Admin navigation | Hidden/inactive | Visible/active through canonical runtime |

## Required production verification
1. Apply the admin authorization migration in Supabase.
2. Test with one ordinary user and one permanent Admin account.
3. Confirm `select public.is_lellee_admin()` returns false for ordinary user and true for Admin when executed through authenticated sessions.
4. Confirm ordinary user cannot directly select from `public.admin_user_roles`.
5. Confirm Admin access does not grant access to private journals/messages except through separately authorized product workflows.
