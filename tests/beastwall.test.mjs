// A beast's corpse held up a wall (Session 1132; QA's backlog I entry, 18 Oct 2026): Cave Bears killed by Hearthwick's well came
// to rest with the middle of the body up to 3.49 over the ground, every one quiet. A bear killed over the well's column (its middle
// 0.22 from the well's centre, 30 of its 31 points inside the solid) climbed it: the beasts' wall hold (S1091, from the people's S466)
// kept a rise the bones gave a stopped point as half a velocity every step, and held a point at rest on the wall in height for ever
// (gravity is 2.7 mm a step, under RD_GRIP.wall), so it rose to 7.7 in 1 of 6 seeded falls (12.5 once unseeded) and hung there.
// Now a held point never rises and may always fall. Here: 12 seeded falls over the column through tickPeople, 32 by the well,
// 8 on clear ground and 12 dropped 1.5 against a wall at their side.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const built = await g.settle('hearthwick');
check('Hearthwick is built', built);
const r = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = () => new THREE.Vector3(), WX0 = 13099.3, WZ0 = 25419.9, P0 = [px, pz];
  // QA's spot, 30 south of the well: the kill throws the body away from you, so toward the well and the house behind it
  px = 13100; pz = 25450;
  const fall = (x, z, s) => { const rr = Math.random; let a = s * 7919 + 104729; Math.random = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Cave Bear', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true); e.hp = 0;
    killZoneEnemy(e, WORLD.scene, s % 2 ? ' (POWER)' : ''); const R = [...RAGDOLLS].find(q => q.rig === e.limbs.wolf); let i = 0;
    while (R && RAGDOLLS.has(R) && i < 300) { tickRagdolls(1 / 60); i++; }
    Math.random = rr; e.mesh.updateMatrixWorld(true); const B = e.limbs.wolf.B, h = B.hips.getWorldPosition(V()), up = +(h.y - activeTerrainH(h.x, h.z)).toFixed(2);
    WORLD.scene.remove(e.mesh); return { up, t: R ? +R.t.toFixed(2) : 9, wall: !!(R && R.solid) }; };
  const out = { well: [], clear: [], solidNear: WORLD.solidAt(WX0 + .6, WZ0) || WORLD.solidAt(WX0, WZ0 + .6) || WORLD.solidAt(WX0, WZ0) };
  for (let s = 1; s <= 32; s++) { const a = s * 2.4, d = .8 * ((s % 4) + 1) / 4; out.well.push(fall(WX0 + Math.sin(a) * d, WZ0 + Math.cos(a) * d, s)); }
  px = P0[0]; pz = P0[1];
  // clear ground: the first spot ahead of you with no solid within 3
  const clear = (x, z) => { for (let dx = -3; dx <= 3; dx += .5) for (let dz = -3; dz <= 3; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let cx = null, cz = null; for (let d = 30; d <= 120 && cx === null; d += 4) { const x = px - Math.sin(yaw) * d, z = pz - Math.cos(yaw) * d; if (clear(x, z)) { cx = x; cz = z; } }
  if (cx !== null) for (let s = 1; s <= 8; s++) out.clear.push(fall(cx, cz, s));
  // the hold itself, made to happen: a bear killed on clear ground, then dropped 1.5 against a wall at its side (everything past
  // 0.25 east of where it died is solid, as a house's wall is to its full height), each of 12 falls held there by its own push
  // over the well's column, through tickPeople as the game runs it (QA's path), the highest point of the body at rest
  out.over = [];
  px = 13100; pz = 25450;
  for (let s = 1; s <= 12; s++) { const rr = Math.random; let a = s * 7919 + 13; Math.random = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
    const x = 13099.08, z = 25419.81, e = buildZoneEnemy(WORLD.scene, [], x, z, 'Cave Bear', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true); e.hp = 0; killZoneEnemy(e, WORLD.scene, '');
    const R = [...RAGDOLLS].find(q => q.rig === e.limbs.wolf), now = performance.now(), inside = R && R.solid ? R.P.filter(o => R.solid(R.O.x + o.p.x * R.K, R.O.z + o.p.z * R.K)).length : 0;
    for (let i = 0; i < 240; i++) tickPeople(1 / 60, now + i * 16.7);
    Math.random = rr; out.over.push({ top: R ? +Math.max(...R.P.map(o => R.O.y + o.p.y * R.K - activeTerrainH(R.O.x + o.p.x * R.K, R.O.z + o.p.z * R.K))).toFixed(2) : 9, t: R ? +R.t.toFixed(2) : 9, inside, n: R ? R.P.length : 0, done: !!R && !RAGDOLLS.has(R) });
    WORLD.scene.remove(e.mesh); }
  px = P0[0]; pz = P0[1];
  out.drop = [];
  if (cx !== null) for (let s = 1; s <= 12; s++) { const rr = Math.random; let a = s * 6007 + 7; Math.random = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
    const e = buildZoneEnemy(WORLD.scene, [], cx, cz, 'Cave Bear', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(cx, activeTerrainH(cx, cz), cz); e.mesh.updateMatrixWorld(true); e.hp = 0; killZoneEnemy(e, WORLD.scene, '');
    const R = [...RAGDOLLS].find(q => q.rig === e.limbs.wolf); let i = 0, top = 0;
    if (R) { const X = cx + .25; R.solid = (x, z) => x > X; const k = 1.5 / R.K; for (const o of R.P) { if (R.O.x + o.p.x * R.K > X) { o.p.x = o.q.x = (X - .02 - R.O.x) / R.K; } o.p.y += k; o.q.y += k; o.q.x -= .004 / R.K; }
      while (RAGDOLLS.has(R) && i < 300) { tickRagdolls(1 / 60); i++; } }
    Math.random = rr; e.mesh.updateMatrixWorld(true); const B = e.limbs.wolf.B, h = B.hips.getWorldPosition(V());
    out.drop.push({ up: +(h.y - activeTerrainH(h.x, h.z)).toFixed(2), t: R ? +R.t.toFixed(2) : 9 }); WORLD.scene.remove(e.mesh); }
  window.requestAnimationFrame = raf; return out;
});
const ups = r.well.map(f => f.up), hi = Math.max(...ups), clr = r.clear.map(f => f.up);
console.log('well', JSON.stringify(r.well), 'clear', JSON.stringify(r.clear));
check(`the well is a solid the bears fall against (${r.well.filter(f => f.wall).length} of ${r.well.length} with the wall test)`, r.solidNear && r.well.every(f => f.wall));
check(`32 Cave Bears killed by the well come to rest on the ground: hips ${Math.min(...ups)}–${hi} over it, none over 0.8 (${ups.filter(u => u > .8).length}), against ${clr.length ? Math.min(...clr) + '–' + Math.max(...clr) : 'none'} on clear ground`, hi <= .8 && clr.length === 8, { ups, clr });
check(`every fall comes to rest before the four-second cap (${r.well.filter(f => f.t > 4).length} capped by the well, ${r.clear.filter(f => f.t > 4).length} on clear ground)`, [...r.well, ...r.clear].every(f => f.t <= 4), r.well.map(f => f.t));
const ov = r.over.map(f => f.top);
check(`12 Cave Bears killed over the well's column (${Math.min(...r.over.map(f => f.inside))}–${Math.max(...r.over.map(f => f.inside))} of ${r.over[0]?.n} points inside it) come to rest on the ground: the highest point ${Math.min(...ov)}–${Math.max(...ov)} over it, none over 1.0 (${ov.filter(u => u > 1).length}; one of six rose to 7.7 before S1132), all at rest by ${Math.max(...r.over.map(f => f.t))} s`, ov.length === 12 && Math.max(...ov) <= 1 && r.over.every(f => f.done && f.t <= 4 && f.inside > 20), r.over);
const dr = r.drop.map(f => f.up);
check(`12 Cave Bears dropped 1.5 against a wall at their side fall to the ground: hips ${Math.min(...dr)}–${Math.max(...dr)} over it, none over 0.8 (${dr.filter(u => u > .8).length}), ${r.drop.filter(f => f.t > 4).length} at the cap`, dr.length === 12 && Math.max(...dr) <= .8 && r.drop.every(f => f.t <= 4), r.drop);
await g.close();
