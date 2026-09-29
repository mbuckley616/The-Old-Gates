// A town lock is picked in a running world (Session 327, Michael's A on #54). The lockpick used to pause the game as the
// inventory does, so the watch stood still and whether you were seen was asked once, when the lock gave. Now, on a shop
// or home door and a strongbox or home chest, the clock turns and the watch walks while you work, you stand still, and
// anyone who sees you at any moment sees the lock picked: the pick breaks off. Dungeon locks still pause.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// nobody about: every townsperson hidden and parked far off, at 23h, at a shop door
await page.evaluate(() => { forceTime(23); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper); window._h = h;
  BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 12 });
  // residents spawn in as the world runs (two every half second), so everyone but the chosen witness is parked every frame
  window._park = () => S.npcs.forEach(n => { if (n === window._keep) return; n.g.visible = false; n.g.position.set(S.site.x + 400, 0, S.site.z + 400); if (n.sched) n.sched = { type: 'guard', a: { x: S.site.x + 400, z: S.site.z + 400 }, b: { x: S.site.x + 400, z: S.site.z + 400 } }; });
  window._keep = null; const f = () => { window._park(); requestAnimationFrame(f); }; requestAnimationFrame(f); const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; px = h.doorX + dx / L * .8; pz = h.doorZ + dz / L * .8; jumpY = 0; });
await g.frames(3);

// 1. the world runs while you pick, and you stand still
await page.focus('#g'); await page.keyboard.down('w'); await g.frames(2);
const run = await page.evaluate(() => { const h = window._h; tryLockpick(WORLD.doorLockFor(h)); window._r0 = { t: (worldState.gameTimeAbsMinutes || 0), x: px, z: pz, live: LP.live, open: lockOpen }; });
await g.frames(12);
await page.keyboard.up('w');
const ran = await page.evaluate(() => ({ ...window._r0, t1: (worldState.gameTimeAbsMinutes || 0), moved: +Math.hypot(px - window._r0.x, pz - window._r0.z).toFixed(3), still: lockOpen, crimes: (worldState.crimes || []).length }));
console.log('ran', JSON.stringify(ran));
check('picking a shop door at night, the clock turns (it stood still), the pick stays open with nobody about, and you do not walk off with W held', ran.live && ran.open && ran.still && ran.t1 > ran.t && ran.moved < .01 && ran.crimes === 0, ran);

// 2. a watchman comes within three units with a clear line: seen, the lock crime, and the pick breaks off
const seen = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = window._h, site = S.site; const w = S.npcs.find(n => n.sched) || S.npcs[0];
  window._s0 = { f: WORLD.favor(site), b: WORLD.bountyAt ? WORLD.bountyAt(site) : ((worldState.crime || {})[site.id] || { bounty: 0 }).bounty, n: (worldState.crimes || []).length };
  const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; const x = h.doorX + dx / L * 3.8, z = h.doorZ + dz / L * 3.8;
  window._keep = w; w.g.visible = true; w._retreated = false; w.sched = { type: 'guard', a: { x, z }, b: { x, z } }; w.g.position.set(x, WORLD.worldH(x, z), z); return w.def && w.def.name; });
await g.frames(4);
const after = await page.evaluate(() => { const site = WORLD.settle.get('dunmore').site; const C = (worldState.crime || {})[site.id] || { bounty: 0 };
  return { ...window._s0, open: lockOpen, f1: WORLD.favor(site), b1: C.bounty, crimes: (worldState.crimes || []).slice(window._s0.n).map(c => c.kind), picked: WORLD.doorPicked(window._h), msg: document.getElementById('msg') ? document.getElementById('msg').textContent : null }; });
console.log('seen', seen, JSON.stringify(after));
check('a watchman three units off with a clear line mid-pick: the pick breaks off, one lock crime, favour -1, the fine +25, the door still shut', !after.open && after.crimes.length === 1 && after.crimes[0] === 'lock' && after.f1 === after.f - 1 && after.b1 - (after.b || 0) === 25 && !after.picked, after);

// 3. struck while picking, you leave the lock
await page.evaluate(() => { window._keep = null; const C = (worldState.crime || {})[WORLD.settle.get('dunmore').site.id]; if (C) C.bounty = 0; });
await g.frames(2);
const hurt = await page.evaluate(() => { tryLockpick(WORLD.doorLockFor(window._h)); const o = lockOpen; PHP -= 3; return o; });
await g.frames(3);
const hurtAfter = await page.evaluate(() => lockOpen);
check('struck mid-pick, you leave the lock', hurt && !hurtAfter, { hurt, hurtAfter });

// 4. a dungeon lock (no town) still pauses the game
const dun = await page.evaluate(() => { tryLockpick({ seed: 'test_dungeon_door', lockTitle: 'A locked door' }); return { t: (worldState.gameTimeAbsMinutes || 0), live: LP.live, open: lockOpen }; });
await g.frames(12);
const dun2 = await page.evaluate(() => { const r = { t1: (worldState.gameTimeAbsMinutes || 0), open: lockOpen }; closeLockpick(); return r; });
check('a lock that is not a town’s still pauses the game: the clock does not move', dun.open && !dun.live && dun2.open && dun2.t1 === dun.t, { dun, dun2 });

// 5. a pick finished at once still works as before (the lock gives, you go in, the crime is counted once)
const fast = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const n0 = (worldState.crimes || []).length; tryLockpick(WORLD.doorLockFor(window._h));
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); } await wait(900);
  return { picked: WORLD.doorPicked(window._h), crimes: (worldState.crimes || []).slice(n0).map(c => c.kind) }; });
check('picked through, the door is picked and one lock crime is noted', fast.picked && fast.crimes.length === 1 && fast.crimes[0] === 'lock', fast);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
