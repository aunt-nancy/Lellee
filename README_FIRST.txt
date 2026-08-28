LELLEE — ORGANIZATION FRONT DOOR + LIVE DASHBOARD V3
Date: 2026-08-27

WHY V3
V2 still attempted to CREATE OR REPLACE the already-existing function:

public.is_organization_member(uuid)

Your production database has that signature already, and PostgreSQL will reject
a replacement whenever the stored input-parameter name does not exactly match
the replacement definition.

V3 ELIMINATES THAT CONFLICT COMPLETELY.

V3 does NOT:
- DROP public.is_organization_member(uuid)
- CREATE OR REPLACE public.is_organization_member(uuid)
- use CASCADE
- disturb RLS policies that already depend on the legacy helper

Instead, V3 reuses the existing helper exactly as it is.

V3 also gives every new Organization RPC/helper a unique V3 function name so
older deployed functions cannot trigger another input-parameter-name conflict.

RUN NOW
Run as ONE complete script in Supabase SQL Editor:

01_Lellee_Organization_Foundation_Live_Dashboard_V3_2026-08-27.sql

Do not run V1 or V2 first.

IMPORTANT
Because the previous attempt was inside a transaction and failed before COMMIT,
it did not complete this package.

AFTER SQL SUCCESS
Upload these V3 package files to the GitHub root:
- index.html
- landing.html
- organizations.html
- organizations.css
- organizations.js
- organization-entry-router.js
- organization-dashboard-live.js
- organization-dashboard-live.css

The V3 JavaScript calls the unique V3 RPC names.

OPTIONAL READ-ONLY CHECK
02_Lellee_Organization_V3_READ_ONLY_VERIFY.sql

PROTECTED STATES REMAIN
- organization_payments_enabled = false
- organization_individual_private_data_access = false
- public_multi_program_launch_enabled = false
- Recovery unchanged

NOTE
V2 also contained a parameter-reference typo inside its new manager helper after
the earlier compatibility edit. V3 corrects that at the same time.
