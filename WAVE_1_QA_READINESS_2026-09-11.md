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
- Reusable program-specific onboarding runtime is implemented for all four Wave 1 programs.
- Onboarding answers save to the existing private `journey_account_intakes` table and do not enroll the user, change the primary program, or read private Journal content.
- Latest onboarding/runtime loader is deployed through `pwa-runtime.js`.
- Vercel status for the onboarding loader commit was confirmed successful.

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
- Program modules are populated for the approved Program Pack structure.
- Four missing resource categories were added: Accessibility, Basic Needs, Personal Safety, Independent Living.
- `journey_account_intakes` has user-scoped RLS and a unique `(user_id, topic_key)` key, supporting reusable private Program Pack setup.
- Caregiving, Reentry, Housing Stability and Building Independence each have their own internal setup questions and saved-answer flow.

## Privacy / data-isolation verification

PASS at policy level:
- `journey_account_intakes` — own-row select/insert/update/delete.
- `program_goals` — own-row ALL policy.
- `program_progress_checkins` — own-row ALL policy.
- `user_saved_resources` — own-row ALL policy.
- `resource_referrals` — own-row ALL policy.
- `program_enrollments` — own-row SELECT.
- `user_program_state` — own-row SELECT.
- Trusted-circle recipient access is restricted to active, accepted relationships and specific allowed scopes under program collaboration settings.
- Recipient-visible scopes currently restrict reads to `shared_tasks` and `shared_appointments`; unrelated journals/messages are not exposed by these policies.
- Cross-program sharing remains off by default.

## Authenticated browser E2E result

Authenticated admin diagnostic completed with:
- **53 passed**
- **0 failed**
- **4 manual gates**
- **4 Wave 1 programs found**

Automated browser/data QA is therefore **PASS** for all currently instrumented checks. The read-only harness verified program records, modules, privacy defaults, safety/resource staging, onboarding reads, program-scoped progress, shared-core RPCs, own-enrollment/state isolation, and deployed runtimes without changing user or release state.

Durable result record: `WAVE_1_E2E_QA_RESULT_2026-09-11.md`.

## Consolidated approval checkpoint

Owner approval received: **APPROVE ALL**.

Approved:
- 8 verified authoritative resource candidates for beta staging only;
- 12 safety-route drafts as the working product copy for formal review.

Conditions preserved:
- resources remain unpublished;
- safety routes remain draft/unpublished;
- no public program status changes;
- required specialist/accessibility/privacy review still applies.

Durable approval record: `WAVE_1_RESOURCE_SAFETY_APPROVAL_2026-09-11.md`.

## Safety state

The four `program_safety_profiles_v2` records are in **review** status. No safety route was published automatically.

- Caregiving: heightened review.
- Reentry: heightened review.
- Housing Stability: heightened review.
- Building Independence: standard review, with accessibility/privacy review required.

Each program has three draft routes covering practical/elevated support needs plus an immediate-danger boundary. Public or external beta use remains blocked until required review is complete.

## Verified resource candidates — beta staging approved, still unpublished

### Caregiving
- Eldercare Locator
- National Family Caregiver Support Program

### Returning Home / Reentry
- CareerOneStop — Find a Job After Incarceration
- USA.gov Benefit Finder

### Housing Stability
- HUD Find Shelter
- HUD Housing Counseling

### Building Independence
- Disability Information and Access Locator (DIAL)
- USA.gov Benefit Finder

All remain `published=false` until the applicable release gate is passed.

## Current QA disposition

| Program | Runtime | Onboarding | Shared tools | Backend pack | Privacy/RLS | Automated E2E | Safety | Resources | Beta-ready |
|---|---|---|---|---|---|---|---|---|---|
| Caregiving | PASS | IMPLEMENTED | CONNECTED | PASS | PASS | PASS | FORMAL REVIEW | BETA STAGING APPROVED | NO |
| Reentry | PASS | IMPLEMENTED | CONNECTED | PASS | PASS | PASS | FORMAL REVIEW | BETA STAGING APPROVED | NO |
| Housing Stability | PASS | IMPLEMENTED | CONNECTED | PASS | PASS | PASS | FORMAL REVIEW | BETA STAGING APPROVED | NO |
| Building Independence | PASS | IMPLEMENTED | CONNECTED | PASS | PASS | PASS | ACCESSIBILITY/PRIVACY REVIEW | BETA STAGING APPROVED | NO |

## Remaining manual gates

1. Interactive navigation click-through in the real authenticated app.
2. Mobile/iPhone visual QA.
3. Required safety/accessibility/privacy review.
4. Controlled beta access/cohort test.

## Next execution block

1. Complete interactive authenticated click-through for each Program Pack and return path.
2. Run mobile/iPhone visual QA.
3. Complete required safety/accessibility/privacy review without publishing routes prematurely.
4. Define and test the controlled beta cohort.
5. Move individual programs to beta only after their own gates pass.

Printable blueprint remains deferred until the end of the full process, per approved instruction.
