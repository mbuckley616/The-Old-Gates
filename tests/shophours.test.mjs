// Shop hours in the open world (Session 151): a shop is closed out of its hours; its door says so. Since S2630 the hours are its trade's.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

async function tryDoor(type, hour) {
  await page.evaluate(([type, hour]) => { forceTime(hour);
    const h = WORLD.settle.get('dunmore').houses.find(x => x.type === type); window._h = h;
    px = h.doorX; pz = h.doorZ + .3; jumpY = 0; }, [type, hour]);
  await page.waitForTimeout(1500);
  await g.frames(); // the prompt is written by the main loop, not by the move
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
// S2630 (#1971 B, a town's day): each shop keeps its trade's hours: the forge ('weapon') and the shipwright 7–17, the apothecary 9–17,
// the armourer 9–18, the goods shop 9–19, the barber 10–18. Read straight from the rule at each hour, and one door tried at dusk.
const HRS_WANT = { weapon: [7, 17], shipwright: [7, 17], potion: [9, 17], armor: [9, 18], misc: [9, 19], barber: [10, 18] };
const table = await page.evaluate((W) => { const S = WORLD.settle.get('dunmore'); const out = {};
  for (const t in W) { const h = S.houses.find(x => x.type === t); if (!h) continue; const open = [];
    for (let q = 0; q < 48; q++) { forceTime(q / 2 + .01); if (!WORLD.shopClosedNow(h)) open.push(q / 2); }
    forceTime(3); const lk = WORLD.doorLockNow(h); out[t] = { from: open[0], to: open[open.length - 1] + .5, n: open.length, opens: lk && lk.opens }; }
  forceTime(12); return out; }, HRS_WANT);
console.log(JSON.stringify(table));
check('every trade in Dunmore opens and shuts at its own hour, and its locked door names that opening', Object.keys(table).length >= 4 && Object.entries(table).every(([t, r]) => r.from === HRS_WANT[t][0] && r.to === HRS_WANT[t][1] && r.n === (HRS_WANT[t][1] - HRS_WANT[t][0]) * 2 && r.opens === HRS_WANT[t][0]), table);
const sched = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const k = t => S.npcs.find(n => n.sched && n.sched.type === 'keeper' && n.sched.shop === t);
  const say = (n, h) => { if (!n) return null; const p = scheduleFor(n, h); return p.hide ? 'hide' : p.go ? 'go' : p.wander ? 'wander' : 'idle'; };
  const f = k('weapon'), m = k('misc'), r = S.npcs.find(n => n.sched && n.sched.type === 'resident');
  return { forge7: say(f, 7.5), goods7: say(m, 7.5), forge175: say(f, 17.5), goods175: say(m, 17.5), goods195: say(m, 19.5), res165: say(r, 16.5), res175: say(r, 17.5) }; });
console.log(JSON.stringify(sched));
check("at half past seven the smith is at work and the goods shop's keeper at the door; at half past five the smith goes to the inn and the goods keeper is still in", sched.forge7 === 'hide' && sched.goods7 === 'go' && sched.forge175 === 'go' && sched.goods175 === 'hide' && sched.goods195 === 'go', sched);
check('a resident keeps the square until five and goes in to the inn after', sched.res165 === 'wander' && sched.res175 === 'go', sched);
const dusk = await tryDoor('misc', 18.5), apo = await tryDoor('potion', 18.5);
check('at half past six the goods shop lets you in and the apothecary is locked till 9', dusk.inside && !dusk.closed && apo.closed && !apo.inside && /locked till 9/.test(apo.prompt), { dusk, apo });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
