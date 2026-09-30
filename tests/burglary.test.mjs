// A night's burglary by the numbers (Session 357, the crime system's owed "numbers by play"). Since Session 327 a town
// lock is picked in a running world: the watch walks while you work, and anyone who sees you at any moment of the pick
// sees the lock picked. This measures what that costs a burglar. Ten minutes of a night town are ticked; every tenth of a
// second each shop door is asked whether someone would see a player standing at it (walking and sneaking), and from that
// record the chance of being seen during a pick of 0, 3, 6, 10 and 20 seconds, started at any moment. The strongbox
// behind the door is picked indoors, where at night nobody is home. The checks are the rules the numbers rest on; the
// numbers themselves are printed for the decision on tuning.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const PICKS = [0, 3, 6, 10, 20];
const out = {};
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate(([id, PICKS]) => { forceTime(23); const S = WORLD.settle.get(id); const site = S.site;
    const shops = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper);
    const homes = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer).slice(0, 8);
    const doors = [...shops, ...homes];
    const at = h => { const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; return { x: h.doorX + dx / L * .8, z: h.doorZ + dz / L * .8 }; };
    const hx = site.x + 2, hz = site.z + 2; px = hx; pz = hz;
    const rec = doors.map(() => ({ walk: [], sneak: [] }));
    const sn0 = _sneaking;
    for (let f = 0; f < 60 * 600; f++) { WORLD.tick(1 / 60, performance.now()); if (f % 6) continue;
      doors.forEach((h, k) => { const p = at(h); px = p.x; pz = p.z;
        _sneaking = false; rec[k].walk.push(!!WORLD.witnessOf(h)); _sneaking = true; rec[k].sneak.push(!!WORLD.witnessOf(h)); });
      _sneaking = sn0; px = hx; pz = hz; }
    // the chance a pick of P seconds, begun at a moment chosen at random, is seen at some moment of it
    const chance = (arr, P) => { const w = Math.round(P * 10); let seen = 0, n = 0; for (let s = 0; s + w < arr.length; s++) { n++; for (let t = s; t <= s + w; t++) if (arr[t]) { seen++; break; } } return +(seen / n).toFixed(3); };
    const rows = doors.map((h, k) => ({ name: h.name, kind: h.type === 'home' ? 'home' : 'shop', pins: WORLD.doorLockFor ? (h.type === 'home' ? 2 : (WORLD.prosperity(site) >= 60 ? 4 : 3)) : null,
      walk: PICKS.map(P => chance(rec[k].walk, P)), sneak: PICKS.map(P => chance(rec[k].sneak, P)) }));
    // what's behind a shop door: the strongbox's mean (the S155 formula at the town's prosperity), and whether anyone is in
    const p = WORLD.prosperity(site);
    const box = shops.map(h => { const mult = /weapon|armor|armoury|forge/.test(h.type) ? 1.2 : /potion|apothecary/.test(h.type) ? .8 : 1; return Math.round((20 + 180 * Math.max(0, Math.min(100, p)) / 100) * mult); });
    const inside = shops.map(h => WORLD.npcInsideNow(h));
    const guards = WORLD.guardsOf(S).filter(n => n.g.visible).map(n => n.def.name);
    return { prosperity: p, guards, rows, box, inside }; }, [id, PICKS]);
  out[id] = r;
  console.log(`\n${id}: prosperity ${r.prosperity}, ${r.guards.length} on duty at 23h (${r.guards.join(', ')}); strongboxes ${r.box.join(', ')} (sum ${r.box.reduce((a, b) => a + b, 0)})`);
  console.log(`  chance seen, by pick length ${PICKS.join('/')} s — walking | sneaking`);
  for (const w of r.rows) console.log(`  ${w.kind} ${w.pins}p  ${w.walk.join(' ')}  |  ${w.sneak.join(' ')}   ${w.name}`);
  const mean = (k, j) => +(r.rows.filter(w => w.kind === k).reduce((a, w) => a + w.walk[j], 0) / Math.max(1, r.rows.filter(w => w.kind === k).length)).toFixed(3);
  const meanS = (k, j) => +(r.rows.filter(w => w.kind === k).reduce((a, w) => a + w.sneak[j], 0) / Math.max(1, r.rows.filter(w => w.kind === k).length)).toFixed(3);
  console.log(`  mean, shops: walking ${PICKS.map((_, j) => mean('shop', j)).join(' ')} | sneaking ${PICKS.map((_, j) => meanS('shop', j)).join(' ')}`);
  console.log(`  mean, homes: walking ${PICKS.map((_, j) => mean('home', j)).join(' ')} | sneaking ${PICKS.map((_, j) => meanS('home', j)).join(' ')}`);
  check(`${id}: at 23h the watch is on duty`, r.guards.length > 0, r.guards);
  check(`${id}: at 23h no keeper is inside a shut shop, so the strongbox behind a picked door is taken unseen`, r.inside.every(x => !x), r.inside);
  check(`${id}: a longer pick is never less likely to be seen, and sneaking never more likely than walking`,
    r.rows.every(w => w.walk.every((v, j) => j === 0 || v >= w.walk[j - 1]) && w.sneak.every((v, j) => v <= w.walk[j] + 1e-9)), r.rows);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
