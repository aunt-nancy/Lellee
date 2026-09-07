# Lellee Trusted Circle runtime reconciliation — September 6, 2026

## Status

Source reconciliation is prepared in draft PR #13 (`security/runtime-project-reconciliation-20260906`). It is **not merged and not a production launch sign-off**.

The current audit corrects the earlier PR #12 assumption that `vnfjszmhmcxkxegzvivg` should become the main app project. Direct schema and environment checks show the canonical Lellee runtime is `hkrrxscyhtxmbvxevfkw`:

- the canonical main app already creates its shared Supabase client against `hkrrxscyhtxmbvxevfkw`;
- `public.platform_environment_baseline` identifies `hkrrxscyhtxmbvxevfkw` as the Lellee Supabase project reference and `lellee.com` as the primary domain;
- the hkrr project contains the core app dependencies checked during this audit, including profiles, recovery profiles, preferences, journal entries, daily check-ins, recovery actions, guided responses, memberships, Admin roles and programs;
- the vnf project is missing multiple core app dependencies required by the current main app.

Therefore the safe reconciliation direction is to keep the app on hkrr and bring Auth plus Trusted Circle back to the same shared runtime, not move the rest of Lellee to vnf.

## Source changes prepared

1. `auth.html` now targets hkrr with its active publishable key. The existing standalone sign-in, account creation, confirmation resend, forgot-password and password-reset behavior is retained. No layout/logo rewrite was made.
2. `trusted-circle.js` now accepts the existing hkrr app client rather than refusing it as a wrong project. It still creates no second Supabase client.
3. The Trusted Circle database repairs are ordered specifically for the hkrr schema:
   - `20260906201600_hkrr_trusted_circle_consent_boundary.sql`
   - `20260906201700_hkrr_trusted_circle_scope_lock.sql`
   - `20260906202000_hkrr_trusted_circle_selected_content.sql`
   - `20260906203000_hkrr_trusted_circle_dashboards_labels.sql`
4. The prior participant-label migration was moved behind its backend prerequisites instead of being replayed in the earlier vnf order.
5. The current release permission boundary is explicitly limited to selected shared tasks and selected shared appointments. Broader catalog entries remain future-facing metadata; they cannot be used to create current-release sharing grants through the prepared guard.

## Database state and activation blocker

Before preparing these migrations, the hkrr Trusted Circle relationship, share, shared-task, shared-appointment, practical-check-in and emergency-contact tables were all confirmed empty.

The existing hkrr Trusted Circle lifecycle/dashboard functions were still older SECURITY DEFINER implementations with `search_path=public`, and multiple Trusted Circle functions were executable by `anon`. The newer relationship-response, selected-content response and scoped participant-label helpers were not present.

A production `apply_migration` attempt was blocked by the platform safety layer before DDL execution. The block was **not bypassed with raw SQL**. Consequently:

- the production hkrr database was not changed by this reconciliation pass;
- the migration files in PR #13 are reviewable source only;
- no real Trusted Circle relationship, invitation, share, user, entitlement, payment or private content record was created for this checkpoint.

## Source verification

On reconciled frontend commit `ddf4bebbb81e3407beef00936cef4b1839d8eb47`:

- Lellee Runtime Ownership Guard — **success** (run 34054956685);
- Lellee Circle UI Regression — **success** (run 34054956734).

The Circle regression uses the actual Trusted Circle/Supporter/Admin feature-section DOM with synthetic Supabase responses at desktop and phone-sized Chromium viewports. It is not a real Supabase Auth/API session, not the complete app runtime, and not Safari/an actual iPhone.

The later scope-lock migration is database-source-only and does not change the tested frontend runtime.

## Locked product decisions preserved

- Consumer brand remains **Lellee**; Recovery is a support path, not the platform's primary identity.
- Approved logo sizing, palette, page layout and navigation/page-jump repairs are not changed by this checkpoint.
- Existing approved subscription/pricing decisions are not changed.
- Stripe/payment activation remains deferred to the final commercial checkpoint.
- Password-reset Site URL/redirect configuration remains a final Auth-environment check even though reset UI behavior is preserved in source.

## Next checkpoint

1. Review and apply the ordered hkrr migrations through an approved database migration path.
2. Re-run authorization/isolation tests against hkrr after migration activation.
3. Test two independent real signed-in sessions: Lellee owner and invited supporter.
4. Verify invitation Accept/Decline, deliberate person/program selection, selected task/appointment sharing, revocation and supporter responses end-to-end.
5. Verify the complete app on desktop plus actual iPhone/Safari, including no menu, router, logo-size or page-jump regression.
6. Continue the broader launch audit afterward; this Trusted Circle checkpoint does not certify coaching membership, messaging, uploads/storage, entitlement lifecycle, Admin surface, Stripe, or full-site security.

PR #11 and PR #12 remain unmerged historical review evidence. PR #13 is the corrected runtime-reconciliation branch and must remain draft until the database and real-session checkpoints above pass.
