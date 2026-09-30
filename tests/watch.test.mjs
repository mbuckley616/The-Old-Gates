// The night watch (Session 166): after dark the guards walk a lantern beat past every shop door; a town of
// prosperity 60 or more puts a third guard on at night; with favour at −2 or worse the nearest guard on duty
// trails you at six to eight units while you are on the pad. The critic found Dunmore's street empty at night
// (the nearest person 74–115 units from any shop door, against a night sight range of six).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// by day: two guards on their gate patrol, the third asleep
const day = await page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('dunmore'); const G = WORLD.guardsOf(S);
  return { prosperity: WORLD.prosperity(S.site), guards: G.length, types: G.map(n => n.sched.type), visible: G.filter(n => n.g.visible).length }; });
check('a town of prosperity ≥ 60 has a third guard, on at night only', day.prosperity >= 60 && day.guards === 3 && day.types.filter(t => t === 'watch').length === 1 && day.visible === 2, day);

// by night: every shop door is passed by a lantern within the night sight range
const night = await page.evaluate(() => { forceTime(23); const S = WORLD.settle.get('dunmore'); const G = WORLD.guardsOf(S);
  px = S.site.x + 300; pz = S.site.z; // off the pad: nobody follows, nobody halts
  const shops = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper);
  const near = {}, first = {}; shops.forEach(h => { near[h.id] = 1e9; });
  delete S._beat; const hadGrid = !!S._route; const t0 = performance.now(); WORLD.tick(1 / 60, performance.now()); const beatMs = Math.round(performance.now() - t0); // the first night tick builds the beat; the grid came with the town
  let loop = 0; const beat = S._beat || []; for (let i = 0; i < beat.length; i++) { const a = beat[i], b = beat[(i + 1) % beat.length]; loop += Math.hypot(b.x - a.x, b.z - a.z); }
  const T = 60 * 360; let samples = 0, outSum = 0;
  for (let f = 0; f < T; f++) { WORLD.tick(1 / 60, performance.now());
    if (f % 30) continue; samples++; outSum += S.npcs.filter(n => n.g.visible).length;
    for (const h of shops) for (const n of G) { if (!n.g.visible) continue; const d = Math.hypot(n.g.position.x - h.exitX, n.g.position.z - h.exitZ); if (d < near[h.id]) near[h.id] = d; if (d < 6 && first[h.id] == null) first[h.id] = f / 60; } }
  const nd = shops.map(h => +near[h.id].toFixed(1));
  return { turns: beat.length - shops.length, hadGrid, beatMs, shops: shops.length, beat: beat.length, loop: Math.round(loop), onDuty: G.filter(n => n.g.visible).length, torches: G.filter(n => n._torch && n._torch.visible).length,
    nearest: nd, passed: nd.filter(d => d < 6).length, firstPass: shops.map(h => first[h.id] == null ? null : Math.round(first[h.id])), meanOut: +(outSum / samples).toFixed(1) }; });
check('at night three guards with torches walk a beat that passes every shop door within the night sight range (6)', night.hadGrid && night.onDuty === 3 && night.torches === 3 && night.beat >= night.shops && night.passed === night.shops, night);

// favour −2: the nearest guard on duty trails you, six to eight units off
const follow = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); const site = S.site;
  const tick = (n, move) => { for (let i = 0; i < n; i++) { if (move) { px += move[0] / 60; pz += move[1] / 60; } WORLD.tick(1 / 60, performance.now()); } };
  px = site.x + 6; pz = site.z - 6; jumpY = 0; if (worldState.crime) delete worldState.crime[site.id];
  (worldState.favor || (worldState.favor = {}))[site.id] = -1; tick(60); const noneAtMinus1 = !S._follower;
  worldState.favor[site.id] = -2; tick(60 * 30); const f = S._follower; const d1 = f ? Math.hypot(px - f.g.position.x, pz - f.g.position.z) : null;
  const G = WORLD.guardsOf(S).filter(n => n.g.visible); const nearestAtStart = G.length;
  tick(60 * 8, [1.5, 0]); tick(60 * 15); const d2 = f ? Math.hypot(px - f.g.position.x, pz - f.g.position.z) : null; const same = S._follower === f;
  const others = WORLD.guardsOf(S).filter(n => n._follow).length;
  worldState.favor[site.id] = -1; tick(30); const dropped = !S._follower && !WORLD.guardsOf(S).some(n => n._follow);
  worldState.favor[site.id] = -2; px = site.x + site.pad + 20; pz = site.z; tick(30); const offPad = !S._follower;
  worldState.favor[site.id] = 0;
  return { noneAtMinus1, name: f && f.def.name, d1: d1 && +d1.toFixed(2), d2: d2 && +d2.toFixed(2), same, others, dropped, offPad, onDuty: nearestAtStart }; });
check('favour −1: no one follows', follow.noneAtMinus1, follow);
check('favour −2: one guard trails you at six to eight units, and keeps up when you walk on', follow.name && follow.d1 >= 5.9 && follow.d1 <= 8.6 && follow.d2 >= 5.9 && follow.d2 <= 8.6 && follow.same && follow.others === 1, follow);
check('he stops when favour recovers or you leave the pad', follow.dropped && follow.offPad, follow);
// Session 357: the trailing guard stood for good 21.5 units off, at a house corner the pulled-straight way missed
// (npcStep gave up; CI on ed2bce7, and 1 run in 3 locally). From that very spot he now reaches you by the street grid.
const corner = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); const site = S.site;
  const tick = n => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); };
  px = site.x + 6; pz = site.z - 6; jumpY = 0; worldState.favor[site.id] = -2; tick(2); const f = S._follower; if (!f) return { none: true };
  f.g.position.set(13536.1, WORLD.worldH(13536.1, 25385.9), 25385.9); f._fw = null; f._fwT = 0; tick(60 * 20);
  const d = Math.hypot(px - f.g.position.x, pz - f.g.position.z); const same = S._follower === f; worldState.favor[site.id] = 0;
  return { name: f.def.name, d: +d.toFixed(2), same }; });
check('from the house corner where he stuck (21.5 units off), the trailing guard reaches six to eight units within 20 s', !corner.none && corner.same && corner.d >= 5.9 && corner.d <= 8.6, corner);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
