// The oilskin's hint at the helm (Session 553, Michael's B on DECISION #148): at sea in rain or storm, wearing the oilskin,
// the sea line says the next shift of weather; it is rolled when first shown and the next shift takes it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
const r = await page.evaluate(() => { let open = null;
  for (let rr = 60; rr < 3000 && !open; rr += 40) for (let a = 0; a < 6.28 && !open; a += .25) { const x = px + Math.cos(a) * rr, z = pz + Math.sin(a) * rr; if (WORLD.openWater(x, z)) open = { x, z }; }
  if (!open) return null;
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull' }; WORLD.spawnShip(open.x, open.z, 0); const S = WORLD.ship; S.sailing = true; S._seaT = 0; S.speed = 0;
  const wx = WORLD.wx; const line = (k, sky, ahead) => { EQ.back = k ? makeCloak(k) : null; wx.type = wx.next = sky; wx.k = 0; wx.timer = 1e9; if (ahead !== undefined) wx.ahead = ahead;
    S.x = open.x; S.z = open.z; WORLD.tick(1 / 30, performance.now()); WORLD.shipBarsUI(); const el = document.getElementById('shipbars'); return el && el.style.display === 'block' ? document.getElementById('shipbars-sea').textContent : null; };
  const out = { rainClear: line('oilskin', 'rain', 'clear'), stormRain: line('oilskin', 'storm', 'rain'), rainRain: line('oilskin', 'rain', 'rain'), wool: line('wool', 'rain', 'clear'), bare: line(null, 'rain', 'clear'), clearSky: line('oilskin', 'clear', 'storm') };
  // rolled when first shown, and the next shift takes it
  const rolled = line('oilskin', 'rain', null); const ahead = wx.ahead;
  wx.ahead = 'storm'; line('oilskin', 'rain'); wx.timer = 0; WORLD.tick(1 / 30, performance.now()); const next = wx.next, cleared = wx.ahead;
  EQ.back = null; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  return Object.assign(out, { rolled, ahead, next, cleared });
});
stop();
console.log(JSON.stringify(r));
check('found open water and the sea line shows', !!r && !!r.bare, r);
check('in rain with the oilskin the line says what comes next: "clearing ahead"; in a storm "rain ahead"', /^Sea: \w+ · clearing ahead$/.test(r.rainClear) && /^Sea: \w+ · rain ahead$/.test(r.stormRain), r);
check('no hint when the next shift is the same weather, in another cloak, bare, or under a clear sky', /^Sea: \w+$/.test(r.rainRain) && /^Sea: \w+$/.test(r.wool) && /^Sea: \w+$/.test(r.bare) && /^Sea: \w+$/.test(r.clearSky), r);
check('the shift is rolled when first shown, and the next shift takes what was foretold', !!r.ahead && r.next === 'storm' && r.cleared === null, { ahead: r.ahead, rolled: r.rolled, next: r.next, cleared: r.cleared });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
