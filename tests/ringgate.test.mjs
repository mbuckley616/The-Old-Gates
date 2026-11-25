// ringgate (Session 2632; Michael's A on #1991, "Medium: rings 26 m across"; OG-037, his answer of 12 Oct, "the gate's outside is
// concentric rings, a broken circle for a failing gate"): on the new look every plain lesser gate's outside is the kit's gatemouth
// (PKIT.places.gatemouth, Session 2616's prototype) in a hill the world's ground is stamped into (ringGateStamp, 82), its face laid again
// where the ground's 4 m grid cannot make it (ringGateLaid). The suite counts them, stands at the nearest, and reads its size against a
// person, its ground (the court, the floor between the rings, the hill over them), its solids against its walls, its level of detail, and
// where the gate's exit stands you.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const a = await page.evaluate(() => { const doors = CELL_DOORS.filter(e => e.zone === 'gen' && e.kind === 'cave_door' && dungeonWorldPos[e.seed]), plain = doors.filter(e => !e.lairDoor && !e.root && !e.hollow && !e.wet);
  const L = [...RING_GATES.values()].filter(G => G.group && G.group.parent); L.sort((p, q) => Math.hypot(p.x - px, p.z - pz) - Math.hypot(q.x - px, q.z - pz));
  const mounds = []; sc.traverse(o => { if (o.name === 'oldGate') mounds.push(o); });
  const moundAtRing = mounds.filter(o => [...RING_GATES.values()].some(G => Math.hypot(o.position.x - G.x, o.position.z - G.z) < 2)).length;
  return { doors: doors.length, plain: plain.length, rings: plain.filter(e => e.ring && RING_GATES.has(e.seed)).length, lairs: doors.filter(e => e.lairDoor && e.ring).length, built: L.length, moundAtRing, near: L[0] && { seed: L[0].seed, x: L[0].x, z: L[0].z } }; });
console.log(JSON.stringify(a));
check(`every plain lesser gate placed so far is a ring gate (${a.rings} of ${a.plain}; ${a.built} built), no lair's cavern is one, and no old mound stands at any`, a.plain > 0 && a.rings === a.plain && a.lairs === 0 && a.built > 0 && a.moundAtRing === 0, a);
const S0 = a.near; await page.evaluate(G => { px = G.x; pz = G.z - 40; }, S0);
for (let n = 0; n < 8; n++) { await g.cells(); if (await page.evaluate(s => { const G = RING_GATES.get(s); return !!(G && G.group && G.group.parent); }, S0.seed)) break; await page.waitForTimeout(1000); }
const r = await page.evaluate(s => { const G = RING_GATES.get(s), S = rgShape(), W = (lx, lz) => G.toW(lx, lz), K = PKIT.places.gatemouth({ key: 'gate:' + s, cond: G.cond, ground: () => 0 });
  const gy = (lx, lz, y) => { jumpY = y == null ? G.y : y; return +(groundY(...W(lx, lz)) - G.y).toFixed(2); }, sol = (lx, lz) => { jumpY = G.y; return solidAt(...W(lx, lz), .3); };
  const out = { seed: s, face: G.face, plate: G.plate, cond: G.cond, roll: gateCondRoll(s), kit: G.kit, far: G.far, laid: G.laid, across: K.across, door: G.door };
  // the ground: the court level before the rings, the floor between them to the slit, the hill over them from above
  out.court = [[0, 6], [-6, 9], [6, 4]].map(([x, z]) => gy(x, z)); out.floor = []; for (let z = 2; z >= G.plate + .6; z -= 1.5) out.floor.push(gy(0, z));
  out.crown = +(S.CY + K.rings[0].ro).toFixed(2); out.over = [gy(0, -4, G.y + 40), gy(0, -10, G.y + 40), gy(-8, -12, G.y + 40)];
  // the grid: a sunk point of the world's 4 m grid under the hill, and the ground there as laid
  const gs = CHUNK / SEGS, [cx, cz] = W(0, -8), qx = Math.round(cx / gs) * gs, qz = Math.round(cz / gs) * gs; out.sunk = +(worldH(qx, qz) - G.y).toFixed(2); out.lifted = +(ringGateLifted(G, qx, qz) - G.y).toFixed(2);
  // the walk in from the court to the slit, as wide as the slit (the inner ring is 4 m across at the floor), is open; the walls round it are not
  out.blocked = []; for (let z = 20; z >= G.plate + .7; z -= .5) for (const x of [-.9, 0, .9]) if (sol(x, z)) out.blocked.push([x, z]);
  const hfront = Math.sqrt(S.holeR ** 2 - S.CY ** 2);
  out.walls = { headL: sol(-(hfront + 2), S.FZ - 2), headR: sol(hfront + 2, S.FZ - 2), plate: sol(0, G.plate - .6), revealL: sol(-(G.floors[1].half + .8), (G.floors[1].z0 + G.floors[1].z1) / 2), revealR: sol(G.floors[2].half + .8, (G.floors[2].z0 + G.floors[2].z1) / 2) };
  // the level of detail: the kit as drawn near, one mesh from RG_LOD
  const LD = G.group, lv = d => { const cam = CAM.clone(); const [x, z] = W(0, d); cam.position.set(x, G.y + 2, z); cam.updateMatrixWorld(true); LD.update(cam); return LD.getCurrentLevel(); };
  RG_SHOW_T = 0; ringGateShow(); out.lod = { at30: lv(30), at200: lv(200), farMeshes: LD.levels[1].object.isMesh ? 1 : 0, shown: LD.visible, chunks: G.chunks.filter(k => chunks.has(k)).length };
  // the gate's exit (goToOW stands you 2.5 m short of a cave door's z): on the floor before the slit, not in a wall
  const P = dungeonWorldPos[s]; jumpY = G.y; out.exit = { y: +(groundY(P.x, P.z - 2.5) - G.y).toFixed(2), solid: solidAt(P.x, P.z - 2.5, .3), lz: +G.toL(P.x, P.z - 2.5)[1].toFixed(2) };
  K.group.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); return out; }, S0.seed);
console.log(JSON.stringify(r));
check(`the gate ${r.seed} is ${r.cond}, its own roll; ${r.kit.tris} triangles in ${r.kit.draws} draws near, ${r.far.tris} in ${r.far.draws} far; its laid ground ${r.laid.tris} triangles over ${r.laid.sunk} sunk points`, r.cond === r.roll && r.kit.tris < 6000 && r.kit.draws <= 14 && r.far.draws === 1 && r.laid.sunk > 20, r);
check(`OG-037 at the medium size: the rings ${r.across} m across, the slit ${r.door.w} by ${r.door.h} m, over three times a person`, Math.abs(r.across - 26) < .1 && Math.abs(r.door.w - 2.4) < .01 && Math.abs(r.door.h - 5.5) < .01 && r.door.h > 3 * 1.75, r);
check(`the court is level (${r.court.join(', ')}) and the floor between the rings runs level to the slit (${r.floor.length} points, ${Math.min(...r.floor)} to ${Math.max(...r.floor)})`, r.court.every(v => Math.abs(v) < .05) && r.floor.every(v => Math.abs(v) < .05), r);
check(`from above, the hill over the rings (${r.over.join(', ')}) stands over their crown at ${r.crown} m`, r.over.every(v => v > r.crown + 1), r);
check(`the world's grid is sunk under it (${r.sunk} m) and laid again as the hill (${r.lifted} m)`, Math.abs(r.sunk + 1.5) < .01 && r.lifted > r.crown, r);
check(`the walk from the court to the slit, the slit's width, is open (${r.blocked.length} blocked), the headwall, the reveals and the back plate are walls`, r.blocked.length === 0 && Object.values(r.walls).every(Boolean), r);
check(`the kit as drawn at 30 m (level ${r.lod.at30}), one mesh at 200 m (level ${r.lod.at200}), drawn while its chunks stand (${r.lod.chunks})`, r.lod.at30 === 0 && r.lod.at200 === 1 && r.lod.farMeshes === 1 && r.lod.shown && r.lod.chunks > 0, r);
check(`out of the gate you stand on the floor before the slit (${r.exit.y} m, ${r.exit.lz} m in the kit's frame, between the rings), clear`, Math.abs(r.exit.y) < .05 && !r.exit.solid && r.exit.lz < r.face && r.exit.lz > r.plate, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
