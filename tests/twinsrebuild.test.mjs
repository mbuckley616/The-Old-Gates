// Faces through a rebuild (Session 250): Session 248 gave the second holder of a name its own face (name|town#1), numbered
// in build order. A town that rebuilds at another prosperity uses other lots, so the order shifts: the second Cathal could
// come back as the first, and change face, which Session 245 had promised would not happen. Now each person's number is kept
// in the town's record with the name and colours, and a newcomer takes a number nobody on the record holds.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => { const id = 'dunmore'; const site = WORLD.siteAnywhere(id); const p0 = WORLD.prosperity(site);
  const faces = () => { const S = WORLD.settle.get(id); const out = {};
    const defs = [...S.npcs.map(n => n.def), ...S.residents.map(x => x.def)].filter((d, i, a) => d && d.name && d.nameKey != null && a.indexOf(d) === i);
    defs.forEach(d => { out[d.nameKey] = d.name + '#' + (d._twin || 0); }); return out; };
  const build = (p) => { WORLD.setProsperity(site, p); if (WORLD.settle.has(id)) WORLD.disposeSettlement(id); WORLD.genSettlement(site); return faces(); };
  const a = faces(); const res = [];
  for (const p of [35, 87, 16, p0]) { const b = build(p); const both = Object.keys(a).filter(k => k in b); const moved = both.filter(k => a[k] !== b[k]).map(k => k + ': ' + a[k] + ' → ' + b[k]);
    const keys = Object.values(b); const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    res.push({ p, people: keys.length, both: both.length, moved, dup }); }
  return { p0, first: Object.keys(a).length, twins: Object.values(a).filter(k => !/#0$/.test(k)).length, res }; });
console.log(' ', JSON.stringify(r));
check('Dunmore has people who share a name, each with a face of their own', r.twins > 0, r.twins);
check('rebuilt at 35, 87, 16 and back, everyone keeps the face they had', r.res.every(x => x.moved.length === 0), r.res.map(x => ({ p: x.p, moved: x.moved.slice(0, 6) })));
check('and in every build no two people share a face', r.res.every(x => x.dup.length === 0), r.res.map(x => ({ p: x.p, dup: x.dup })));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
