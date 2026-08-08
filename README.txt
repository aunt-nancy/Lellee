LELLEE — BIG FINAL HARDENING BUILD

Adds in one build:
- account recovery page
- reset email
- new password UI for recovery sessions
- data lifecycle center
- account deletion request workflow
- sync / diagnostics page
- keyboard skip link
- visible focus states
- form labeling assistance
- reduced-motion support
- larger mobile tap targets
- mobile form zoom prevention
- final desktop / Android / iPhone QA checklist
- all previous production/PWA/notification features preserved

RUN:
07_account_lifecycle.sql once in Supabase.

DEPLOY:
Upload all web/PWA files in this package to GitHub and commit.

NOTE:
Deletion is implemented as a user-authenticated deletion REQUEST.
Actual irreversible auth-user deletion should be performed through a secured
server/admin process, not directly from public browser code.
