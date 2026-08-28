LELLEE — GUEST BROWSE ACCESS FIX
Date: August 28, 2026

PURPOSE
Users must be able to explore Lellee before creating an account.
Account creation/sign-in is required only when a user chooses to save or personalize private information.

WHAT THIS FIX CHANGES
1. /app now opens in guest browsing mode when there is no signed-in session.
2. The public landing page routes support exploration into guest browsing mode.
3. "Log In" and "My Lellee" explicitly open the sign-in screen.
4. The sign-in screen includes "Browse Lellee first."
5. Guest users see a clear Browsing Preview badge and a Sign in/Create Account option.
6. Personal save actions prompt the user to create/sign in to an account instead of blocking browsing.
7. Guest preview data is not persisted as a Lellee account record.
8. Signing out clears the local app-profile cache before returning to the public site, reducing the risk that a later guest on the same device sees the previous user's local profile.
9. The service-worker version is bumped so the new navigation behavior replaces the prior cached shell.

UPLOAD TO GITHUB
Upload these four files to the ROOT of the same GitHub repository connected to www.lellee.com:
- index.html
- landing.html
- service-worker.js
- reset-lellee-cache.html

Replace the existing files using the exact filenames. Do not add numbered copies.
No Supabase SQL is required for this fix.

AFTER VERCEL SHOWS READY
1. Open https://www.lellee.com/reset-lellee-cache.html once.
2. Open https://www.lellee.com/ and select a support path / Start Your Journey.
3. Confirm Lellee opens for browsing WITHOUT requesting an account first.
4. Navigate through Today, Recovery, Learn, Tools and Resources.
5. Try a personal Save action. It should then invite the user to sign in/create an account while still offering Browse Lellee first.
6. Open https://www.lellee.com/app?auth=signin and confirm the explicit sign-in page still works.

EXPECTED EXPERIENCE
Browse first -> understand Lellee -> choose support -> create/sign in only when saving/personalizing.
