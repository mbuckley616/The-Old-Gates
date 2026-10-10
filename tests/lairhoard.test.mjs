// A lair cavern's master and its hoard (Session 694, the critic's s482). The master counted as dead only when every foe in the
// cavern was dead as you left (`onLeavePortal(…, ENEMIES.every(e=>e.dead))`), so a master killed and looted, with the rest of the
// cavern alive, stood again at full health over a full hoard on the next entry: 261 gold a trip at level 1. Now the master is dead
// from the blow that kills it (`slayMaster`, from `killE`), and the hoard rolls once: its items are kept in `worldState.masters[seed]`,
// so what you take stays taken, a turned day does not refill it, and an emptied hoard is gone.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const SEED = 4021;
const enter = async () => {
  await page.evaluate((seed) => { window._lairBoss = null; window._lairMsg = null;
    const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Troll King' } });
    goToDungeon(p); }, SEED);
  for (let k = 0; k < 60; k++) { await page.waitForTimeout(500); if (await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && ENEMIES.length > 0 && !fadeBusy())) break; }
  await page.waitForTimeout(500);
};
const leave = async () => { await page.evaluate(() => goToOW());
  for (let k = 0; k < 40; k++) { await page.waitForTimeout(500); if (await page.evaluate(() => activeZoneId !== 'dungeon' && !fadeBusy())) break; }
  await page.waitForTimeout(500); };
await page.evaluate(() => { window.fadeBusy = () => { const f = document.getElementById('fd'); return !!(f && parseFloat(getComputedStyle(f).opacity) > .05); };
  const _m = showMsg; showMsg = function (t, c) { if (/master|hoard|large|breathing/i.test(t)) window._lairMsg = t; return _m.apply(this, arguments); }; });
const read = () => page.evaluate((seed) => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); const r = worldState.masters && worldState.masters[seed];
  return { masters: ENEMIES.filter(e => e.master && !e.dead).length, alive: ENEMIES.filter(e => !e.dead).length, all: ENEMIES.length,
    hoard: h ? h.items.map(i => i.name + (i.type === 'gold' ? ':' + i.value : '')) : null, rec: r === true ? true : r ? { dead: r.dead, n: r.hoard && r.hoard.items.length } : null, msg: window._lairMsg }; }, SEED);

// 1. first entry: a master and a full hoard, recorded
await enter();
const a = await read();
check('first entry: one master and a hoard (gold, a sword or a cuirass, the potions)', a.masters === 1 && a.hoard && a.hoard.length >= 3, a);
check('the hoard is recorded once, the master alive', a.rec && a.rec.dead === false && a.rec.n === a.hoard.length, a);

// 2. leave with the master alive and one thing taken: the master comes back, the hoard does not refill
await page.evaluate(() => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); currentLootContainer = h; takeLootItem(h.items.findIndex(i => i.type === 'gold')); currentLootContainer = null; });
await leave();
await page.evaluate(() => { worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 1440 * 2; });
await enter();
const b = await read();
check('master alive on leaving: it stands again (only the kill ends it)', b.masters === 1, b);
check('the gold taken stays taken, two days on: the hoard is the rest, not a new roll', b.hoard && b.hoard.length === a.hoard.length - 1 && !b.hoard.some(n => /^Gold Coins/.test(n)) && b.hoard.every(n => a.hoard.includes(n)), { a: a.hoard, b: b.hoard });

// 3. kill the master with the cavern alive, take one more, leave, come back: no master, the rest of the hoard where you left it
const k = await page.evaluate(() => { const e = ENEMIES.find(x => x.master && !x.dead); killE(e); const h = CHESTS.find(c => /:hoard$/.test(c.id)); currentLootContainer = h; takeLootItem(0); currentLootContainer = null; return { alive: ENEMIES.filter(x => !x.dead).length }; });
const c0 = await read();
check('the kill marks the master dead at once, with the cavern still alive', c0.rec && c0.rec.dead === true && k.alive > 5, { ...c0, ...k });
await leave(); await enter();
const c = await read();
check('back in after the kill: no master', c.masters === 0 && c.alive > 5, c);
check('the hoard holds what you left in it, and no more', c.hoard && c.hoard.length === a.hoard.length - 2 && /where you left it/.test(c.msg || ''), c);

// 4. through a save's JSON (the world row): the same
await page.evaluate((seed) => { worldState.masters = JSON.parse(JSON.stringify(worldState.masters)); }, SEED);
await leave(); await enter();
const d = await read();
check('through the save\'s JSON: still no master, the same remainder', d.masters === 0 && JSON.stringify(d.hoard) === JSON.stringify(c.hoard), { c: c.hoard, d: d.hoard });

// 5. empty it: next time it is gone
await page.evaluate(() => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); currentLootContainer = h; while (h.items.length) takeLootItem(0); currentLootContainer = null; });
await leave(); await enter();
const e = await read();
check('emptied: no hoard and no master next time ("long gone")', e.hoard === null && e.masters === 0 && /long gone/.test(e.msg || ''), e);

// 6. an old save's `true`: dead and gone, as before
await page.evaluate((seed) => { worldState.masters[seed] = true; }, SEED);
await leave(); await enter();
const f = await read();
check('an old save (masters[seed] === true): no master, no hoard', f.hoard === null && f.masters === 0, f);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
