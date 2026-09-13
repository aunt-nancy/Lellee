# Lellee Journey Access Limits

Date: 2026-09-12  
Status: APPROVED PRODUCT RULE

## Active journey limits

- **Lellee Free:** 1 active journey at a time.
- **Lellee Plus:** up to 2 active journeys at once.
- **Lellee Premium:** up to 4 active journeys at once.
- **Lellee Premium + Lellee Coach:** up to 6 active journeys at once.

Recovery counts as one active journey.

## Concurrent use

An active journey is not exclusive. Users can work in every journey currently active on their account. Opening one journey only changes what the user is viewing; it does not pause another active journey.

A user may have one **Primary Journey** for the default Today experience while also having other active journeys.

## Shared services

Calendar/Reminders, Document Vault, Trusted People, crisis information, general shared tools, and coaching itself are shared Lellee services and do not count as separate journeys.

## Limit and downgrade rule

Journey limits restrict the number of journeys that can be active at the same time, not the number a person may ever use.

If an account reaches its plan limit, already-active journeys remain usable. A new journey cannot be activated until the user makes one current journey inactive or upgrades to a level with more active-journey slots.

If a user changes to a lower plan while they have more active journeys than the new limit, Lellee does **not** delete, erase, or reset any journey, coaching setup, goals, progress, or history. Existing work remains saved. The account must return to the allowed active-journey count before activating another journey.

User-facing language should use **Inactive** rather than **Paused** for a journey the user has chosen not to keep in their current active set.

## Backend enforcement

The active database includes:

- `lellee_journey_plan_limits` — central Free/Plus/Premium limit configuration.
- `get_my_journey_access_summary()` — returns the signed-in user's effective level, active-journey allowance, distinct active journeys, remaining slots, and limit state.
- `can_activate_my_journey(uuid)` — read-only server-side activation gate. Reopening an already-active journey is permitted; a new journey requires an available slot.

The active-journey count is a distinct union of ordinary active program enrollments and eligible active controlled-beta cohort access, preventing duplicate counting of the same program.

## Current controlled beta

The current beta remains coaching only. These journey limits do not expand Lellee into clinical care, individualized legal advice, housing placement, case management, emergency assessment, or broad program-specific resource navigation.
