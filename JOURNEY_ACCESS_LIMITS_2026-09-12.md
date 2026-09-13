# Lellee Journey Access Limits

Date: 2026-09-12  
Updated: 2026-09-13  
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

User-facing language uses **Inactive** rather than **Paused** for a journey the user has chosen not to keep in their current active set. The legacy database may continue using `paused` internally for compatibility.

## Controlled beta exemption

Controlled-beta journey access is temporary testing access and does **not** consume a commercial active-journey slot. Beta membership is administered separately and cannot be turned off through the member's commercial plan-slot control.

A journey that is both an eligible controlled-beta journey and an ordinary enrollment is counted only once and is treated as beta-exempt while the controlled beta remains active.

## Backend enforcement

The production database already includes:

- `lellee_journey_plan_limits` — central Free/Plus/Premium limit configuration.
- `get_my_journey_access_summary()` — signed-in plan allowance and active-journey summary.
- `can_activate_my_journey(uuid)` — read-only server-side activation gate.

Source-controlled migration `20260913153000_journey_active_inactive_controls.sql` prepares the next database update. When applied, it will:

- exclude eligible controlled-beta journeys from commercial slot usage;
- return plan-slot usage, beta-exempt count, total active journeys, and saved inactive journeys separately;
- expose `set_my_journey_active(uuid, boolean)` for an authenticated member to make an **existing commercial enrollment** Active or Inactive;
- preserve setup, goals, progress, history, and other journey data when a journey becomes Inactive;
- refuse to alter controlled-beta cohort membership through the member-facing toggle;
- refuse reactivation when the member has reached the commercial plan limit.

The browser runtime is fail-closed: Active / Inactive buttons appear only after the database summary explicitly reports `journey_activity_controls=true`. Deploying the front-end code before the migration therefore does not expose a broken or unsafe mutation control.

## Member experience after the activity-control migration

On **My Journeys**, active plan journeys will offer **Make Inactive**. The confirmation explains that setup, goals, progress, and history stay saved. Saved inactive journeys will appear in a separate **Inactive journeys** section with **Make Active** when a plan slot is available.

Controlled-beta cards will instead show **Beta access · no plan slot** and will not display a member-controlled inactive toggle.

## Current controlled beta

The current beta remains coaching only. These journey limits do not expand Lellee into clinical care, individualized legal advice, housing placement, case management, emergency assessment, or broad program-specific resource navigation.
