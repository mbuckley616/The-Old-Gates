// A dungeon foe in your own cell comes to you and swings (Session 622; backlog C, Michael's playtest of 6 Oct: "foes approach
// and stand still, staring"). The dungeon's chase follows a path of whole cells (`bfs`), and in your cell that path is empty,
// so a foe that stepped into it stopped where it stood. A blow starts within 0.9, and a cell is 1 across: standing towards its
// far side you had a foe 0.9–1.4 off that never moved or swung again until you stepped away. It now comes straight at you in
// your cell, and plans its path again a quarter-second after you step into another cell (it waited up to 1.2 s).
// Driven by the game's own loop at fixed 1/60 ticks, the draw and the browser's frames held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });
const same = [], replan = [];
for (const seed of [4021, 777]) {
  await page.evaluate((seed) => { level = 4; const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const S = [], R = [];
    const live = ENEMIES.filter(e => !e.dead && !e.disguised && !e.dormant && e.floor === 1 && !e.ranged && !e.master);
    const park = (e) => ENEMIES.forEach(x => { if (x !== e && !x.dead) { x.dead = true; x._tmp = true; } });
    const unpark = () => ENEMIES.forEach(x => { if (x._tmp) { x.dead = false; x._tmp = false; } });
    const stage = (e, ex, ez, x, z) => { e.x = ex; e.z = ez; px = x; pz = z; jumpY = 0; currentFloor = 1; PHP = 9999; dead = false; ROLL = null; blocking = false; staggered.length = 0;
      e.alert = true; e.path = []; e.pathT = 0; e.atkCd = 0; e.telegraphT = 0; e.fleeT = 0; e._fleeTriggered = true; };
    for (const e of live) { const c = Math.round(e.x), r = Math.round(e.z), sx = e.x, sz = e.z; let open = true;
      for (let i = -1; i <= 2; i++) for (let j = -1; j <= 1; j++) if (dSolid(c + i, r + j)) open = false; if (!open) continue;
      park(e);
      // 1. the foe at one corner of your cell, you at the other: 1.19 apart
      stage(e, c - .42, r - .42, c + .42, r + .42); let tells = 0, wasT = false, first = null;
      _drive((n) => { if (e.telegraphT > 0 && !wasT) { tells++; if (first == null) first = +(n / 60).toFixed(2); } wasT = e.telegraphT > 0; return false; }, 60 * 4);
      S.push({ name: e.name, d: +Math.hypot(e.x - px, e.z - pz).toFixed(2), tells, first, lost: 9999 - PHP });
      // 2. a foe planning to your cell: you step one cell on, and how long before it plans to the new one
      stage(e, c - 1, r, c, r); _drive((n) => n >= 20, 60);
      px = c + 1; let at = null; _drive((n) => { PHP = 9999; if (e._pathTo === (c + 1) + ',' + r) { at = +(n / 60).toFixed(2); return true; } return false; }, 120);
      R.push({ name: e.name, at });
      unpark(); e.x = sx; e.z = sz; e.alert = false; }
    return { S, R }; });
  same.push(...r.S); replan.push(...r.R);
}
console.log(JSON.stringify(same)); console.log(JSON.stringify(replan));
check(`foes staged in your cell, 1.19 off (${same.length} of them)`, same.length >= 3, same.length);
check('every one comes in and winds up its blow within 2 s', same.every(s => s.tells >= 1 && s.first != null && s.first < 2), same.filter(s => !(s.tells >= 1 && s.first < 2)));
check('and its blows land: 4 s cost health every time', same.every(s => s.lost > 0), same.map(s => s.lost));
check('it stops short of you, not inside you (0.6 off or more)', same.every(s => s.d >= .55), same.map(s => s.d));
check('you step into the next cell: every foe plans to it within 0.3 s', replan.length >= 3 && replan.every(r => r.at != null && r.at <= .3), replan);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
