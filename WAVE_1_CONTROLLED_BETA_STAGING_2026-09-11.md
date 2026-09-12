# Lellee Wave 1 — Controlled Beta Staging

Date: 2026-09-11
Scope: Caregiving, Returning Home / Reentry, Housing Stability, Building Independence
Status: PLANNING ONLY — no tester access has been activated.

## Approved beta rule

The controlled beta is configured as:
- invite-only;
- up to 10 initial testers per Program Pack;
- explicit program assignment;
- no public discovery;
- revocable access;
- no public program activation;
- no recruitment or activation until required safety/accessibility/privacy review clears.

## Cohorts created

Four planning cohorts now exist in the active Lellee database, each with target size 10:

1. Wave 1 Caregiving — Controlled Beta
2. Wave 1 Reentry — Controlled Beta
3. Wave 1 Housing Stability — Controlled Beta
4. Wave 1 Building Independence — Controlled Beta

All four cohort records remain `planning`. No members have been invited or activated.

## Readiness reviews created

Each cohort has a readiness-review record with the following conservative state:

- content_ready: true
- privacy_ready: true
- support_ready: true
- qa_ready: true
- safety_ready: false
- resources_ready: false
- accessibility_ready: false

Recommendation for all four: **HOLD**.

The hold remains until required safety/accessibility/privacy review clears and beta-only resource exposure is explicitly enabled. This prevents a planning record from being mistaken for launch authorization.

## QA already completed

- Authenticated automated E2E: 53 PASS / 0 FAIL / 4 programs found.
- Authenticated iPhone / interactive Program Pack QA: PASS.
- Cross-program sharing: OFF by default.
- Resource candidates: owner-approved for beta staging only; still unpublished.
- Safety routes: owner-approved as working product copy only; still draft/unpublished.

## Remaining release gate

The next true blocker is required human/specialist review of safety-sensitive, legal-sensitive, accessibility and privacy wording/behavior. No automated check or product-owner approval substitutes for that required review.

After that review clears, the beta can move from `planning` to controlled recruitment and the first tester can be assigned explicitly to one Program Pack at a time.

No public launch or public discovery is authorized by this staging record.