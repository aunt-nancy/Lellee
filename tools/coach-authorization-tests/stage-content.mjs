import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const contentPackage = JSON.parse(readFileSync(new URL('../../content/launch-2026-10-30/program-packs.json', import.meta.url), 'utf8'));
export function validatePackage(pkg = contentPackage) {
  assert.deepEqual(pkg.approved_portfolio,['recovery','reentry','caregiving','independent-living','housing-stability','grief','workforce-reentry','family-recovery']);
  assert.equal(pkg.status, 'draft');
  assert.equal(pkg.publication_authorized, false);
  assert.deepEqual(new Set(pkg.packs.map(p => p.slug)), new Set(pkg.approved_portfolio.filter(s => s !== 'recovery')));
  const keys = new Set();
  for (const pack of pkg.packs) {
    assert.equal(pack.status, 'draft'); assert.equal(pack.public_release, false);
    assert.equal(pack.items.length, 30);
    if (pack.slug === 'caregiving') assert.ok(pack.minimum_care_recipients >= 3);
    for (const item of pack.items) {
      assert.equal(item.status, 'draft'); assert.equal(item.day_number, null);
      assert.ok(item.body_text.length >= 180 && item.body_text.includes('\n'));
      assert.ok(item.actions.length === 3 && new Set(item.actions).size === 3);
      assert.ok(item.reflection_prompt && item.low_energy_action);
      assert.ok(item.source_ids.length && item.source_ids.every(s => pkg.sources[s]?.url.startsWith('https://')));
      assert.ok(item.evidence_status && !keys.has(item.content_key));
      assert.ok(!/[<>]/.test(item.body_text), 'Content stays plain text');
      keys.add(item.content_key);
    }
  }
  return true;
}

// Only used against explicitly marked isolated fixtures/staging. No network client.
// Does not create a connection or accept a URL, approve records or publish items.
export async function stageContent(db, pkg = contentPackage) {
  validatePackage(pkg);
  const marker = (await db.query("select current_setting('lellee.isolated_content_review',true) as marker")).rows[0].marker;
  assert.equal(marker, 'enabled', 'An isolated content-review session must be explicitly marked');
  await db.exec('begin');
  try {
    const slugs = pkg.packs.map(p => p.slug);
    const available = (await db.query('select id,slug from public.programs where slug=any($1::text[])', [slugs])).rows;
    assert.equal(available.length, slugs.length, 'Resolve every approved program before staging any row');
    const programs = new Map(available.map(p => [p.slug, p.id]));
    let inserted = 0;
    for (const pack of pkg.packs) {
      const pid = programs.get(pack.slug);
      const sections = [...pack.sections, 'Continuity and optional review'];
      const stages = new Map();
      for (const [index, name] of sections.entries()) {
        const key = `launch-20261030-${index+1}`;
        // A matching name reuses the existing stage. Never overwrite a stage.
        let rows = (await db.query('select id,name from public.program_journey_stages where program_id=$1 and (stage_key=$2 or name=$3) order by sequence', [pid,key,name])).rows;
        assert.ok(rows.length <= 1, 'Ambiguous stage mapping requires review');
        if (!rows.length) rows = (await db.query("insert into public.program_journey_stages(program_id,stage_key,name,description,sequence,status) values($1,$2,$3,$4,$5,'draft') returning id,name", [pid,key,name,'Optional coaching and organization theme; not a clinical stage or performance level.',index+1])).rows;
        assert.equal(rows[0].name, name, 'Existing stage key has different meaning; do not overwrite it');
        stages.set(name, rows[0].id);
      }
      for (const item of pack.items) {
        const notes = JSON.stringify({package_version:pkg.version,review_status:'not_reviewed',section:item.section,cadence:item.cadence,low_energy_action:item.low_energy_action,source_refs:item.source_ids.map(id=>pkg.sources[id]),evidence_status:item.evidence_status});
        const r = await db.query(`insert into public.program_content_items
          (program_id,stage_id,content_key,content_type,title,intro_text,body_text,suggested_choices,reflection_prompt,sequence,estimated_minutes,pathway,language_code,tags,status,version_number,editor_notes)
          values($1,$2,$3,'guided_action',$4,$5,$6,$7,$8,$9,$10,'all','en',$11,'draft',1,$12)
          on conflict (program_id,content_key,language_code,pathway,version_number) do nothing returning id`,
          [pid,stages.get(item.section),item.content_key,item.title,item.intro_text,item.body_text,item.suggested_choices,item.reflection_prompt,item.sequence,item.estimated_minutes,['launch-preparation','not-reviewed',...item.source_ids],notes]);
        inserted += r.rows.length;
      }
    }
    await db.exec('commit');
    return {inserted,skipped:210-inserted,published:0};
  } catch (error) { await db.exec('rollback'); throw error; }
}
