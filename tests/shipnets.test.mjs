// Session 638 — the boarding nets (Michael's B on #192, docs/design/the-ship-in-hand.md; his 6 Oct note: a netting on either
// side, E only when looking at it, not a board option always in range). A net hangs amidships on each side of every hull; E
// climbs it with the crosshair on it (within 5 of the eye) or while swimming against it, in 0.8 s, to the rail above. A black
// sail's or a merchantman's net boards her at her rail, and landing on her deck any other way boards her as you land.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  let sx = null, sz = null; for (let r = 300; r < 3000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40], [40, 40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  window._sea = { x: sx, z: sz }; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(sx, sz, 0.7);
  return { ok: sx !== null }; });
check('open sea, and your sloop on it', sea.ok, sea);

// stand the player in the water at a point in the hull's own frame, facing a point in that frame (or away from it)
const at = (mesh, lx, lz, look) => page.evaluate(([who, lx, lz, look]) => { const m = who === 'own' ? WORLD.ship.mesh : window._o.mesh;
  m.updateMatrixWorld(true); const p = new THREE.Vector3(lx, 0, lz).applyMatrix4(m.matrixWorld); px = p.x; pz = p.z; jumpY = SWIM_Y; velY = 0; pitch = 0;
  if (look) { const q = new THREE.Vector3(look[0], 0.6, look[1]).applyMatrix4(m.matrixWorld); yaw = Math.atan2(-(q.x - px), -(q.z - pz)); if (look[2]) yaw += Math.PI; } }, [mesh, lx, lz, look]);
const prompt = async () => { await g.frames(2); return page.evaluate(() => ({ p: shipPrompt(), swim: isSwimming(), side: shipNetSide(WORLD.ship.mesh, WORLD.ship.W) })); };

const W = await page.evaluate(() => WORLD.ship.W);
await at('own', W / 2 + .5, 0, [W / 2, 0]); const swimNet = await prompt();
await at('own', W / 2 + .5, 5, [W / 2, 5]); const swimBow = await prompt();
await at('own', -(W / 2 + 2.6), .4, [-W / 2, 0]); const lookNet = await prompt();
await at('own', -(W / 2 + 2.6), .4, [-W / 2, 0, true]); const lookAway = await prompt();
await at('own', W / 2 + 7, 0, [W / 2, 0]); const tooFar = await prompt();
console.log(JSON.stringify({ swimNet, swimBow, lookNet, lookAway, tooFar }));
check(`swimming against her net: "${swimNet.p}"`, swimNet.swim && swimNet.p === "Press 'E' to climb aboard the Test Gull", swimNet);
check('swimming at her side by the bow, looking at the hull there, nothing (the old 3.5 radius offered *board*)', swimBow.p === null, swimBow);
check(`2.6 off her other side, the crosshair on that net: "${lookNet.p}"`, lookNet.p === "Press 'E' to climb aboard the Test Gull" && lookNet.side === -1, lookNet);
check('the same spot looking away, nothing', lookAway.p === null, lookAway);
check('7 off, looking at the net, nothing (out of reach)', tooFar.p === null, tooFar);

// E: the climb, 0.8 s, to the rail above the net
await at('own', W / 2 + .5, 0, [W / 2, 0]); await g.frames(2);
await page.keyboard.press('e'); await g.frames(1);
const mid = await page.evaluate(() => { for (let i = 0; i < 24; i++) WORLD.tick(1 / 60, performance.now()); return { climbing: climbing(), y: +jumpY.toFixed(2), deck: +DECK_Y.toFixed(2) }; });
const top = await page.evaluate(() => { for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now()); const m = WORLD.ship.mesh; m.updateMatrixWorld(true);
  const l = new THREE.Vector3(px, SEA_Y, pz).applyMatrix4(new THREE.Matrix4().copy(m.matrixWorld).invert());
  return { climbing: climbing(), onDeck: onDeck(), lx: +l.x.toFixed(2), lz: +l.z.toFixed(2), y: +jumpY.toFixed(2), msg: document.getElementById('msg').textContent }; });
console.log('climb', JSON.stringify(mid), JSON.stringify(top));
check(`E starts the climb: at 0.4 s still on the net, ${mid.y} of the way to the deck's ${mid.deck}`, mid.climbing && mid.y > 0.3 && mid.y < mid.deck - .2, mid);
check(`at 0.9 s she is boarded at the rail above the net (${top.lx} across, ${top.lz} along), not at her stern`, !top.climbing && top.onDeck && Math.abs(top.lx - (W / 2 - .8)) < .15 && Math.abs(top.lz) < .2 && /You climb aboard/.test(top.msg), top);

// a black sail: her net boards her at her rail, and her crew turns
const bs = await page.evaluate(() => { const S = WORLD.ship; const o = WORLD.spawnOtherShip('pirate', _sea.x + 25, _sea.z + 25, 'sea:test:nets:pirate'); o.speed = 0; window._o = o; return { W: o.W, crew: o.crew.length }; });
await at('o', bs.W / 2 + .5, 0, [bs.W / 2, 0]); await g.frames(3);
const bsP = await page.evaluate(() => { const o = window._o; o.speed = 0; return shipPrompt(); });
await page.keyboard.press('e'); await g.frames(1);
const bsOn = await page.evaluate(() => { const o = window._o; for (let i = 0; i < 60; i++) { o.speed = 0; WORLD.tick(1 / 60, performance.now()); }
  o.mesh.updateMatrixWorld(true); const l = new THREE.Vector3(px, SEA_Y, pz).applyMatrix4(new THREE.Matrix4().copy(o.mesh.matrixWorld).invert());
  return { boarded: o.boarded, alert: o.crew.filter(e => !e.dead && e.alert).length, lx: +l.x.toFixed(2), lz: +l.z.toFixed(2), y: +jumpY.toFixed(2), chest: !!o.chest }; });
console.log('black sail', bsP, JSON.stringify(bsOn));
check(`at a black sail's net: "${bsP}"`, bsP === "Press 'E' to climb aboard a black-sailed ship", bsP);
check(`climbed, she is boarded at her rail (${bsOn.lx} across), her crew turns (${bsOn.alert}) and her chest is set`, bsOn.boarded && bsOn.alert >= 3 && Math.abs(bsOn.lx - (bs.W / 2 - .8)) < .2 && bsOn.chest, bsOn);

// a merchantman lying alongside: stepping onto her deck boards her as you land
const mer = await page.evaluate(() => { const o = WORLD.spawnOtherShip('merchant', _sea.x - 30, _sea.z - 30, 'sea:test:nets:merchant'); o.speed = 0; WORLD.tick(1 / 60, performance.now());
  const before = o.boarded; px = o.x; pz = o.z; jumpY = DECK_Y; velY = 0; o.speed = 0; WORLD.tick(1 / 60, performance.now());
  return { before, after: o.boarded, chest: !!o.chest, x: Math.abs(px - o.x) < .01 }; });
console.log('merchant', JSON.stringify(mer));
check('landing on a merchantman\'s deck boards her where you landed', !mer.before && mer.after && mer.chest && mer.x, mer);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
