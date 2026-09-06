# Lellee coaching membership and administration security checkpoint — September 6, 2026

## Status

This checkpoint is source-prepared on draft PR #13 (`security/runtime-project-reconciliation-20260906`). It is **not merged, not deployed, and not a production security sign-off**.

The canonical runtime for this audit is `hkrrxscyhtxmbvxevfkw`, consistent with the Lellee main app and platform environment baseline.

## Live-state findings

The canonical hkrr coaching workspace currently has no coaching businesses, business memberships, client relationships, invitations, coaching messages, or shared coaching items. This provided a clean window to inspect membership authorization without modifying real coaching relationships.

The staff/training foundation is not entirely empty, so the source repair does not delete or reset staff/training records.

### Critical authorization defect

The live `lellee_admin_activate_staff_coach(uuid,text,uuid,text)` function is a privileged `SECURITY DEFINER` function and is executable by the anonymous API role. Its existing authorization condition rejects a caller only when `auth.uid()` is non-null and that signed-in caller is not an Admin. With no signed-in identity, that rejection is skipped.

As a result, the existing implementation can reach privileged staff-coach/profile/training writes without first proving an authenticated Admin identity.

The same null-auth authorization pattern exists in companion administrative helpers, including training-access refresh, installment/payment administration, and release-check refresh. Anonymous execution grants unnecessarily widen those paths.

### Coach-client invitation lifecycle gaps

The existing coach-client invitation creator verifies active business membership and an approved business, but did not verify that the selected program is an approved program for that business.

The invitation acceptance function verifies the invited email but did not re-check that the business/program approval remained current. On relationship renewal, the previous implementation also did not clear an older `ended_at` timestamp.

## Source repair prepared

Migration:

`supabase/migrations/20260906210000_hkrr_coach_membership_admin_hardening.sql`

It prepares the following controls for reviewed migration activation:

1. Requires a signed-in Admin or explicit service-role JWT for staff-coach activation and training-payment administration.
2. Removes anonymous execution from private/member/admin coaching and training RPCs while preserving authenticated/service-role use where appropriate.
3. Replaces mutable helper search paths with fixed, explicitly qualified object references.
4. Requires coach-client invitations to use an approved business and an approved business/program assignment.
5. Re-checks business/program approval and verified invited-email ownership when an invitation is accepted.
6. Reactivates an ended relationship only through a new accepted invitation, refreshes the assigned active coach, and clears the old `ended_at` value.
7. Narrows direct private coaching/staff/training table grants to authenticated reads governed by existing RLS; mutations remain through reviewed functions/service-role paths.
8. Preserves anonymous read access only for the dedicated approved public staff-coach profile surface.

## Colleague/team membership functional gap

The current approved Coach Dashboard does **not** contain a staff-team or colleague-membership administration interface. Its current functional areas are clients, groups, services, messages, assignments, and leads. The dashboard's use of the word “members” refers to participants in coaching groups, not `coach_business_members` staff memberships.

The current database foundation automatically creates an owner membership when a coaching business is created, but this audit found no corresponding approved owner-facing workflow for adding, pausing, promoting, or removing colleague business members.

Therefore this checkpoint does **not** invent a new Team UI or silently add staff-management behavior. Colleague membership administration is recorded as a separate functional/product decision before a UI or owner-management RPC is introduced.

## Production state

No production migration was applied in this checkpoint. The earlier Trusted Circle database activation attempt on the same canonical project was blocked by the platform safety layer before DDL execution, and that safety block is not being bypassed with raw SQL.

Accordingly, the live coaching-admin authorization defects described above remain **production blockers** until the reviewed migration is applied through an approved database migration path and then verified.

## Next checkpoint

1. Review/apply the prepared hkrr migration through an approved migration path.
2. Re-run authorization tests proving anonymous callers cannot activate staff coaches, record training payments/unlocks, refresh protected release state, or invoke private coach-member administration RPCs.
3. Test a real approved coach-business owner and real invited client in separate authenticated sessions.
4. Decide separately whether multi-coach businesses need owner-facing Team administration in the current release or whether the initial release is intentionally solo/centrally administered.
5. Continue the launch audit with coaching messaging and other signed-in permission paths.

This checkpoint changes no Lellee pricing, logo, public navigation, coaching pricing model, page layout, or Stripe activation status.
