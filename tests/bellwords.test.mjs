// The Drowned Bell's two once-only lines (Session 794; the approved draft *The Makers' Things*, second run): the first storm
// she rides with the bell aboard, and the first black sail that turns for you while it is on you. Driven through tickSeaWear
// and the black sails' own tick, as `drownedbell` drives them.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._said = []; const sm = showMsg; showMsg = (t, c) => { window._said.push(t); return sm(t, c); }; });
const storm = await page.evaluate(() => {
  const keepShip = worldState.ship, keepSea = SHIP.sea, keepSpeed = SHIP.speed, keepWx = WX.type;
  const run = (bell, wx) => { window._said.length = 0; if (bell === 'fresh') { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); takeArtifact('drowned_bell'); }
    if (!bell) { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); }
    WX.type = wx; worldState.ship = { cls: 'sloop', hull: 100, rig: 100, name: 'Test' }; SHIP._wh = 0; SHIP._wr = 0; SHIP.sea = 3; SHIP.speed = 5;
    for (let k = 0; k < 600; k++) tickSeaWear(1 / 60, 1); return window._said.slice(); };
  const out = { bare: run(false, 'storm'), rainBell: run('fresh', 'rain'), first: run('keep', 'storm'), second: run('keep', 'storm'), seen: worldState.artifacts.drowned_bell.stormSeen != null };
  WX.type = keepWx; worldState.ship = keepShip; SHIP.sea = keepSea; SHIP.speed = keepSpeed; delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  return out; });
console.log(JSON.stringify(storm));
check('bare in a storm, nothing is said; with the bell in a rough sea under rain, nothing', storm.bare.length === 0 && storm.rainBell.length === 0, storm);
check(`the first storm with the bell aboard: *${storm.first[0]}*; the next, nothing`, storm.first.length === 1 && storm.first[0] === 'The sea is running high, and she rides it as if she had been told to.' && storm.second.length === 0 && storm.seen, storm);
const sail = await page.evaluate(() => {
  let spot = null; const H = (x, z) => worldH(x, z);
  outer: for (let r = 0; r < 9000; r += 150) for (let a = 0; a < 24; a++) { const x = px + Math.cos(a / 24 * Math.PI * 2) * r, z = pz + Math.sin(a / 24 * Math.PI * 2) * r;
    let ok = true; for (const [dx, dz] of [[0, 0], [450, 0], [450, -150], [0, -150]]) if (!(H(x + dx, z + dz) < -4.5)) { ok = false; break; } if (ok) { spot = { x, z }; break outer; } }
  if (!spot) return { none: true };
  const x0 = px, z0 = pz, keepSail = SHIP.sailing; px = spot.x; pz = spot.z; SHIP.sailing = true;
  const run = (bell, fresh, tag) => { window._said.length = 0; const n0 = GAME_LOG.length;
    if (fresh) { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); if (bell) takeArtifact('drowned_bell'); }
    for (const o of OTHER.slice()) despawnOtherShip(o);
    const o = spawnOtherShip('pirate', spot.x + 450, spot.z, 'sea:test:bellwords:' + tag); o.yaw = 0; o.speed = 3; o.wp = { x: o.x, z: o.z - 400 };
    for (let k = 0; k < 60; k++) tickOtherShips(1 / 60, performance.now()); for (const s of OTHER.slice()) despawnOtherShip(s);
    return { said: window._said.filter(t => /bell/.test(t)), log: GAME_LOG.slice(n0).map(e => e.text).filter(t => /bell/.test(t)) }; };
  const res = { bare: run(false, true, 'a'), first: run(true, true, 'b'), second: run(true, false, 'c') }; res.seen = worldState.artifacts.drowned_bell.blackSailSeen != null;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); delete worldState.artifacts; SHIP.sailing = keepSail; px = x0; pz = z0; return res; });
console.log(JSON.stringify(sail));
const L = 'The bell in your pack rings once, with no sea running. Off the east quarter, a black sail has put about.';
check('the test stands you at sea on deep water; bare, a black sail 450 off rings nothing', !sail.none && sail.bare.said.length === 0, sail);
check(`the first black sail that turns for you with the bell aboard, 450 to the east: *${sail.first.said[0]}*, on screen and in the log`, sail.first.said[0] === L && sail.first.log[0] === L && sail.seen, sail.first);
check('the next one rings nothing', sail.second.said.length === 0 && sail.second.log.length === 0, sail.second);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
