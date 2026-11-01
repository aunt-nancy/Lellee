# Launch completion checkpoint — October 30, 2026

October 31 update: protected preview access is confirmed in cloud Chrome. Public
Caregiving browsing and reload pass; guest resource browsing fails in the legacy
Recovery-specific directory. Full authenticated testing requires an isolated
canonical backend because the preview still targets the production runtime.
See `PREVIEW_ACCEPTANCE_2026-10-31.md` for exact evidence and the proposed correction.

Follow-up: the user approved that resource correction. It is prepared with 16
passing isolated SQL/RLS checks and 11 supported-Chrome fixture checks. The new
public read function remains unapplied to production. The existing live resource
tables contain zero published rows; no directory content was invented. See
`PUBLIC_RESOURCE_CORRECTION_2026-10-31.md`. Full migrated-backend acceptance remains open.

Scope: finish the authorized launch preparation while preserving every settled
approval. This is a factual checkpoint, not launch approval or a claim that all
work is finished.

## Prepared in this branch

- Existing independent service authorization and schedule privacy corrections.
- Seven non-Recovery launch content packs: 168 original core exercises plus 42
  adapted continuity prompts, 30 items per pack. Source-linked principles and
  design proposals are identified separately. These are unpublished review
  drafts, not 210 clinically validated lessons or a replacement for Recovery's
  742 records. They do not establish full two-year content parity.
- Concrete walkthrough, knowledge check and approved training-evidence mapping
  in `content/launch-2026-10-30`. The user approved the sequence on October 30: the prepared orientation,
  then existing Coaching Foundations and its reviewed completion certificate.
  This is mapping approval only. Content signoffs and publication remain held;
  the legacy extra-course formula is unchanged pending separate reconciliation.
- Content Studio staging function and tests using the runtime's actual captured
  columns, constraints and policies. Staging is idempotent, preserves existing
  published content, inserts only draft records, retains review/source metadata
  and leaves program activation flags and Recovery unchanged.
- Pilot delivery fixes: show complete exercise steps, select an activity from a
  journey theme, save/reopen its response, keep program responses separate,
  distinguish partial saves, and block overwrite when prior responses cannot
  be read. Add accessible choice states, reflection labeling and save messages.
- A native PostgreSQL 17 test runner and isolated pull-request check, without
  production credentials or deployment steps. Its first isolated run passed all 164 checks on native PostgreSQL 17.6
  (GitHub Actions run 41124742505, tested commit 0219e7b).

- Internal orientation/Foundations editorial and technical review is recorded in
  `FOUNDATIONS_CONTENT_REVIEW_2026-10-30.md`. Added 53 concrete fictional practice
  cases and capstone submission guidance. Eighteen isolated curriculum contract
  checks pass. Existing server-side choice randomization and answer-text grading
  were verified; no redundant runtime correction was retained. Human signoffs
  and complete application/device acceptance remain open.
- Pull-request run 41171508057 passed the approval lock, 18 Foundations contract
  checks, 164 native PostgreSQL 17.6 checks and all 24 isolated real Auth/REST
  checks on commit `d87ba19`. Its protected Vercel preview is READY and matches
  that commit. The connected Vercel account returned HTTP 403 while requesting a
  temporary protected-preview link, so browser-facing route and account-flow
  acceptance was not performed or claimed.

## Evidence and limits

Local PGlite: 140 authorization/RPC assertions, 12 schedule privacy checks and
12 Content Studio draft-staging checks pass. Captured schema is reduced; it is
not a complete production clone. Supported-browser fixtures verify all seven
packs, selection/save/reload, program separation and three failure cases.
These browser accounts and backends are simulated, not real Supabase sessions.
The isolated real-Auth/PostgREST contract passed 24/24 checks in run
41126084322 on commit 1cb8644. It preserved real Supabase Auth definitions
and used synthetic business/training data. Tested real signup/password login,
REST/RPC qualification in five states, invitation acceptance, group isolation,
forged verification/metadata denial and revocation with an unchanged token.
The runner was stopped successfully. This is not a complete canonical application
clone or deployed frontend/curriculum acceptance.

Native PostgreSQL could not start in the local managed environment because its
required non-root filesystem ownership was unavailable. The native runner now
requires an existing non-root runner and creates no operating-system user.
An attempted PostgreSQL-17 WASM alternative lacked the required crypto extension
and was removed. Neither failed attempt is counted as a passing test.

The approved consumer prices, branding, logo artwork and dimensions, public
layouts/navigation, legal terms, program roadmap, Recovery content, sharing
defaults and future staff/learning lane remain locked. The scope checker still
fingerprints the same 35 protected files. New content and QA work are explicit
exceptions authorized by the user's instruction to finish launch preparation;
they do not authorize changing settled product decisions.

## Remaining launch blockers

1. **Training content/review:** the orientation-to-Foundations mapping is now
   approved; no active requirements row or course IDs were seeded. All seven
   existing professional courses remain draft. A final read-only check found zero recorded course signoffs. Required
   human reviews and authentic evidence cannot be fabricated by completing code.
2. **Authenticated staging:** the canonical Supabase project has no existing
   development branch. No paid branch or new project was created. The exact-commit
   Vercel preview exists, but the current Vercel connection cannot open its protected
   routes. Existing
   production projects are not disposable staging environments. The isolated Auth/REST contract now passes, including real tokens,
   invitations, scheduling authorization and group isolation. Complete canonical
   frontend/onboarding/curriculum, sharing revocation, notifications and
   side-effect acceptance still require execution.
3. **Actual-device acceptance:** no actual iPhone/Safari or full screen-reader
   acceptance was performed. Earlier beta attestations are preserved as
   historical approvals; they do not verify this new code.
4. **Content and feature readiness:** the new packs need substantive review and
   controlled acceptance. Multi-care-recipient exercise content does not prove
   that three separate digital care profiles, medication/appointment records and
   their consolidated dashboard work. Broader tools and long-term delivery
   parity remain to be established.
5. **Release:** production rollout remains a separate final approval after
   prerequisites pass. No main merge, production migration, content publication,
   coach approval, marketplace activation or payment activation occurred.

The approved eight-program portfolio may release programs individually as their
gates pass. Its names, number and sequencing are not changed by this checkpoint.

## Minimal next handoff when preparation is reviewed

The mapping decision is recorded in `coach-training-mapping.json`; do not ask
for that approval again. Complete the required content reviews and use an
authorized isolated Supabase environment for full application acceptance. Only after
that evidence and device checks pass can a production rollout be proposed. No
request to reapprove unchanged pricing, design, legal terms or roadmap is needed.
