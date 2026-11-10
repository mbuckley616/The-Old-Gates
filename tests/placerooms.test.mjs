// Saves by place (Session 243): a save made inside a room comes back in that room, at that spot, after a reload and Continue.
// Split from `placesave` in Session 1280 for CI's 900 s (its section 3). Session 2001 (QA): split again, three rooms here and three in
// `placerooms2`, which shares this file's body: the weekly run of 8 Nov took 166–196 s a round trip on a slow runner and the cap killed
// both tries in the fourth room. `PLACEROOMS_KINDS` is set by placerooms2.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
// Session 1280: each round trip waits for what it needs, not for fixed times. The save's promise settles when the store has
// both rows (ssWrite); the title's Continue is shown once the store is read (ssMigrate); a room is entered, and a loaded save's
// spot applied, in one step of goToInterior (currentHouse, the interior scene, _pendingPos cleared). The five fixed pauses
// a round trip held (7.2 s) are gone; on CI the six-room suite was killed at 900 s with them.
const cont = async () => { const t0 = Date.now();
  await page.evaluate(() => saveToSlot(0));
  // Session 326: waits for what it needs (the menu, then the room), not for fixed times a loaded runner can outlast
  await page.reload(); await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && typeof saveToSlot === 'function' && getComputedStyle(b).display !== 'none'; }, null, { timeout: 300000, polling: 100 });
  await page.evaluate(() => document.getElementById('cb').click()); const t1 = Date.now();
  // S2052 (QA): as gatesave (S1978) and dungeonexit (S1985), Continue's load is one long task (90–151 s side by side on four cores)
  // that one 120 s wait shared with the room after it; the world restored is waited for on its own, up to 300 s, then the room
  await page.waitForFunction(() => activeZoneId === 'world' || activeZoneId === 'dungeon', null, { timeout: 300000, polling: 200 }); const t2 = Date.now();
  await page.waitForFunction(() => started && !!currentHouse && !!currentHouse.id && scene === interiorScene && !window._pendingPos, null, { timeout: 120000, polling: 100 }).catch(() => {}); await g.hide();
  console.log('cont', (Date.now() - t0) / 1000, 's', JSON.stringify({ title: (t1 - t0) / 1000, load: (t2 - t1) / 1000, room: (Date.now() - t2) / 1000 }));
  return page.evaluate(() => ({ started, id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
};
const here = () => page.evaluate(() => ({ id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
// Session 562: the doors' fades run on a 440 ms timer that a loaded runner fires late; wait for the room (or the street), not for 3 s
const inRoom = (id) => page.waitForFunction((id) => !!currentHouse && scene === interiorScene && (id == null || currentHouse.id === id), id, { timeout: 60000, polling: 250 });
const out = async () => { await page.evaluate(() => { if (currentHouse) exitInterior(); }); await page.waitForFunction(() => !currentHouse, null, { timeout: 60000, polling: 250 }); await g.hide(); };
const t00 = Date.now(); const lap = (s) => console.log(`${s} at ${Math.round((Date.now() - t00) / 1000)} s`);

// 3. save inside each kind of place, reload, Continue: the same room at the same spot
await g.settle('dunmore');
const kinds = globalThis.PLACEROOMS_KINDS || ['home', 'weapon', 'inn'];
const places = [];
for (const t of kinds) {
  if (!(await page.evaluate(() => !!WORLD.settle.get('dunmore')))) await g.settle('dunmore');
  await page.evaluate((t) => { const S = WORLD.settle.get('dunmore'); let h = S.houses.find(h => h.type === (t === 'cellar' ? 'inn' : t)); if (t === 'cellar') h = WORLD.cellarFor(h); goToInterior(h); return h.id; }, t).then(inRoom);
  await g.hide();
  const at = await here(); const back = await cont();
  places.push({ t, at, back }); console.log(t, JSON.stringify({ at, back })); await out();
}
for (const r of places) check(`saved in the ${r.t}, continued in the same room at the same spot`, r.back.started && r.back.id === r.at.id && r.back.name === r.at.name && Math.hypot(r.back.x - r.at.x, r.back.z - r.at.z) < .5, r);

lap(`${kinds.length} rooms`);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
