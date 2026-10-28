// A load does not double a job's foe (Session 674, the critic's s480 note: die to a guild task's foe, *Load last save* from
// a save made before it spawned, walk back, and the old foe was still in `ZONES.world.enemies` at its damaged health while
// the loaded task spawned a second, both keyed `…:foe:0`, both paying XP). On a load the foes a job raised are dropped,
// and the loaded job raises its own when you come near, as on a fresh page. The duel's rival is not touched.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const count = () => page.evaluate(() => { const L = ZONES.world.enemies.filter(e => e._guildTag === 'guild_m:test:1');
  return { n: L.length, ids: L.map(e => e.id), hp: L.map(e => [e.hp, e.maxHp]), live: L.filter(e => !e.dead && e.mesh && e.mesh.parent).length }; });
await page.evaluate(async () => { const G = gstate();
  G.guild_m.active = { id: 'guild_m:test:1', g: 'guild_m', kind: 'creature', sx: px + 30, sz: pz + 30, gold: 60, desc: '', short: 'The thing at the loch' };
  await saveToSlot(0); });
await g.spin(null, 30);
const spawned = await count();
const rival = await page.evaluate(() => { const e = buildZoneEnemy(WORLD.scene, [], px + 40, pz + 40, 'Bandit Captain', null); e._questTag = 'q:test'; e._duel = true; WORLD.scene.add(e.mesh); e.mesh.visible = false; ZONES.world.enemies.push(e);
  const f = ZONES.world.enemies.find(x => x._guildTag === 'guild_m:test:1'); if (f) f.hp = Math.round(f.hp / 3); return true; });
const hurt = await count();
// Session 1543: wait for the load to land, not a fixed 4 s. The fade starts only once ssLoad's promise resolves, so a wait
// for the fade read straight after the call passed before it began (and named `#fade`, which is `#fd`, so it never waited). The task in play is marked (after the save, so the
// saved one is not); the load has landed when the active task is another object and the fade has lifted.
await page.evaluate(() => { gstate().guild_m.active._preload = true; return reloadActiveSlot(); });
const landed = await page.waitForFunction(() => { const t = gstate().guild_m.active, f = document.getElementById('fd');
  return t && !t._preload && (!f || getComputedStyle(f).opacity === '0'); }, null, { timeout: 120000, polling: 250 }).then(() => true, () => false);
for (let i = 0; i < 4; i++) { await page.evaluate(() => { const t = gstate().guild_m.active; px = t.sx - 30; pz = t.sz - 30; }); await g.spin(null, 30); }
const after = await count();
const keptRival = await page.evaluate(() => ZONES.world.enemies.some(e => e._duel && e._questTag === 'q:test'));
const task = await page.evaluate(() => { const t = gstate().guild_m.active; return t && { id: t.id, spawned: t.spawned, d: Math.hypot(px - t.sx, pz - t.sz), zone: activeZoneId, dead }; });
console.log(JSON.stringify({ spawned, hurt, landed, after, keptRival, task }));
check('the load lands (the active task replaced, the fade lifted)', landed, landed);
check('before the load the task raises its one foe, keyed by the job', spawned.n === 1 && spawned.ids[0] === 'guild_m:test:1:foe:0', spawned);
check('after a load from before the spawn there is one foe, not two, at full health', task && task.id === 'guild_m:test:1' && after.n === 1 && after.live === 1 && after.hp[0][0] === after.hp[0][1], after);
check('the duel\'s rival is left where it was', keptRival, keptRival);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
