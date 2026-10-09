// The Mages' hearth task's house has a cold hearth (Session 676, the critic's s480 note, routed to H by the systems builder:
// "the task house's fire should be out until you light it"). While a *Light a hearth* task names a home and is not done, that
// home's hearth is built cold: grey ash for the ember bed, no flames, its light dark. The moment the task is marked done the
// room's tick shows the flames and brings the light up; every other home, and the same home with no task, is lit as before.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const SHOTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'prototypes');
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const enter = (i, task) => page.evaluate(async ([i, task]) => {
  if (typeof isInterior === 'function' && isInterior()) { exitInterior(); await new Promise(r => setTimeout(r, 2500)); }
  const S = WORLD.settle.get('dunmore'), h = S.houses.filter(x => x.type === 'home')[i];
  gstate().guild_m.active = task ? { id: 'guild_m:test:1', g: 'guild_m', kind: 'hearth', siteId: 'dunmore', house: null, gold: 40, desc: '', short: 'Light a hearth' } : null;
  px = h.exitX; pz = h.exitZ; goToInterior(h);
  for (let k = 0; k < 40 && !(currentHouse && currentHouse.id === h.id); k++) await new Promise(r => setTimeout(r, 250));
  await new Promise(r => setTimeout(r, 1500));
  return currentHouse && currentHouse.id === h.id; }, [i, task]);
// what the room's hearth shows: the room's bake, its hidden hearth flames, and the hearth's point light (at W-1.2, D*.4)
const read = () => page.evaluate(() => { const h = currentHouse, W = h._roomW || 10, D = h._roomD || 10;
  const room = FURN_LIVE.filter(r => r.parent === interiorScene).sort((a, b) => (b.userData.tris || 0) - (a.userData.tris || 0))[0];
  // the room's lights are swept into its light pool (_sweepScenePool): the hearth's is the source at W-1.2, D*.4
  _sweepScenePool(interiorScene); const P = _LPS.get(interiorScene);
  const src = P.src.find(v => Math.abs(v.pos.x - (W - 1.2)) < .05 && Math.abs(v.pos.z - D * .4) < .05);
  const lightI = src ? src.mirror.intensity : null, pooled = P.pool.some(L => L.intensity > 0 && Math.abs(L.position.x - (W - 1.2)) < .05 && Math.abs(L.position.z - D * .4) < .05);
  const hf = room && room.userData.hearthFire;
  return { found: !!room, hearthFire: hf ? { visible: hf.visible, tris: hf.geometry.index.count / 3 } : null, fireTris: room && room.userData.fire ? room.userData.fire.geometry.index.count / 3 : 0, lightI, pooled }; });
const shoot = async (name) => { await page.evaluate(() => { const h = currentHouse, W = h._roomW || 10, D = h._roomD || 10; px = W - 3.6; pz = D * .4 + .6; yaw = -Math.PI / 2 - .2; pitch = -.12; });
  await g.frames(3); await page.screenshot({ path: path.join(SHOTS, name) }); };

// a home with no task: lit as it always was
check('entered a Dunmore home with no task', await enter(0, false));
const plain = await read(); console.log('no task', JSON.stringify(plain));
check('with no task the hearth burns: no flames held aside, its light at 1.2', plain.hearthFire === null && plain.fireTris > 100 && plain.lightI === 1.2 && plain.pooled, plain);

// the same home as the task's house: cold
check('entered it again with a hearth task naming Dunmore', await enter(0, true));
const cold = await read(); console.log('cold', JSON.stringify(cold));
check('the task house is built cold: its flames held aside and hidden, its light at 0', cold.hearthFire && cold.hearthFire.visible === false && cold.hearthFire.tris > 50 && cold.lightI === 0 && !cold.pooled, cold);
check('the room keeps its candles burning (the room fire mesh is the candles alone)', cold.fireTris > 0 && cold.fireTris < plain.fireTris && Math.abs(cold.fireTris + cold.hearthFire.tris - plain.fireTris) < 1, [cold.fireTris, cold.hearthFire && cold.hearthFire.tris, plain.fireTris]);
// ten seconds of the room at 60 fps: the pool sweeps 700 times, long enough to drop a dark source (it does after 600)
await page.evaluate(() => { for (let i = 0; i < 700; i++) { tickInterior(1 / 60, performance.now()); _sweepScenePool(interiorScene); } });
const still = await read(); console.log('after 700 sweeps', JSON.stringify(still));
check('the room ticks and the hearth stays cold while the task is open', still.hearthFire.visible === false && !still.pooled, still);
await g.hide(); await shoot('coldhearth-cold.png');

// the task is done (the guild marks it when the flame is cast): the hearth catches on the next tick
await page.evaluate(() => { gstate().guild_m.active.done = true; for (let i = 0; i < 2; i++) { tickInterior(1 / 60, performance.now()); _sweepScenePool(interiorScene); } });
const lit = await read(); console.log('lit', JSON.stringify(lit));
check('once the task is done the hearth catches: flames shown, its light back in the room\'s pool at 1.2', lit.hearthFire.visible === true && lit.lightI === 1.2 && lit.pooled, lit);
await shoot('coldhearth-lit.png');

// another home in the same town is not the task's house... the task names the town, so every home there is a candidate:
// the cold one is any home of the named site, never a home elsewhere or a shop
const other = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), T = { id: 't', g: 'guild_m', kind: 'hearth', siteId: 'dunmore', done: false };
  gstate().guild_m.active = T; const home = S.houses.find(x => x.type === 'home'), shop = S.houses.find(x => x.type !== 'home');
  const elsewhere = [...WORLD.settle.values()].find(s => s.id !== 'dunmore' && s.houses.some(x => x.type === 'home'));
  const r = [coldHearthHouse(home), shop ? coldHearthHouse(shop) : false, elsewhere ? coldHearthHouse(elsewhere.houses.find(x => x.type === 'home')) : false];
  const home2 = S.houses.filter(x => x.type === 'home')[1]; T.house = home.id; r.push(coldHearthHouse(home) && !coldHearthHouse(home2)); T.house = null;
  T.kind = 'deliver'; r.push(coldHearthHouse(home)); gstate().guild_m.active = null; r.push(coldHearthHouse(home)); return r; });
check('only a home of the task\'s own town (the bound one, once bound), and only for an open hearth task, is cold', other[0] === true && other[1] === false && other[2] === false && other[3] === true && other[4] === false && other[5] === false, other);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
