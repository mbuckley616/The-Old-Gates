// The wheel and the hatch answer to the crosshair (Session 614; Michael's sailing playtest, 6 Oct 2026: "targeting to
// pilot the ship / go below deck is area-based, not mesh-based: he often starts piloting the ship when he does not mean
// to"). Within reach, the eye's ray must meet the wheel's box or the hatch's square; standing by them looking elsewhere,
// E neither takes the wheel nor goes below, by the ship's own E or the town doors' generic one.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

// stand at (x,z) on her deck with the eye looking at a world point (or along a bearing), and ask the ship what E would do
const look = (where) => page.evaluate((where) => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  if (!WORLD.ship.mesh) { worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0.7); }
  const S = WORLD.ship; S.sailing = false; S.speed = 0; WORLD.tick(1 / 60, performance.now());
  const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), wheel = S.mesh.userData.wheel.getWorldPosition(new THREE.Vector3());
  const hatch = { x: S.x + fx * (S.L / 2 - 3.2), z: S.z + fz * (S.L / 2 - 3.2) };
  const at = where.at === 'helm' ? S.helm : where.at === 'hatch' ? hatch : where.at === 'nearHatch' ? { x: hatch.x - fx * 1.6, z: hatch.z - fz * 1.6 } : { x: S.helm.x - fx * where.back, z: S.helm.z - fz * where.back };
  px = at.x; pz = at.z; jumpY = 1.0; onGround = true;
  const eye = new THREE.Vector3(px, jumpY + 1.6, pz); CAM.position.copy(eye);
  const tgt = where.look === 'wheel' ? wheel : where.look === 'hatch' ? new THREE.Vector3(hatch.x, 1.05, hatch.z) : where.look === 'astern' ? eye.clone().add(new THREE.Vector3(-fx, -.3, -fz)) : eye.clone().add(new THREE.Vector3(-fz, 0, fx));
  CAM.lookAt(tgt); CAM.updateMatrixWorld(true);
  const prompt = WORLD.shipPrompt(), d = +Math.hypot(px - S.wheel.x, pz - S.wheel.z).toFixed(2), dh = +Math.hypot(px - hatch.x, pz - hatch.z).toFixed(2);
  // going below fades first, so the door's call is caught rather than waited for
  let took = null, below = null; const G = goToInterior; let went = null; goToInterior = h => { went = h; };
  try { if (where.press === 'ship') WORLD.shipInteract(); if (where.press === 'interact') interact(); } finally { goToInterior = G; }
  if (where.press) { took = S.sailing; below = !!went && went.type === 'cabin'; }
  if (S.sailing) { S.sailing = false; S.speed = 0; }
  return { prompt, d, dh, took, below }; }, where);

const r1 = await look({ at: 'helm', look: 'wheel', press: 'ship' });
const r2 = await look({ at: 'helm', look: 'astern', press: 'ship' });
const r3 = await look({ at: 'helm', look: 'side', press: 'ship' });
const r4 = await look({ back: -3.8, look: 'wheel', press: 'ship' }); // on her deck, forward of the wheel
console.log(JSON.stringify({ r1, r2, r3, r4 }));
check(`at the helm (${r1.d} from the wheel) looking at the wheel: the prompt, and E takes the wheel`, /pilot the/.test(r1.prompt || '') && r1.took === true, r1);
check('at the helm looking astern: no prompt, and E does not take the wheel', !/pilot/.test(r2.prompt || '') && r2.took === false, r2);
check('at the helm looking over the side: no prompt, E does nothing', !/pilot/.test(r3.prompt || '') && r3.took === false, r3);
check(`on her deck looking at the wheel from ${r4.d} units (beyond 2.4): no prompt, E does nothing`, !/pilot/.test(r4.prompt || '') && r4.took === false && r4.d > 2.4, r4);

const h1 = await look({ at: 'nearHatch', look: 'hatch', press: 'ship' });
const h2 = await look({ at: 'hatch', look: 'side', press: 'ship' });
const h3 = await look({ at: 'hatch', look: 'side', press: 'interact' });
const h4 = await look({ at: 'hatch', look: 'astern', press: 'interact' });
const h5 = await look({ at: 'nearHatch', look: 'hatch', press: 'interact' });
console.log(JSON.stringify({ h1, h2, h3, h4, h5 }));
check(`${h1.dh} from the hatch looking at it: "go below", and E goes below`, /go below/.test(h1.prompt || '') && h1.below === true, h1);
check('standing on the hatch looking over the side: no prompt, the ship\'s E does not go below', !/go below/.test(h2.prompt || '') && h2.below === false, h2);
check('standing on the hatch looking away: the generic door E (interact) does not go below either', h3.below === false && h4.below === false, { h3, h4 });
check('looking at the hatch, the generic E goes below', h5.below === true, h5);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop(); await g.close();
