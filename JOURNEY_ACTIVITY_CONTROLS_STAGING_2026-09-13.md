# Lellee — Journey Activity Controls Staging

Date: 2026-09-13  
Status: SOURCE-CONTROLLED / DATABASE APPLICATION PENDING

## Approved behavior

Members can keep multiple journeys active up to their Lellee plan allowance. A member may make an ordinary commercial journey **Inactive** to free a plan slot and later make it **Active** again. This changes activity state only; it does not delete setup, goals, progress, history, or other saved journey work.

Controlled-beta journeys are exempt from commercial plan-slot usage while testing. Beta membership remains program-administered and is not changed by a member plan-slot toggle.

## Source changes prepared

- `supabase/migrations/20260913153000_journey_active_inactive_controls.sql`
  - separates commercial active count from beta-exempt count;
  - returns inactive saved journeys;
  - upgrades the read-only activation gate;
  - adds authenticated `set_my_journey_active(uuid, boolean)` for existing commercial enrollments;
  - preserves the legacy internal `paused` status while the member UI says **Inactive**;
  - does not delete journey data or alter controlled-beta membership.
- `journey-plan-limit-runtime.js`
  - shows **Make Inactive** / **Make Active** only when the backend advertises that the activity-control migration is live;
  - shows controlled beta as **Beta access · no plan slot**;
  - explains before deactivation that saved work is retained;
  - fails closed if the mutation RPC is unavailable.
- `recovery-journey-switcher.js`
  - cache-bumps the journey activity runtime.

## Deployment safety

The front-end is intentionally feature-gated by `journey_activity_controls=true` from `get_my_journey_access_summary()`. Until the database migration is applied, the new activity buttons remain hidden. Existing My Journeys behavior continues unchanged.

No member enrollment, beta membership, program status, goal, journal, progress record, or other user data was changed as part of this staging work.

## Remaining step

Apply `20260913153000_journey_active_inactive_controls.sql` to canonical Supabase project `hkrrxscyhtxmbvxevfkw`, then verify:

1. Free / Plus / Premium / Premium + Coach limits remain 1 / 2 / 4 / 6.
2. Controlled-beta journeys report as exempt and do not consume a plan slot.
3. An ordinary active journey can become Inactive without data loss.
4. The same journey can be reactivated when a slot is available.
5. Reactivation is blocked at the plan limit.
6. Controlled-beta membership cannot be changed through the member activity control.
7. My Journeys refreshes correctly on desktop and iPhone.
