// The sea's state and its wear (Session 412; Michael's A on #85, docs/design/sailing.md). The state where she is: the
// weather (clear and fog 0; overcast, rain and snow 1; a storm 3) plus one in open water (a bed below −8 and no shore
// within 150 units), at most 3. Under sail in a rough sea (2) she loses 1 hull and 1 rig a minute; in a storm (3) with W
// held 1 hull every 6 s and 1 rig every 4 s, half that with no key held while she makes way, nothing hove to.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const spots = await page.evaluate(() => { let open = null, coast = null;
  for (let r = 60; r < 3000 && !(open && coast); r += 40) for (let a = 0; a < 6.28 && !(open && coast); a += .25) { const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    if (!open && WORLD.openWater(x, z)) open = { x, z };
    if (!coast && WORLD.worldH(x, z) < -5 && [[0, 12], [12, 0], [0, -12], [-12, 0]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -4) && !WORLD.openWater(x, z)) coast = { x, z }; }
  window._spots = { open, coast }; return { open: !!open, coast: !!coast, openBed: open && +WORLD.worldH(open.x, open.z).toFixed(1), coastBed: coast && +WORLD.worldH(coast.x, coast.z).toFixed(1) }; });
check('found open water and coastal water', spots.open && spots.coast, spots);

const states = await page.evaluate(() => { const out = {}, wx = WORLD.wx;
  for (const w of ['clear', 'fog', 'overcast', 'rain', 'snow', 'storm']) { wx.type = wx.next = w; wx.k = 0;
    out[w] = [WORLD.seaState(_spots.coast.x, _spots.coast.z), WORLD.seaState(_spots.open.x, _spots.open.z)]; }
  return out; });
console.log(JSON.stringify(states));
check('coastal / open: clear 0/1, fog 0/1, overcast 1/2, rain 1/2, snow 1/2, storm 3/3',
  JSON.stringify(states) === JSON.stringify({ clear: [0, 1], fog: [0, 1], overcast: [1, 2], rain: [1, 2], snow: [1, 2], storm: [3, 3] }), states);

const key = (code, down) => page.evaluate(([code, down]) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code })), [code, down]);
// her at the wheel at a spot under a weather for `secs` (and half a second, so a sum of 1/30 s steps reaches the whole point), held in place each tick, no other ship about (a black sail's volley
// would add its own wear); `speed` forced each tick if given
const run = (where, weather, secs, speed) => page.evaluate(([where, weather, secs, speed]) => { const p = _spots[where], wx = WORLD.wx;
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull' }; WORLD.spawnShip(p.x, p.z, 0); const S = WORLD.ship; S.sailing = true; S._seaT = 0; S._wh = 0; S._wr = 0;
  wx.type = wx.next = weather; wx.k = 0; wx.timer = 1e9; S.speed = speed == null ? 7.5 : speed;
  const n = Math.round((secs + .5) * 30); let sea = null;
  for (let i = 0; i < n; i++) { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o); S.x = p.x; S.z = p.z; if (speed != null) S.speed = speed; WORLD.tick(1 / 30, performance.now()); if (i === 40) sea = S.sea; PHP = maxHP; }
  WORLD.shipBarsUI(); const el = document.getElementById('shipbars');
  return { sea, bars: WORLD.shipBars(), panel: el && el.style.display === 'block' ? el.textContent : null, others: WORLD.others.length }; }, [where, weather, secs, speed]);

await key('KeyW', true);
const rough = await run('open', 'rain', 120);
const moderate = await run('open', 'clear', 120);
const roughCoast = await run('coast', 'rain', 120);
const storm = await run('coast', 'storm', 60);
await key('KeyW', false);
const reduced = await run('coast', 'storm', 60, 3);
const hoveTo = await run('coast', 'storm', 60, 0);
console.log(JSON.stringify({ rough, moderate, roughCoast, storm, reduced, hoveTo }));
check('rain in open water is rough (2): two minutes under sail cost 2 hull and 2 rig', rough.sea === 2 && rough.bars.hull === 98 && rough.bars.rig === 98, rough);
check('the panel names the sea: "Sea: rough"', /Sea: rough/.test(rough.panel || ''), rough.panel);
check('a clear day in open water is moderate (1): nothing', moderate.sea === 1 && moderate.bars.hull === 100 && moderate.bars.rig === 100, moderate);
check('rain along the coast is moderate (1): nothing', roughCoast.sea === 1 && roughCoast.bars.hull === 100, roughCoast);
check('a storm under full sail (W held) for a minute: hull −10, rig −15', storm.sea === 3 && storm.bars.hull === 90 && storm.bars.rig === 85 && /Sea: storm/.test(storm.panel || ''), storm);
check('no key held, still making 3: half, hull −5, rig −7', reduced.bars.hull === 95 && reduced.bars.rig === 93, reduced);
check('hove to (no way on her): nothing', hoveTo.bars.hull === 100 && hoveTo.bars.rig === 100, hoveTo);

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
