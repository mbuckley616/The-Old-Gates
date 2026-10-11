// The dead ride where they fell (Session 613; Michael's sailing playtest, 6 Oct 2026: "Killed pirates' bodies hover above
// the sea where the ship was when they died. Bodies should stay on the boat or roll off and ragdoll into the water,
// floating until later purged"). A hand killed on a black sail's deck sails and turns with her, body, search and glow
// alike; a boarder killed on your deck sails with yours; a body off the deck lies on the water where it fell; a black
// sail's dead go when she does, a floating body when you are 700 units from it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [90, 0], [-90, 0], [0, 90], [0, -90]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

// helpers in the page: where a body lies (its hips, or its mesh), and whether that is on a deck
await page.evaluate(() => {
  window._hips = e => { const h = e.limbs && e.limbs.person && e.limbs.person.B && e.limbs.person.B.hips; const v = new THREE.Vector3(); if (h) h.getWorldPosition(v); else e.mesh.getWorldPosition(v); return v; };
  window._lay = (e, plat) => { const v = _hips(e), c = ZONE_CORPSES.find(c => c.body === e.mesh);
    return { x: +v.x.toFixed(2), z: +v.z.toFixed(2), y: +v.y.toFixed(2), onDeck: !!plat && bodyOnDeck(plat, v.x, v.z), inScene: !!e.mesh.parent,
      corpse: !!c, corpseOff: c ? +Math.hypot(c.x - e.x, c.z - e.z).toFixed(2) : null, glowOff: c && c.gl ? +Math.hypot(c.gl.position.x - e.x, c.gl.position.z - e.z).toFixed(2) : null }; };
});

// 1. a black sail's hand killed on her deck, then she sails and turns for 20 s
const theirs = await page.evaluate(() => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0;
  WORLD.tick(1 / 60, performance.now());
  const o = WORLD.spawnOtherShip('pirate', S.x + 60, S.z); o.yaw = 0; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9; window._o = o;
  for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now());
  const e = o.crew[0]; killZoneEnemy(e, WORLD.scene); window._e = e;
  for (let i = 0; i < 300; i++) { o.volleyT = 1e9; o.ramWait = 1e9; S.x = _sea.x; S.z = _sea.z; S.speed = 0; PHP = maxHP; WORLD.tick(1 / 60, performance.now()); if (typeof tickRagdolls === 'function') tickRagdolls(1 / 60); }
  const at = _lay(e, o.plat), ship0 = { x: o.x, z: o.z, yaw: o.yaw };
  for (let i = 0; i < 60 * 20; i++) { for (const x of WORLD.others) if (x !== o) WORLD.despawnOtherShip(x); o.volleyT = 1e9; o.ramWait = 1e9; o.sated = true; S.x = _sea.x; S.z = _sea.z; S.speed = 0; PHP = maxHP;
    WORLD.tick(1 / 60, performance.now()); if (typeof tickRagdolls === 'function') tickRagdolls(1 / 60); }
  const moved = +Math.hypot(o.x - ship0.x, o.z - ship0.z).toFixed(1), turned = +Math.abs(Math.atan2(Math.sin(o.yaw - ship0.yaw), Math.cos(o.yaw - ship0.yaw))).toFixed(2);
  return { at, after: _lay(e, o.plat), moved, turned, fromWhereFell: +Math.hypot(_hips(e).x - at.x, _hips(e).z - at.z).toFixed(1) }; });
console.log('theirs', JSON.stringify(theirs));
check('the hand falls on her deck', theirs.at.onDeck && theirs.at.corpse, theirs.at);
check(`she sails ${theirs.moved} units and turns ${theirs.turned} rad, and the body is still on her deck at deck height, its search and glow with it`,
  theirs.moved > 40 && theirs.after.onDeck && Math.abs(theirs.after.y - 1) < .8 && theirs.after.corpseOff < .01 && theirs.after.glowOff < .01 && theirs.fromWhereFell > 30, theirs);

// 2. a body that goes over her side lies on the water where it fell, and stays there as she sails on
const over = await page.evaluate(() => { const o = _o, S = WORLD.ship, e = o.crew[1];
  for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now());
  killZoneEnemy(e, WORLD.scene); for (let i = 0; i < 300; i++) { o.sated = true; o.volleyT = 1e9; S.x = _sea.x; S.z = _sea.z; PHP = maxHP; WORLD.tick(1 / 60, performance.now()); if (typeof tickRagdolls === 'function') tickRagdolls(1 / 60); }
  // thrown clear: the body put 6 units off her beam, as a power blow over the rail would leave it
  const sx = Math.cos(o.yaw) * (o.W / 2 + 6), sz = -Math.sin(o.yaw) * (o.W / 2 + 6); moveBody(e, e.x + sx, e.z + sz, 0);
  for (let i = 0; i < 10; i++) WORLD.tick(1 / 60, performance.now());
  const at = _lay(e, o.plat), afloat = !!e._afloat && FLOATING.includes(e);
  for (let i = 0; i < 60 * 10; i++) { o.sated = true; o.volleyT = 1e9; S.x = _sea.x; S.z = _sea.z; PHP = maxHP; WORLD.tick(1 / 60, performance.now()); }
  const after = _lay(e, o.plat);
  return { at, afloat, after, drift: +Math.hypot(after.x - at.x, after.z - at.z).toFixed(2), shipFrom: +Math.hypot(o.x - after.x, o.z - after.z).toFixed(1) }; });
console.log('over', JSON.stringify(over));
check('a body off her side is afloat: on the water (hips within 0.4 of the surface), off her deck', over.afloat && !over.at.onDeck && Math.abs(over.at.y) < .4, over);
check(`she sails on and the body stays where it fell (moved ${over.drift}, she is ${over.shipFrom} off)`, over.drift < .01 && Math.abs(over.after.y) < .4 && over.shipFrom > 20, over);

// 3. a sail that goes takes her dead with her; the floating body stays until you are 700 units from it
const gone = await page.evaluate(() => { const o = _o, a = o.crew[0], b = o.crew[1];
  WORLD.despawnOtherShip(o);
  const out = { deckBody: { inScene: !!a.mesh.parent, corpse: ZONE_CORPSES.some(c => c.body === a.mesh), enemy: ZONES.world.enemies.includes(a) }, floater: { inScene: !!b.mesh.parent, corpse: ZONE_CORPSES.some(c => c.body === b.mesh) } };
  const S = WORLD.ship; S.sailing = false; const p0 = { x: px, z: pz }; px = b.x + 720; pz = b.z; jumpY = WORLD.SEA_Y - .35; WORLD.tick(1 / 60, performance.now());
  out.far = { inScene: !!b.mesh.parent, corpse: ZONE_CORPSES.some(c => c.body === b.mesh), floating: FLOATING.includes(b) }; px = p0.x; pz = p0.z; S.sailing = true; return out; });
console.log('gone', JSON.stringify(gone));
check('her dead go with her: the body on her deck leaves the scene, the searches and the foes', !gone.deckBody.inScene && !gone.deckBody.corpse && !gone.deckBody.enemy, gone);
check('the floating body stays after she goes, and goes when you are 720 units off', gone.floater.inScene && gone.floater.corpse && !gone.far.inScene && !gone.far.corpse && !gone.far.floating, gone);

// 4. boarders on your deck: one killed there sails and turns with your ship (W held 20 s, A the first 4)
const mine = await page.evaluate(() => { const S = WORLD.ship; worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); S.sailing = true; S.speed = 0;
  WORLD.tick(1 / 60, performance.now());
  const o = WORLD.spawnOtherShip('pirate', S.x + 12, S.z); o.yaw = Math.PI; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9; o.closeT = 20;
  for (let i = 0; i < 5 && !WORLD.boarders.length; i++) { o.x = S.x + 12; o.z = S.z; o.speed = 0; WORLD.tick(1 / 60, performance.now()); }
  const e = WORLD.boarders[0]; if (!e) return { boarders: 0 };
  killZoneEnemy(e, WORLD.scene); for (const b of WORLD.boarders) if (!b.dead) killZoneEnemy(b, WORLD.scene);
  WORLD.despawnOtherShip(o);
  for (let i = 0; i < 300; i++) { S.speed = 0; PHP = maxHP; WORLD.tick(1 / 60, performance.now()); if (typeof tickRagdolls === 'function') tickRagdolls(1 / 60); }
  const at = _lay(e, S.plat), s0 = { x: S.x, z: S.z, yaw: S.yaw };
  HELD_KEYS.KeyW = true; HELD_KEYS.KeyA = true;
  try { for (let i = 0; i < 60 * 20; i++) { if (i === 60 * 4) HELD_KEYS.KeyA = false; for (const x of [...WORLD.others]) WORLD.despawnOtherShip(x); PHP = maxHP; WORLD.tick(1 / 60, performance.now()); if (typeof tickRagdolls === 'function') tickRagdolls(1 / 60); } }
  finally { HELD_KEYS.KeyW = false; HELD_KEYS.KeyA = false; }
  return { boarders: 1, at, after: _lay(e, S.plat), moved: +Math.hypot(S.x - s0.x, S.z - s0.z).toFixed(1), turned: +Math.abs(Math.atan2(Math.sin(S.yaw - s0.yaw), Math.cos(S.yaw - s0.yaw))).toFixed(2), inDeckDead: DECK_DEAD.includes(e) }; });
console.log('mine', JSON.stringify(mine));
check('pirates came over your rail', mine.boarders === 1, mine);
check(`a boarder killed on your deck lies there as you sail ${mine.moved} units and turn ${mine.turned} rad`, mine.at && mine.at.onDeck && mine.moved > 30 && mine.after.onDeck && Math.abs(mine.after.y - 1) < .8 && mine.after.corpseOff < .01 && mine.inDeckDead, mine);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop(); await g.close();
