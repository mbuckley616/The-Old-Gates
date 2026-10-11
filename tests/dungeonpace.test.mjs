// Session 635: Michael's A on DECISION #190 underground. An alert dungeon foe chases at 85–110% of your walk (3.83), placed
// on the dungeon's own table by its def's speed: a Golem (0.42) at 85%, a Goblin (2.02) at 110%. Before, it came at that
// speed times the difficulty's: 0.42–2.02 cells a second at normal. It sees you at 8 cells in its cone (was 3.5). Driven by
// the game's own loop at fixed 1/60 ticks, in a deep cave (seed 4021) and a crypt (seed 777), the draw held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// the table
const table = await page.evaluate(() => ['Golem', 'Slime', 'Cave Troll', 'Skeleton', 'Kobold Thief', 'Goblin'].map(k => ({ k, chase: +dungeonChaseSpeed({ spd: 1, rankSpd: { Golem: .42, Slime: .65, 'Cave Troll': .68, Skeleton: 1.35, 'Kobold Thief': 1.9, Goblin: 2.02 }[k] }).toFixed(2) })));
console.log(' table', JSON.stringify(table));
check(`the dungeon's table on 85–110% of your walk: ${table.map(r => `${r.k} ${r.chase}`).join(', ')}`,
  Math.abs(table[0].chase - 3.26) < .01 && Math.abs(table[5].chase - 4.21) < .01 && table.every((r, i) => i === 0 || r.chase >= table[i - 1].chase), table);

const rows = [], sights = [], walks = [];
for (const [seed, theme, interior] of [[4021, 'deep', 'cave'], [777, 'undead', 'cave']]) {
  await page.evaluate(({ seed, theme, interior }) => { level = 4; const p = Object.assign({}, PORTALS[0], { theme, seed, size: 'medium', interior, zone: 'world', tutorial: false, diff: 'hard' }); goToDungeon(p); }, { seed, theme, interior });
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    // the longest straight open run on floor 1, three cells wide, along x
    let best = null;
    for (let z = 1; z < 200; z++) for (let x = 1; x < 200; x++) { let n = 0; while (n < 14 && !dSolid(x + n, z) && !dSolid(x + n, z - 1) && !dSolid(x + n, z + 1)) n++; if (n >= 6 && (!best || n > best.n)) best = { x, z, n }; }
    if (!best) return { none: true };
    const park = (e) => ENEMIES.forEach(x => { if (x !== e && !x.dead) { x.dead = true; x._tmp = true; } });
    const unpark = () => ENEMIES.forEach(x => { if (x._tmp) { x.dead = false; x._tmp = false; } });
    const live = ENEMIES.filter(e => !e.dead && !e.disguised && !e.dormant && e.floor === 1 && !e.ranged && !e.master && !/Mimic/.test(e.name));
    const seen = new Set(), out = [];
    const prep = () => { currentFloor = 1; PHP = 9999; dead = false; ROLL = null; blocking = false; staggered.length = 0; jumpY = 0; };
    for (const e of live) { if (seen.has(e.name)) continue; seen.add(e.name); const sx = e.x, sz = e.z; park(e); prep();
      e.x = best.x; e.z = best.z; px = best.x + best.n - 1; pz = best.z; e.alert = true; e.path = []; e.pathT = 0; e.fleeT = 0; e._fleeTriggered = true;
      const x0 = e.x; _drive(() => { PHP = 9999; return false; }, 30);
      out.push({ name: e.name, spd: +e.spd.toFixed(2), rank: e.rankSpd, moved: +((e.x - x0) * 2).toFixed(2), chase: +dungeonChaseSpeed(e).toFixed(2) });
      unpark(); e.x = sx; e.z = sz; e.alert = false; e.path = []; }
    // sight: one foe, its cone on you, at 7 and at 9.5 cells along the run (if the run is long enough)
    let line = null; for (let z = 1; z < 200; z++) for (let x = 1; x < 200; x++) { let n = 0; while (n < 16 && !dSolid(x + n, z)) n++; if (n >= 8 && (!line || n > line.n)) line = { x, z, n }; }
    const e = live[0]; const sx = e.x, sz = e.z; park(e); const sg = { line };
    for (const D of [7, 9.5]) { if (D > line.n - 1) { sg[D] = 'short'; continue; } prep(); e.x = line.x; e.z = line.z; px = line.x + D; pz = line.z; e.alert = false; e.patrolType = 'scan';
      _drive(() => { PHP = 9999; e.combatYaw = Math.atan2(px - e.x, pz - e.z); return e.alert; }, 20); sg[D] = e.alert; e.alert = false; }
    unpark(); e.x = sx; e.z = sz;
    // your walk down the run, the foes parked: W held, facing +x
    ENEMIES.forEach(x => { if (!x.dead) { x.dead = true; x._tmp = true; } }); prep(); px = best.x; pz = best.z; yaw = -Math.PI / 2; const w0 = px;
    K['KeyW'] = true; try { _drive(() => false, 60); } finally { K['KeyW'] = false; } const walk = +(px - w0).toFixed(2); unpark();
    return { best, out, sg, walk };
  });
  console.log(seed, JSON.stringify(r));
  if (!r.none) { rows.push(...r.out); sights.push(r.sg); walks.push(Math.min(r.walk, r.best.n - 1)); }
  await page.evaluate(() => goToOW()); await page.waitForTimeout(3000); await g.hide();
}
check(`foes chased on a straight run in two dungeons (${rows.length} kinds: ${rows.map(r => r.name).join(', ')})`, rows.length >= 3, rows);
check(`each covers its chase speed in half a second, near your walk, whatever the difficulty's scale: ${rows.map(r => `${r.name} ${r.moved} of ${r.chase} (its speed ${r.spd})`).join(', ')}`,
  rows.every(r => r.chase >= 3.25 && r.chase <= 4.22 && Math.abs(r.moved - r.chase) < .45), rows);
check(`your own walk down the run is 3.83 a second underground (${walks.join(', ')} in a second), so the band is the open world's`, walks.length && walks.every(w => w > 3.5 && w < 4.1), walks);
check(`a foe whose cone is on you sees you at 7 cells (${sights.map(s => s[7]).join(', ')}); not at 9.5 where the run is long enough (${sights.map(s => s[9.5]).join(', ')})`,
  sights.length && sights.every(s => s[7] === true) && sights.every(s => s[9.5] === false || s[9.5] === 'short') && sights.some(s => s[9.5] === false), sights);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
