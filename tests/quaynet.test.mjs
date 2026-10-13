// Session 756 (the critic, s585): a bought ship lay 4 beyond the quay's end and 2 out to its side, her near net 4.5 from the
// stone at its closest, and with the net's reach of 5 from the eye 6 of Portclare's 1,472 half-unit spots gave the prompt;
// from the middle of the quay's end E did nothing. She now lies alongside the quay's last stretch (`quayBerth`), her nets
// beside its end. Counted at four ports as the critic did, then boarded for real from the middle of Portclare's quay end.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('portclare');
const stop = g.keepAlive();
// the eye's height over the ground, read off the live camera
await page.evaluate(() => { const S = WORLD.siteAnywhere('portclare'); const pl = ZONES.world.platforms.find(p => p.site === S.id && !p.river && !p.shallow); px = (pl.x0 + pl.x1) / 2; pz = (pl.z0 + pl.z1) / 2; jumpY = pl.y; velY = 0; });
await g.frames(3);
const eye = await page.evaluate(() => CAM.position.y - jumpY);
const count = (id) => page.evaluate(([id, eye]) => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  if (WORLD.ship.mesh) { WORLD.ship.mesh.parent && WORLD.ship.mesh.parent.remove(WORLD.ship.mesh); WORLD.ship.mesh = null; }
  worldState.ship = null; gold = 5000; const site = WORLD.siteAnywhere(id); const said = WORLD.buyShip(site);
  const pl = ZONES.world.platforms.find(p => p.site === site.id && !p.river && !p.shallow); const m = WORLD.ship.mesh, W = WORLD.ship.W;
  m.updateMatrixWorld(true); const tp = thirdPerson; thirdPerson = false;
  const nets = [1, -1].map(sd => new THREE.Vector3(sd * (W / 2 + .05), 1.2, 0).applyMatrix4(m.matrixWorld));
  let n = 0, all = 0; const sd = WORLD.shoreDir ? WORLD.shoreDir(site) : shoreDir(site);
  const ex = sd.dx ? (sd.dx > 0 ? pl.x1 : pl.x0) : (pl.x0 + pl.x1) / 2, ez = sd.dz ? (sd.dz > 0 ? pl.z1 : pl.z0) : (pl.z0 + pl.z1) / 2;
  let endMid = 0;
  for (let x = pl.x0 + .25; x < pl.x1; x += .5) for (let z = pl.z0 + .25; z < pl.z1; z += .5) { all++;
    let hit = 0; for (const t of nets) { CAM.position.set(x, pl.y + eye, z); CAM.lookAt(t); if (shipNetSide(m, W)) { hit = 1; break; } } n += hit;
    if (Math.hypot(x - (ex - sd.dx * .75), z - (ez - sd.dz * .75)) < .4 && hit) endMid = 1; }
  thirdPerson = tp;
  return { id, said: said.slice(0, 40), spots: all, reach: n, endMid, off: +Math.min(...nets.map(t => Math.hypot(t.x - ex, t.z - ez))).toFixed(2) };
}, [id, eye]);
const res = [];
const ids = await page.evaluate(() => ['Portclare', 'Carrigshane', 'Inisowen', 'Inismore'].map(n => (WORLD.allPorts().find(p => p.name === n) || {}).id).filter(Boolean));
const hasQuay = id => page.evaluate(id => ZONES.world.platforms.some(p => p.site === id && !p.river && !p.shallow), id);
for (const id of ids) { if (!await hasQuay(id)) await g.settle(id); for (let k = 0; k < 20 && !await hasQuay(id); k++) await page.waitForTimeout(1500);
  if (!await hasQuay(id)) { res.push({ id, missing: true }); continue; } res.push(await count(id)); }
if (!await hasQuay(ids[0])) await g.settle(ids[0]);
console.log(JSON.stringify({ eye: +eye.toFixed(2), res }));
for (const r of res) check(`${r.id}: a bought ship's net answers from ${r.reach} of ${r.spots} half-unit spots on the quay (was 6 or 3), the middle of its end among them`, r.reach >= 60 && r.endMid === 1, r);

// for real at Portclare: stand at the middle of the quay's end, look down at her net, the prompt, E, aboard
const p = await page.evaluate(() => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  if (WORLD.ship.mesh) { WORLD.ship.mesh.parent && WORLD.ship.mesh.parent.remove(WORLD.ship.mesh); WORLD.ship.mesh = null; }
  worldState.ship = null; gold = 5000; const site = WORLD.siteAnywhere('portclare'); WORLD.buyShip(site); const sd = shoreDir(site);
  const pl = ZONES.world.platforms.find(p => p.site === site.id && !p.river && !p.shallow);
  const ex = sd.dx ? (sd.dx > 0 ? pl.x1 : pl.x0) : (pl.x0 + pl.x1) / 2, ez = sd.dz ? (sd.dz > 0 ? pl.z1 : pl.z0) : (pl.z0 + pl.z1) / 2;
  px = ex - sd.dx * .8; pz = ez - sd.dz * .8; jumpY = pl.y; velY = 0;
  const m = WORLD.ship.mesh, W = WORLD.ship.W; m.updateMatrixWorld(true);
  const nets = [1, -1].map(s => new THREE.Vector3(s * (W / 2 + .05), 1.0, 0).applyMatrix4(m.matrixWorld)); const t = nets.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  yaw = Math.atan2(-(t.x - px), -(t.z - pz)); pitch = Math.atan2(t.y - (jumpY + 1.6), Math.hypot(t.x - px, t.z - pz)); window._tgt = t;
  return { d: +Math.hypot(t.x - px, t.z - pz).toFixed(2) };
});
await g.frames(3);
const pr = await page.evaluate(() => ({ p: shipPrompt(), cam: [+CAM.position.x.toFixed(1), +CAM.position.y.toFixed(2), +CAM.position.z.toFixed(1)] }));
await page.keyboard.press('e'); await g.spin(null, 70);
const on = await page.evaluate(() => ({ deck: WORLD.onDeck ? WORLD.onDeck() : onDeck(), y: +jumpY.toFixed(2) }));
console.log(JSON.stringify({ p, pr, on }));
check(`from the middle of Portclare's quay end, ${p.d} from her net, looking at it: "${pr.p}"`, /^Press 'E' to climb aboard the /.test(pr.p || ''), pr);
check('E climbs her net and stands you on her deck', on.deck, on);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
