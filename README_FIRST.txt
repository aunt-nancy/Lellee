LELLEE — STABLE ACCOUNT CREATION + SIGN-IN FIX
Date: 2026-08-29

WHY THIS REPAIR EXISTS
The old /app?auth=signin route loaded the entire large Lellee application behind the sign-in card. Feature scripts, account checks, and late page initialization could keep changing the page after it appeared, causing visible jumping or delayed loading.

WHAT THIS PACKAGE DOES
- Adds a lightweight standalone auth.html page.
- Sends /app?auth=signin and /app?auth=signup to auth.html before the heavy app initializes.
- Sends the three approved landing-page Log In/My Lellee links directly to auth.html.
- Keeps account confirmation, sign-in, return-program context, legal acknowledgments, and Browse Lellee first.
- Keeps the approved landing design, calm Journey modal, Recovery preview, Recovery menu/logo, and mobile navigation unchanged.

UPLOAD THESE FILES TO THE GITHUB ROOT
1. auth.html (NEW)
2. index.html
3. landing.html
4. service-worker.js
5. reset-lellee-cache.html

NO SQL.
Do not replace recovery-preview.html, program-preview.html, or any locked Recovery design files.
