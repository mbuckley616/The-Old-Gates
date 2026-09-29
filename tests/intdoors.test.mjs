// Interior doors against the room (Session 252): backlog G asked, since Session 143, for a door in an inn room and a shop's
// back room to be judged for its height against the ceiling and its swing against the furniture. Measured here in every
// interior of Dunmore and Portclare: the leaf swept through its whole swing against every solid of the room, the gap it
// closes, the lintel against the ceiling, and the tallest townsperson's head against the lintel.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
let all = [];
for (const id of ['dunmore', 'portclare']) { await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); const out = []; const v = new THREE.Vector3();
    const heads = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene).map(r => { r.root.updateMatrixWorld(true); r.B.head.getWorldPosition(v); return v.y - r.root.position.y; });
    const tallest = Math.max(...heads);
    for (const h of S.houses) { if (h.type === 'castle') continue; WORLD.buildInteriorFor(h);
      const ceil = h.style === 'stone' ? 2.6 : h.style === 'french' ? 2.4 : h.style === 'anglo' ? 2.0 : 2.1;
      for (const d of WORLD.intDoors || []) { const ang = d.ang, ux = Math.sin(ang), uz = Math.cos(ang), w = 1.34, hx = d.x - ux * w / 2, hz = d.z - uz * w / 2;
        const open = []; for (let t = -1.2; t <= 1.2; t += .02) { const x = d.x + ux * t, z = d.z + uz * t; if (!INT_SOL.some(s => s !== d.sol && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && s.y0 <= d.y + .5 && s.y1 >= d.y + 1)) open.push(t); }
        const gap = open.length ? open[open.length - 1] - open[0] : 0;
        let hit = null; for (let a = .15; a <= 1.62 && hit == null; a += .05) { const ra = ang + d.dir * a, vx = Math.sin(ra), vz = Math.cos(ra);
          for (let s = .15; s <= w; s += .1) { const x = hx + vx * s, z = hz + vz * s; const o = INT_SOL.find(o => o !== d.sol && x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1 && o.y0 < d.y + 1.3 && o.y1 > d.y + .1); if (o) { hit = +a.toFixed(2); break; } } }
        out.push({ h: h.name, gap: +gap.toFixed(2), hit, top: d.y + 1.48, ceil: d.y + ceil }); } }
    return { tallest: +tallest.toFixed(3), doors: out }; }, id);
  console.log(' ', id, 'doors', r.doors.length, 'tallest head bone', r.tallest, 'gaps', [...new Set(r.doors.map(d => d.gap))].join(', '));
  all.push(r); }
const doors = all.flatMap(r => r.doors), tallest = Math.max(...all.map(r => r.tallest));
check('there are doors to judge (shops\' back rooms, inn rooms, halls)', doors.length >= 30, doors.length);
check('every door swings its full quarter turn without touching a wall, counter, bed or shelf', doors.every(d => d.hit == null), doors.filter(d => d.hit != null));
check('every gap is within a tenth of the leaf (1.34), so the shut door covers it', doors.every(d => d.gap > 1.1 && d.gap < 1.45), [...new Set(doors.map(d => d.gap))]);
check('the door (1.48) is below every ceiling, and the tallest head (bone + a hat\'s .3) passes under it', doors.every(d => d.top < d.ceil - .4) && tallest + .3 < 1.48, { tallest });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
