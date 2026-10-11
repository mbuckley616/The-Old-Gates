// Indoors a person sees what they face (Session 368, Michael's B on #73): a keeper or a guest in the room sees you within
// six units, with a clear line, and within 60° either side of the way they look, (sin ry, cos ry). Behind them, or off
// to the side past the cone, you are not seen. A theft done while the keeper looks away goes unfined.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /misc/.test(x.type) && x.keeper) || S.houses.find(x => /weapon|armor|potion/.test(x.type) && x.keeper);
  window._h = h; window._S = S; worldState.crime = {}; px = h.doorX; pz = h.doorZ + .3; jumpY = 0; goToInterior(h); });
await page.waitForFunction(() => !!WORLD.intBox && typeof intNPCMesh !== 'undefined' && !!intNPCMesh, null, { timeout: 60000, polling: 250 });
await g.hide();

// the keeper held still; the sweep turns the keeper, not you
const sweep = await page.evaluate(() => { const h = window._h, K = intNPCMesh; const am = K.userData.amble; if (am) am.paused = true; jumpY = 0;
  const kx = K.position.x, kz = K.position.z; window._kx = kx; window._kz = kz;
  // a spot 2.5 units off with a clear line
  let sx = null, sz = null; for (let a = 0; a < 16 && sx == null; a++) { const x = kx + Math.sin(a / 16 * Math.PI * 2) * 2.5, z = kz + Math.cos(a / 16 * Math.PI * 2) * 2.5; if (WORLD.intSightLine(kx, kz, x, z) && !intSolidAt(x, z, .3, 0)) { sx = x; sz = z; } }
  if (sx == null) return { none: true };
  px = sx; pz = sz; const toMe = Math.atan2(px - kx, pz - kz); const rows = [];
  for (let d = -180; d < 180; d += 5) { K.rotation.y = toMe + d * Math.PI / 180; rows.push({ off: d, seen: !!WORLD.witnessOf(h) }); }
  K.rotation.y = toMe; const near = !!WORLD.witnessOf(h); K.rotation.y = toMe + Math.PI; const behind = !!WORLD.witnessOf(h);
  // seven units off, in front: past the six units, unseen as before
  px = kx + Math.sin(toMe) * 7; pz = kz + Math.cos(toMe) * 7; K.rotation.y = toMe; const far = !!WORLD.witnessOf(h);
  return { rows, near, behind, far, dist: 2.5 }; });
const inCone = sweep.rows && sweep.rows.filter(r => Math.abs(r.off) <= 55), outCone = sweep.rows && sweep.rows.filter(r => Math.abs(r.off) >= 65);
console.log('seen at offsets', sweep.rows && sweep.rows.filter(r => r.seen).map(r => r.off).join(' '));
check('a spot with a clear line to the keeper was found', !sweep.none, sweep);
check('facing within 55° of you, the keeper sees you', inCone.every(r => r.seen), inCone.filter(r => !r.seen));
check('turned 65° or more away, the keeper does not', outCone.every(r => !r.seen), outCone.filter(r => r.seen));
check('face on they see you, back turned they do not; past six units in front, still not', sweep.near && !sweep.behind && !sweep.far, sweep);

// the theft itself: taken with the keeper's back turned, no fine; turned to you, the fine
const theft = await page.evaluate(() => { const X = WORLD.intBox, K = intNPCMesh, site = window._S.site; px = X.x; pz = X.z + .8; jumpY = 0; lookAtPt(X.x, .3, X.z);
  K.position.x = px + 1.5; K.position.z = pz; K.rotation.y = Math.atan2(K.position.x - px, K.position.z - pz);
  const b0 = WORLD.bountyAt(site); const gold0 = gold; X.open = true; WORLD.boxInteract(); const away = { took: gold - gold0, fined: WORLD.bountyAt(site) - b0 };
  // the box refills for the second go
  delete worldState.boxes[X.id];
  K.rotation.y = Math.atan2(px - K.position.x, pz - K.position.z); const b1 = WORLD.bountyAt(site), g1 = gold; X.open = true; WORLD.boxInteract();
  return { away, facing: { took: gold - g1, fined: WORLD.bountyAt(site) - b1 } }; });
check('the strongbox emptied behind the keeper\'s back is not fined', theft.away.took > 0 && theft.away.fined === 0, theft);
check('emptied again with the keeper turned to you, it is', theft.facing.took > 0 && theft.facing.fined > 0, theft);

// a guest in a room sees what they face too (the coaching inn's travellers are `INT_NPCS`): one stood in this shop
const gst = await page.evaluate(() => { const K = intNPCMesh; K.position.set(-99, 0, -99); const G = new THREE.Group(); const kx = window._kx, kz = window._kz;
  G.position.set(kx, 0, kz); const n = { g: G, def: { name: 'A traveller' }, wa: 0, wt: 99, walk: false, box: { x0: 0, x1: 0, z0: 0, z1: 0 } }; WORLD.intNpcs.push(n);
  jumpY = 0; let spot = null; for (let a = 0; a < 16 && !spot; a++) { const x = kx + Math.sin(a / 16 * Math.PI * 2) * 2, z = kz + Math.cos(a / 16 * Math.PI * 2) * 2; if (WORLD.intSightLine(kx, kz, x, z) && !intSolidAt(x, z, .3, 0)) spot = [x, z]; }
  if (!spot) { WORLD.intNpcs.pop(); return { none: true }; } [px, pz] = spot; const toMe = Math.atan2(px - kx, pz - kz);
  G.rotation.y = toMe; const facing = WORLD.witnessOf(window._h); G.rotation.y = toMe + Math.PI; const away = WORLD.witnessOf(window._h);
  G.rotation.y = toMe + 70 * Math.PI / 180; const side = WORLD.witnessOf(window._h); WORLD.intNpcs.pop();
  return { facing: facing && facing.name, away: away && away.name, side: side && side.name }; });
check('a guest facing you sees you; with their back turned, or 70° off, not', !gst.none && gst.facing === 'A traveller' && !gst.away && !gst.side, gst);
console.log(JSON.stringify({ gst }));
// the keeper's walk turns back from a bound: the x part of the heading at an x bound, the z part at a z bound (they were swapped)
const bounce = await page.evaluate(() => { const K = intNPCMesh, am = K.userData.amble || (K.userData.amble = { wa: 0, wt: 9, minX: .8, maxX: 6, minZ: .6, maxZ: 4, speed: .25 }); am.paused = false;
  K.position.set(am.maxX - .001, 0, (am.minZ + am.maxZ) / 2); am.wa = Math.PI / 2 - .3; am.wt = 9; intAmbleStep(K, 1 / 60); const x = { sin: +Math.sin(am.wa).toFixed(3), cos: +Math.cos(am.wa).toFixed(3) };
  K.position.set((am.minX + am.maxX) / 2, 0, am.maxZ - .001); am.wa = .3; am.wt = 9; intAmbleStep(K, 1 / 60); const z = { sin: +Math.sin(am.wa).toFixed(3), cos: +Math.cos(am.wa).toFixed(3) };
  return { x, z }; });
check('at an x bound the keeper turns back in x and keeps its z; at a z bound, the other way', bounce.x.sin < 0 && bounce.x.cos > 0 && bounce.z.cos < 0 && bounce.z.sin > 0, bounce);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
