// Saves by place, and house ids that follow their lots (Session 243). Backlog F owed a watch for "a place that fails to
// regenerate (a house id that changed)". A house's id was its index among the lots a build used, and a town rebuilds
// when its prosperity moves twelve points or a paid building finishes: at another prosperity it uses fewer or more
// lots, and the guild halls' big lots come and go at 60, so every id could land on another building. Your own house
// (worldState.owned is keyed by id) went with it, and so did a save made inside a house.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
const cont = async () => {
  await page.evaluate(() => saveToSlot(0)); await page.waitForTimeout(1200);
  await page.reload(); await page.waitForTimeout(5000);
  await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(15000); await g.hide();
  return page.evaluate(() => ({ started, id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
};
const here = () => page.evaluate(() => ({ id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
const out = async () => { await page.evaluate(() => { if (currentHouse) exitInterior(); }); await page.waitForTimeout(3000); await g.hide(); };

// 1. ids follow their lots through prosperity swings
const swing = [];
for (const id of ['dunmore', 'carraig_mor', 'portclare', 'colmans_rest']) {
  await g.settle(id);
  swing.push(await page.evaluate((id) => {
    const site = WORLD.siteAnywhere(id); const p0 = WORLD.prosperity(site);
    const build = (p) => { WORLD.setProsperity(site, p); if (WORLD.settle.has(id)) WORLD.disposeSettlement(id); WORLD.genSettlement(site);
      return WORLD.settle.get(id).houses.filter(h => /^g_/.test(h.id)).map(h => { const l = WORLD.settle.get(id).sol.find(q => q.hid === h.id); return { id: h.id, t: h.type, x: h.doorX, z: h.doorZ, cx: l ? l.cx : NaN, cz: l ? l.cz : NaN, who: h.keeper }; }); };
    const guards = () => WORLD.settle.get(id).npcs.filter(n => n.def && n.def.role === 'Guard').map(n => n.def.name);
    const a = build(p0); const g0 = guards(); const r = { id, p0, n: a.length, cases: [] };
    for (const p of [p0 - 13, p0 + 13, p0 - 26, p0 + 26]) { if (p < 5 || p > 100) continue; const b = build(p);
      let both = 0, moved = 0; const renamed = []; const mv = []; for (const h of a) { const o = b.find(x => x.id === h.id); if (!o) continue; both++; const dd = Math.hypot(o.x - h.x, o.z - h.z); if (dd > .5) { mv.push([h.id, h.t, o.t, +dd.toFixed(1), +Math.hypot(o.cx - h.cx, o.cz - h.cz).toFixed(2)]); if (Math.hypot(o.cx - h.cx, o.cz - h.cz) > .01) moved++; } const guild = t => /^guild_/.test(t); if (o.who !== h.who && h.who && o.who && !guild(h.t) && !guild(o.t)) renamed.push([h.id, h.who, o.who]); }
      const ids = new Set(b.map(h => h.id)); r.cases.push({ p, n: b.length, both, moved, mv, renamed, guardsSame: (x => x.every(n => g0.includes(n)) || g0.every(n => x.includes(n)))(guards()), unique: ids.size === b.length }); }
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
check('an owned home is still Your House at its own door after the town rises 26 or falls 26 and 45', owned.res.every(r => r.found && r.type === 'home' && r.name === 'Your House' && r.moved === 0), owned.res);

// 3. save inside each kind of place, reload, Continue: the same room at the same spot
await g.settle('dunmore');
const kinds = ['home', 'weapon', 'inn', 'guild_f', 'church', 'cellar'];
const places = [];
for (const t of kinds) {
  if (!(await page.evaluate(() => !!WORLD.settle.get('dunmore')))) await g.settle('dunmore');
  await page.evaluate((t) => { const S = WORLD.settle.get('dunmore'); let h = S.houses.find(h => h.type === (t === 'cellar' ? 'inn' : t)); if (t === 'cellar') h = WORLD.cellarFor(h); goToInterior(h); }, t);
  await page.waitForTimeout(3000); await g.hide();
  const at = await here(); const back = await cont();
  places.push({ t, at, back }); console.log(t, JSON.stringify({ at, back })); await out();
}
for (const r of places) check(`saved in the ${r.t}, continued in the same room at the same spot`, r.back.started && r.back.id === r.at.id && r.back.name === r.at.name && Math.hypot(r.back.x - r.at.x, r.back.z - r.at.z) < .5, r);

// 4. saved in a home while the town's prosperity fell 13 (the town rebuilt behind you): back in that home
await g.settle('dunmore');
const fell = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.filter(h => h.type === 'home')[5]; goToInterior(h); return { id: h.id, name: h.name, exitX: h.exitX, exitZ: h.exitZ }; });
await page.waitForTimeout(3000); await g.hide();
await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); WORLD.setProsperity(s, WORLD.prosperity(s) - 13); });
const back4 = await cont();
const exit4 = await page.evaluate(() => currentHouse && { x: currentHouse.exitX, z: currentHouse.exitZ });
console.log('fell', JSON.stringify({ fell, back4, exit4 }));
check('saved in a home as the town fell 13: continued in the same house, behind the same door, under the same name', back4.id === fell.id && back4.name === fell.name && exit4 && Math.hypot(exit4.x - fell.exitX, exit4.z - fell.exitZ) < .1, { fell, back4, exit4 });
await out();

// 5. a save that names another building (as one from before this build can): the door it was saved behind decides
await g.settle('dunmore');
const real = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.filter(h => h.type === 'home')[3]; goToInterior(h); return h.id; });
await page.waitForTimeout(3000); await g.hide();
await page.evaluate(() => { currentHouse = Object.assign(Object.create(Object.getPrototypeOf(currentHouse)), currentHouse, { id: 'g_dunmore_2' }); });
const back5 = await cont();
console.log('legacy', JSON.stringify({ real, back5 }));
check('a save naming the wrong id comes back behind the door it was made behind', back5.id === real, { real, back5 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
