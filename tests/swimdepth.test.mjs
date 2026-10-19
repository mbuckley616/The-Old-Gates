// F2b, the water (Session 1084; docs/design/scale-numbers-build.md, *Water*). At true scale you swim where the water is over
// 1.40 m deep, chest-deep on a 1.8 m body, with the feet 1.45 under the surface (SWIM_Y) and the eye 0.20 over it; shallower
// water is waded on the bed. A diver clears the bed by 0.90 and never rises above the swimmer's line. Walked down a shelving
// shore through the game's own loop at fixed steps, the draw held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => {
    const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t;
    try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
    return n; };
});

// a shore near the start: a ray that runs from dry land (0.5 up) down to 3 m of water within 150 m, falling all the way
const shore = await page.evaluate(() => {
  const H = (x, z) => WORLD.worldH(x, z);
  for (let r = 0; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .2) {
    const x0 = px + Math.cos(a) * r, z0 = pz + Math.sin(a) * r; if (H(x0, z0) < .5) continue;
    for (let b = 0; b < 6.28; b += .26) { const dx = Math.cos(b), dz = Math.sin(b); let prev = H(x0, z0), ok = true, d = 0;
      for (d = 1; d <= 150; d++) { const h = H(x0 + dx * d, z0 + dz * d); if (h > prev + .02) { ok = false; break; } prev = h; if (h < -3) break; }
      if (ok && prev < -3) return { x0, z0, dx, dz, len: d }; } }
  return null; });
check('a shelving shore to walk into', !!shore, shore);

const consts = await page.evaluate(() => ({ SEA_Y, SWIM_Y, SWIM_DEPTH, eye: SCALE.EYE_SWIM }));
check('the swimmer’s feet hang 1.45 under the sea, and the swim begins at 1.40', Math.abs(consts.SEA_Y - consts.SWIM_Y - 1.45) < 1e-6 && consts.SWIM_DEPTH === 1.4, consts);

// walk in at a slow walk, sneaking off; read the depth under you on the tick isSwimming turns true, and the eye then
const walk = await page.evaluate((s) => {
  for (const k in K) K[k] = false; px = s.x0; pz = s.z0; jumpY = WORLD.worldH(px, pz); velY = 0; onGround = true; ROLL = null;
  yaw = Math.atan2(-s.dx, -s.dz); pitch = 0; let first = null, wade = null, maxWadeDepth = 0, wadeUnder = false;
  _drive(() => { K['KeyW'] = true; const depth = -WORLD.worldH(px, pz), sw = WORLD.isSwimming();
    if (!sw && depth > .9 && depth < 1.3 && !wade) wade = { depth: +depth.toFixed(3), feet: +(jumpY + depth).toFixed(3), eye: +(CAM.position.y - SEA_Y).toFixed(3) };
    if (!sw && depth > maxWadeDepth) maxWadeDepth = depth; if (!sw && depth > .3 && cameraUnderwater()) wadeUnder = true;
    if (sw && !first) first = { depth: +depth.toFixed(3) }; return !!first; }, 60 * 60);
  for (const k in K) K[k] = false;
  _drive(() => false, 90);
  const depth = -WORLD.worldH(px, pz);
  return { first, wade, maxWadeDepth: +maxWadeDepth.toFixed(3), wadeUnder, swim: WORLD.isSwimming(), depth: +depth.toFixed(3),
    feet: +(jumpY - SEA_Y).toFixed(3), eye: +(CAM.position.y - SEA_Y).toFixed(3), under: cameraUnderwater() }; }, shore);
console.log(JSON.stringify(walk));
check('in water about a metre deep you wade on the bed (the follow’s lag on the slope under 0.1), the eye over the water', walk.wade && Math.abs(walk.wade.feet) < .1 && walk.wade.eye > .3 && !walk.wadeUnder, walk.wade);
check('the swim begins at 1.40 ±0.05 deep', walk.first && Math.abs(walk.first.depth - 1.4) <= .05, walk.first);
check('the swimmer’s eye rides 0.20 ±0.05 over the water, the camera dry', walk.swim && Math.abs(walk.eye - .2) <= .05 && !walk.under, walk);

// out where it is deeper (4 m and more), dive: look down and hold W (the world's own key map, HELD_KEYS); the eye goes under, the bed is kept at 0.90
const dive = await page.evaluate((s) => {
  let d = 0; for (d = s.len; d < s.len + 200; d++) if (WORLD.worldH(s.x0 + s.dx * d, s.z0 + s.dz * d) < -4) break;
  px = s.x0 + s.dx * d; pz = s.z0 + s.dz * d; jumpY = SWIM_Y; velY = 0; onGround = false; yaw = Math.atan2(-s.dx, -s.dz); pitch = 0;
  _drive(() => false, 30);
  const atTop = { swim: WORLD.isSwimming(), feet: +(jumpY - SEA_Y).toFixed(3) };
  pitch = -.8; let low = 9, under = false, camUnder = false, highest = -9;
  _drive(() => { K['KeyW'] = true; HELD_KEYS.KeyW = true; low = Math.min(low, jumpY - WORLD.worldH(px, pz)); highest = Math.max(highest, jumpY); under = under || WORLD.dive.under; camUnder = camUnder || cameraUnderwater(); return false; }, 240);
  for (const k in K) K[k] = false; HELD_KEYS.KeyW = false; pitch = 0;
  _drive(() => { highest = Math.max(highest, jumpY); return false; }, 600);
  return { atTop, bed: +WORLD.worldH(px, pz).toFixed(2), clear: +low.toFixed(3), under, camUnder, highest: +(highest - SWIM_Y).toFixed(3),
    back: +(jumpY - SWIM_Y).toFixed(3), swim: WORLD.isSwimming(), eye: +(CAM.position.y - SEA_Y).toFixed(3) }; }, shore);
console.log(JSON.stringify(dive));
check('swimming at the line in deep water', dive.atTop.swim && Math.abs(dive.atTop.feet + 1.45) < .02, dive.atTop);
check('a dive goes under, and the camera with it', dive.under && dive.camUnder, dive);
check('the diver keeps 0.90 off the bed', dive.clear >= .9 - .01, dive);
check('let go, the diver drifts back up to the line and no higher, still swimming', dive.highest <= .001 && Math.abs(dive.back) < .02 && dive.swim && Math.abs(dive.eye - .2) <= .05, dive);

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
