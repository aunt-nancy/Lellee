# Lellee Wave 1 — Internal QA Readiness Checkpoint

Date: 2026-09-11  
Scope: Caregiving, Returning Home / Reentry, Finding Stability / Housing Stability, Building Independence  
Environment: active app Supabase project `hkrrxscyhtxmbvxevfkw`  
Public release status: **NOT LIVE — all four remain `planned`**

## Runtime implementation

- Shared Program Pack runtime is admin-only/internal.
- Current Wave 1 runtime: `wave1-program-runtime.js` QA2.
- Shared tools connected from the Program Pack: Document Vault, Calendar/Reminders, Resources, Trusted People, program-scoped Goals/Progress.
- Shared-tool entry stores Wave 1 program context without changing the user’s primary program.
- Cross-program sharing remains off by default.
- Latest cache-key loader deployed through `pwa-runtime.js`.
- Vercel status for the QA2 loader commit was confirmed successful.

## Backend readiness matrix

| Program | Enabled modules | Outcome domains | Draft safety routes | Verified resource drafts | Published resources | Public status |
|---|---:|---:|---:|---:|---:|---|
| Returning Home / Reentry | 14 | 4 | 3 | 2 | 0 | planned |
| Caregiving | 12 | 3 | 3 | 2 | 0 | planned |
| Building Independence | 13 | 3 | 3 | 2 | 0 | planned |
| Housing Stability | 12 | 2 | 3 | 2 | 0 | planned |

## Shared-core integration checks

PASS at schema/runtime integration level:
- `get_my_document_vault_summary` exists in active app database.
- `get_my_calendar` exists in active app database.
- `get_my_trusted_circle_summary` exists in active app database.
- Program-specific `program_goals` and `program_progress_checkins` tables exist.
- Wave 1 program IDs can scope goals/check-ins separately from Recovery.
- Program modules are now populated for the approved Program Pack structure.
- Four missing resource categories were added: Accessibility, Basic Needs, Personal Safety, Independent Living.

Still pending:
- authenticated browser end-to-end testing of every shared-tool return path;
- mobile/iPhone visual QA;
- program-specific onboarding implementation;
- verified resource publication approval;
- safety-route human/specialist review and publication;
- final beta-user access rules and beta cohort test.

## Safety state

All safety profiles remain draft. No safety route was published automatically.

- Caregiving: heightened review.
- Reentry: heightened review.
- Housing Stability: heightened review.
- Building Independence: standard review, with accessibility/privacy review required.

Each program now has three draft routes covering its practical/elevated support needs plus an immediate-danger boundary. Draft status is intentional; public or external beta use remains blocked until required review is complete.

## Verified resource candidates — still unpublished

These were verified from authoritative sources on 2026-09-11 and stored as drafts only:

### Caregiving
- Eldercare Locator — https://eldercare.acl.gov/home
- National Family Caregiver Support Program — https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program

### Returning Home / Reentry
- CareerOneStop — Find a Job After Incarceration — https://cloudfront.careeronestop.org/JusticeImpacted/Help/ReEntry/reentry-intro.aspx
- USA.gov Benefit Finder — https://www.usa.gov/benefit-finder

### Housing Stability
- HUD Find Shelter — https://www.hud.gov/findshelter
- HUD Housing Counseling — https://www.hud.gov/stat/sfh/housing-counseling

### Building Independence
- Disability Information and Access Locator (DIAL) — https://dial.acl.gov/home
- USA.gov Benefit Finder — https://www.usa.gov/benefit-finder

No resource candidate was marked `published=true`; human approval remains a launch gate.

## Current QA disposition

| Program | Runtime | Shared tools | Backend pack | Safety | Resources | Browser E2E | Beta-ready |
|---|---|---|---|---|---|---|---|
| Caregiving | PASS | CONNECTED | PASS | REVIEW REQUIRED | DRAFTS READY | PENDING | NO |
| Reentry | PASS | CONNECTED | PASS | REVIEW REQUIRED | DRAFTS READY | PENDING | NO |
| Housing Stability | PASS | CONNECTED | PASS | REVIEW REQUIRED | DRAFTS READY | PENDING | NO |
| Building Independence | PASS | CONNECTED | PASS | REVIEW REQUIRED | DRAFTS READY | PENDING | NO |

## Next execution block

1. Implement the reusable program-specific onboarding runtime for all four Wave 1 programs.
2. Run authenticated internal end-to-end navigation/data tests.
3. Batch resource-candidate approval in one review instead of one-by-one questions.
4. Prepare safety wording for required specialist/human review without publishing it prematurely.
5. Move individual programs to beta only after their own gates pass.

Printable blueprint remains deferred until the end of the full process, per approved instruction.
