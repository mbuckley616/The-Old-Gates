// When the game autosaves (Session 353, Michael's A on #66): at rest and at thresholds. The critic's s253 lost forty
// minutes to a death because nothing saved in the open world between the arrival and the fall. Now sleeping anywhere,
// the dungeon door going down (at the threshold; going up already saved), arriving on a town's pad and stepping off the
// coach each autosave. The ring still keeps at most one autosave a 90 s (`SS.lastAuto`); each check clears it first.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const W = (ms) => page.waitForTimeout(ms);
// count autosaves by wrapping ssAutosave; clear the ring's 90 s gate before each moment
await page.evaluate(() => { window._saves = []; const A = window.ssAutosave; window.ssAutosave = function () { _saves.push(activeZoneId + '@' + Math.round(px) + ',' + Math.round(pz)); return A.apply(this, arguments); }; });
const reset = () => page.evaluate(() => { SS.lastAuto = 0; _saves.length = 0; });
const saves = () => page.evaluate(() => _saves.slice());
const R = {};

// 1. sleep: restAtBed runs its fade, then saves
await reset(); await page.evaluate(() => restAtBed(2)); await W(3000); await g.hide();
R.sleep = await saves();
check('sleeping autosaves', R.sleep.length === 1, R.sleep);

// 2. arriving on a town's pad: walk from outside Dunmore onto its pad
await g.settle('dunmore');
R.away = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + t.pad + 60; pz = t.z; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now()); return { pad: t.pad }; });
await reset();
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + 4; pz = t.z + 4; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now()); });
R.arrive = await saves();
await page.evaluate(() => { for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now()); });
R.stay = (await saves()).length;
check('arriving on a town\'s pad autosaves once, and standing there saves no more', R.arrive.length === 1 && R.stay === 1, { ...R.away, arrive: R.arrive, stay: R.stay });

// 3. not mid-fight: an alert foe within 30 of the pad's edge, and the arrival does not save
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + t.pad + 60; pz = t.z; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now()); });
await reset();
R.fight = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + 4; pz = t.z + 4;
  const fake = { dead: false, alert: true, mesh: { position: { x: px + 5, z: pz } } }; ZONES.world.enemies.push(fake);
  for (let i = 0; i < 60; i++) { fake.mesh.position.x = px + 5; fake.mesh.position.z = pz; WORLD.tick(1 / 60, performance.now()); }
  ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(fake), 1); return _saves.slice(); });
check('arriving with a foe on you does not autosave', R.fight.length === 0, R.fight);

// 4. the coach: open the nearest coaching road between two towns, board a waiting coach, step down
await page.evaluate(() => { const T = ['town', 'city', 'port'];
  const defs = WORLD.ROAD_DEFS.map(d => ({ d, a: WORLD.siteAnywhere(d.a), b: WORLD.siteAnywhere(d.b) })).filter(q => q.a && q.b && T.includes(q.a.kind) && T.includes(q.b.kind)).sort((p, q) => Math.hypot((p.a.x + p.b.x) / 2 - px, (p.a.z + p.b.z) / 2 - pz) - Math.hypot((q.a.x + q.b.x) / 2 - px, (q.a.z + q.b.z) / 2 - pz));
  const { d, a, b } = defs[0]; const key = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; worldState.coaches = worldState.coaches || {}; worldState.coaches[key] = { a: d.a, b: d.b, opened: 0 }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2; });
await W(6000);
await page.evaluate(() => { forceTime(12); for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now()); });
await W(3000);
R.coach = await page.evaluate(() => { const C = [...WORLD.coachLines.values()][0]; if (!C) return null;
  C.state = 'wait'; C.u = .4; C.riding = false; px = C.cart.position.x + .5; pz = C.cart.position.z;
  WORLD.coachInteract(); const boarded = C.riding; SS.lastAuto = 0; _saves.length = 0; const onBoard = _saves.length;
  WORLD.coachInteract(); return { boarded, onBoard, down: !C.riding, saves: _saves.slice() }; });
check('stepping off the coach autosaves (boarding does not)', !!R.coach && R.coach.boarded && R.coach.down && R.coach.saves.length === 1, R.coach);

// 5. the dungeon door going down: saved in the world, at the door
await reset();
R.door = await page.evaluate(() => { const e = WORLD.doorAnywhere(42); if (!e) return { door: false }; const p = makePortalDef(e); const wp = WORLD.dungeonPos[42]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world'; goToDungeon(p); return { door: true, saves: _saves.slice() }; });
await W(6000); await g.hide();
R.inside = await page.evaluate(() => activeZoneId);
check('the dungeon door going down autosaves at the threshold, in the world', R.door.door && R.door.saves.length === 1 && /^world@/.test(R.door.saves[0]) && R.inside === 'dungeon', { ...R.door, inside: R.inside });
// and coming back up saves as before (goToOW)
await reset(); await page.evaluate(() => goToOW()); await W(4000); await g.hide();
R.up = await saves();
check('coming back up still autosaves', R.up.length >= 1, R.up);
console.log(JSON.stringify(R));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
