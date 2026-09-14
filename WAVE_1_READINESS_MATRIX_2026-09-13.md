# Lellee Wave 1 Readiness Matrix

Date: 2026-09-13
Status: FINAL IMPLEMENTATION / QA GATE BEFORE LIVE RELEASE

## Product-owner direction
Wave 1 programs are intended to go live inside the main Lellee app like Recovery once each program clears its own launch gates. A passing program may go live without waiting for another Wave 1 program.

## Coach readiness requirements — APPROVED
A coach cannot be marked Ready/Approved until all applicable requirements are satisfied:

1. Complete required Lellee Core Coach Training.
2. Complete program-specific training for every journey the coach will serve.
3. Pass required training modules and knowledge/competency checks.
4. Complete privacy, boundaries, safety/escalation, and crisis-referral training.
5. Submit applicable credentials, education, training certificates, and/or lived-experience qualifications.
6. Any credential displayed as Verified must receive human review first.
7. Accept the Lellee Coach Code of Conduct and scope-of-practice boundaries.
8. Complete identity/business review where required.
9. Have no unresolved approval or safety blockers.
10. Receive final human coach approval before becoming available to users.

A professional license is not universally required. Lellee may recognize training, certifications, education, and lived experience, while clearly distinguishing those qualifications from licensed clinical credentials.

## Readiness matrix

| Program | Implemented | QA Passed | Correction Needed | Beta Ready | Blocked | Live Ready |
|---|---|---|---|---|---|---|
| Recovery | Yes | Yes / ongoing regression monitoring | Minor regressions only | Yes | No | **Live** |
| Caregiving | Core architecture and controlled-beta runtime implemented | Partial | **Yes** — complete/verify final Program Builder configuration, safety text, module mapping, and final live regression check | Near | No known hard blocker | **Not yet** |
| Returning Home / Reentry | Approved structure and shared runtime architecture | Partial / final side-by-side QA pending | Yes — final program-specific implementation verification and launch-gate pass | Pending final QA | No known hard blocker | **Not yet** |
| Finding Stability / Housing Stability | Approved structure and shared runtime architecture | Partial / final side-by-side QA pending | Yes — final program-specific implementation verification and launch-gate pass | Pending final QA | No known hard blocker | **Not yet** |
| Building Independence | Approved structure and shared runtime architecture | Partial / final side-by-side QA pending | Yes — final program-specific implementation verification and launch-gate pass | Pending final QA | No known hard blocker | **Not yet** |

## Launch gate for each Wave 1 program
A program becomes Live Ready only after all of the following pass for that program:

- Program content and guided journey are implemented.
- Evidence/source rules are configured and reviewed.
- Resources and local-resource behavior are verified.
- Privacy rules and cross-program data isolation pass.
- Safety/help routing passes.
- Required human-review rules pass.
- Mobile and accessibility QA pass.
- Program-specific data separation passes.
- Internal QA passes with no launch-blocking regression.
- Controlled beta/pilot feedback is reviewed where required.

## Immediate completion order

1. Finish Caregiving configuration verification without changing its approved six-stage adaptive model.
2. Implement/display the approved 10-point Coach Readiness framework in Coach Training & Credentialing.
3. Run the final Wave 1 regression pass only on remaining unresolved items; do not repeat already-passed QA screens.
4. Verify all four Wave 1 programs against the launch gate above.
5. Mark each passing program Live Ready and release it in the main Lellee app like Recovery.
6. Begin Wave 2 after Wave 1 live-release readiness is formally closed.

## Release rule
Do not activate a program merely because its architecture is approved. Activation occurs only after its individual launch gate passes. Conversely, do not hold a passing Wave 1 program back because another Wave 1 program still needs corrections.
