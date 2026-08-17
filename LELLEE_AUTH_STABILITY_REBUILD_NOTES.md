# Lellee — Authentication Stability Full Rebuild

This is a FULL site replacement package, not an incremental patch.

## What was corrected
- One returning-user sign-in owner: `recovery.html`.
- Landing-page "Sign in" routes to `/app/recovery` instead of authenticating a second time.
- Build 5 and Build 6 no longer install separate Supabase auth-state listeners or run their own session lookup.
- Returning users resume their last safe page; fallback is Today.
- The dashboard opens immediately after authentication; profile/journal hydration runs in the background.
- Local feature JavaScript is staged after the authenticated shell opens instead of executing 60+ modules at once.
- Pricing no longer uses a document-wide MutationObserver.
- Coaching account-count visibility no longer uses a document-wide MutationObserver.
- Service-worker cache version was bumped and static assets use network-first refresh behavior.
- Vercel headers prevent stale recovery/JS/CSS/service-worker files from persisting during this beta.
- The approved Lellee logo is packaged as `lellee-approved-logo-locked.png` and is no longer dependent on the old shared logo filename.
- Every local asset referenced by the site is included in this package.

## Deployment requirement
Replace the existing deployment contents with THIS ENTIRE package. Do not merge only `recovery.html` into the old deployment, because the old deployment contains stale files that caused the regression.
