#!/usr/bin/env python3
"""
Submit Lellee's public sitemap URLs to IndexNow AFTER lellee.com is live.
The key file must be publicly reachable first.
"""
import json, urllib.request, urllib.error
KEY="7128db9e431d3f715783d57c4d3d52d2"
HOST="lellee.com"
KEY_LOCATION=f"https://{HOST}/{KEY}.txt"
URLS=[
  "https://lellee.com/",
  "https://lellee.com/recovery/",
  "https://lellee.com/tools/",
  "https://lellee.com/learn/",
  "https://lellee.com/resources/",
  "https://lellee.com/about/",
  "https://lellee.com/editorial-policy/",
  "https://lellee.com/privacy.html",
  "https://lellee.com/terms.html",
  "https://lellee.com/safety.html",
  "https://lellee.com/learn/12-step-recovery/",
  "https://lellee.com/learn/90-days-in-recovery/",
  "https://lellee.com/learn/after-return-to-use/",
  "https://lellee.com/learn/asking-for-help-in-recovery/",
  "https://lellee.com/learn/boundaries-in-recovery/",
  "https://lellee.com/learn/faith-spirituality-recovery/",
  "https://lellee.com/learn/first-30-days-recovery/",
  "https://lellee.com/learn/grounding-techniques-recovery/",
  "https://lellee.com/learn/halt-in-recovery/",
  "https://lellee.com/learn/how-to-handle-cravings/",
  "https://lellee.com/learn/loneliness-in-recovery/",
  "https://lellee.com/learn/long-term-recovery/",
  "https://lellee.com/learn/medication-supported-recovery/",
  "https://lellee.com/learn/multiple-pathways-to-recovery/",
  "https://lellee.com/learn/one-day-at-a-time-recovery/",
  "https://lellee.com/learn/one-year-in-recovery/",
  "https://lellee.com/learn/peer-support-recovery/",
  "https://lellee.com/learn/recovery-journal/",
  "https://lellee.com/learn/recovery-meetings/",
  "https://lellee.com/learn/recovery-milestones/",
  "https://lellee.com/learn/recovery-residence-vs-sober-living/",
  "https://lellee.com/learn/recovery-routine/",
  "https://lellee.com/learn/recovery-support-network/",
  "https://lellee.com/learn/relapse-prevention-plan/",
  "https://lellee.com/learn/relapse-warning-signs/",
  "https://lellee.com/learn/relationships-early-recovery/",
  "https://lellee.com/learn/skills-based-recovery/",
  "https://lellee.com/learn/sleep-and-recovery/",
  "https://lellee.com/learn/therapy-and-addiction-recovery/",
  "https://lellee.com/learn/understanding-triggers/",
  "https://lellee.com/learn/urge-surfing-recovery/",
  "https://lellee.com/learn/what-is-early-recovery/",
  "https://lellee.com/learn/topics/early-recovery/",
  "https://lellee.com/learn/topics/cravings-and-coping/",
  "https://lellee.com/learn/topics/relapse-prevention/",
  "https://lellee.com/learn/topics/recovery-pathways/",
  "https://lellee.com/learn/topics/relationships-and-support/",
  "https://lellee.com/learn/topics/long-term-recovery/",
  "https://lellee.com/resources/los-angeles-ca/",
  "https://lellee.com/resources/long-beach-ca/",
  "https://lellee.com/resources/torrance-ca/",
  "https://lellee.com/resources/inglewood-ca/",
  "https://lellee.com/resources/compton-ca/",
  "https://lellee.com/resources/carson-ca/"
]

payload=json.dumps({
  "host":HOST,
  "key":KEY,
  "keyLocation":KEY_LOCATION,
  "urlList":URLS
}).encode("utf-8")

req=urllib.request.Request(
    "https://api.indexnow.org/indexnow",
    data=payload,
    headers={"Content-Type":"application/json; charset=utf-8"},
    method="POST"
)
try:
    with urllib.request.urlopen(req,timeout=30) as r:
        print("IndexNow response:",r.status,r.read().decode("utf-8",errors="ignore"))
except urllib.error.HTTPError as e:
    print("IndexNow HTTP error:",e.code,e.read().decode("utf-8",errors="ignore"))
