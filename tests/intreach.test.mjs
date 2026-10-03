// Every room's partitions leave its rooms reachable (Session 449; backlog G, *the interior partitions*).
// Each generated house of the towns below is built (`WORLD.buildInteriorFor`) and walked from where `goToInterior` sets
// you down (the room's middle, 2.2 in from the door) by a flood fill on a tenth-of-a-unit grid that moves as the game
// does indoors: a step is refused where `intSolidAt` at the player's radius (0.3) and height says solid, the feet then
// stand on `footholdY` (a stair's step within STEP_UP, or a drop), and the room's walls bound it at the radius. The
// doors hung in the partitions are taken as opened (E opens one); nothing is jumped. A bed counts as reached from a spot
// where E would take it (1.6, within .9 of its height), a person where E would talk (2.2, within 1.2), the strongbox or
// home chest at 1.6 from the floor, a tower's chest at 1.5 within 1.2.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// The towns: Portclare and Dunmore, and the first city of each register (a keep, a guild hall, a cathedral; the Mark's,
// Aurenne's and a generated culture's rooms), with the cellars and the Guest's chapel under the houses that have them.
const TOWNS = process.env.TOWNS ? process.env.TOWNS.split(',') : ['portclare', 'dunmore', ...await page.evaluate(() => {
  const by = {}; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => {
    const r = /^cul/.test(t.reg) ? 'cul' : t.reg; if (t.kind === 'city' && !by[r]) by[r] = t.id; });
  return Object.values(by); })];
await page.evaluate(() => {
  // walk(h, shut): the room built, the flood from the door, what it reaches and misses; `shut` keeps the inner doors shut
  window._walk = (h, shut) => {
    WORLD.buildInteriorFor(h);
    const W = h.intW, D = h.intD, R = .3, S = .1;
    const doorSol = new Set(INT_DOORS.map(d => d.sol));
    const saved = INT_SOL.slice(); const kept = shut ? saved : saved.filter(s => !doorSol.has(s));
    INT_SOL.length = 0; for (const s of kept) INT_SOL.push(s);
    const solidAt = (x, z, y) => { const j = jumpY; jumpY = y; const r = intSolidAt(x, z, R); jumpY = j; return r; };
    const sx = W / 2, sz = D - 2.2; const y0 = footholdY(sx, sz, 0, 0);
    const startBlocked = solidAt(sx, sz, y0);
    const seen = new Set(); const pts = []; const q = [[Math.round(sx / S), Math.round(sz / S), y0]];
    const key = (i, k, y) => i + ',' + k + ',' + Math.round(y * 20);
    seen.add(key(q[0][0], q[0][1], y0));
    while (q.length && pts.length < 400000) {
      const [i, k, y] = q.pop(); pts.push([i * S, k * S, y]);
      for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nk = k + dk, x = ni * S, z = nk * S;
        if (x <= R || x >= W - R || z <= R || z >= D - R) continue;
        if (solidAt(x, z, y)) continue;
        const ny = footholdY(x, z, y, 0);
        const kk = key(ni, nk, ny); if (seen.has(kk)) continue; seen.add(kk); q.push([ni, nk, ny]);
      }
    }
    INT_SOL.length = 0; for (const s of saved) INT_SOL.push(s);
    const near = (tx, tz, ty, r, dy) => pts.some(p => Math.hypot(p[0] - tx, p[1] - tz) < r && Math.abs(p[2] - ty) < dy);
    const f2 = v => +(+v).toFixed(2), miss = [];
    INT_BEDS.forEach((b, n) => { if (!near(b.x, b.z, b.y || 0, 1.6, .9)) miss.push({ what: 'bed', n, room: b.room, x: f2(b.x), z: f2(b.z), y: f2(b.y || 0) }); });
    (WORLD.intNpcs || []).forEach(n => { const p = n.g.position; if (!near(p.x, p.z, p.y, 2.2, 1.2)) miss.push({ what: 'person', name: n.def && n.def.name, x: f2(p.x), z: f2(p.z), y: f2(p.y) }); });
    if (intNPCMesh && intNPCPos && !near(intNPCPos.x, intNPCPos.z, 0, 2.2, 1.2)) miss.push({ what: 'keeper', x: f2(intNPCPos.x), z: f2(intNPCPos.z) });
    const BX = WORLD.intBox, LT = WORLD.intLoot;
    if (BX && !near(BX.x, BX.z, 0, 1.6, .61)) miss.push({ what: BX.kind === 'home' ? 'chest' : 'strongbox', x: f2(BX.x), z: f2(BX.z) });
    if (LT && !near(LT.x, LT.z, LT.y, 1.5, 1.2)) miss.push({ what: 'loot', x: f2(LT.x), z: f2(LT.z), y: f2(LT.y) });
    const top = pts.reduce((m, p) => Math.max(m, p[2]), 0);
    return { id: h.id, name: h.name, type: h.type, style: h.style, two: !!h.two, W, D, startBlocked, cells: pts.length, top: f2(top),
      beds: INT_BEDS.length, people: (WORLD.intNpcs || []).length + (intNPCMesh ? 1 : 0), box: !!BX, loot: !!LT, doors: INT_DOORS.length, miss };
  };
});
const rows = [], shut = [];
for (const town of TOWNS) {
  await g.settle(town);
  const ids = await page.evaluate((town) => { forceTime(13); const S = WORLD.settle.get(town); return S ? S.houses.filter(h => String(h.id).startsWith('g_')).map(h => h.id) : []; }, town);
  for (const id of ids) {
    const r = await page.evaluate(([town, id]) => {
      const h = WORLD.settle.get(town).houses.find(x => x.id === id); forceTime(13);
      const out = [Object.assign({ town }, window._walk(h, false))];
      if (out[0].doors) out.push(Object.assign({ town, shut: true }, window._walk(h, true)));
      const cel = ['inn', 'guild_f', 'guild_m', 'castle', 'church'].includes(h.type) && WORLD.cellarFor(h);
      if (cel && (h.type !== 'church' || cel.type === 'chapel')) out.push(Object.assign({ town }, window._walk(cel, false)));
      return out;
    }, [town, id]);
    for (const x of r) (x.shut ? shut : rows).push(x);
  }
}
// The keeps and the towers: no town above holds a keep, so the nearest towns and cities with one are generated, as
// `civicfurn` finds its keep, and the two nearest towers (the spiral up the spire to the chest on its top floor).
rows.push(...await page.evaluate(() => {
  const all = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => all.push(t));
  const byD = k => all.filter(t => k.includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const out = []; let keeps = 0;
  for (const t of byD(['city', 'town']).slice(0, 40)) { if (keeps >= 3) break;
    const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); const h = S && S.houses.find(x => x.type === 'castle'); if (!h) continue; keeps++;
    out.push(Object.assign({ town: t.id }, window._walk(h, false))); out.push(Object.assign({ town: t.id }, window._walk(WORLD.cellarFor(h), false))); }
  for (const t of byD(['tower']).slice(0, 2)) { if (!WORLD.settlements.get(t.id)) WORLD.genSettlement(t);
    const h = ZONES.world.houses.find(x => x.type === 'tower' && x.siteId === t.id); if (h) out.push(Object.assign({ town: t.id }, window._walk(h, false))); }
  return out; }));
console.log('towns:', TOWNS.join(', '), ' styles:', [...new Set(rows.map(r => r.style))].join(', '));
const bad = rows.filter(r => r.miss.length || r.startBlocked);
console.log(`\n${rows.length} rooms; ${rows.reduce((a, r) => a + r.beds, 0)} beds, ${rows.reduce((a, r) => a + r.people, 0)} people, ${rows.filter(r => r.box).length} strongboxes or chests, ${rows.reduce((a, r) => a + r.doors, 0)} inner doors`);
const byType = {}; for (const r of rows) { const t = byType[r.type] || (byType[r.type] = { n: 0, bad: 0 }); t.n++; if (r.miss.length || r.startBlocked) t.bad++; }
console.log(Object.entries(byType).map(([t, v]) => `${t} ${v.n - v.bad}/${v.n}`).join(', '));
for (const r of bad) console.log(`  ${r.town} ${r.type}${r.two ? ' (two floors)' : ''} ${r.W}×${r.D} ${r.name}: ${r.startBlocked ? 'START BLOCKED ' : ''}${JSON.stringify(r.miss)}`);
check('rooms of every kind in the towns were built and walked (at least 30)', rows.length >= 30, rows.length);
check('nobody is set down inside a solid at the door', rows.every(r => !r.startBlocked), rows.filter(r => r.startBlocked).map(r => r.name));
check('every bed is reached on foot from the door', rows.every(r => !r.miss.some(m => m.what === 'bed')), bad.map(r => [r.name, r.miss.filter(m => m.what === 'bed')]));
check('every person indoors is reached to talk to', rows.every(r => !r.miss.some(m => m.what === 'person' || m.what === 'keeper')), bad.map(r => [r.name, r.miss.filter(m => m.what === 'person' || m.what === 'keeper')]));
check('every strongbox, chest and tower hoard is reached', rows.every(r => !r.miss.some(m => ['strongbox', 'chest', 'loot'].includes(m.what))), bad.map(r => [r.name, r.miss]));
check('three keeps (and their cellars) and two towers were walked', rows.filter(r => r.type === 'castle').length >= 3 && rows.filter(r => r.type === 'tower').length >= 2, Object.keys(byType));
check('a tower\'s hoard is on its top floor and reached by the spiral', rows.filter(r => r.type === 'tower').every(r => r.loot && r.top > 20), rows.filter(r => r.type === 'tower').map(r => [r.name, r.loot, r.top]));
check('a two-floor room\'s upstairs is reached by its stair', rows.filter(r => r.two && r.type !== 'church' && r.type !== 'castle').every(r => r.top > 1.5), rows.filter(r => r.two).map(r => [r.name, r.top]));
const hid = shut.filter(r => r.miss.length);
console.log(`control: with the inner doors kept shut, ${hid.length} of ${shut.length} rooms with doors hide something (${hid.reduce((a, r) => a + r.miss.length, 0)} things)`);
check('control: with the inner doors shut, the walk is stopped by them (rooms behind doors are missed)', hid.length >= shut.length / 2, shut.map(r => [r.name, r.miss.length]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
