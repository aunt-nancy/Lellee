LELLEE — EXISTING EMAIL + PASSWORD RECOVERY FIX

Upload/replace only these GitHub-root files:
1. auth.html
2. service-worker.js
3. reset-lellee-cache.html

What this corrects:
- Detects Supabase's hidden/fake signup response for an email that already has an account.
- Stops falsely saying a duplicate account was newly created.
- Adds Forgot password and a complete password-reset flow.
- Adds Resend confirmation email for genuinely unconfirmed new accounts.
- Converts "Invalid login credentials" into a useful account-recovery instruction.
- Preserves the stable standalone account-page layout and all approved Lellee designs.

No SQL. Do not replace landing.html, index.html, or Recovery files.
