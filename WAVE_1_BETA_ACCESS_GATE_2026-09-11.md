# Lellee Wave 1 — Controlled Beta Access Gate

Date: 2026-09-11
Scope: Caregiving, Returning Home / Reentry, Housing Stability, Building Independence
Status: BACKEND GATE INSTALLED — all four cohorts remain locked in planning.

## What was implemented

The active Lellee database now includes two read-only beta-access functions:

- `get_my_wave1_beta_access()` — returns a program only when the signed-in user is an active member of that program's active controlled-beta cohort and the latest readiness review has every required gate marked ready.
- `wave1_beta_cohort_ready(uuid)` — reports whether a cohort has all required readiness gates passed.

## Required gates

Access requires all of the following to be true:

- content_ready
- safety_ready
- resources_ready
- accessibility_ready
- privacy_ready
- support_ready
- qa_ready

The cohort must also be `active`, and the tester's cohort membership must be `active`.

## Current state

All four Wave 1 cohorts currently return `false` from the readiness gate and remain `planning`:

- Wave 1 Caregiving — Controlled Beta
- Wave 1 Reentry — Controlled Beta
- Wave 1 Housing Stability — Controlled Beta
- Wave 1 Building Independence — Controlled Beta

No tester has been invited or activated. No public program status was changed. No resource or safety route was published.

## Why this matters

A cohort planning record alone cannot grant access. Product-owner approval alone cannot grant access. A tester membership alone cannot grant access. Controlled beta access requires the cohort, member, and readiness conditions to all be satisfied.

This preserves the approved invite-only, revocable, program-specific beta model while the required human/specialist safety-accessibility-privacy review remains outstanding.
