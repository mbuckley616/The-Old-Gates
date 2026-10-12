// Session 740 — two gate guards in every walled town (Michael's A on #242). A town with one road in had one guard, since one
// street reaches the wall's ring: Carraig Mór and Coeur de Vie. The second stands at the same gate by day and at night walks
// the beat from the far side of the loop. He is spawned last, so no one else's name or place moves (checked by the session's
// before/after probe, and here by his being the town's last guard).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['carraig_mor', 'coeur_de_vie', 'dunmore']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); const G = S.npcs.filter(n => n.sched && n.sched.type === 'guard');
    const last = S.npcs.filter(n => n.sched && /guard|watch|constable/.test(n.sched.type)).slice(-1)[0];
    return { n: G.length, names: G.map(n => n.def.name), a: G.map(n => n.sched.a), b: G.map(n => n.sched.b), lastIsGuard2: G.length === 2 && last === G[1],
      solid: G.map(n => WORLD.solidAt(n.sched.a.x, n.sched.a.z)), p: WORLD.prosperity(S.site) }; }, id);
  check(`${id}: two gate guards (${r.names.join(', ')})`, r.n === 2, r);
  if (id === 'dunmore') continue;
  const d = Math.hypot(r.a[0].x - r.a[1].x, r.a[0].z - r.a[1].z);
  check(`${id}: the second stands at the same gate, across the street (${d.toFixed(1)} from the first's post), on open ground, and is the town's last man of the watch`,
    d > 4 && d < 8 && r.a[1].x === r.b[1].x && r.a[1].z === r.b[1].z && !r.solid[1] && r.lastIsGuard2, r);
  // by day: ticked from noon, he stays at his post, the first walks gate to plaza as before
  const day = await page.evaluate((id) => { forceTime(12); const S = WORLD.settle.get(id); const G = S.npcs.filter(n => n.sched && n.sched.type === 'guard');
    const t = WORLD.siteAnywhere(id); px = t.x; pz = t.z; let far = 0;
    for (let f = 0; f < 60 * 60; f++) { WORLD.tick(1 / 60, performance.now()); if (f % 30 === 0) far = Math.max(far, Math.hypot(G[1].g.position.x - G[1].sched.a.x, G[1].g.position.z - G[1].sched.a.z)); }
    return { far: +far.toFixed(2), vis: G.map(n => n.g.visible) }; }, id);
  check(`${id}: by day (a minute ticked at noon) the second keeps within 1.5 of his post`, day.far < 1.5 && day.vis.every(Boolean), day);
  // at night: both walk the beat, starting on opposite sides of the loop, and two men (three with the watch) are awake
  const night = await page.evaluate((id) => { forceTime(23); const S = WORLD.settle.get(id); const G = S.npcs.filter(n => n.sched && n.sched.type === 'guard');
    for (const n of G) { n._beatI = null; }
    let gap = 0, k = 0, minGap = 1e9;
    for (let f = 0; f < 60 * 90; f++) { WORLD.tick(1 / 60, performance.now()); if (f % 60 === 59) { const d = Math.hypot(G[0].g.position.x - G[1].g.position.x, G[0].g.position.z - G[1].g.position.z); gap += d; k++; minGap = Math.min(minGap, d); } }
    const awake = WORLD.guardsOf(S).filter(n => n.g.visible).map(n => n.def.name + ':' + n.sched.type);
    return { mean: +(gap / k).toFixed(1), minGap: +minGap.toFixed(1), awake, beatI: G.map(n => n._beatI) }; }, id);
  const want = r.p >= 60 ? 3 : 2;
  check(`${id}: at 23h ${want} men are awake (prosperity ${r.p})`, night.awake.length === want, night);
  check(`${id}: over ninety seconds of the night beat the two gate guards walk apart (mean ${night.mean} between them)`, night.mean > 15, night);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
