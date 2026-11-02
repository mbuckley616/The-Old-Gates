// The peaceful animals (Session 1707; Michael's A on #984): each loaded chunk within 150 m of you rolls once, by its id, one group or none by
// its biome (deer in woods and fields, a hare or a fox in grass and heath, a badger at night, an otter by a river), never on a pad or a road.
// Walked across the country: groups are found, each off the roads and pads, and the same group stands again when its chunks are rolled
// again. A deer that sees you runs about 40 m; one you creep up behind grazes on. One blow kills a deer, its body gives 2 to 4 meat and no
// other loot, and its herd bolts; a grazing animal does not stop you passing time; walked away from, the animals go.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const walk = await page.evaluate(() => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const at = [px, pz], kinds = {}, biomes = {}; let groups = 0, herd = null;
  for (let k = 0; k < 40 && !(herd && groups >= 6); k++) { const x = at[0] + 300 + k * 260, z = at[1] - 200 + (k % 5) * 180;
    if (WORLD.worldH(x, z) < 2) continue; px = x; pz = z; stream(px, pz, true); _wildT = 0; tickWildSpawn(.1);
    for (const ch of WILD_CH) { if (!ch.wild || !ch.wild.length || ch._seen) continue; ch._seen = true; groups++;
      const b = lairBiome({ x: ch.cx * CHUNK + 32, z: ch.cz * CHUNK + 32 }); biomes[b] = (biomes[b] || 0) + 1;
      for (const e of ch.wild) kinds[e.name] = (kinds[e.name] || 0) + 1;
      if (!herd && ch.wild.length >= 2 && ch.wild[0].name === 'Deer') herd = [px, pz]; } }
  if (herd) { px = herd[0]; pz = herd[1]; stream(px, pz, true); _wildT = 0; tickWildSpawn(.1); }
  return { groups, kinds, biomes, herd: !!herd }; });
console.log('  walked:', JSON.stringify(walk));
check(`groups stand in the country by their biome (${walk.groups} groups: ${JSON.stringify(walk.kinds)})`, walk.groups >= 3 && walk.herd, walk);

const rules = await page.evaluate(() => { const W = () => ZONES.world.enemies.filter(e => e.wild && !e.dead);
  const bad = W().filter(e => { const ri = roadInfo(e.x, e.z); return (ri && ri.d < 7.9) || wildPadNear(e.x, e.z, 0); }).map(e => e.name + ' ' + e.id);
  const sig = () => W().map(e => e.id + '|' + e.name + '|' + e.x.toFixed(2) + ',' + e.z.toFixed(2)).sort().join();
  const before = sig(), n = W().length; for (const ch of [...WILD_CH]) wildDrop(ch); const gone = W().length; _wildT = 0; tickWildSpawn(.1);
  return { n, bad, gone, same: before === sig(), noFoe: W().every(e => !e.alert && e.hp === 1 && e.limbs.wolf) }; });
check(`none on a road or a pad (${rules.n} animals), the same group again by its chunk's id, each a one-blow animal on its own body`, rules.n > 0 && !rules.bad.length && rules.gone === 0 && rules.same && rules.noFoe, rules);

const flee = await page.evaluate(() => { const W = ZONES.world.enemies.filter(e => e.wild && !e.dead), e = W.find(o => o.name === 'Deer');
  for (const o of W) o._duelHold = o !== e; e._w = { mode: 'graze', t: 99 };
  px = e.x + Math.sin(e.combatYaw) * 15; pz = e.z + Math.cos(e.combatYaw) * 15; const x0 = e.x, z0 = e.z; let i = 0;
  for (; i < 600; i++) { tickZoneEnemies(1 / 60, 0, WORLD.scene); if (i > 30 && e._w.mode !== 'flee') break; }
  const out = { ran: +Math.hypot(e.x - x0, e.z - z0).toFixed(1), from: +Math.hypot(e.x - px, e.z - pz).toFixed(1), secs: +(i / 60).toFixed(2) };
  const o = W.find(q => q !== e && q.name === 'Deer') || W.find(q => q !== e); for (const q of W) q._duelHold = q !== o; o._w = { mode: 'graze', t: 99 };
  px = o.x - Math.sin(o.combatYaw) * 15; pz = o.z - Math.cos(o.combatYaw) * 15; _sneaking = true;
  for (let k = 0; k < 120; k++) tickZoneEnemies(1 / 60, 0, WORLD.scene); out.crept = o._w.mode; _sneaking = false; for (const q of W) q._duelHold = false;
  return out; });
check(`a deer that sees you at 15 m runs (${flee.ran} m in ${flee.secs} s, ${flee.from} m from you); crept up on from behind, it grazes on (${flee.crept})`,
  flee.ran > 30 && flee.from > 40 && flee.crept !== 'flee', flee);

const hunt = await page.evaluate(() => { forceTime(12); PHP = maxHP; dead = false; stamina = maxStamina; atkCd = 0;
  const W = ZONES.world.enemies.filter(e => e.wild && !e.dead), ch = [...WILD_CH].find(c => c.wild && c.wild.filter(o => !o.dead && o.name === 'Deer').length >= 2);
  const e = ch.wild.find(o => !o.dead); for (const o of W) { o._w = { mode: 'graze', t: 99 }; o._duelHold = o === e; }
  const mates = ch.wild.filter(o => o !== e && !o.dead); for (const o of mates) { o.x = e.x + (o.x - e.x) * .2; o.z = e.z + (o.z - e.z) * .2; }
  px = e.x; pz = e.z + 1.2; const others = ZE.filter(o => !o.dead && !o.locked && !o.wild && Math.hypot(px - o.x, pz - o.z) < 20); for (const o of others) o.locked = true;
  const wait = _canWait(); for (const o of others) o.locked = false; wait.heldAside = others.map(o => o.name); /* a foe that wandered by is held aside: the check is the herd's */ const c0 = ZONE_CORPSES.length; let swings = 0;
  const frames = _drive(() => { if (e.dead) return true; yaw = Math.atan2(-(e.x - px), -(e.z - pz)); stamina = maxStamina;
    if (atkCd <= 0 && !_pendingStrike && swings < 4) { attack(false); swings++; } }, 240);
  e._duelHold = false; const c = ZONE_CORPSES.slice(c0).find(k => k.name === e.name || k.body === e.mesh) || ZONE_CORPSES[ZONE_CORPSES.length - 1];
  return { dead: !!e.dead, swings, frames, items: c ? c.items.map(i => i.name + '×' + (i.qty || 1)) : null, meat: c ? c.items.filter(i => i.food === 'meat').reduce((a, i) => a + (i.qty || 1), 0) : 0,
    other: c ? c.items.filter(i => i.food !== 'meat').length : -1, mates: mates.length, bolted: mates.filter(o => o._w && o._w.mode === 'flee').length, wait, taken: WILD_TAKEN.get(e._wildKey) === lootDay() }; });
check(`one blow kills a deer (${hunt.swings} swing), its body ${JSON.stringify(hunt.items)}: 2 to 4 meat and nothing else, taken for the day`,
  hunt.dead && hunt.swings === 1 && hunt.meat >= 2 && hunt.meat <= 4 && hunt.other === 0 && hunt.taken, hunt);
check(`its herd bolts (${hunt.bolted} of ${hunt.mates}); a grazing herd beside you did not stop you passing time`, hunt.mates > 0 && hunt.bolted === hunt.mates && hunt.wait && hunt.wait.ok, hunt);

const away = await page.evaluate(() => { const n0 = ZONES.world.enemies.filter(e => e.wild && !e.dead).length; px += 1500; stream(px, pz, true); _wildT = 0; tickWildSpawn(.1);
  const left = [...WILD_CH].filter(ch => ch.wild && ch.wild.some(e => !e.dead && Math.hypot(e.x - px, e.z - pz) > 300)).length;
  return { n0, left, inScene: ZONES.world.enemies.filter(e => e.wild && !e.dead && Math.hypot(e.x - px, e.z - pz) > 300).length }; });
check(`walked 1.5 km away, the animals behind go (${away.n0} → ${away.inScene})`, away.n0 > 0 && away.inScene === 0 && away.left === 0, away);
// S1711 — the birds (#984 A: "ravens or crows on open ground … the birds take off"). A crow put down 15 m in front of you takes off: it
// climbs to 8–14 m, is out of a blade's reach while up there and missed by an arrow that passes under it, and lands again past 60 m
const bird = await page.evaluate(() => { forceTime(12); stream(px, pz, true);
  let x = px, z = pz; for (let k = 0; k < 40 && !wildGround(x, z); k++) { x = px + (k % 7 - 3) * 9; z = pz + Math.floor(k / 7) * 9; }
  const e = keyFoe(buildZoneEnemy(WORLD.scene, STATIC_SOL, x, z, 'Crow', null, { tier: 1, key: 'test:bird' }), 'wild:test:bird');
  e.homeX = x; e.homeZ = z; e.combatYaw = 0; ZONES.world.enemies.push(e); for (const o of ZE) o._duelHold = o !== e; e._w = { mode: 'graze', t: 99 };
  px = x + Math.sin(e.combatYaw) * 15; pz = z + Math.cos(e.combatYaw) * 15; const x0 = e.x, z0 = e.z;
  let top = 0, aloftSeen = false, outOfReach = true, arrowUnder = null, arrowAt = null, landed = -1, gaits = new Set(); const rig = e.limbs.wolf;
  for (let i = 0; i < 60 * 30; i++) { tickZoneEnemies(1 / 60, 0, WORLD.scene); hcBirdPose && rig.hc && hcBirdPose(rig); if (rig.gaitNow) gaits.add(rig.gaitNow);
    const fy = (e._w && e._w.fy) || 0; top = Math.max(top, fy);
    if (e.aloft) { aloftSeen = true; if (strikeCandidate(e)) outOfReach = false;
      if (arrowUnder == null) { arrowUnder = wildArrowMisses(e, e.mesh.position.y - 3); arrowAt = wildArrowMisses(e, e.mesh.position.y + .2); } }
    if (i > 60 && e._w.mode === 'graze') { landed = i; break; } }
  const gy = activeTerrainH(e.x, e.z);
  const out = { kind: e.name, body: !!rig.bird, top: +top.toFixed(1), aloftSeen, outOfReach, arrowUnder, arrowAt, flew: +Math.hypot(e.x - x0, e.z - z0).toFixed(1),
    secs: landed > 0 ? +(landed / 60).toFixed(1) : -1, onGround: +(e.mesh.position.y - gy).toFixed(2), ground: wildOpen(e.x, e.z), reach: strikeCandidate(e), gaits: [...gaits] };
  for (const o of ZE) o._duelHold = false; e.dead = true; if (e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1);
  return out; });
console.log('  bird:', JSON.stringify(bird));
check(`a crow seen at 15 m takes off to ${bird.top} m, out of a blade's reach aloft, an arrow under it misses and one at its height strikes (${bird.arrowUnder}, ${bird.arrowAt})`,
  bird.body && bird.top >= 8 && bird.top <= 14 && bird.aloftSeen && bird.outOfReach && bird.arrowUnder === true && bird.arrowAt === false, bird);
check(`it lands ${bird.flew} m off after ${bird.secs} s, on open ground and within reach again`, bird.flew >= 60 && bird.secs > 0 && Math.abs(bird.onGround) < .05 && bird.ground && bird.reach, bird);
await g.close();
