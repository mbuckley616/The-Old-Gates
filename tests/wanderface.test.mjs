// A wandering foe in the open faces the way it walks and sees that way (Session 628). The open world's wander walked a foe
// in a circle round its home but never turned it: the body stood at its spawn's turn (rotation 0) and the sight cone
// (`combatYaw`, the 150° arc `canSeePlayer` reads) at a random angle given at spawn, matching neither. So a foe slid
// sideways and backwards, and saw you, or not, from a side that had nothing to do with either. The dungeon's wander already
// turned both (`90-main.js`). Driven by the game's own loop at fixed 1/60 ticks, by Dunmore, by day.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  window._fwd = (e) => { const v = new THREE.Vector3(0, 0, 1).applyQuaternion(e.mesh.quaternion); return Math.atan2(v.x, v.z); };
  window._ad = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
  window._spawn = (kind, x, z) => { const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], x, z, kind, null)); ZONES.world.enemies.push(e); return e; };
  window._drop = (e) => { e.dead = true; WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies; L.splice(L.indexOf(e), 1); }; });
const KINDS = ['Bandit', 'Wolf', 'Skeleton', 'Troll'];
// 1. the body and the cone follow the walk
const walk = await page.evaluate((KINDS) => { forceTime(12); const t = WORLD.siteAnywhere('dunmore'); px = t.x + 120; pz = t.z + 120; yaw = 0;
  const es = KINDS.map((k, i) => _spawn(k, t.x + 40 + i * 9, t.z + 40));
  const rec = es.map(e => ({ kind: e.name, worstBody: 0, worstCone: 0, n: 0, alert: false })); let prev = es.map(e => [e.x, e.z]);
  _drive((n) => { PHP = maxHP; if (n % 30 === 29) es.forEach((e, k) => { const dx = e.x - prev[k][0], dz = e.z - prev[k][1]; if (Math.hypot(dx, dz) > .05) {
      const mv = Math.atan2(dx, dz), r = rec[k]; r.worstBody = Math.max(r.worstBody, _ad(_fwd(e), mv)); r.worstCone = Math.max(r.worstCone, _ad(e.combatYaw, mv)); r.n++; }
      prev[k] = [e.x, e.z]; rec[k].alert = rec[k].alert || e.alert; }); return false; }, 360);
  es.forEach(_drop); return rec.map(r => ({ ...r, worstBody: +r.worstBody.toFixed(2), worstCone: +r.worstCone.toFixed(2) })); }, KINDS);
console.log(' walk', JSON.stringify(walk));
// 2. what it sees: you 8 units ahead of its walk are seen; 8 units behind, walking (not sneaking), you are not
const sight = await page.evaluate((KINDS) => { const out = []; const t = WORLD.siteAnywhere('dunmore');
  const clear = (e, x, z) => { for (let s = .15; s < .9; s += .15) if (WORLD.camSolid(e.x + (x - e.x) * s, e.z + (z - e.z) * s)) return false; return true; };
  for (const kind of KINDS) for (const side of [1, -1]) {
    // a place in the open where nothing stands between it and either of the two spots (a tree hides you whatever the cone)
    let e = null, fx = 0, fz = 0, h = 0;
    for (let k = 0; k < 16 && !e; k++) { px = t.x + 120; pz = t.z + 120; const c = _spawn(kind, t.x + 30 + (k % 4) * 23, t.z + 30 + (k >> 2) * 23);
      _drive(() => { PHP = maxHP; return false; }, 30);
      h = +_ad(c.combatYaw, _fwd(c)).toFixed(2); fx = Math.sin(_fwd(c)); fz = Math.cos(_fwd(c));
      if (clear(c, c.x + fx * 8, c.z + fz * 8) && clear(c, c.x - fx * 8, c.z - fz * 8)) e = c; else _drop(c); }
    if (!e) { out.push({ kind, side, noPlace: true }); continue; }
    px = e.x + fx * 8 * side; pz = e.z + fz * 8 * side; sneaking = false;
    let seenAt = -1; _drive((n) => { PHP = maxHP; if (e.alert) { seenAt = n; return true; } return false; }, 60);
    out.push({ kind, side: side > 0 ? 'ahead' : 'behind', seenAt, coneOffBody: h }); _drop(e); }
  return out; }, KINDS);
console.log(' sight', JSON.stringify(sight));
check('a wandering foe\'s body faces the way it walks (within 0.25 rad, sampled every half second for 6 s)', walk.every(w => w.n >= 4 && !w.alert && w.worstBody < .25), walk);
check('and its sight cone points the same way', walk.every(w => w.worstCone < .25), walk);
check('you, 8 ahead of its walk, are seen within a second', sight.filter(s => s.side === 'ahead').every(s => s.seenAt >= 0), sight);
check('you, 8 behind it, walking, are not', sight.filter(s => s.side === 'behind').every(s => s.seenAt < 0), sight);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
