// Saves by place, and house ids that follow their lots (Session 243). Backlog F owed a watch for "a place that fails to
// regenerate (a house id that changed)". A house's id was its index among the lots a build used, and a town rebuilds
// when its prosperity moves twelve points or a paid building finishes: at another prosperity it uses fewer or more
// lots, and the guild halls' big lots come and go at 60, so every id could land on another building. Your own house
// (worldState.owned is keyed by id) went with it, and so did a save made inside a house.
// Session 1280: split in three for CI's 900 s, each part booting its own game: this one (the ids through prosperity swings
// and your own house), `placerooms` (a save inside each kind of room) and `placeload` (the three re-entries that go wrong).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
const t00 = Date.now(); const lap = (s) => console.log(`${s} at ${Math.round((Date.now() - t00) / 1000)} s`);

// 1. ids follow their lots through prosperity swings. Session 1275: a kit house keeps its front on the street line and its depth is its
// kind's (an inn 4–6 m, a merchant's house 8), so its centre moves when the kind does; a building on another lot moves both, the centre
// and the middle of its street front, and only that counts
const swing = [];
for (const id of ['dunmore', 'carraig_mor', 'portclare', 'colmans_rest']) {
  await g.settle(id);
  swing.push(await page.evaluate((id) => {
    const site = WORLD.siteAnywhere(id); const p0 = WORLD.prosperity(site);
    const build = (p) => { WORLD.setProsperity(site, p); if (WORLD.settle.has(id)) WORLD.disposeSettlement(id); WORLD.genSettlement(site);
      return WORLD.settle.get(id).houses.filter(h => /^g_/.test(h.id)).map(h => { const l = WORLD.settle.get(id).sol.find(q => q.hid === h.id); const S = WORLD.settle.get(id); const d = h.type === 'home' ? h.dlg : (S.npcs.find(n => n.def && n.def._houseId === h.id) || {}).def;
      const tx = -Math.sin(h.exitYaw), tz = -Math.cos(h.exitYaw);
      return { id: h.id, t: h.type, x: h.doorX, z: h.doorZ, cx: l ? l.cx : NaN, cz: l ? l.cz : NaN, fx: l ? l.cx + tx * h.d / 2 : NaN, fz: l ? l.cz + tz * h.d / 2 : NaN, who: h.keeper, look: d ? [d.sCol, d.hairCol, d.bCol, d.roleTag || d.role].join('/') : null }; }); };
    const guards = () => WORLD.settle.get(id).npcs.filter(n => n.def && n.def.role === 'Guard').map(n => n.def.name);
    const a = build(p0); const g0 = guards(); const r = { id, p0, n: a.length, cases: [] };
    for (const p of [p0 - 13, p0 + 13, p0 - 26, p0 + 26]) { if (p < 5 || p > 100) continue; const b = build(p);
      let both = 0, moved = 0; const renamed = [], relooked = []; const mv = []; for (const h of a) { const o = b.find(x => x.id === h.id); if (!o) continue; both++; const dd = Math.hypot(o.x - h.x, o.z - h.z); if (dd > .5) { const dc = Math.hypot(o.cx - h.cx, o.cz - h.cz), df = Math.hypot(o.fx - h.fx, o.fz - h.fz); mv.push([h.id, h.t, o.t, +dd.toFixed(1), +dc.toFixed(2), +df.toFixed(2)]); if (Math.min(dc, df) > .01) moved++; } const guild = t => /^guild_/.test(t); if (o.t === h.t && h.look && o.look && o.look !== h.look && h.who === o.who) relooked.push([h.id, h.look, o.look]); if (o.who !== h.who && h.who && o.who && !guild(h.t) && !guild(o.t)) renamed.push([h.id, h.who, o.who]); }
      const ids = new Set(b.map(h => h.id)); r.cases.push({ p, n: b.length, both, moved, mv, renamed, relooked, guardsSame: (x => x.every(n => g0.includes(n)) || g0.every(n => x.includes(n)))(guards()), unique: ids.size === b.length }); }
    build(p0); return r; }, id));
}
console.log('swing', JSON.stringify(swing));
check('across prosperity swings of 13 and 26 in four towns, no house id moves to another lot', swing.every(s => s.cases.length >= 3 && s.cases.every(c => c.moved === 0 && c.unique && c.both > 0)), swing);
check('and nobody is renamed: every keeper, resident and guard keeps the name the town first gave them (a guild hall\u2019s master is not the shopkeeper who takes the lot)', swing.every(s => s.cases.every(c => c.renamed.length === 0 && c.guardsSame)), swing.map(s => ({ id: s.id, cases: s.cases.map(c => ({ p: c.p, renamed: c.renamed.length, guardsSame: c.guardsSame, first: c.renamed[0] })) })));

// 2. your own house stays yours, where it was, through the same swings: the home nearest the centre (the first a new
// shop would take), one in the middle and the farthest (the first a poorer town drops)
const owned = await page.evaluate(() => {
  const id = 'dunmore', site = WORLD.siteAnywhere(id), p0 = WORLD.prosperity(site);
  const build = (p) => { WORLD.setProsperity(site, p); if (WORLD.settle.has(id)) WORLD.disposeSettlement(id); WORLD.genSettlement(site); return WORLD.settle.get(id).houses; };
  const homes = build(p0).filter(h => h.type === 'home'); const d = h => Math.hypot(h.doorX - site.x, h.doorZ - site.z);
  homes.sort((a, b) => d(a) - d(b)); const picks = [homes[0], homes[Math.floor(homes.length / 2)], homes[homes.length - 1]];
  const res = [];
  for (const h of picks) { worldState.owned = { [h.id]: { name: h.name, site: id } }; const hx = h.doorX, hz = h.doorZ;
    for (const p of [p0 + 26, p0 - 26, p0 - 45]) { const H = build(p).find(x => x.id === h.id);
      res.push({ id: h.id, p, found: !!H, type: H && H.type, name: H && H.name, moved: H ? +Math.hypot(H.doorX - hx, H.doorZ - hz).toFixed(2) : null }); } }
  // and without the guard, what the swing would do to those three lots (the lot's use without ownership)
  worldState.owned = {}; const bare = {}; for (const p of [p0 + 26, p0 - 26, p0 - 45]) { const B = build(p); bare[p] = picks.map(h => { const H = B.find(x => x.id === h.id); return H ? H.type : null; }); }
  build(p0); return { p0, res, bare };
});
console.log('owned', JSON.stringify(owned));
check('and they look the same: skin, hair, clothes and a resident\u2019s trade are kept with the name', swing.every(s => s.cases.every(c => c.relooked.length === 0)), swing.map(s => ({ id: s.id, cases: s.cases.map(c => ({ p: c.p, relooked: c.relooked.length, first: c.relooked[0] })) })));
check('an owned home is still Your House at its own door after the town rises 26 or falls 26 and 45', owned.res.every(r => r.found && r.type === 'home' && r.name === 'Your House' && r.moved === 0), owned.res);

lap('swings and the owned home');
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
