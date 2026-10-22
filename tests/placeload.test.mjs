// Saves by place (Session 243): the re-entries that can go wrong. A save in a home the town rebuilt behind, a save naming
// another building, and a save behind a door whose town is still unbuilt. Split from `placesave` in Session 1280 for CI's
// 900 s (its sections 4 to 6).
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
  await page.reload(); await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && typeof saveToSlot === 'function' && getComputedStyle(b).display !== 'none'; }, null, { timeout: 120000, polling: 100 });
  await page.evaluate(() => document.getElementById('cb').click());
  await page.waitForFunction(() => started && !!currentHouse && !!currentHouse.id && scene === interiorScene && !window._pendingPos, null, { timeout: 120000, polling: 100 }).catch(() => {}); await g.hide(); console.log('cont', (Date.now() - t0) / 1000, 's');
  return page.evaluate(() => ({ started, id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
};
const here = () => page.evaluate(() => ({ id: currentHouse && currentHouse.id, name: currentHouse && currentHouse.name, x: +px.toFixed(1), z: +pz.toFixed(1) }));
// Session 562: the doors' fades run on a 440 ms timer that a loaded runner fires late; wait for the room (or the street), not for 3 s
const inRoom = (id) => page.waitForFunction((id) => !!currentHouse && scene === interiorScene && (id == null || currentHouse.id === id), id, { timeout: 60000, polling: 250 });
const out = async () => { await page.evaluate(() => { if (currentHouse) exitInterior(); }); await page.waitForFunction(() => !currentHouse, null, { timeout: 60000, polling: 250 }); await g.hide(); };
const t00 = Date.now(); const lap = (s) => console.log(`${s} at ${Math.round((Date.now() - t00) / 1000)} s`);

// 1. saved in a home while the town's prosperity fell 13 (the town rebuilt behind you): back in that home
await g.settle('dunmore');
const fell = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.filter(h => h.type === 'home')[5]; goToInterior(h); return { id: h.id, name: h.name, exitX: h.exitX, exitZ: h.exitZ }; });
await inRoom(fell.id); await g.hide();
await page.evaluate(() => { const s = WORLD.siteAnywhere('dunmore'); WORLD.setProsperity(s, WORLD.prosperity(s) - 13); });
const back4 = await cont();
const exit4 = await page.evaluate(() => currentHouse && { x: currentHouse.exitX, z: currentHouse.exitZ });
console.log('fell', JSON.stringify({ fell, back4, exit4 }));
check('saved in a home as the town fell 13: continued in the same house, behind the same door, under the same name', back4.id === fell.id && back4.name === fell.name && exit4 && Math.hypot(exit4.x - fell.exitX, exit4.z - fell.exitZ) < .1, { fell, back4, exit4 });
await out();

// 2. a save that names another building (as one from before this build can): the door it was saved behind decides
await g.settle('dunmore');
const real = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.filter(h => h.type === 'home')[3]; goToInterior(h); return h.id; });
await inRoom(real); await g.hide();
await page.evaluate(() => { currentHouse = Object.assign(Object.create(Object.getPrototypeOf(currentHouse)), currentHouse, { id: 'g_dunmore_2' }); });
const back5 = await cont();
console.log('legacy', JSON.stringify({ real, back5 }));
check('a save naming the wrong id comes back behind the door it was made behind', back5.id === real, { real, back5 });
await out();

// 3. Session 326: on a slow machine the town behind a saved door can still be queued when the re-entry looks for it; the
// world's job queue drains a job or two a frame, and the re-entry gave up after 60 tries (6 s). Starve the world's tick
// outright, drop the town, and ask for the inn: the re-entry must build the town itself.
await g.settle('dunmore');
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(h => h.type === 'inn'); goToInterior(h); });
await inRoom(); await g.hide();
const W6 = await page.evaluate(() => { const h = currentHouse; return { kind: 'house', id: h.id, parent: null, site: h.siteId, x: px, z: pz, yaw, jumpY, door: { x: h.exitX, z: h.exitZ, yaw: h.exitYaw || 0 } }; });
await out();
const starved = await page.evaluate(async (W) => {
  const tick = WORLD.tick; WORLD.tick = () => {}; const msgs = []; const sm = showMsg; showMsg = function (m) { msgs.push(m); return sm.apply(this, arguments); };
  WORLD.disposeSettlement('dunmore'); const gone = !WORLD.settle.has('dunmore');
  _reenterPlace(W); await new Promise(r => setTimeout(r, 8000));
  const r = { gone, id: currentHouse && currentHouse.id, built: WORLD.settle.has('dunmore'), movedOn: msgs.filter(m => /moved on/.test(m)).length };
  WORLD.tick = tick; showMsg = sm; return r; }, W6);
console.log('starved', JSON.stringify({ want: W6.id, starved }));
check('with the world\u2019s tick starved and the town unbuilt, a save behind the inn door still comes back in the inn (it gave up after 6 s)', starved.gone && starved.built && starved.id === W6.id && starved.movedOn === 0, { want: W6.id, starved });
await out();
lap('three re-entries');
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
