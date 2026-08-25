LELLEE SAME-PAGE REFRESH PATCH
August 24, 2026

UPLOAD
1. Upload same-page-refresh.js to the ROOT of the Lellee GitHub repository.
2. Then edit the root index.html.
3. Immediately BEFORE </body>, add this one line:

<script src="/same-page-refresh.js"></script>

Place it AFTER the existing group-b-production.js script line.

Expected ending:

<script src="/group-a-core.js"></script>
<script src="/group-b-production.js"></script>
<script src="/same-page-refresh.js"></script>
</body>
</html>

DO NOT change vercel.json.
DO NOT change landing.html.
DO NOT change Supabase, account creation, or subscriptions.

TEST
1. Wait for Vercel deployment = Ready.
2. Open www.lellee.com -> landing page.
3. Click Explore Lellee.
4. Click Journal.
5. The address should end in #journal.
6. Refresh.
7. Journal should remain open.
8. Repeat with Tools; address should end in #tools and refresh should stay on Tools.

ROLLBACK
Delete the one script-tag line from index.html and delete same-page-refresh.js.
