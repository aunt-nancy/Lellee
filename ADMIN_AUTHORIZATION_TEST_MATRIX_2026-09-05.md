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
3. Confirm `is_lellee_admin()` returns false for the ordinary user and true for Admin through authenticated sessions.
4. Confirm the temporary compatibility policy lets a signed-in user read only their own `admin_user_roles` row and never another user's row.
5. Confirm ordinary users cannot insert, update, or delete `admin_user_roles` records.
6. Confirm Admin access does not grant access to private journals/messages except through separately authorized product workflows.

## Compatibility note
A narrow own-row SELECT policy remains temporarily for older modules still being converted to `is_lellee_admin()`. It exposes only `user_id`, `role`, and `active` for the signed-in user's own row. Remove this compatibility policy after every legacy direct role read has been migrated.
