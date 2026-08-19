FIXED: /app/recovery now rewrites to /recovery.html instead of /index.html.
This fixes Continue Journey returning to the public landing page.
Persistent login/session behavior is expected: once signed in, /app can open Welcome directly until logout/session expiry.
Deploy vercel.json together with the existing latest home files. No SQL required.
