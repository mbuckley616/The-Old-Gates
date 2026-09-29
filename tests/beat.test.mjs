// The night beat by the streets (Session 247): the critic found Dunmore's watchman standing 492 of 600 seconds behind
// Clodagh's Goods, 4.6 units from its door with the house between. Each guard joins the beat at his own point and walked
// to it in a straight line; the house was in the way, and sliding along its wall kept npcStep's give-up from firing.
// Now a beat point he makes no headway on is reached by the town's street grid, and the grid's path starts from his own cell.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { forceTime(23); const S = WORLD.settle.get(id); const G = WORLD.guardsOf(S);
    px = S.site.x + 300; pz = S.site.z;
    const shops = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper);
    const passes = {}; shops.forEach(h => passes[h.id] = 0); const was = {};
    const st = G.map(() => ({ still: 0, run: 0, longest: 0, last: null }));
    for (let f = 0; f < 60 * 600; f++) { WORLD.tick(1 / 60, performance.now()); if (f % 30) continue;
      G.forEach((n, k) => { if (!n.g.visible) return; const p = { x: n.g.position.x, z: n.g.position.z }; const s = st[k];
        if (s.last && Math.hypot(p.x - s.last.x, p.z - s.last.z) < .1) { s.still += .5; s.run += .5; s.longest = Math.max(s.longest, s.run); } else s.run = 0;
        s.last = p; });
      for (const h of shops) { const near = G.some(n => n.g.visible && Math.hypot(n.g.position.x - h.exitX, n.g.position.z - h.exitZ) < 3); if (near && !was[h.id]) passes[h.id]++; was[h.id] = near; } }
    return { guards: G.map((n, k) => ({ name: n.def.name, onDuty: n.g.visible, still: st[k].still, longest: st[k].longest })), passes: shops.map(h => passes[h.id]) }; }, id);
  const on = r.guards.filter(x => x.onDuty);
  console.log(' ', id, JSON.stringify(r));
  check(`${id}: no guard on the beat stands still more than 10 s at a time, nor more than a quarter of ten minutes`, on.length > 0 && on.every(x => x.longest <= 10 && x.still <= 150), r.guards);
  check(`${id}: in ten minutes a lantern comes within 3 units of every shop door at least twice`, r.passes.every(p => p >= 2), r.passes);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
