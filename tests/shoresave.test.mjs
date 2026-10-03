// A save made in a place the routing moved to the shore (Session 455; owed by Session 452). S452 set 42 places that the
// basin lakes were laid over on the nearest dry ground in their own cell, and left a save made standing in one to reload
// at the old spot, now open water. The load read that as "a position in the sea" and sent you to the spawn, thousands of
// units off. The place moved whole, so the saved spot now moves with it: in the street, at a door, or behind one.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();

const pick = await page.evaluate(() => { let L = WORLD.routed.shore.list; /* on a build before S455 (the control run under --src), the same list from the sites' own drawnAt */
  if (!L) { L = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) for (const t of WORLD.getCell(i, j).sites || []) if (t.drawnAt && t.pad > 0) L.push({ id: t.id, from: t.drawnAt, dx: t.x - t.drawnAt.x, dz: t.z - t.drawnAt.z, pad: t.pad }); }
  const v = L.map(m => ({ m, s: WORLD.siteAnywhere(m.id) })).filter(o => o.s && o.s.kind === 'village')[0];
  return { n: L.length, id: v.m.id, name: v.s.name, from: v.m.from, to: { x: v.s.x, z: v.s.z }, dx: v.m.dx, dz: v.m.dz, pad: v.s.pad, spawn: { x: px, z: pz } }; });
console.log(JSON.stringify(pick));
check('the routing lists every place it moved, with its offset', pick.n >= 35 && pick.n <= 50 && Math.abs(pick.from.x + pick.dx - pick.to.x) < 1e-6, pick.n);

// a world save: standing in the old street, 10 units off the old centre
const load = (where) => page.evaluate((where) => { const d = _buildSavePayload(); d.where = where; d.px = where.x; d.pz = where.z;
  _applyLoadData(d); _applyZoneFromSave(d); return { x: px, z: pz }; }, where);
const st = { x: pick.from.x + 10, z: pick.from.z - 6 };
const before = await page.evaluate(p => ({ h: +WORLD.worldH(p.x, p.z).toFixed(2), m: !!(WORLD.movedPlaceAt && WORLD.movedPlaceAt(p.x, p.z)) }), st);
const w = await load({ kind: 'world', x: st.x, z: st.z, yaw: 1 });
await g.settle(pick.id);
const wAt = await page.evaluate(([p, s]) => ({ x: +px.toFixed(1), z: +pz.toFixed(1), off: +Math.hypot(px - s.x, pz - s.z).toFixed(1), h: +WORLD.worldH(px, pz).toFixed(2), built: WORLD.settle.has(s.id) }), [w, { x: pick.to.x, z: pick.to.z, id: pick.id }]);
console.log('world', JSON.stringify({ before, w, wAt }));
check('the old street now reads as water, and the lookup knows it', before.h < .5 && before.m, before);
check('a world save there reloads in the moved village, at the same spot in its street (10, −6 from the centre)', Math.abs(w.x - (pick.to.x + 10)) < .01 && Math.abs(w.z - (pick.to.z - 6)) < .01, w);
check('…on dry ground, with the village built round you', wAt.h > 1.5 && wAt.built, wAt);

// a save behind a door: enter a house in the moved village, save, then write its door back to where the village was drawn
const hs = await page.evaluate(id => { const S = WORLD.settle.get(id); const h = S.houses.find(h => h.type === 'home' && h.exitX != null) || S.houses.find(h => h.exitX != null); goToInterior(h); return { id: h.id, ex: h.exitX, ez: h.exitZ }; }, pick.id);
await page.waitForFunction(() => currentHouse && currentHouse.id, null, { timeout: 60000, polling: 300 }); await page.waitForTimeout(1500);
const saved = await page.evaluate(([dx, dz]) => { const d = _buildSavePayload(); const W = d.where; W.door.x -= dx; W.door.z -= dz; return d; }, [pick.dx, pick.dz]);
await page.evaluate(() => { if (currentHouse) exitInterior(); }); await page.waitForTimeout(2500);
await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(4000);
const h1 = await page.evaluate(d => { _applyLoadData(d); _applyZoneFromSave(d); return { x: px, z: pz }; }, saved);
await page.waitForFunction(() => currentHouse && currentHouse.id, null, { timeout: 60000, polling: 300 }).catch(() => {}); await page.waitForTimeout(1500);
const h2 = await page.evaluate(() => ({ id: currentHouse && currentHouse.id }));
console.log('house', JSON.stringify({ hs, door: saved.where.door, h1, h2 }));
check('a save behind a door there puts you outside that door in the moved village first (not the spawn)', Math.hypot(h1.x - hs.ex, h1.z - hs.ez) < .5, { h1, hs });
check('…then back in the same room', h2.id === hs.id, { h2, hs });
// a dry spot near nothing moved is left where it was saved, and a spot in water near no moved place is not carried
const ctl = await page.evaluate(([s, f]) => { const far = { x: s.x + 30, z: s.z + 30 }; const hdry = WORLD.worldH(far.x, far.z);
  const M = WORLD.movedPlaceAt || (() => null); return { dry: hdry > .5, moved: !!M(far.x, far.z), lakeFar: !!M(f.x + 900, f.z) }; }, [pick.spawn, pick.from]);
const c2 = await load({ kind: 'world', x: pick.spawn.x + 30, z: pick.spawn.z + 30, yaw: 0 });
console.log('control', JSON.stringify({ ctl, c2 }));
check('a save elsewhere is untouched (no lookup hit, the same spot back)', ctl.dry && !ctl.moved && !ctl.lakeFar && Math.abs(c2.x - pick.spawn.x - 30) < .01 && Math.abs(c2.z - pick.spawn.z - 30) < .01, { ctl, c2 });

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
