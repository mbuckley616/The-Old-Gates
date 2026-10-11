// The boss bar below ground (Session 732; the critic's s572 run). `tickBossHud` was called only from the open world's branches
// of the loop, so a bar raised by the crag's beast came down into the cavern at 100% and stayed through both floors, and the
// master's own bar never showed. The dungeon's branch now calls it, and below ground it reads the cavern's own foes on your floor.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const bar = () => page.evaluate(() => { const h = document.getElementById('bossHpHud'), f = document.getElementById('bossHpFill');
  return { shown: !!h && h.style.display === 'block', name: (document.getElementById('bossHpName') || {}).textContent || '', fill: f ? parseFloat(f.style.width) || 0 : null }; });

// a beast on you in the open world raises its bar
await page.evaluate(() => { const x = px + 3, z = pz; const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Cave Bear', null);
  e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.boss = true; e.alert = true; e.name = 'Testcrag the Cave Bear'; e.displayName = null; e.spd = 0; ZONES.world.enemies.push(e); window._wb = e; });
await g.frames(10);
const out = await bar();
console.log('outdoors', JSON.stringify(out));
check('outdoors the beast on you shows its bar', out.shown && out.name === 'Testcrag the Cave Bear', out);

// down into a lair's cavern with it still alert at the door
await page.evaluate(() => { window._lairBoss = null; delete (worldState.masters || {})[5199];
  const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 5199, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, diff: 'hard', diffScale: DIFF_SCALE.hard, lair: { place: 'Testcrag', boss: 'Cave Bear' } });
  goToDungeon(p); });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
await page.evaluate(() => { const e = window._lairBoss; e.alert = false; e._agg = false; });
await g.frames(10);
const down = await bar();
console.log('below, master asleep', JSON.stringify(down));
check('below ground the world beast\'s bar is gone', !down.shown || down.name !== 'Testcrag the Cave Bear', down);
check('and no bar while the master has not seen you', !down.shown, down);

// the master on you: its own bar, and it falls with its health
await page.evaluate(() => { const e = window._lairBoss; if ((e.floor || 1) === 2 && currentFloor !== 2) goToFloor2(); });
await g.frames(30);
const m = await page.evaluate(() => { const e = window._lairBoss; px = e.x + 2; pz = e.z; e.alert = true; return { name: e.name, floor: e.floor || 1, cf: currentFloor }; });
await g.frames(4);
const on = await bar();
await page.evaluate(() => { const e = window._lairBoss; e.hp = Math.round(e.maxHp / 2); });
await g.frames(4);
const half = await bar();
console.log('master', JSON.stringify(m), JSON.stringify(on), JSON.stringify(half));
check('the master on you shows its own bar, by its name', on.shown && on.name === m.name, { m, on });
check('the bar falls with its health (half → 50%)', half.shown && Math.abs(half.fill - 50) < 1.5, half);

// another floor's boss does not raise a bar
await page.evaluate(() => { const e = window._lairBoss; e._f = e.floor; e.floor = (e.floor || 1) + 1; });
await g.frames(4);
const other = await bar();
await page.evaluate(() => { const e = window._lairBoss; e.floor = e._f; e.dead = true; });
await g.frames(4);
const dead = await bar();
check('a master on another floor shows no bar', !other.shown, other);
check('a dead master shows no bar', !dead.shown, dead);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
