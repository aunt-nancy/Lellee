# Lellee Trusted Circle functional-backend checkpoint - September 6, 2026

## Applied status

The six missing approved Trusted Circle tables and three dashboard summary entry points are restored in Supabase project `vnfjszmhmcxkxegzvivg`.
This is a database functionality/security checkpoint, not completion of the whole Trusted Circle interface, all platform security, or launch.
No HTML, JavaScript, CSS, logo, palette, approved price, Stripe connection, password-reset URL, or device-pairing change was made.
Source tracking is PR #11 on `security/revoke-anon-secdef-20260906`; this report does not claim that PR is merged.

Applied migration history:
- `restore_circle_selected_content_20260906`: `20260906173126`.
- `restore_circle_dashboard_queries_20260906`: `20260906173646`.

Repository SQL:
- `supabase/migrations/20260906183000_restore_circle_selected_content.sql`.
- `supabase/migrations/20260906183100_restore_circle_dashboard_queries.sql`.
- Repeatable test: `supabase/tests/launch_circle_selected_content.sql`.

## Restored components

| Component | Verified database behavior |
| --- | --- |
| `trusted_circle_shared_tasks` | Owner-selected tasks; recipient requires current explicit task-sharing permission; narrow supporter progress/completion response |
| `trusted_circle_shared_appointments` | Owner-selected appointments; recipient requires current explicit appointment permission |
| `trusted_circle_checkins` | Explicit practical check-in requests to an accepted supporter; narrow acknowledgment/completion response |
| `trusted_circle_emergency_contacts` | Owner-only records; automatic contact remains disabled |
| `program_collaboration_settings` | Program and role/category gates, read-only for ordinary users, changes require the Admin rule |
| `trusted_circle_guardrails` | Read-only documented privacy boundaries |
| `get_my_trusted_circle_summary()` | Caller-scoped owner summary of people, grants, selected records and own emergency contacts |
| `get_my_supporter_dashboard()` | Caller-scoped invitations, accepted relationships and currently accessible selected records |
| `get_collaboration_operations_summary()` | Admin-only relationship/permission metadata, role/scope catalog and program/guardrail summary; no private content or phone records |

The approved SUPER-build artifact and existing `trusted-circle.js` response contracts guided restoration. Historical broad policies were not replayed.
The original artifact's enabled Recovery program setting was preserved as a backend default; other program rows are disabled pending program review. No other program was activated, and Recovery was not made the platform's primary public identity.
The production `profiles` table is absent. These summaries use the original generic fallback labels (Trusted person/Lellee user), not invented display names or an exposed Auth email directory. A verified participant-label source remains part of interface completion.

## Access boundaries

Each new data table has RLS and operation-specific privileges. Owners can create, edit permitted fields and delete their selected records, including retaining/removing their own history after revocation. They cannot reassign a saved record's owner, recipient, program or creation timestamp.
Creation locks the relationship and requires a matching accepted active relationship, valid role and applicable enabled program. A missing program field adopts a program-scoped relationship's program; a conflicting explicit program is rejected.
Tasks and appointments are not exposed merely because a relationship exists. Reads require the matching live explicit scope grant, correct owner/program, valid time window and current consent. Expired, future, paused and revoked grants block subsequent access.
The check-in table is NOT private daily check-ins, mood, journals or safety history. It contains only a practical request the owner explicitly creates for that supporter. It does not reuse task/appointment scope permissions. Cancelling that request, pausing/revoking the relationship, an inactive role, or newer consent blocks supporter access.
A renewed invitation/acceptance does not revive previously selected content. Freshly selected records and applicable fresh grants are required.
Supporters cannot directly rewrite or delete owner content. `respond_trusted_circle_item(text,uuid,text,text)` checks the caller, locks the relationship/item and permits only task in-progress/completed or practical check-in acknowledged/completed. Owner-assigned tasks cannot be completed by the supporter. Completed/cancelled items cannot be changed through replay.
Emergency records are not returned to supporters or to an unrelated platform Admin. No automatic contact, message delivery, crisis notification, file upload, payment or private-source-table access was activated.
The three summary entry points and shared summary helper are SECURITY INVOKER with fixed empty search paths; caller RLS still applies. The Admin summary independently requires `is_lellee_admin()` and only reads metadata.

## Executed verification

A rollback-only smoke test passed at `2026-09-06T17:37:41.468073Z`: invite, accept, create all four record types, create explicit grants, load both dashboards and complete a shared task.
The complete role-simulation regression passed at `2026-09-06T17:41:51.517282Z`: **30 grouped results passed**.
Five synthetic identities were used: two owners, two supporters and an unrelated user. The existing Admin was checked without creating another Admin. Tests used actual PostgreSQL authenticated/anon roles with distinct simulated JWT claims, not real Supabase Auth sessions. The harness requires the reviewed empty Circle data tables and existing Admin/program foundation.

| Test category | Passing groups |
| --- | ---: |
| Two pairs: invitation summaries, acceptance, four record types, legitimate edits, protected writes and pre-grant visibility | 8 |
| Two pairs: recipient isolation, populated summaries, direct-mutation/Admin denial and forged-recipient/contact protection | 4 |
| Eleven grant, role, relationship, renewed-consent and cancellation states: content reads, dashboard counts and mutation denial | 11 |
| Supporter responses, assignment restrictions, invalid response type and completed-response replay | 1 |
| Program adoption, exact grant match, conflicting program and disabled-program enforcement | 1 |
| Actual re-invitation/fresh acceptance, old-content suppression and fresh selection | 1 |
| Actual relationship revocation, owner history and owner deletion | 1 |
| Outsider isolation and Admin metadata-only operation | 2 |
| Missing subject claim plus six anonymous table reads and four anonymous RPC calls | 1 |
| Total | 30 |

All fixture identities, relationships, grants, selected records and temporary setting changes were rolled back. Before/after counts matched: one real user; zero paid entitlements; zero persistent Circle relationships, grants, tasks, appointments, check-in requests or emergency-contact records. The six existing placement records and restored program-setting rows had unchanged fingerprints during the full regression.
No password, recovery email, real Auth token, lasting account, paid membership or charge was generated.

## Catalog postflight

At `2026-09-06T17:43:59.292181Z`:
- All six restored tables existed with RLS, no anonymous table/column privileges and each required trusted service CRUD privilege checked individually.
- All three summary entry points plus the shared helper were SECURITY INVOKER, fixed-search-path, authenticated-callable and not anonymous-callable.
- The project still had zero anonymously executable public-schema SECURITY DEFINER functions.
- One real user, six placement records, zero paid entitlements and zero selected Circle content rows remained.
- Only Recovery was enabled in the restored program collaboration settings, matching the referenced artifact default.

No fresh all-clear Security Advisor claim is made. Existing signed-in function notices and previously recorded credential_types, pg_net and password-protection configuration items remain review items.

## Next checkpoint and limits

The next task is connecting the approved interface to these restored backends without redesign: show pending invitations with accept/decline actions; choose the intended person/program instead of silently selecting the first active relationship; create/revoke explicit scope permissions; connect task/check-in response and appointment controls; provide safe participant labels. The current frontend was not modified in this pass.
Real browser execution, real Auth-token verification, independent user sessions, notification delivery, concurrent-client stress, cache behavior and complete desktop/iPhone acceptance remain unverified. A database function returning the expected shape is not proof the browser page works end-to-end.
Selected goals/milestones, progress snapshots, referral/document metadata, private source tables, uploads/storage and unrelated coaching/messaging/agent/RLS paths are not certified by these selected-content tests. Revocation prevents later authorized reads; it cannot erase copies already viewed or saved.
Main/branch and migration-history reconciliation remain open. Do not blindly replay historical migrations or treat Vercel success as a functional/security test.
Stripe connection/payment activation and password-reset Site URL/redirect are deferred until the end at the user's request. Other-device pairing is not required. Approved layout, palette, logo proportions, pricing and broad Lellee positioning remain locked.

## Technical references

- Supabase RLS and grant/policy separation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase function execution/security context: https://supabase.com/docs/guides/database/functions
- PostgreSQL policy semantics and concurrency caveats: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
