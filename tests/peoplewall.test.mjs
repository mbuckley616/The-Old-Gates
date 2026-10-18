// A person's corpse and a wall (Session 1136; owed by Session 1133): the beasts' wall hold let a Cave Bear killed over Hearthwick's
// well climb its column, which has no top, and hang there quiet. The people's ragdoll (ragdollStep, S466) holds a point at a wall
// the same way. Here, as for the bears: 24 seeded Bandits killed over the well's column and 24 by it, through tickPeople as the game
// runs it, with you 30 south; 8 on clear ground; and 12 dropped 1.5 against a wall at their side. Each must rest on the ground.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const built = await g.settle('hearthwick');
check('Hearthwick is built', built);
const r = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const WX0 = 13099.3, WZ0 = 25419.9, P0 = [px, pz];
  const seed = s => { let a = s * 7919 + 104729; Math.random = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; }; };
  const rest = R => R ? +Math.max(...R.P.map(o => R.O.y + o.p.y - activeTerrainH(R.O.x + o.p.x, R.O.z + o.p.z))).toFixed(2) : 9;
  const hipsUp = R => R ? +(R.O.y + R.P[R.I.hips].p.y - activeTerrainH(R.O.x + R.P[R.I.hips].p.x, R.O.z + R.P[R.I.hips].p.z)).toFixed(2) : 9;
  const fall = (x, z, s, prep) => { const rr = Math.random; seed(s);
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true); e.hp = 0;
    killZoneEnemy(e, WORLD.scene, s % 2 ? ' (POWER)' : ''); const R = [...RAGDOLLS].find(q => q.rig === e.limbs.person);
    const inside = R && R.solid ? R.P.filter(o => R.solid(R.O.x + o.p.x, R.O.z + o.p.z)).length : 0;
    if (R && prep) prep(R);
    const now = performance.now(); let i = 0;
    for (; i < 300 && R && RAGDOLLS.has(R); i++) tickPeople(1 / 60, now + i * 16.7);
    Math.random = rr; const out = { top: rest(R), hips: hipsUp(R), t: R ? +R.t.toFixed(2) : 9, inside, n: R ? R.P.length : 0, wall: !!(R && R.solid), done: !!R && !RAGDOLLS.has(R) };
    WORLD.scene.remove(e.mesh); return out; };
  px = 13100; pz = 25450;
  const out = { over: [], by: [], clear: [], drop: [], solid: WORLD.solidAt(WX0, WZ0) };
  for (let s = 1; s <= 24; s++) { const a = s * 2.4, d = .25 * ((s % 3) / 2); out.over.push(fall(WX0 + Math.sin(a) * d, WZ0 + Math.cos(a) * d, s)); }
  for (let s = 1; s <= 24; s++) { const a = s * 2.4, d = .4 + .5 * ((s % 4) + 1) / 4; out.by.push(fall(WX0 + Math.sin(a) * d, WZ0 + Math.cos(a) * d, s + 100)); }
  px = P0[0]; pz = P0[1];
  const clear = (x, z) => { for (let dx = -3; dx <= 3; dx += .5) for (let dz = -3; dz <= 3; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let cx = null, cz = null; for (let d = 30; d <= 120 && cx === null; d += 4) { const x = px - Math.sin(yaw) * d, z = pz - Math.cos(yaw) * d; if (clear(x, z)) { cx = x; cz = z; } }
  if (cx !== null) {
    for (let s = 1; s <= 8; s++) out.clear.push(fall(cx, cz, s + 200));
    // the hold made to happen: everything 0.25 east of where each died is solid, to any height, and the body is lifted 1.5 against it
    for (let s = 1; s <= 12; s++) out.drop.push(fall(cx, cz, s + 300, R => { const X = cx + .25; R.solid = (x, z) => x > X;
      for (const o of R.P) { if (R.O.x + o.p.x > X) o.p.x = o.q.x = X - .02 - R.O.x; o.p.y += 1.5; o.q.y += 1.5; o.q.x -= .004; } }));
  }
  window.requestAnimationFrame = raf; return out;
});
const rng = a => `${Math.min(...a)}–${Math.max(...a)}`;
// a body may come to rest sitting against the wall, the top of its head about 1.0 up (as 3 of 48 do, before and after S1136); what
// it may not do is hang: the hips on the ground, and nothing higher than a seated head
const ov = r.over.map(f => f.top), oh = r.over.map(f => f.hips);
check(`the well is a solid the Bandits fall against (${r.over.filter(f => f.wall).length} of ${r.over.length} with the wall test, ${rng(r.over.map(f => f.inside))} of ${r.over[0]?.n} points inside it at death)`, r.solid && r.over.every(f => f.wall) && Math.max(...r.over.map(f => f.inside)) > 10);
check(`24 Bandits killed over the well's column come to rest on the ground: hips ${rng(oh)} over it, none over 0.4; the highest point ${rng(ov)}, none over a seated head's 1.2 (${ov.filter(u => u > 1.2).length})`, ov.length === 24 && Math.max(...oh) <= .4 && Math.max(...ov) <= 1.2, r.over);
const by = r.by.map(f => f.top), bh = r.by.map(f => f.hips);
check(`24 Bandits killed by the well come to rest on the ground: hips ${rng(bh)} over it, none over 0.4; the highest point ${rng(by)}, none over 1.2 (${by.filter(u => u > 1.2).length})`, by.length === 24 && Math.max(...bh) <= .4 && Math.max(...by) <= 1.2, r.by);
const cl = r.clear.map(f => f.top), dr = r.drop.map(f => f.hips);
check(`8 on clear ground rest with the highest point ${rng(cl)} over it, none over 0.5`, cl.length === 8 && Math.max(...cl) <= .5, cl);
check(`12 Bandits dropped 1.5 against a wall at their side fall to the ground: hips ${rng(dr)} over it, none over 0.5 (${dr.filter(u => u > .5).length})`, dr.length === 12 && Math.max(...dr) <= .5, r.drop);
const all = [...r.over, ...r.by, ...r.clear, ...r.drop];
check(`every fall comes to rest before the four-second cap (${all.filter(f => !f.done || f.t > 4).length} of ${all.length} not; slowest ${Math.max(...all.map(f => f.t))} s)`, all.every(f => f.done && f.t <= 4), all.map(f => f.t));
await g.close();
