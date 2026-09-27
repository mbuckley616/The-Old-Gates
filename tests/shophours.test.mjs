// Shop hours in the open world (Session 151): a shop is closed 18–8 (Session 10's rule); its door says so.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

async function tryDoor(type, hour) {
  await page.evaluate(([type, hour]) => { forceTime(hour);
    const h = WORLD.settle.get('dunmore').houses.find(x => x.type === type); window._h = h;
    px = h.doorX; pz = h.doorZ + .3; jumpY = 0; }, [type, hour]);
  await page.waitForTimeout(1500);
  // the prompt is written by the main loop: on a slow runner 1.5s can pass without a frame, leaving the last door's text
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const prompt = await page.evaluate(() => document.getElementById('ipr').textContent);
  await page.keyboard.press('e'); await page.waitForTimeout(3000);
  const out = await page.evaluate(() => ({ zone: activeZoneId, inside: currentHouse === window._h, closed: WORLD.shopClosedNow(window._h), hour: Math.floor(gameHour()), name: window._h.name }));
  out.prompt = prompt;
  if (out.inside) { await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide(); }
  return out;
}
const types = await page.evaluate(() => [...new Set(WORLD.settle.get('dunmore').houses.map(h => h.type))]);
const shop = ['weapon', 'armor', 'potion', 'misc'].find(t => types.includes(t));
const night = await tryDoor(shop, 23);
check('a shop at night is locked, and its door says so', night.closed && !night.inside && /locked/.test(night.prompt), night);
const day = await tryDoor(shop, 12);
check('the same shop at noon lets you in', !day.closed && day.inside && /enter/.test(day.prompt), day);
const inn = await tryDoor('inn', 23);
check('the inn at night still lets you in', inn.inside, inn);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
