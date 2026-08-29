Lellee header Plans & Pricing repair — 2026-08-29

Purpose
- Put subscription prices and what each offering includes directly in the header menu.
- Preserve the repaired no-jump navigation and bounded freeze repair.
- Preserve the approved landing logo artwork and locked dimensions.

What changed
1. Added a native Plans & Pricing dropdown to the public landing-page header.
2. Added a matching Plans & Pricing dropdown to the app/program-preview header, including mobile access.
3. Shows Lellee Free ($0), Lellee Premium ($14.99/month or $149/year), and the Lellee Coach add-on ($49.99/month + Premium).
4. Shows additional 15-minute coaching check-ins at $19.99 each.
5. Corrected the old visible Lellee Plus $5.99/$59.99 copy in index.html to the approved Lellee Premium pricing while leaving internal IDs/data keys unchanged for compatibility.
6. No new MutationObserver, scrollTo, or routing loop was added. Header pricing uses native <details> behavior.
7. Advanced the service-worker/reset cache version.

Deployment
Upload every file in this ZIP to the repository root and replace matching files. Wait for Vercel to show Ready. Then open /reset-lellee-cache.html once.
