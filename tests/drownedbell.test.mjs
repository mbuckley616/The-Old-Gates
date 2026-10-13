// The Drowned Bell (Session 778; Michael's B on DECISION #175, the Sea's row of docs/design/unique-artifacts.md): carried,
// your ship takes half the wear of rough seas and storms (tickSeaWear), and a black sail hunts you from 600 units, not 300.
// The wear is driven through tickSeaWear itself; the hunt through the black sails' own tick, with you at sea in deep water.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// 1. the sea's wear, a minute (and half a second) in a storm with W held and two in a rough sea, bare and with the bell in the bag
const wear = await page.evaluate(() => {
  const keepShip = worldState.ship, keepSea = SHIP.sea, keepSpeed = SHIP.speed;
  const run = (bell, sea, mins = 1) => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
    if (bell) takeArtifact('drowned_bell');
    worldState.ship = { cls: 'sloop', hull: 100, rig: 100, name: 'Test' }; SHIP._wh = 0; SHIP._wr = 0; SHIP.sea = sea; SHIP.speed = 5;
    for (let k = 0; k < 60 * 60 * mins + 30; k++) tickSeaWear(1 / 60, 1);
    const b = shipBars(); return { hull: 100 - b.hull, rig: 100 - b.rig, carried: bellAboard() }; };
  const out = { stormBare: run(false, 3), stormBell: run(true, 3), roughBare: run(false, 2, 2), roughBell: run(true, 2, 2) };
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); delete worldState.artifacts;
  worldState.ship = keepShip; SHIP.sea = keepSea; SHIP.speed = keepSpeed; return out;
});
console.log(JSON.stringify(wear));
check(`a minute of storm with W held: bare hull −${wear.stormBare.hull} rig −${wear.stormBare.rig}; with the Bell hull −${wear.stormBell.hull} rig −${wear.stormBell.rig}`, wear.stormBare.hull === 10 && wear.stormBare.rig === 15 && wear.stormBell.hull === 5 && Math.abs(wear.stormBell.rig - 7.5) <= .5 && wear.stormBell.carried && !wear.stormBare.carried, wear);
check('two minutes of rough sea: 2 hull and 2 rig bare, 1 and 1 with the Bell', wear.roughBare.hull === 2 && wear.roughBare.rig === 2 && wear.roughBell.hull === 1 && wear.roughBell.rig === 1, wear);

// 2. the hunt: a black sail 450 units east of you, out on deep water, her course set north; one second of her tick
const hunt = await page.evaluate(() => {
  let spot = null; const H = (x, z) => worldH(x, z);
  outer: for (let r = 0; r < 9000; r += 150) for (let a = 0; a < 24; a++) { const x = px + Math.cos(a / 24 * Math.PI * 2) * r, z = pz + Math.sin(a / 24 * Math.PI * 2) * r;
    let ok = true; for (const [dx, dz] of [[0, 0], [450, 0], [450, -150], [0, -150]]) if (!(H(x + dx, z + dz) < -4.5)) { ok = false; break; } if (ok) { spot = { x, z }; break outer; } }
  if (!spot) return { none: true };
  const x0 = px, z0 = pz, keepSail = SHIP.sailing; px = spot.x; pz = spot.z; SHIP.sailing = true;
  const run = (bell) => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); if (bell) takeArtifact('drowned_bell');
    for (const o of OTHER.slice()) despawnOtherShip(o);
    const o = spawnOtherShip('pirate', spot.x + 450, spot.z, 'sea:test:bell:' + bell); o.yaw = 0; o.speed = 3; o.wp = { x: o.x, z: o.z - 400 };
    const y0 = o.yaw; for (let k = 0; k < 60; k++) tickOtherShips(1 / 60, performance.now());
    const want = Math.atan2(-(px - o.x), -(pz - o.z)); const turned = +(o.yaw - y0).toFixed(2);
    const out = { turned, want: +want.toFixed(2), dist: Math.round(Math.hypot(o.x - px, o.z - pz)) }; for (const s of OTHER.slice()) despawnOtherShip(s); return out; };
  const res = { atSea: atSea(), bare: run(false), bell: run(true) };
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); delete worldState.artifacts;
  SHIP.sailing = keepSail; px = x0; pz = z0; return res;
});
console.log(JSON.stringify(hunt));
check('the test stands you at sea on deep water', !hunt.none && hunt.atSea, hunt);
check(`bare, a black sail 450 off keeps her own course (turned ${hunt.bare && hunt.bare.turned})`, Math.abs(hunt.bare.turned) < .05, hunt.bare);
check(`with the Bell aboard she comes about for you (turned ${hunt.bell && hunt.bell.turned} toward ${hunt.bell && hunt.bell.want})`, Math.sign(hunt.bell.turned) === Math.sign(hunt.bell.want) && Math.abs(hunt.bell.turned) > .3, hunt.bell);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
