// A lair's cavern door stands in the lair's own pad, facing it (Session 702, the critic's s482). `lairDoorFor` put the door
// 6 units north of the lair, behind the crag, and the placement pushed it out of the lair's pad: every lair's old gate stood
// about 46 off, facing north, away from the crag (the gate always faces -z). It is now 16 south of the lair's centre, inside
// its pad, and its face looks back at the crag's mouth and the beast before it.
import { boot, check } from './lib/game.mjs';
// Lairs on islets in the cells past the grid's edge (z > 28,800) are left out: solidAt reads everything there as the continent's edge.
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const rows = [];
  for (let i = hi - 4; i <= hi + 4; i++) for (let j = hj - 4; j <= hj + 4; j++) { const c = WORLD.getCell(i, j); if (!c || !c.sites) continue;
    for (const t of c.sites) if (t.kind === 'lair' && t.pad > 0 && t.x < WORLD.SIZE * GRID && t.z < WORLD.SIZE * GRID) rows.push({ id: t.id, cell: [i, j] }); }
  const out = [];
  for (const x of rows.slice(0, 14)) { WORLD.loadCell(...x.cell); const s = WORLD.SITE[x.id]; const c = WORLD.getCell(...x.cell);
    const door = (c.doors || []).find(d => d.lairDoor && d.lairSite === x.id); if (!door) continue; const w = dungeonWorldPos[door.seed];
    if (!w) { out.push({ name: s.name, placed: false }); continue; }
    const d = Math.hypot(w.x - s.x, w.z - s.z);
    // the gate's face is on its -z side: is the lair in front of it, and is the walk from the threshold to the beast's spot clear?
    const front = { x: w.x, z: w.z - 2.5 }, beast = { x: s.x, z: s.z + 3 };
    let blocked = 0; const L = Math.hypot(beast.x - front.x, beast.z - front.z);
    for (let k = 0; k <= L; k += .5) { const f = k / L; if (solidAt(front.x + (beast.x - front.x) * f, front.z + (beast.z - front.z) * f)) blocked++; }
    const facing = (w.z - s.z) / (d || 1);
    out.push({ name: s.name, placed: true, d: +d.toFixed(1), pad: s.pad, facing: +facing.toFixed(2), blocked, frontSolid: solidAt(front.x, front.z), dz: +(w.z - s.z).toFixed(1), dx: +(w.x - s.x).toFixed(1), seed: door.seed, id: x.id }); }
  return out; });
console.log(JSON.stringify(r));
const placed = r.filter(x => x.placed);
check('lairs round the start, each with its cavern door placed', placed.length >= 6, r.length);
const near = placed.filter(x => x.d <= x.pad);
check('every lair\'s door stands inside its own pad (was ~46 out)', near.length === placed.length, placed.map(x => [x.name, x.d, x.pad]));
check('every door faces its lair (the lair lies on the gate\'s -z side)', placed.every(x => x.facing > .9), placed.map(x => [x.name, x.facing]));
check('the threshold is open ground and the walk from it to the beast is clear', placed.every(x => !x.frontSolid && x.blocked === 0), placed.map(x => [x.name, x.frontSolid, x.blocked]));
// walk in and out: the cavern is the lair's, and you come out at its door
const p = placed[0];
const ent = await page.evaluate((p) => { const s = WORLD.SITE[p.id]; const portal = (ZONES.world.portals || []).find(q => q.seed === p.seed);
  if (!portal) return { ok: false }; px = portal.x; pz = portal.z - 2.5; goToDungeon(portal); return { ok: true, lair: portal.lair && portal.lair.siteId }; }, p);
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon')) break; }
const inside = await page.evaluate(() => activeZoneId);
await page.evaluate(() => goToOW());
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'world')) break; }
await g.spin(30);
const out = await page.evaluate((p) => { const s = WORLD.SITE[p.id]; const w = dungeonWorldPos[p.seed]; return { zone: activeZoneId, fromDoor: +Math.hypot(px - w.x, pz - w.z).toFixed(1), fromLair: +Math.hypot(px - s.x, pz - s.z).toFixed(1), solid: solidAt(px, pz) }; }, p);
console.log(JSON.stringify({ ent, inside, out }));
check('the lair\'s portal is the cavern\'s, and it opens', ent.ok && ent.lair === p.id && inside === 'dungeon', { ent, inside });
check('out of the cavern you stand by its door, in the lair, on open ground', out.zone === 'world' && out.fromDoor < 8 && out.fromLair <= p.pad && !out.solid, out);
// and you can walk away from it (at z+2, inside the mound, no key moved you)
const walk = await page.evaluate(() => ({ x: px, z: pz }));
await page.evaluate(() => { K['KeyW'] = true; }); await g.frames(20); await page.evaluate(() => { K['KeyW'] = false; });
const moved = await page.evaluate((w) => +Math.hypot(px - w.x, pz - w.z).toFixed(2), walk);
check('and walk away from it', moved > 1, moved);
// an ordinary old gate, not a lair's: the same way out
const og = await page.evaluate(() => { const portal = (ZONES.world.portals || []).filter(q => !q.lair && (q.kind || 'cave_door') === 'cave_door').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  if (!portal) return null; px = portal.x; pz = portal.z - 2.5; goToDungeon(portal); return { seed: portal.seed, x: portal.x, z: portal.z }; });
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon')) break; }
await page.evaluate(() => goToOW());
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'world')) break; }
await page.waitForTimeout(1500);
const ogOut = og && await page.evaluate((o) => ({ zone: activeZoneId, fromDoor: +Math.hypot(px - o.x, pz - o.z).toFixed(1), front: +(o.z - pz).toFixed(1), solid: solidAt(px, pz) }), og);
console.log(JSON.stringify({ og, ogOut }));
check('out of an ordinary old gate you stand in front of it, on open ground', og && ogOut.zone === 'world' && ogOut.front > 1 && !ogOut.solid, ogOut);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
