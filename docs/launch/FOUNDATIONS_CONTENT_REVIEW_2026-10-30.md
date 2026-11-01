# Orientation and Foundations — internal content review

October 30, 2026. Internal editorial and technical review of the draft repository
content; not a qualified reviewer attestation, course approval or release audit.
The approved orientation → Foundations → reviewed completion-certificate mapping
is preserved. No human review slot, certificate, payment or authorization is issued.

## Findings and completed preparation

| Area | Evidence reviewed | Result and next requirement |
|---|---|---|
| Orientation | Six walkthrough sections, six knowledge questions and review key | Setup versus service permission, private sharing, role boundaries and current evidence are covered. Product demonstrations must use the deployed version before content signoff. |
| Foundations instruction | All eight authored module bodies: 2,434 whitespace-delimited words | Concise principles and practice directions exist. Reading length alone does not substantiate the configured 12 learning hours. Review actual readings, practice, feedback and capstone workload; no hours changed. |
| Practice material | Existing directions request sample cases without supplying those concrete sets in the module bodies | Added `foundations-practice-workbook.md`: 53 fictional cases, an offer rewrite, agreement checklist, cultural-humility reflection, paired communication exercise, full note exercise and capstone submission companion. Still a review draft. |
| Assessment | All 56 original questions and keyed responses, including 23 scenario questions | Stored key distribution is A=2, B=49, C=5, D=0. This is not the learner display order: existing September 30 server randomization already addresses presentation bias. No redundant answer-bank rewrite or frontend shuffle retained. |
| Grading contract | Latest repository randomization migration plus read-only runtime definitions of both private learner/grader functions | Existing grader compares selected answer text, which is what the current frontend submits. Earlier index-comparison migration was superseded. No grading mismatch fix is needed. |
| Capstone | Jordan scenario and existing rubric | Required human review and critical-failure rules remain. Added a submission organizer without changing scoring or supplying a pass. |
| Policy dependencies | References to organizational safety, incident, reporting and correction procedures | Exact versioned procedures and accountable contacts were not established by this focused content review. Reviewer must supply and verify them before teaching; references to “follow policy” do not themselves establish operational readiness. |

The workbook fills the case sets requested by seven instruction modules:

| Module | Concrete cases added | Evidence the reviewer should inspect |
|---|---:|---|
| scope_role_boundaries | 10 | Classification, bounded participant response, referral and truthful offer |
| ethics_privacy_consent | 5 | Purpose, recipient, minimum information, permission and incident handling |
| trauma_cultural_responsiveness | 5 | Revised statements and reflection that preserve choice |
| communication_skills | 10 | Actual questions/reflections plus observed practice |
| goals_accountability | 3 | Participant-selected step, barrier, alternative and neutral follow-up |
| documentation_shared_progress | 8 | Objective rewrites and one purpose-limited factual note |
| risk_referral_escalation | 12 | Reviewed routing procedure, factual handoff and scope/safety judgment |

The new examples are original instructional designs. They have not been
independently validated, piloted with learners or endorsed by cited organizations.
The safety exercise anchors require qualified scope review; they do not create
medical advice, jurisdiction-specific reporting rules or an emergency protocol.

## Verification performed

`node tools/coach-authorization-tests/foundations-contract.mjs` uses in-memory
PostgreSQL, the original six relevant table definitions, the 56 authored questions
and the existing learner/assessment functions from
`20260930015723_professional_assessment_choice_randomization.sql`.
Results and exact source hashes are in `foundations-contract-results.json`.

It verifies unpublished-course and anonymous/unenrolled rejection; answer keys
are omitted from the learner payload; shuffled choices preserve text; wrong and
index-object submissions do not pass; missing answers create no attempt; locked
modules remain unavailable; correct displayed answer text scores 100% in all
seven modules and unlocks the next; and quiz progression does not pass a capstone.

Only synthetic records inside a transient local database are marked published or
approved to exercise the code paths. No hosted course is changed. These checks
do not establish full frontend, real Auth, RLS, reviewer workflow or device
acceptance. The previous 164 database and 24 real-Auth checks retain their original
scope and are not recounted as new results.

## Source spot-check and limits

Primary-source lookups on October 30 confirmed the existence/current positioning
of the 2025 ICF ethics and competency materials and HHS/FTC consumer-app privacy
guidance. This was a focused source spot-check, not verification of every course
claim or a determination of which laws apply to Lellee. An ICF reference does not
make this an ICF credential or accredited training program.

- https://coachingfederation.org/credentialing/coaching-ethics/icf-code-of-ethics/
- https://coachingfederation.org/credentialing/coaching-competencies/icf-core-competencies/
- https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html
- https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule

Before qualified signoff: review each source-to-claim connection, the new practice
examples, actual workload and accommodations; identify current operational
procedures; validate instructor/reviewer qualifications and independent
attestations through the existing controls. Then run the complete application
acceptance handoff, including actual iPhone/Safari and assistive technology.
None of those gates is marked passed by this report. All settled approvals remain
locked; production release remains held.

## Verification rerun note

The first pull-request rerun crossed midnight UTC while it was still October 30
in America/Los_Angeles. Its synthetic “expired” certificate used `current_date-1`,
which produced October 30 and was therefore correctly accepted through the end
of the approved Pacific-date validity period. The fixture now derives yesterday
from `statement_timestamp() at time zone 'America/Los_Angeles'`, matching the
authorization rule. This correction changes test data only; it does not weaken
or alter certificate expiry behavior.
