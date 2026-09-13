# Lellee — Concurrent Multi-Journey Model

Date: 2026-09-12
Status: APPROVED PRODUCT BEHAVIOR

## Product-owner decision

Users may work on multiple Lellee journeys at the same time. Opening one journey is navigation only; it must not pause, deactivate, replace, or erase another active journey.

## User-facing language

Use **My Journeys** rather than **Switch Journey** for navigation between programs.

Do not label another active journey **Paused** merely because the user is viewing a different journey.

Preferred states/actions:
- ACTIVE JOURNEY
- PRIMARY (when applicable, without implying exclusivity)
- CONTROLLED BETA (when applicable)
- Continue
- My Journeys

## Data/privacy behavior

Each journey keeps its own coaching setup, goals, progress and program context. Shared Lellee tools may be available across journeys, but cross-program sharing remains off by default and private program information does not automatically flow between journeys.

## Current implementation

`my-journeys-runtime.js` provides the concurrent My Journeys presentation and controlled-beta access behavior. `recovery-journey-switcher.js` now opens My Journeys and explicitly states that opening another journey does not pause the others.

The current coaching-only scope and 988/911 crisis boundary remain unchanged.