// ringgate (Session 2633; Michael's A on #1991, "Medium: rings 26 m across"; OG-037, his answer of 12 Oct, "the gate's outside is
// concentric rings, a broken circle for a failing gate"): on the new look every plain lesser gate's outside is the kit's gatemouth
// (PKIT.places.gatemouth, Session 2616's prototype) in a hill the world's ground is stamped into (ringGateStamp, 82), its face laid again
// where the ground's 4 m grid cannot make it (ringGateLaid). The suite counts them, stands at the nearest, and reads its size against a
// person, its ground (the court, the floor between the rings, the hill over them), its solids against its walls, its level of detail, and
// where the gate's exit stands you. Session 2641: the home province's authored gates are ring gates too.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const a = await page.evaluate(() => { const home = CELL_DOORS.filter(e => ZONE_ANCHOR[e.zone] && (e.kind || 'cave_door') === 'cave_door' && dungeonWorldPos[e.seed]), doors = CELL_DOORS.filter(e => e.zone === 'gen' && e.kind === 'cave_door' && dungeonWorldPos[e.seed]), plain = doors.filter(e => !e.lairDoor && !e.root && !e.hollow && !e.wet);
  const L = [...RING_GATES.values()].filter(G => G.group && G.group.parent); L.sort((p, q) => Math.hypot(p.x - px, p.z - pz) - Math.hypot(q.x - px, q.z - pz));
  const mounds = []; sc.traverse(o => { if (o.name === 'oldGate') mounds.push(o); });
  const moundAtRing = mounds.filter(o => [...RING_GATES.values()].some(G => Math.hypot(o.position.x - G.x, o.position.z - G.z) < 2)).length;
  return { doors: doors.length, plain: plain.length, rings: plain.filter(e => e.ring && RING_GATES.has(e.seed)).length, lairs: doors.filter(e => e.lairDoor && e.ring).length, built: L.length, moundAtRing, home: home.length, homeRings: home.filter(e => e.ring && RING_GATES.has(e.seed)).length, crypt: !!(home.find(e => e.seed === 137) || {}).ring, near: L[0] && { seed: L[0].seed, x: L[0].x, z: L[0].z } }; });
console.log(JSON.stringify(a));
check(`every plain lesser gate placed so far is a ring gate (${a.rings} of ${a.plain}; ${a.built} built), no lair's cavern is one, and no old mound stands at any`, a.plain > 0 && a.rings === a.plain && a.lairs === 0 && a.built > 0 && a.moundAtRing === 0, a);
// S2641: the home province's authored gates (WORLD_DUNGEONS, placed by their old zones' anchors, the Crypt of Embers among them) are ring gates too
check(`the home province's authored gates are ring gates (${a.homeRings} of ${a.home}), the Crypt of Embers among them`, a.home >= 7 && a.homeRings === a.home && a.crypt, a);
// S2649 (s1963, the critic: a gate facing down its hill showed the walk up a bare bank): where the land falls 2 m or more past the court, a flight
// runs down the bank on the axis inside the hill's reach. Every gate stamped so far: the flights' slopes and ends, the ground along each falling
// with no step over its own rise from the court to the foot (past the 2 m it eases into the land over, the land is the world's own, and may rise again)
const st = await page.evaluate(() => { const out = { gates: 0, flights: 0, bad: [], worst: 0, s: [] }; for (const G of RING_GATES.values()) { out.gates++; const T = G.stair; if (!T) continue; out.flights++; out.s.push(T.s);
    if (T.z1 > 35 || T.s > .9 || T.n < 4) out.bad.push([G.seed, 'plan', T]);
    let prev = null; for (let z = T.z0 - 2; z <= T.z1 + 3; z += .25) { const [x, zz] = G.toW(0, z), h = worldH(x, zz) - G.y; if (prev !== null) { const d = h - prev; out.worst = Math.max(out.worst, Math.abs(d)); if ((z <= T.z1 - 2 && d > .05) || Math.abs(d) > T.s * .25 + .25) out.bad.push([G.seed, +z.toFixed(2), +d.toFixed(2)]); } prev = h; } }
  return out; });
console.log(JSON.stringify(st));
check(`a gate on a slope has its flight down the bank (${st.flights} of ${st.gates}, slopes ${st.s.join(', ')}), the ground along each falling without a step (worst ${st.worst.toFixed(2)} m in 0.25)`, st.bad.length === 0, st);
// Session 2730 (the critic, 27 Nov: the look sheets' gate at dusk a hump after the other seven views): a door's spot is pushed off the roads,
// stamps and doors loaded when it is placed, so gate 137 came back 59 m from where it stood once its cells were unloaded and loaded again
// with its neighbours not yet in (the gate's cell first, as a far jump's return gives it). It keeps the spot it was first given.
const keep = await page.evaluate(() => { const G0 = RING_GATES.get(137); if (!G0) return { none: true }; const a = [+G0.x.toFixed(1), +G0.z.toFixed(1), +G0.ry.toFixed(2)];
  const [ci, cj] = cellOf(G0.x, G0.z); const ks = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const k = cellKey(ci + di, cj + dj); if (LOADED.has(k)) { ks.push([ci + di, cj + dj]); unloadCell(k); } }
  loadCell(ci, cj); const G1 = RING_GATES.get(137); const b = G1 ? [+G1.x.toFixed(1), +G1.z.toFixed(1), +G1.ry.toFixed(2)] : null;
  ks.forEach(([i, j]) => { if (!LOADED.has(cellKey(i, j))) loadCell(i, j); }); return { a, b, cells: ks.length }; });
check(`a gate keeps its spot when its cells unload and its own cell loads again first (gate 137 at ${keep.a}, then ${keep.b})`, !keep.none && !!keep.b && keep.a.every((v, i) => v === keep.b[i]), keep);
const S0 = a.near; await page.evaluate(G => { px = G.x; pz = G.z - 40; }, S0);
for (let n = 0; n < 8; n++) { await g.cells(); if (await page.evaluate(s => { const G = RING_GATES.get(s); return !!(G && G.group && G.group.parent); }, S0.seed)) break; await page.waitForTimeout(1000); }
await page.evaluate(() => WORLD.setRadius(RADIUS)); /* the chunks round you built now, as the game's frames would (CI read none streamed yet) */
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
  const P = dungeonWorldPos[s], [dlx, dlz] = G.toL(P.x, P.z); out.doorAt = [+dlx.toFixed(2), +dlz.toFixed(2)];
  K.group.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); return out; }, S0.seed);
console.log(JSON.stringify(r));
check(`the gate ${r.seed} is ${r.cond}, its own roll; ${r.kit.tris} triangles in ${r.kit.draws} draws near, ${r.far.tris} in ${r.far.draws} far; its laid ground ${r.laid.tris} triangles over ${r.laid.sunk} sunk points`, r.cond === r.roll && r.kit.tris < 6000 && r.kit.draws <= 14 && r.far.draws === 1 && r.laid.sunk > 20, r);
check(`OG-037 at the medium size: the rings ${r.across} m across, the slit ${r.door.w} by ${r.door.h} m, over three times a person`, Math.abs(r.across - 26) < .1 && Math.abs(r.door.w - 2.4) < .01 && Math.abs(r.door.h - 5.5) < .01 && r.door.h > 3 * 1.75, r);
check(`the court is level (${r.court.join(', ')}) and the floor between the rings runs level to the slit (${r.floor.length} points, ${Math.min(...r.floor)} to ${Math.max(...r.floor)})`, r.court.every(v => Math.abs(v) < .05) && r.floor.every(v => Math.abs(v) < .05), r);
check(`from above, the hill over the rings (${r.over.join(', ')}) stands over their crown at ${r.crown} m`, r.over.every(v => v > r.crown + 1), r);
check(`the world's grid is sunk under it (${r.sunk} m) and laid again as the hill (${r.lifted} m)`, Math.abs(r.sunk + 1.5) < .01 && r.lifted > r.crown, r);
check(`the walk from the court to the slit, the slit's width, is open (${r.blocked.length} blocked), the headwall, the reveals and the back plate are walls`, r.blocked.length === 0 && Object.values(r.walls).every(Boolean), r);
check(`the kit as drawn at 30 m (level ${r.lod.at30}), one mesh at 200 m (level ${r.lod.at200}), drawn while its chunks stand (${r.lod.chunks})`, r.lod.at30 === 0 && r.lod.at200 === 1 && r.lod.farMeshes === 1 && r.lod.shown && r.lod.chunks > 0, r);
check(`the gate's door stands at the slit (${r.doorAt.join(', ')} in the kit's frame)`, Math.abs(r.doorAt[0]) < .01 && Math.abs(r.doorAt[1] - r.plate) < .01, r);
// in by the gate's door and out again: you come up on its floor before the slit, looking out of the rings, not on the hill over them
await page.evaluate(s => { const e = CELL_DOORS.find(d => d.seed === s), p = makePortalDef(e), w = dungeonWorldPos[s]; p.x = w.x; p.z = w.z; p.zone = 'world'; p.sigil = false; px = p.x; pz = p.z; goToDungeon(p); }, S0.seed);
for (let k = 0; k < 120 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
// Session 2658 (Michael, 25 Nov: "Any dungeon exit should be a mirror ... to the corresponding entrance door"): inside, the way out is the gate's door
// seen from within: the slit between its two pillars of script, lit by the gate's own condition, the lintel and the sigil; no block door, no
// green disc, no green light; standing in the entrance cell against its wall
const ex = await page.evaluate(s => { const X = DUN_EXIT, G = RING_GATES.get(s); let green = 0, disc = 0; dScene.traverse(o => { if (o.isPointLight && o.color.getHex() === 0x88ff44) green++; if (o.isMesh && o.geometry.type === 'CircleGeometry' && o.material.color && o.material.color.getHex() === 0xc8e88a) disc++; });
  if (!X) return { none: true, green, disc }; const wx = dAt(dEntranceX), wz = dAt(dEntranceZ), n = X.group.children.length;
  return { kind: X.kind, cond: X.cond, gcond: G && G.cond, w: X.w, h: X.h, n, green, disc, off: +Math.hypot(X.x - wx, X.z - wz).toFixed(2), half: DCELL / 2, H: FLOOR_HEIGHT }; }, S0.seed);
console.log('exit', JSON.stringify(ex));
check(`inside, the way out is the gate's door: ${ex.kind}, a slit ${ex.w} by ${ex.h} m in ${ex.n} pieces, lit ${ex.cond} as outside (${ex.gcond}), on the entrance cell's wall (${ex.off} m of ${ex.half}); no green light or disc (${ex.green}, ${ex.disc})`,
  !ex.none && ex.kind === 'ring' && ex.cond === ex.gcond && ex.n >= 6 && ex.h < ex.H && Math.abs(ex.off - ex.half) < .01 && ex.green === 0 && ex.disc === 0, ex);
await page.evaluate(() => goToOW());
for (let k = 0; k < 120 && !(await page.evaluate(() => activeZoneId === 'world')); k++) await page.waitForTimeout(500);
const x = await page.evaluate(s => { const G = RING_GATES.get(s), [lx, lz] = G.toL(px, pz), f = [Math.sin(G.ry), Math.cos(G.ry)], look = [-Math.sin(yaw), -Math.cos(yaw)];
  return { zone: activeZoneId, lx: +lx.toFixed(2), lz: +lz.toFixed(2), y: +(jumpY - G.y).toFixed(2), ground: +(groundY(px, pz) - G.y).toFixed(2), out: +(f[0] * look[0] + f[1] * look[1]).toFixed(3), solid: solidAt(px, pz, .3), plate: G.plate, face: G.face, ry: +G.ry.toFixed(3) }; }, S0.seed);
console.log(JSON.stringify(x));
check(`in by the door and out again: on the floor (${x.y} m) ${(x.lz - x.plate).toFixed(1)} m before the slit, clear, looking out of the rings (${x.out}); the gate faces ${x.ry}`, x.zone === 'world' && Math.abs(x.y) < .05 && Math.abs(x.ground) < .05 && Math.abs(x.lx) < .05 && x.lz > x.plate + 2 && x.lz < x.face && !x.solid && x.out > .99, x);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
