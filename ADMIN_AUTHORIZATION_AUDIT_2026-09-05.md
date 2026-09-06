# Lellee Admin Authorization Consolidation — 2026-09-05

## Objective
Make administrator/editor authorization consistent site-wide without changing the approved Lellee visual design, pricing, product positioning, or user privacy boundaries.

## Canonical rule
All admin/editor gating should use the server-side `public.is_lellee_admin()` RPC. Client modules must not depend on reading `public.admin_user_roles` directly.

## Changes in this checkpoint
- Added `supabase/migrations/20260905_admin_authorization_consolidation.sql`.
- The migration creates/normalizes `public.admin_user_roles`, enables RLS, revokes direct anonymous/authenticated table access, and exposes only `public.is_lellee_admin()` to authenticated clients.
- Updated `welcome-router.js` to use the canonical RPC.
- Updated `program-builder.js` to use the canonical RPC and recheck authorization before save/delete actions.
- Updated `staff-operations.js` to use the canonical RPC and recheck authorization before staff/handoff mutations.
- Updated `commerce-ops.js` to use the canonical RPC and recheck authorization before revenue/admin mutations.
- Updated `onboarding-help.js` to use the canonical RPC and recheck authorization before knowledge-base mutations.

## Important safety boundary
This migration does **not** grant any user an admin role. Role assignment/revocation remains a trusted server/service-role or Supabase SQL operation.

## Production gate
Do not merge until CI/runtime ownership checks pass. After merge, the SQL migration still must be applied to production Supabase and a permanent Admin account must be verified against `is_lellee_admin()`.

## Remaining audit work
Additional legacy modules may still contain direct `admin_user_roles` reads. Those should be consolidated before the site-wide Admin checkpoint is closed.
