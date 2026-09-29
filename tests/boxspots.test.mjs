// Strongboxes and home chests against the room (Session 310). Backlog G has asked since Session 155 whether the
// strongbox's and the home chest's spots sit well against the furniture. Measured in every shop and home of four towns:
// the box's footprint against every other solid, its mesh against every other piece of furniture, and whether you can
// walk from the front door to a spot close enough to open it (1.6 units from its centre, the prompt's reach).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const TOWNS = (process.env.TOWNS || 'dunmore,portclare,ironhaven,ashenmoor').split(',');
let all = [];
for (const id of TOWNS) { await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); const out = [];
    const bb = new THREE.Box3(), cb = new THREE.Box3();
    for (const h of S.houses) { if (h.type === 'castle') continue; WORLD.buildInteriorFor(h); const X = WORLD.intBox; if (!X) continue;
      const W = h.intW, D = h.intD, sc = X.g.parent;
      // 1. the chest as drawn against every other solid across its height (its own collision box is a little larger
      // than the chest, .64 × .56 about a .30 × .24 shop chest, so two collision boxes may touch where nothing does)
      X.g.updateMatrixWorld(true); cb.setFromObject(X.g); cb.expandByScalar(-.02);
      const own = INT_SOL.find(s => Math.abs((s.x0 + s.x1) / 2 - X.x) < .01 && Math.abs((s.z0 + s.z1) / 2 - X.z) < .01);
      const solHits = INT_SOL.filter(s => s !== own && s.x0 < cb.max.x && s.x1 > cb.min.x && s.z0 < cb.max.z && s.z1 > cb.min.z && (s.y0 == null || s.y0 < cb.max.y) && (s.y1 == null || s.y1 > .02))
        .map(s => [s.x0, s.x1, s.z0, s.z1, s.y0, s.y1].map(v => v == null ? v : +v.toFixed(2)));
      // the nearest other solid to the chest, for the log
      let gap = 1e9; for (const s of INT_SOL) { if (s === own || (s.y1 != null && s.y1 < .02) || (s.y0 != null && s.y0 > cb.max.y)) continue;
        const dx = Math.max(s.x0 - cb.max.x, cb.min.x - s.x1, 0), dz = Math.max(s.z0 - cb.max.z, cb.min.z - s.z1, 0); gap = Math.min(gap, Math.hypot(dx, dz)); }
      // 2. its mesh against every other mesh that is furniture-sized (not floors, walls, ceilings, rugs)
      const meshHits = [];
      sc.traverse(o => { if (!o.isMesh || !o.geometry) return; let p = o; while (p) { if (p === X.g) return; p = p.parent; }
        bb.setFromObject(o); const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
        if (sx > 3.5 || sz > 3.5 || sy < .05 || sy > 2.8) return;
        if (bb.intersectsBox(cb)) meshHits.push([+bb.min.x.toFixed(2), +bb.max.x.toFixed(2), +bb.min.y.toFixed(2), +bb.max.y.toFixed(2), +bb.min.z.toFixed(2), +bb.max.z.toFixed(2)]); });
      // 3. walkable from the door: flood a 0.1 grid from inside the front door
      const st = .1, nx = Math.ceil(W / st), nz = Math.ceil(D / st), seen = new Uint8Array(nx * nz), q = [];
      // walking on the floor only: anything standing on it blocks, even what the game lets you step up onto
      const B = INT_SOL.filter(o => (o.y1 == null || o.y1 > .05) && (o.y0 == null || o.y0 < 1.0)), R = .3;
      const free = (i, k) => { if (i < 0 || k < 0 || i >= nx || k >= nz) return false; const x = i * st, z = k * st;
        for (const o of B) if (x > o.x0 - R && x < o.x1 + R && z > o.z0 - R && z < o.z1 + R) return false; return true; };
      let si = Math.round(W / 2 / st), sk = Math.round(.8 / st);
      for (let t = 0; t < 40 && !free(si, sk); t++) sk++;
      if (free(si, sk)) { seen[sk * nx + si] = 1; q.push(si, sk); }
      let reach = 1e9;
      while (q.length) { const k = q.pop(), i = q.pop(); const x = i * st, z = k * st; reach = Math.min(reach, Math.hypot(x - X.x, z - X.z));
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, k2 = k + b; if (!free(i2, k2) || seen[k2 * nx + i2]) continue; seen[k2 * nx + i2] = 1; q.push(i2, k2); } }
      out.push({ town: id, h: h.name, type: h.type, back: !!h._backRoom, W, D, x: +X.x.toFixed(2), z: +X.z.toFixed(2), solHits, meshHits, gap: +gap.toFixed(2), reach: +reach.toFixed(2) }); }
    return out; }, id);
  const bad = r.filter(b => b.solHits.length || b.meshHits.length || b.reach > 1.6);
  console.log(' ', id, 'boxes', r.length, 'with a problem', bad.length, 'nearest solid from', Math.min(...r.map(b => b.gap)), 'reach from', Math.min(...r.map(b => b.reach)), 'to', Math.max(...r.map(b => b.reach)));
  for (const b of bad) console.log('   ', JSON.stringify(b));
  all = all.concat(r); }
check('there are boxes to judge (shops and homes)', all.length >= 20, all.length);
check('no chest stands in another solid (a counter, a bed, a wall, a crate)', all.every(b => !b.solHits.length), all.filter(b => b.solHits.length));
check('no box\'s mesh passes through another piece of furniture', all.every(b => !b.meshHits.length), all.filter(b => b.meshHits.length).map(b => ({ h: b.h, x: b.x, z: b.z, meshHits: b.meshHits })));
check('every box can be walked up to and opened from the front door (within 1.6 units)', all.every(b => b.reach <= 1.6), all.filter(b => b.reach > 1.6));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
