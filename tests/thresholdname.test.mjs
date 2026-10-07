// The save made at a dungeon's door is named for the door (Session 627; the critic, 7 Oct 2026). Going down saves you at
// the threshold (Session 353), but the save is written while you still stand in the open world, so the slot list and the
// death screen named the nearest town: *autosave — near Hearthwick* for a save that wakes you at the Old Garrison's door.
// Now that save carries the dungeon's name; an ordinary autosave in the open is named as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const lastAuto = () => page.evaluate(() => { const a = SS.idx.filter(e => e.kind === 'auto').sort((x, y) => y.ts - x.ts)[0]; return a ? { ts: a.ts, place: a.place } : null; });
const out = [];
for (const seed of [7100, 7104]) {
  const t0 = await page.evaluate((seed) => { const p = PORTALS.find(p => p.seed === seed) || makePortalDef(WORLD_DUNGEONS.find(d => d.seed === seed)); /* S631 — not in PORTALS on CI */ const w = WORLD.dungeonPos[seed];
    if (w) { px = w.x; pz = w.z + 3; } SS.lastAuto = 0; const t = Date.now(); goToDungeon(p); return { t, name: p.name, at: !!w }; }, seed);
  await page.waitForFunction((t) => SS.idx.some(e => e.kind === 'auto' && e.ts >= t), t0.t, { timeout: 20000 });
  const a = await lastAuto();
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1000);
  // the death screen reads the same entry
  const died = await page.evaluate(() => { PHP = 0; playerDead(); const s = document.getElementById('died-sub').textContent; document.getElementById('died').style.display = 'none'; dead = false; PHP = maxHP; return s; });
  await page.evaluate(() => goToOW()); for (let k = 0; k < 40 && await page.evaluate(() => activeZoneId === 'dungeon'); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1000);
  out.push({ seed, name: t0.name, place: a && a.place, died }); console.log(' ', JSON.stringify(out[out.length - 1]));
}
// an ordinary autosave in the open, by Dunmore, a few seconds later: the town, as before
const town = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + 5; pz = t.z + 5; SS.lastAuto = 0; const ts = Date.now(); saveGame(true); return { ts, name: t.name }; });
await page.waitForFunction((t) => SS.idx.some(e => e.kind === 'auto' && e.ts >= t), town.ts, { timeout: 20000 });
const ord = await lastAuto(); console.log('  ordinary', JSON.stringify(ord), town.name);
check('the save at a dungeon\'s door is named for the dungeon', out.every(o => o.name && o.place === o.name), out);
check('the death screen inside names it too', out.every(o => o.died.includes(o.name)), out.map(o => o.died));
check('an ordinary autosave in the open is still named for the town', ord && ord.place === town.name, { ord, town: town.name });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
