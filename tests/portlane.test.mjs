// A port's lane (Session 618; Michael's sailing playtest of 6 Oct: "Ports have no clear connection from the town to the ship
// buying/upgrading area, not even a road"). The quay head and the shipwright's yard stand outside the town's ring of lots, and
// nothing joined them: at Portclare 78 units of open ground. Now a lane runs from the perimeter lane down to the quay head,
// and the shipwright's footpath ends on it. Four ports nearest Dunmore: the line from the ring to the quay head is street all
// the way, the yard's path meets the lane, nothing solid stands on it, and a walk down it with W held through the game's
// own loop reaches the quay.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });
const ports = await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); return WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)).map(p => p.id); });
const rows = [];
for (const id of ports.slice(0, 4)) {
  await g.settle(id);
  const r = await page.evaluate(id => {
    const S = WORLD.settle.get(id), t = siteAnywhere(id), sd = shoreDir(t), q = t.quayStart;
    const segs = []; (S.paths || []).forEach(p => { for (let i = 0; i < p.pts.length - 1; i++) segs.push([p.pts[i], p.pts[i + 1], p.w]); });
    const dseg = (x, z, a, b) => { const vx = b.x - a.x, vz = b.z - a.z, L2 = vx * vx + vz * vz || 1; let u = ((x - a.x) * vx + (z - a.z) * vz) / L2; u = Math.max(0, Math.min(1, u)); return Math.hypot(x - a.x - vx * u, z - a.z - vz * u); };
    const near = (x, z, skip) => { let m = 1e9; segs.forEach(s => { if (s !== skip) m = Math.min(m, dseg(x, z, s[0], s[1]) - s[2] / 2); }); const ri = roadInfo(x, z); if (ri) m = Math.min(m, ri.d - ROAD_HALF); return m; };
    const inner = t.pad - 8, L = Math.hypot(q.x - t.x, q.z - t.z);
    let gap = 0, run = 0, solid = 0, steep = 0, prevH = null;
    for (let s = inner; s <= L; s += .5) { const x = t.x + (q.x - t.x) * s / L, z = t.z + (q.z - t.z) * s / L;
      if (near(x, z) > 0) { run += .5; gap = Math.max(gap, run); } else run = 0;
      if (WORLD.solidAt(x, z)) solid++;
      const h = worldH(x, z); if (prevH != null && Math.abs(h - prevH) / .5 > .6) steep++; prevH = h; }
    const sw = S.npcs.find(n => n.sched && n.sched.shop === 'shipwright');
    // the yard's footpath: the ribbon that starts at its door; where it ends, the lane
    let yard = null; if (sw) { const d = sw.sched.door; const fp = (S.paths || []).find(p => p.w === 1.3 && Math.hypot(p.pts[0].x - d.x, p.pts[0].z - d.z) < 3);
      if (fp) { const e = fp.pts[fp.pts.length - 1]; const A = { x: t.x + (q.x - t.x) * inner / L, z: t.z + (q.z - t.z) * inner / L }; yard = { len: +Math.hypot(e.x - d.x, e.z - d.z).toFixed(1), toLane: +dseg(e.x, e.z, A, q).toFixed(2) }; } }
    return { id, pad: t.pad, laneLen: +(L - inner).toFixed(1), gap, solid, steep, yard, ring: { x: t.x + (q.x - t.x) * inner / L, z: t.z + (q.z - t.z) * inner / L }, q: { x: q.x, z: q.z } };
  }, id);
  // walk it: from the ring, W held, steering at the quay head each frame
  r.walk = await page.evaluate(([a, b]) => { px = a.x; pz = a.z; jumpY = worldH(px, pz); let n = 0, best = 1e9;
    try { K['KeyW'] = true; _drive(() => { yaw = Math.atan2(-(b.x - px), -(b.z - pz)); best = Math.min(best, Math.hypot(px - b.x, pz - b.z)); return ++n > 60 * 40 || best < 1.5; }, 60 * 40 + 1); }
    finally { K['KeyW'] = false; }
    return { best: +best.toFixed(2), s: +(n / 60).toFixed(1), end: Math.hypot(px - b.x, pz - b.z) < 1.5 }; }, [r.ring, r.q]);
  console.log(JSON.stringify(r)); rows.push(r);
}
check('four ports settled', rows.length === 4, rows.map(r => r.id));
check('from the town’s ring to the quay head is street all the way (no stretch off it)', rows.every(r => r.gap === 0), rows.map(r => [r.id, r.laneLen, r.gap]));
check('the shipwright’s footpath ends on the lane, not in the grass', rows.every(r => r.yard && r.yard.toLane < 1), rows.map(r => [r.id, r.yard]));
check('nothing solid stands on the lane', rows.every(r => r.solid === 0), rows.map(r => [r.id, r.solid]));
check('a walk down the lane with W held reaches the quay head', rows.every(r => r.walk.end), rows.map(r => [r.id, r.walk]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
