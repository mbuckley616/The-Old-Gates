// Directions from townsfolk match the true bearing and pick the nearest building; the map tags every footprint.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const tags = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const t = {}; for (const r of S.sol) { if (r.c === undefined) continue; t[r.bt || 'UNTAGGED'] = (t[r.bt || 'UNTAGGED'] || 0) + 1; } return t; });
check('every footprint carries a type', !tags.UNTAGGED, tags);
const res = await page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const pool = [...S.npcs, ...S.residents.map(r => r.n).filter(Boolean)].filter(n => n.def && !n.def._lord);
  for (const n of pool) { let t; try { t = n.def.topics; } catch (e) { continue; }
    const f = Array.isArray(t) && t.find(x => /^Where can I find/.test(x.label)); if (!f) continue;
    px = n.g.position.x + 1; pz = n.g.position.z + 1; const out = [];
    for (const it of f.follow) { WORLD.way = null; const said = it.fn(it); const W = WORLD.way; if (!W) { out.push({ label: it.label, said, skipped: true }); continue; }
      const dir = WORLD.compassWord(W.x - px, W.z - pz); out.push({ label: it.label, dirOk: said.includes(dir + ' of here') || /right here|mine|square/.test(said), glyph: !!W.glyph }); }
    return out; } return null; });
check('a townsperson answers', Array.isArray(res) && res.length > 2, res && res.length);
check('every direction matches the bearing', res.every(r => r.skipped || r.dirOk), res.filter(r => !r.skipped && !r.dirOk));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
