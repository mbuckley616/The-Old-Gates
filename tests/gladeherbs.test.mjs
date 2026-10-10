// A slain lair-beast doubles the herbs of the glade nearest its lair, if that glade lies within 700 units (canon §12, Michael's B on
// DECISION #227, Session 719). The second ring of 18 is `<glade>:herb:18…35`, on a stream of its own, so the glade's first 18 and
// its beasts come out as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const lairs = [], glades = [], camps = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) { const c = getCell(i, j); if (!c || !c.sites) continue;
    for (const t of c.sites) { if (t.kind === 'lair') lairs.push(t); else if (t.kind === 'glade') glades.push(t); else if (t.kind === 'bcamp') camps.push(t); } }
  const D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const nearestGlade = l => glades.slice().sort((a, b) => D(a, l) - D(b, l))[0];
  const pairs = lairs.map(l => { const gl = nearestGlade(l); return { l, gl, d: D(l, gl) }; });
  const inReach = pairs.filter(p => p.d <= 700), outReach = pairs.filter(p => p.d > 700);
  const saved = worldState.lairs; worldState.lairs = {};
  const snap = id => { const S = SETTLE.get(id); return { herbs: (S.herbs || []).map(h => [h.id, +h.x.toFixed(2), +h.z.toFixed(2), h.type]), beasts: (S.creatures || []).map(e => [e.baseName || e.type || e.name, +e.x.toFixed(2), +e.z.toFixed(2)]) }; };
  const build = site => { disposeSettlement(site.id); genSettlement(site); const s = snap(site.id); disposeSettlement(site.id); return s; };
  const out = { lairs: lairs.length, glades: glades.length, inReach: inReach.length, outReach: outReach.length };
  const P = inReach[0]; if (P) {
    out.before = build(P.gl); out.doubledBefore = gladeDoubled(P.gl);
    worldState.lairs[P.l.id] = 1440; out.doubledAfter = gladeDoubled(P.gl); out.after = build(P.gl);
    // another glade within 700 of the same lair, but not its nearest, is untouched
    const other = glades.filter(q => q.id !== P.gl.id && D(q, P.l) <= 700)[0]; out.other = other ? { d: Math.round(D(other, P.l)), doubled: gladeDoubled(other) } : null;
    out.pair = { lair: P.l.name, glade: P.gl.name, d: Math.round(P.d) }; worldState.lairs = {}; }
  // a lair whose nearest glade is beyond 700: slain, that glade does not double
  const Q = outReach[0]; if (Q) { worldState.lairs[Q.l.id] = 1440; out.far = { d: Math.round(Q.d), doubled: gladeDoubled(Q.gl) }; worldState.lairs = {}; }
  // a bandit camp broken beside a glade is not a lair's beast
  const C = camps.map(c => ({ c, gl: nearestGlade(c) })).find(x => D(x.c, x.gl) <= 700); if (C) { worldState.lairs[C.c.id] = 1440; out.camp = { d: Math.round(D(C.c, C.gl)), doubled: gladeDoubled(C.gl) }; worldState.lairs = {}; }
  // the glade's own beasts dying marks the glade itself in worldState.lairs: that is no lair either
  if (P) { worldState.lairs[P.gl.id] = 1440; out.selfMark = gladeDoubled(P.gl); }
  worldState.lairs = saved; return out; });
console.log(JSON.stringify({ ...r, before: r.before && { n: r.before.herbs.length, beasts: r.before.beasts.length }, after: r.after && { n: r.after.herbs.length, ids: r.after.herbs.slice(16, 20).map(h => h[0]) } }));
check('lairs and glades found on the grid, and a lair with its nearest glade within 700', r.lairs > 10 && r.glades > 5 && r.inReach > 0, { lairs: r.lairs, glades: r.glades, inReach: r.inReach, outReach: r.outReach, pair: r.pair });
check('with the beast alive the glade grows 18 herbs', r.before && r.before.herbs.length === 18 && r.doubledBefore === false, r.before && r.before.herbs.length);
check('the beast slain, its nearest glade within 700 grows 36', r.doubledAfter === true && r.after.herbs.length === 36, r.after && r.after.herbs.length);
check('the second ring is <glade>:herb:18…35', r.after && r.after.herbs.slice(18).every((h, k) => h[0].endsWith(':herb:' + (18 + k))), r.after && r.after.herbs.slice(18).map(h => h[0]));
check('the first 18 herbs and the glade\'s beasts are as before, place for place', r.after && JSON.stringify(r.after.herbs.slice(0, 18)) === JSON.stringify(r.before.herbs) && JSON.stringify(r.after.beasts) === JSON.stringify(r.before.beasts), { beasts: r.before && r.before.beasts.length });
check('another glade within 700 of that lair, not its nearest, does not double', !r.other || r.other.doubled === false, r.other);
check('a lair whose nearest glade lies beyond 700 doubles nothing', !r.far || r.far.doubled === false, r.far);
check('a broken bandit camp beside a glade doubles nothing; nor does the glade\'s own mark', (!r.camp || r.camp.doubled === false) && r.selfMark === false, { camp: r.camp, self: r.selfMark });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
