# Lellee AI Edge Blocking Gate

The included `robots.txt` expresses Lellee's preference that named AI crawlers, AI-search crawlers, and AI assistants do not access the site. This is not sufficient as a security boundary because crawler compliance is voluntary.

Before production launch:

1. Put the public Lellee domain behind an edge/WAF provider with AI bot detection.
2. Block AI Training, AI Search, and AI Agent/Assistant crawler categories at the edge unless Lellee later chooses an explicit exception.
3. Keep normal Google/Bing search indexing available for public marketing pages if desired.
4. Never exempt a request merely because it sends a custom `User-Agent` claiming to be a Lellee agent.
5. Lellee internal agents must authenticate to Lellee's backend using an internal service identity and an allowlisted capability.
6. Keep journal, messages, coaching-private content, safety/crisis activity, and account data behind authentication plus database authorization/RLS.
7. Log every internal agent access decision and externally consequential action.
8. Require human approval before outbound communications, publishing, billing changes, permission changes, or safety/clinical decisions.

Production gate status: EDGE ENFORCEMENT STILL REQUIRED.
