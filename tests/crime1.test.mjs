// The crime system, part 1 (Session 155): town doors locked after hours, a strongbox in every shop, a chest in every home.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const shop = await page.evaluate(() => { forceTime(23); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /weapon|armor|potion|misc/.test(x.type)); window._h = h;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].name === 'Lockpick') BAG.splice(i, 1);
  px = h.doorX; pz = h.doorZ + .3; jumpY = 0; return { name: h.name, type: h.type, lock: WORLD.doorLockNow(h), home: S.houses.find(x => x.type === 'home' && !x.ownedByPlayer) ? WORLD.doorLockNow(S.houses.find(x => x.type === 'home' && !x.ownedByPlayer)) : null }; });
await page.waitForTimeout(1500); await g.frames();
const prompt = await page.evaluate(() => document.getElementById('ipr').textContent);
await page.keyboard.press('e'); await page.waitForTimeout(1500);
const noPick = await page.evaluate(() => ({ inside: currentHouse === window._h, lockOpen, zone: activeZoneId }));
check('at night a shop and a home are locked; the door says so; without a pick you stay out', shop.lock && shop.lock.kind === 'shop' && shop.home && shop.home.kind === 'home' && /locked till 8/.test(prompt) && /pick/.test(prompt) && !noPick.inside && !noPick.lockOpen, { shop, prompt, noPick });

// with picks: the lock opens as a shop door; set every pin and you are inside
const picked = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 6 });
  const h = window._h; px = h.doorX; pz = h.doorZ + .3; tryLockpick(WORLD.doorLockFor(h)); const title = document.getElementById('lp-title').textContent, pins = LP.pins.length;
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
  await wait(900); return { title, pins, picked: WORLD.doorPicked(h), crimes: (worldState.crimes || []).map(c => c.kind) }; });
await page.waitForTimeout(5000); await g.hide();
const inside = await page.evaluate(() => ({ inside: currentHouse === window._h, box: !!WORLD.intBox, kind: WORLD.intBox && WORLD.intBox.kind }));
check('with a pick, the shop door opens as a lock and lets you in; the pick is remembered as a crime', /shop door/i.test(picked.title) && picked.pins >= 3 && picked.picked && picked.crimes.includes('lock') && inside.inside && inside.box && inside.kind === 'shop', { picked, inside });

// the strongbox: locked, picked, emptied; the takings scale with the town; then it is empty till it refills
const box = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const X = WORLD.intBox; px = X.x; pz = X.z + .8; jumpY = 0;
  const p1 = WORLD.boxPrompt(); WORLD.boxInteract(); const title = document.getElementById('lp-title').textContent; const gold0 = gold, bag0 = BAG.length;
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
  await wait(900); const got = gold - gold0, items = BAG.length - bag0; const p2 = WORLD.boxPrompt(); WORLD.boxInteract(); const goldAgain = gold - gold0;
  worldState.boxes[X.id].taken -= 10; const p3 = WORLD.boxPrompt();
  return { p1, title, got, items, p2, goldAgain, p3, theft: (worldState.crimes || []).some(c => c.kind === 'theft'), lidOpen: X.lid.rotation.x < 0 }; });
check('the strongbox is a lock; picked, it yields the takings and a thing from the stock; then it is empty till it refills', /pick/.test(box.p1) && /strongbox/i.test(box.title) && box.got >= 16 && box.got <= 240 && box.items === 1 && /empty/i.test(box.p2) && box.goldAgain === box.got && /pick/.test(box.p3) && box.theft && box.lidOpen, box);

// a home's chest, and the rules of the lock: yours is never locked, and by day the shop is open
await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide();
const home = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'home' && !x.ownedByPlayer); window._hh = h;
  const night = !!WORLD.doorLockNow(h); forceTime(12); const day = !!WORLD.doorLockNow(h); forceTime(23);
  (worldState.owned || (worldState.owned = {}))[h.id] = true; const owned = !!WORLD.doorLockNow(h); delete worldState.owned[h.id];
  const shopDay = (() => { forceTime(12); const r = !!WORLD.doorLockNow(window._h); forceTime(23); return r; })();
  px = h.exitX; pz = h.exitZ; goToInterior(h); await wait(4500); const X = WORLD.intBox; if (!X) return { night, day, owned, shopDay, none: true };
  px = X.x; pz = X.z + .8; jumpY = 0; WORLD.boxInteract(); const title = document.getElementById('lp-title').textContent; const gold0 = gold, bag0 = BAG.length;
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
  await wait(900); return { night, day, owned, shopDay, kind: X.kind, title, got: gold - gold0, items: BAG.length - bag0, keepsake: BAG[BAG.length - 1].name }; });
check('a home is locked at night, open by day, never locked when it is yours; its chest holds a few coins and a keepsake', home.night && !home.day && !home.owned && !home.shopDay && home.kind === 'home' && /chest/i.test(home.title) && home.got >= 2 && home.got <= 12 && home.items === 1, home);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
