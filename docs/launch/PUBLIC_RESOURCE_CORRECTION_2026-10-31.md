# Public resource correction — October 31, 2026

The user approved correcting the guest resource flow after the protected preview
showed a Caregiving header over a Recovery-specific directory. The old bundled
loader returned before querying for guests. The database also lacked anonymous
directory read policies, so removing that early return alone was insufficient.

## Prepared behavior

The frontend reads `get_public_program_resources` for the selected program before
loading any private saved state. Caregiving and other programs show suitable
category controls; Recovery retains the original approach filters, categories and
news tab. Returning to Recovery restores those controls. The current Recovery
preference and learning code is unchanged. Unknown programs fail without silently
switching into Recovery.

The new migration exposes one explicit published-directory JSON projection to
`anon` and `authenticated`. It does not grant direct anonymous table access, alter
RLS, publish a record, grant service rights or modify any saved/referral records.
It returns approved public directory fields only, excluding internal reviewer
identities, provider email, private saved notes and referral/contact information.
Published service rows match the selected program or the existing shared NULL
program convention and require an active category. Legacy unscoped local rows
remain Recovery-specific; explicitly different-program local rows are excluded.

Guests may browse and open public provider links; saving prompts sign-in. Signed-in
saves use the correct existing local/service saved table and check errors before
claiming success. Unknown saved state disables mutation rather than overwriting
it. Responses are guarded against program/user changes while loading. Non-HTTP(S)
website values and malformed phone values are not rendered as links.

Loading, unavailable and empty states are distinct. Published sponsorship remains
clearly labeled separately. No public provider availability, eligibility or
clinical appropriateness is promised by this correction.

## Evidence

- Sixteen isolated PostgreSQL/RLS checks pass: selected/shared program scope,
  drafts/inactive categories, Recovery compatibility, field allowlist, anonymous
  table/private data/write denial, alias resolution, no fallback and no activation.
  The fixture uses the captured fields/read-policy behavior with synthetic rows;
  it is not a complete database clone. See `public-resource-results.json`.
- Ten browser checks pass in supported cloud Chrome using actual resource markup
  and runtime with simulated backend/storage. See
  `public-resource-browser-results.json`. No production account or write is used.
- The approval checker still fingerprints all 35 protected files. It additionally
  verifies that the bundled resource module equals its standalone source and that
  all other bundle modules and Recovery preference code remain byte-for-byte
  unchanged. Consumer/public markup, pricing, branding and legal terms remain locked.

Read-only runtime inspection found zero published rows in both `service_resources`
and `local_resources`, including shared rows. Therefore a successful live query
will honestly show an empty directory until separately reviewed resource records
are published. No resource content was invented or seeded by this fix.

Existing security advisor output was reviewed for the affected directory tables.
The migration was not applied to production; a passing production advisor check
for the new function is not claimed. Execute migration/ACL/advisor and full
canonical frontend acceptance in an isolated environment before rollout.

## Deployment boundary

The public RPC is prepared in migration
`20261101040121_public_program_resource_directory.sql`. The Supabase CLI generated
its filename; the UTC date is November 1 while the user's local date is October 31.
It has not been applied to either hosted production project. Until a backend with
this migration is deliberately paired with the frontend, the corrected screen
will report directory unavailability rather than inventing empty results.

The Vercel preview's existing production backend is not an isolated account-test
environment. Full account/invitation/scheduling/privacy acceptance, qualified
course signoffs, substantive program-content/feature checks and actual-device
accessibility remain open. This correction does not authorize a main merge,
production migration, content publication, marketplace or payments activation.

The exact-code Vercel preview on commit `68881de` was checked: Caregiving controls
render, Recovery-only controls are hidden, and the unapplied endpoint produces an
explicit unavailable/Retry state instead of a false empty count. This is frontend
deployment verification only; no successful hosted RPC response is claimed.

The first CI run used GitHub's synthetic merge commit and included newer unrelated
main-branch agent documents in the scope check. It stopped at that check. Both
isolated jobs now explicitly check out `github.event.pull_request.head.sha`, so
verification covers the same draft source commit as the preview. The original 35
file hashes and narrow bundle/module checks remain unchanged. Reconciliation with
the latest main branch is still a prerequisite to any future production merge.
