// Every pack in the world stood in one shape (the critic, 8 Oct, s477): `spawnChunkEncounters` offset each member from the
// pack's anchor by `hash01(i,k,98)` and `hash01(k,i,99)`, which name no chunk, so member 1 always stood about (+4.4, +0.9)
// from member 0 whatever the chunk. Since Session 651 a member's place is drawn from its chunk and index. Spawned here over a
// block of chunks round Vieux Marché: the packs' shapes differ, and a chunk spawned twice in one epoch stands the same.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('vieux_marche');
const r = await page.evaluate(() => {
  const S = WORLD.settle.get('vieux_marche').site; const c0x = Math.floor(S.x / CHUNK), c0z = Math.floor(S.z / CHUNK);
  const shapes = [], again = [];
  const spawn = (cx, cz) => { const ch = { cx, cz, enemies: [] }; spawnChunkEncounters(ch); const L = ch.enemies.map(e => ({ x: e.x != null ? e.x : e.mesh.position.x, z: e.z != null ? e.z : e.mesh.position.z }));
    for (const e of ch.enemies) { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); const i = ZONES.world.enemies.indexOf(e); if (i >= 0) ZONES.world.enemies.splice(i, 1); } return L; };
  for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) { const cx = c0x + dx, cz = c0z + dz; if (Math.abs(dx) < 3 && Math.abs(dz) < 3) continue;
    const L = spawn(cx, cz); if (L.length < 2) continue;
    shapes.push(L.slice(1).map(p => [+(p.x - L[0].x).toFixed(1), +(p.z - L[0].z).toFixed(1)]).join(';'));
    if (again.length < 5) { const L2 = spawn(cx, cz); again.push(JSON.stringify(L) === JSON.stringify(L2)); } }
  const first = shapes.map(s => s.split(';')[0]); const counts = {}; for (const f of first) counts[f] = (counts[f] || 0) + 1;
  return { packs: shapes.length, distinct: new Set(first).size, most: Math.max(0, ...Object.values(counts)), sample: shapes.slice(0, 6), again };
});
console.log(JSON.stringify(r));
check(`packs of two or more spawned round Vieux Marché (${r.packs})`, r.packs >= 8, r.packs);
check('the second member stands in a different place from the first, pack to pack', r.distinct >= r.packs * 0.8 && r.most <= 2, { distinct: r.distinct, most: r.most, sample: r.sample });
check('a chunk spawned twice in one epoch stands the same', r.again.length >= 3 && r.again.every(Boolean), r.again);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
