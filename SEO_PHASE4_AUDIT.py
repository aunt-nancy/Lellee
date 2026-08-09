#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import re, json, xml.etree.ElementTree as ET

ROOT=Path(__file__).parent
issues=[]
html_files=list(ROOT.rglob("*.html"))

# Sitemap URLs
sitemap=ET.fromstring((ROOT/"sitemap.xml").read_text(encoding="utf-8"))
ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
sitemap_urls={u.find("s:loc",ns).text for u in sitemap.findall("s:url",ns)}

titles={}
descriptions={}
canonicals={}
for p in html_files:
    soup=BeautifulSoup(p.read_text(encoding="utf-8"),"html.parser")
    title=soup.title.get_text(strip=True) if soup.title else ""
    desc=(soup.find("meta",attrs={"name":"description"}) or {}).get("content","")
    canon=(soup.find("link",rel="canonical") or {}).get("href","")
    noindex=bool(soup.find("meta",attrs={"name":"robots","content":re.compile("noindex",re.I)}))
    h1=len(soup.find_all("h1"))
    if not title: issues.append(f"{p}: missing title")
    if not desc: issues.append(f"{p}: missing meta description")
    if h1!=1: issues.append(f"{p}: expected 1 H1, found {h1}")
    if canon and noindex and canon in sitemap_urls:
        issues.append(f"{p}: noindex canonical appears in sitemap")
    if canon:
        if canon in canonicals: issues.append(f"{p}: duplicate canonical with {canonicals[canon]}")
        canonicals[canon]=p
    if title:
        titles.setdefault(title,[]).append(str(p))
    if desc:
        descriptions.setdefault(desc,[]).append(str(p))

for title,paths in titles.items():
    if len(paths)>1: issues.append("Duplicate title: "+title+" -> "+", ".join(paths))
for desc,paths in descriptions.items():
    if len(paths)>1: issues.append("Duplicate description -> "+", ".join(paths))

# Internal static link resolution for known public routes.
for p in html_files:
    soup=BeautifulSoup(p.read_text(encoding="utf-8"),"html.parser")
    for a in soup.find_all("a",href=True):
        href=a["href"]
        if not href.startswith("/") or href.startswith("//") or href.startswith("/app"):
            continue
        clean=href.split("?")[0].split("#")[0]
        if clean in ("","/"): target=ROOT/"landing.html"
        elif clean.endswith(".html"): target=ROOT/clean.lstrip("/")
        else: target=ROOT/clean.lstrip("/")/"index.html"
        if not target.exists():
            issues.append(f"{p}: broken internal link {href}")

report={
  "html_files":len(html_files),
  "sitemap_urls":len(sitemap_urls),
  "issues":issues,
  "status":"PASS" if not issues else "REVIEW"
}
(ROOT/"SEO_PHASE4_LOCAL_AUDIT_RESULTS.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps(report,indent=2))
