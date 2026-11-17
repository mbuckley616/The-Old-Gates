// The Commencement's table and the Caravan's scale on the new look (Session 2351; Michael's B on #1628, *Festivals on the Calendar, III*;
// PKIT.props.bursar and .saffron in 38-kit.js, genSettlement's S.stalls in 83). Every Aurennais place builds both hidden, each 0.75 m in
// front of its keeper's spot (BURSAR_AT, CARAVAN_AT) toward the square's middle; the bursar's shows from 9:00 to noon on Shearing 6,
// the caravan's from 6:00 to 18:00 on its day, with their keepers, and neither on an ordinary day. A picture of each.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const ids = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => !s.islet);
  return ['town', 'port', 'village'].map(k => (S.find(s => s.kind === k) || {}).id).filter(Boolean); });
const out = [];
for (const id of ids) {
  check(`${id} is built`, await g.settle(id));
  out.push(await page.evaluate(id => { const S = WORLD.settle.get(id), site = siteAnywhere(id); if (!S.stalls) return { id, none: true };
    return { id, kind: site.kind, stalls: S.stalls.map(T => { const c = Math.cos(T.ry), s = Math.sin(T.ry), at = (lx, lz) => [T.x + lx * c + lz * s, T.z - lx * s + lz * c];
      let solid = 0; for (const lx of [-.75, -.25, .25, .75]) for (const lz of [-.38, 0, .38]) { const [x, z] = at(lx, lz); if (solidAt(x, z)) solid++; }
      const A = T.key === 'bursar' ? BURSAR_AT : CARAVAN_AT, kx = site.x + A[0], kz = site.z + A[1], [qx, qz] = at(-(T.slide || 0), -.75);
      const [ex, ez] = festKeeperAt(site, T.key, A), back = { lx: +((ex - T.x) * c - (ez - T.z) * s).toFixed(2), lz: +((ex - T.x) * s + (ez - T.z) * c).toFixed(2) };
      let door = 1e9; for (const h of S.houses) if (h.doorX != null) door = Math.min(door, Math.hypot(h.doorX - T.x, h.doorZ - T.z));
      return { key: T.key, slide: T.slide, solid, keeper: +Math.hypot(qx - kx, qz - kz).toFixed(3), toMid: +(Math.hypot(T.x - site.x, T.z - site.z) - Math.hypot(kx - site.x, kz - site.z)).toFixed(2),
        door: +door.toFixed(1), back, tris: T.tris, draws: T.draws, hidden: !T.group.visible }; }) }; }, id));
}
console.log(JSON.stringify(out));
for (const r of out) {
  check(`${r.id} (${r.kind}) has the bursar's table and the caravan's scale`, !r.none && r.stalls.length === 2 && r.stalls[0].key === 'bursar' && r.stalls[1].key === 'caravan', r);
  for (const T of r.none ? [] : r.stalls) check(`  the ${T.key}'s: its keeper's spot ${T.keeper} m from where the keeper stands, the table ${-T.toMid} m nearer the middle (0.75 back from it, slid along); ${T.tris} triangles in ${T.draws} draws; ${T.solid} of 12 points of it on a solid (slid ${T.slide} m); the nearest door ${T.door} m; down on an ordinary day; the keeper behind its middle (${T.back.lx}, ${T.back.lz})`,
    T.keeper < .01 && Math.abs(T.back.lx) < .02 && Math.abs(T.back.lz + .75) < .02 && T.solid === 0 && Math.abs(T.slide) <= .9 && T.toMid < -.3 && T.toMid > -1.7 && T.tris <= 4000 && T.draws <= 10 && T.hidden, T);
}
// the days: each up with its keeper in its hours on its day, down outside them
const id = out.find(r => !r.none).id; await g.settle(id);
const d = await page.evaluate(id => { const site = siteAnywhere(id), S = WORLD.settle.get(id), st = TS(site), keep = { p: st.p, flags: st.flags }, o = {};
  const day = k => { const f = FESTIVALS.find(f => f.key === k); return ((f.month - CAL.startMonth + 12) % 12) * 28 + f.dom - 1; };
  const at = (n, h) => { worldState.gameTimeAbsMinutes = n * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; px = site.x + 3; pz = site.z + 3; CAM.position.set(px, CAM.position.y, pz); houseLod(); return S.stalls.map(T => T.group.visible); };
  st.p = 70; st.flags = {}; worldState.festivals = {};
  try { const nb = day('commencement'), nc = day('caravan');
    o.bDawn = at(nb, 8.5); o.bTen = at(nb, 10); o.bNoon = at(nb, 12.5); o.bBefore = at(nb - 1, 10);
    o.cDawn = at(nc, 5.5); o.cNoon = at(nc, 12); o.cDusk = at(nc, 18.5);
    st.flags = { occupied: true }; o.occupied = at(nc, 12); st.flags = {};
    at(nb, 10); tickBursar(); if (BURSAR) { const T = S.stalls[0], n = BURSAR.npc.g.position, c = Math.cos(T.ry), s = Math.sin(T.ry), dx = n.x - T.x, dz = n.z - T.z;
      o.bk = { lz: +(dx * s + dz * c).toFixed(2), lx: +(dx * c - dz * s).toFixed(2), slide: T.slide }; bursarOut(); }
    at(nc, 12); tickCaravan(); if (CARAVAN) { const T = S.stalls[1], n = CARAVAN.npc.g.position, c = Math.cos(T.ry), s = Math.sin(T.ry), dx = n.x - T.x, dz = n.z - T.z;
      o.ck = { lz: +(dx * s + dz * c).toFixed(2), lx: +(dx * c - dz * s).toFixed(2), slide: T.slide }; caravanOut(); }
  } finally { Object.assign(st, keep); worldState.festivals = {}; }
  return o; }, id);
console.log(JSON.stringify(d));
check(`on the Commencement the table is down at 8:30 (${!d.bDawn[0]}), up at 10:00 (${d.bTen[0]}), down at 12:30 (${!d.bNoon[0]}) and the day before (${!d.bBefore[0]}); the scale down all that day (${!d.bTen[1]})`,
  !d.bDawn[0] && d.bTen[0] && !d.bNoon[0] && !d.bBefore[0] && !d.bTen[1], d);
check(`on the Caravan the scale is down at 5:30 (${!d.cDawn[1]}), up at noon (${d.cNoon[1]}), down at 18:30 (${!d.cDusk[1]}), and not in an occupied town (${!d.occupied[1]}); the table down (${!d.cNoon[0]})`,
  !d.cDawn[1] && d.cNoon[1] && !d.cDusk[1] && !d.occupied[1] && !d.cNoon[0], d);
check(`the bursar stands behind the table (${JSON.stringify(d.bk)}) and the caravan-master behind the scale (${JSON.stringify(d.ck)}), 0.75 m back, behind its middle however far it was slid (S2358: the keeper slides with it)`,
  d.bk && d.ck && Math.abs(d.bk.lz + .75) < .05 && Math.abs(d.bk.lx) < .05 && Math.abs(d.ck.lz + .75) < .05 && Math.abs(d.ck.lx) < .05, d);

// a picture of each on its morning, from the subscriber's side
for (const [k, h, file] of [['commencement', 10, 'kit-bursar-table.png'], ['caravan', 10, 'kit-caravan-scale.png']]) {
  const pic = path.join(here, '../docs/prototypes', file);
  await page.evaluate(([id, k, h]) => { const site = siteAnywhere(id), S = WORLD.settle.get(id), st = TS(site); st.p = 70; st.flags = {};
    const f = FESTIVALS.find(f => f.key === k), n = ((f.month - CAL.startMonth + 12) % 12) * 28 + f.dom - 1; worldState.gameTimeAbsMinutes = n * 1440 + h * 60; forceTime(h);
    const T = S.stalls[k === 'caravan' ? 1 : 0], c = Math.cos(T.ry), s = Math.sin(T.ry); if (k === 'caravan') tickCaravan(); else tickBursar();
    VM_SCENE.visible = false; thirdPerson = false; px = T.x + s * 2.6 + c * (.8 - T.slide); pz = T.z + c * 2.6 - s * (.8 - T.slide); yaw = Math.atan2(px - T.x, pz - T.z); pitch = -.3; }, [id, k, h]);
  await g.spin(null, 8); await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
  await page.evaluate(() => { try { bursarOut(); caravanOut(); } catch (e) {} });
}
await page.evaluate(() => { VM_SCENE.visible = true; });
await g.close();
