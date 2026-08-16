LELLEE CONSOLIDATED REPAIR — 2026-08-15

PURPOSE
One repair package for the issues found after Builds 1–6 were deployed and quality-tested.

ORDER
1. Supabase -> SQL Editor -> New query
   Run LELLEE_CONSOLIDATED_REPAIR.sql and wait for Success.

2. GitHub repository root
   Upload/replace:
   - recovery.html
   - consolidated-repair.css
   - consolidated-repair.js
   - index.html
   - landing.html
   - master-landing.css
   - master-landing.js
   - vercel.json

   Keep all Build 2–6 CSS/JS files already in GitHub.
   Do NOT upload the SQL or this README to GitHub unless you want them there for version history.

3. Commit to main and wait for Vercel Ready / Production.

WHAT THIS REPAIR ADDRESSES
- Learn Mark Complete freeze / persistence
- Journal Review Entries no-op
- Then & Now build-without-visible-comparison
- Recovery Story build-without-visible-preview
- Lellee Plus Recovery Review no-op
- My Support Network hanging on load
- Legacy saved meetings and support contacts migration
- Expert-Guided Practices navigation
- Settings restored to Account
- Workspaces and Professional Hub removed from consumer accordion
- Professional promotion moved to bottom of Today
- tighter accordion submenu spacing
- Recovery-wide small-text readability, especially Plus
- Spanish preference direct persistence + live core-interface translation fallback
- Recovery-day calculation based on local calendar day and stored recovery date
- Required W-2 Coach training wording (no paid-training promise)
- $499 Complete Professional Bundle + 2 included months
- informational post-bundle plan: $29.99/month + 7% of Lellee-generated business, 0% independently sourced; billing remains OFF
- clearer Social Media Agent prerequisite CTA
- calmer two-stage account creation
- one usable sign-in path while the journey modal is open
- path-specific optional-context examples
- neutral recommendation copy when no related path was selected

NOT INCLUDED / NEEDS CURRENT SOURCE FILE
The Lellee Home handoff currently lives in home.html/master-app.js. Those current production files were not part of Builds 1–6 supplied to this repair package, so this ZIP does not invent or overwrite them. The desired change remains: when Recovery is already selected, use one primary “Continue to Recovery” action and “Review My Answers” as secondary.

QA AFTER DEPLOYMENT
Do one targeted regression check only: Learn completion, Journal Review Entries, Then & Now, Story Preview, Support Network, Meetings legacy record, Recovery Review, Spanish save/refresh, Settings nav, and professional pricing/training wording.
