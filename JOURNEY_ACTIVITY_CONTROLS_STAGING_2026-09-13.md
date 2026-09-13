# Lellee — Journey Activity Controls Staging

Date: 2026-09-13  
Status: DATABASE APPLIED / FUNCTION VERIFICATION PASSED / MEMBER QA PENDING

## Approved behavior

Members can keep multiple journeys active up to their Lellee plan allowance. A member may make an ordinary commercial journey **Inactive** to free a plan slot and later make it **Active** again. This changes activity state only; it does not delete setup, goals, progress, history, or other saved journey work.

Controlled-beta journeys are exempt from commercial plan-slot usage while testing. Beta membership remains program-administered and is not changed by a member plan-slot toggle.

## Applied database changes

The canonical Supabase production project `hkrrxscyhtxmbvxevfkw` was updated through the Supabase SQL Editor on 2026-09-13 after the ChatGPT Supabase connector repeatedly disabled database execution.

- `supabase/migrations/20260913153000_journey_active_inactive_controls.sql`
  - separates commercial active count from beta-exempt count;
  - returns inactive saved journeys;
  - upgrades the read-only activation gate;
  - adds authenticated `set_my_journey_active(uuid, boolean)` for existing commercial enrollments;
  - preserves the legacy internal `paused` status while the member UI says **Inactive**;
  - does not delete journey data or alter controlled-beta membership.
- `supabase/migrations/20260913154500_recovery_inactive_guard.sql`
  - temporarily prevents Recovery from being made Inactive until direct Recovery routes enforce inactive state;
  - marks Recovery as `can_make_inactive=false` in the journey summary;
  - prevents Recovery from freeing a commercial slot while remaining usable through a direct Recovery route.

## Front-end changes already deployed

- `journey-plan-limit-runtime.js`
  - shows **Make Inactive** / **Make Active** only when the backend advertises that the activity-control migration is live;
  - shows controlled beta as **Beta access · no plan slot**;
  - explains before deactivation that saved work is retained;
  - fails closed if the mutation RPC is unavailable.
- `recovery-journey-switcher.js`
  - cache-bumps the journey activity runtime.

## Verification completed

Read-only production verification confirmed all of the following as `TRUE`:

1. `get_my_journey_access_summary()` exists.
2. `can_activate_my_journey(uuid)` exists.
3. `set_my_journey_active(uuid,boolean)` exists.
4. `get_my_journey_access_summary_base_20260913()` exists.
5. `set_my_journey_active_base_20260913(uuid,boolean)` exists.
6. `authenticated` can execute the public journey summary.
7. `authenticated` can execute the public activity toggle.
8. The internal summary base is not executable by `authenticated`.
9. The internal activity-toggle base is not executable by `authenticated`.
10. The Recovery inactive guard is present in the public activity-toggle function.

No member enrollment, beta membership, program status, goal, journal, progress record, or other user data was changed during installation or verification.

## Remaining member QA

The database layer is installed and verified. Complete targeted authenticated member QA before treating the entire interaction flow as fully signed off:

1. Confirm Free / Plus / Premium / Premium + Coach limits display as 1 / 2 / 4 / 6.
2. Confirm controlled-beta journeys display as exempt and do not consume a plan slot.
3. Confirm a non-Recovery ordinary active journey can become Inactive without losing saved work.
4. Confirm the same journey can be reactivated when a slot is available.
5. Confirm reactivation is blocked at the plan limit.
6. Confirm controlled-beta membership cannot be changed through the member activity control.
7. Confirm Recovery does not show a **Make Inactive** control while the temporary guard is active.
8. Confirm My Journeys refreshes correctly on desktop and iPhone.
