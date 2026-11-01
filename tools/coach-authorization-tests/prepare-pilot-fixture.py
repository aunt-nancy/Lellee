"""Render real pilot DOM/scripts against isolated test data, outside the checkout."""
from pathlib import Path
from lxml import html
import json,sys

root=Path(__file__).resolve().parents[2]
dest=Path(sys.argv[1]).resolve()
assert root not in dest.parents and dest != root, 'Fixtures must stay outside deployable source'
dest.mkdir(parents=True,exist_ok=True)
doc=html.fromstring((root/'index.html').read_text())
parts=[]
for ident in ['page-program-switcher','page-program-home','page-program-journey-runtime']:
    nodes=doc.xpath('//*[@id=$ident]',ident=ident)
    assert len(nodes)==1
    parts.append(html.tostring(nodes[0],encoding='unicode'))
body='\n'.join(parts)
pkg=json.loads((root/'content/launch-2026-10-30/program-packs.json').read_text())
fixture=(root/'tools/coach-authorization-tests/pilot-fixture.js').read_text()
for mode in ['normal','response-failure','progress-failure','load-failure']:
    page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated Lellee pilot verification</title><link rel="stylesheet" href="/pilot-runtime.css"><style>.page{{display:none}}.page.active{{display:block}}body{{font-family:system-ui;margin:20px}}button,input,textarea{{font:inherit}}textarea{{width:95%;min-height:70px}}</style></head><body data-fixture-mode="{mode}"><p>ISOLATED TEST · simulated account and backend · draft content · no live data</p><button id="fixtureHome">Program chooser</button><button id="fixtureReset">Reset fixture data</button><output id="fixtureWrite" role="status"></output>{body}<script>window.fixtureContentPackage={json.dumps(pkg,ensure_ascii=False).replace('<','\\u003c')};</script><script>{fixture}</script><script src="/pilot-runtime.js"></script><script>window.showPage('program-switcher');</script></body></html>'''
    (dest/f'pilot-{mode}.html').write_text(page)
print('Prepared four isolated pilot fixtures')
