// The Commencement's table and the Caravan's scale on the new look (Session 2351; Michael's B on #1628, *Festivals on the Calendar, III*;
// PKIT.props.bursar and .saffron in 38-kit.js, genSettlement's S.stalls in 83). Every Aurennais place builds both hidden, each 0.75 m in
// front of its keeper's spot (BURSAR_AT, CARAVAN_AT) toward the square's middle; the bursar's shows from 9:00 to noon on Shearing 6,
// the caravan's from 6:00 to 18:00 on its day, with their keepers, and neither on an ordinary day. A picture of each. Session 2648: the
// caravan's string, 2 to 4 pack camels behind its keeper (caravanStringTick, 34-creatures.js), gone with the keeper. Session 2652: tied
// nose to tail, a lead rope from each camel's halter to the tail of the one ahead.
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
      o.ck = { lz: +(dx * s + dz * c).toFixed(2), lx: +(dx * c - dz * s).toFixed(2), slide: T.slide };
      /* S2648 — the Caravan's string: 2 to 4 pack camels behind the keeper, nose to tail, out with the keeper */
      caravanStringTick(); const G = (CSTRING && CSTRING.groups) || [], km = Math.hypot(n.x - site.x, n.z - site.z);
      o.cs = { n: G.length, back: G.map(g => +(Math.hypot(g.position.x - site.x, g.position.z - site.z) - km).toFixed(2)), solid: G.filter(g => solidAt(g.position.x, g.position.z)).length,
        kind: G.every(g => g.parent === scene && g.children[0].userData.rig && g.children[0].userData.rig.name === 'Pack Camel'),
        gap: G.slice(1).map((g, i) => +Math.hypot(g.position.x - G[i].position.x, g.position.z - G[i].position.z).toFixed(2)),
        along: G.slice(1).map((g, i) => { const dx = g.position.x - G[i].position.x, dz = g.position.z - G[i].position.z, L = Math.hypot(dx, dz) || 1; return +Math.abs((dx * Math.sin(g.rotation.y) + dz * Math.cos(g.rotation.y)) / L).toFixed(3); }) };
      /* S2652 — the lead ropes: folded while the bodies are the drivers', then each from a camel's halter ring to the tail of the one ahead */
      const R = CSTRING && CSTRING.rope, RP = R && R.geometry.attributes.position; o.cs.folded = !!R && [...RP.array].every(v => v === 0);
      at(nc, 6.5); caravanStringTick(); /* S2687 — standing, the hour it comes in (couched from 7) */
      for (const gr of G) { const rig = gr.children[0].userData.rig; if (!rig.hc) hcAttach(rig, HC.build(hcGenome(rig))); hcLevel(rig, 0); hcPose(rig); }
      caravanStringTick(); const ring = new THREE.Vector3(), tail = new THREE.Vector3(); let low = 1e9;
      if (R) for (let i = 0; i < RP.count; i++) low = Math.min(low, RP.getY(i) + R.position.y - worldH(RP.getX(i) + R.position.x, RP.getZ(i) + R.position.z));
      o.rope = { n: R ? R.userData.ends.length : 0, draws: R ? 1 : 0, tris: R ? R.geometry.index.count / 3 : 0, low: +low.toFixed(2), ends: (R ? R.userData.ends : []).map((e, i) => {
        const f = G[i].children[0].userData.rig, l = G[i + 1].children[0].userData.rig; if (!e || !reinsBit(f, ring, new THREE.Vector3())) return null;
        l.hc.C.byName.tail0.getWorldPosition(tail); return { ring: +e[0].distanceTo(ring).toFixed(3), tail: +e[1].distanceTo(tail).toFixed(2), span: +e[0].distanceTo(e[1]).toFixed(2), up: +(e[0].y - worldH(e[0].x, e[0].z)).toFixed(2) }; }) };
      /* S2687 — couched while it trades: at noon every camel kneels (the kit's couch), its withers low; its rope still from its ring; up again at 17:30 */
      const wy = () => G.map(gr => { const r = gr.children[0].userData.rig, p = r.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()); return +(p.y - worldH(p.x, p.z)).toFixed(2); });
      const pose = h => { at(nc, h); caravanStringTick(); for (const gr of G) hcPose(gr.children[0].userData.rig); caravanStringTick(); for (const gr of G) gr.updateMatrixWorld(true); };
      const stand0 = wy(); pose(12); let low2 = 1e9; if (R) for (let i = 0; i < RP.count; i++) low2 = Math.min(low2, RP.getY(i) + R.position.y - worldH(RP.getX(i) + R.position.x, RP.getZ(i) + R.position.z));
      o.couch = { stand: stand0, noon: wy(), gait: G.map(gr => gr.children[0].userData.rig.gaitNow), ends: R ? R.userData.ends.filter(e => e).length : 0, low: +low2.toFixed(2) };
      pose(17.5); o.couch.up = wy(); o.couch.after = G.map(gr => !!gr.children[0].userData.rig.couch);
      caravanOut(); caravanStringTick(); o.cs.after = CSTRING; }
  } finally { Object.assign(st, keep); worldState.festivals = {}; }
  return o; }, id);
console.log(JSON.stringify(d));
check(`on the Commencement the table is down at 8:30 (${!d.bDawn[0]}), up at 10:00 (${d.bTen[0]}), down at 12:30 (${!d.bNoon[0]}) and the day before (${!d.bBefore[0]}); the scale down all that day (${!d.bTen[1]})`,
  !d.bDawn[0] && d.bTen[0] && !d.bNoon[0] && !d.bBefore[0] && !d.bTen[1], d);
check(`on the Caravan the scale is down at 5:30 (${!d.cDawn[1]}), up at noon (${d.cNoon[1]}), down at 18:30 (${!d.cDusk[1]}), and not in an occupied town (${!d.occupied[1]}); the table down (${!d.cNoon[0]})`,
  !d.cDawn[1] && d.cNoon[1] && !d.cDusk[1] && !d.occupied[1] && !d.cNoon[0], d);
check(`the bursar stands behind the table (${JSON.stringify(d.bk)}) and the caravan-master behind the scale (${JSON.stringify(d.ck)}), 0.75 m back, behind its middle however far it was slid (S2358: the keeper slides with it)`,
  d.bk && d.ck && Math.abs(d.bk.lz + .75) < .05 && Math.abs(d.bk.lx) < .05 && Math.abs(d.ck.lz + .75) < .05 && Math.abs(d.ck.lx) < .05, d);

check(`the Caravan's string: ${d.cs && d.cs.n} pack camels (2 to 4), ${JSON.stringify(d.cs && d.cs.back)} m further from the middle than the keeper, ${d.cs && d.cs.solid} on a solid, ${JSON.stringify(d.cs && d.cs.gap)} m apart and facing along the line (${JSON.stringify(d.cs && d.cs.along)}); gone with the keeper (${d.cs && d.cs.after === null})`,
  d.cs && d.cs.n >= 2 && d.cs.n <= 4 && d.cs.kind && d.cs.back.every(b => b > 1.5 && b < 8) && d.cs.solid === 0 && d.cs.gap.every(x => x > 2.8) && d.cs.along.every(a => a > .95) && d.cs.after === null, d.cs);
check(`the string couches while it trades (S2687): at noon ${d.couch && d.couch.gait.join(', ')}, the spine's root ${d.couch && d.couch.noon.join(', ')} m up against ${d.couch && d.couch.stand.join(', ')} standing at 6:30, ${d.couch && d.couch.ends} ropes still tied (lowest ${d.couch && d.couch.low} m); up again at 17:30 (${d.couch && d.couch.up.join(', ')} m)`,
  d.couch && d.couch.gait.every(g => g === 'couch') && d.couch.noon.every((y, i) => y < .55 * d.couch.stand[i]) && d.couch.ends === d.cs.n - 1 && d.couch.low > .05 && d.couch.up.every((y, i) => Math.abs(y - d.couch.stand[i]) < .05) && d.couch.after.every(c => !c), d.couch);
check(`the string's lead ropes (S2652): ${d.rope && d.rope.n} for ${d.cs && d.cs.n} camels in ${d.rope && d.rope.draws} draw (${d.rope && d.rope.tris} triangles), folded until the kit's bodies are built (${d.cs && d.cs.folded}); each from the halter's ring to the tail of the camel ahead (${JSON.stringify(d.rope && d.rope.ends)}), its lowest point ${d.rope && d.rope.low} m off the ground`,
  d.rope && d.cs.folded && d.rope.n === d.cs.n - 1 && d.rope.draws === 1 && d.rope.ends.every(e => e && e.ring < .001 && e.tail < .2 && e.span > .8 && e.span < 2.6 && e.up > 1.2 && e.up < 2.2) && d.rope.low > .9, d.rope);

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
