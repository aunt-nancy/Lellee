#!/usr/bin/env python3
# Run only AFTER https://lellee.com is live and this key file is reachable.
import json, urllib.request
KEY="9d35fe2d83dda7fcee3464d5908b53b0"
payload={
 "host":"lellee.com",
 "key":KEY,
 "keyLocation":f"https://lellee.com/{KEY}.txt",
 "urlList":json.load(open("INDEXNOW_URLS.json",encoding="utf-8"))
}
req=urllib.request.Request("https://api.indexnow.org/indexnow",data=json.dumps(payload).encode(),headers={"Content-Type":"application/json; charset=utf-8"},method="POST")
with urllib.request.urlopen(req,timeout=30) as r:
 print("IndexNow status:",r.status)
