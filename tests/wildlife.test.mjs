// The peaceful animals (Session 1707; Michael's A on #984): each loaded chunk within 150 m of you rolls once, by its id, one group or none by
// its biome (deer in woods and fields, a hare or a fox in grass and heath, a badger at night, an otter by a river), never on a pad or a road.
// Walked across the country: groups are found, each off the roads and pads, and the same group stands again when its chunks are rolled
// again. A deer that sees you runs about 40 m; one you creep up behind grazes on. One blow kills a deer, its body gives 2 to 4 meat and no
// other loot, and its herd bolts; a grazing animal does not stop you passing time; walked away from, the animals go.
// Session 1784: the watcher (L5, #1005 B): one Gatelands cell in three keeps a grey wolf on a rise off a road with three sheep round it; it
// casts no shadow while they do, never runs or hunts, turns to keep you in front of it, and one blow takes it.
// Session 1785: it sits, in the creature kit's own `sit` (the haunches on the ground, the paws planted), breathing; killed, it leaves the sit.
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
  return { n, bad, gone, same: before === sig(), noFoe: W().every(e => !e.alert && e.hp === (e.answer ? 16 : 1) && e.limbs.wolf) /* S1796 — the three that answer back have the Boar's 16 */ }; });
check(`none on a road or a pad (${rules.n} animals), the same group again by its chunk's id, each a one-blow animal on its own body (one that answers back, 16)`, rules.n > 0 && !rules.bad.length && rules.gone === 0 && rules.same && rules.noFoe, rules);

const flee = await page.evaluate(() => { const W = ZONES.world.enemies.filter(e => e.wild && !e.dead), e = W.find(o => o.name === 'Deer');
  for (const o of W) o._duelHold = o !== e; e._w = { mode: 'graze', t: 99 };
  px = e.x + Math.sin(e.combatYaw) * 15; pz = e.z + Math.cos(e.combatYaw) * 15; const x0 = e.x, z0 = e.z; let i = 0;
  for (; i < 600; i++) { tickZoneEnemies(1 / 60, 0, WORLD.scene); if (i > 30 && e._w.mode !== 'flee') break; }
  const out = { ran: +Math.hypot(e.x - x0, e.z - z0).toFixed(1), from: +Math.hypot(e.x - px, e.z - pz).toFixed(1), secs: +(i / 60).toFixed(2) };
  const o = W.find(q => q !== e && q.name === 'Deer') || W.find(q => q !== e); for (const q of W) q._duelHold = q !== o; o._w = { mode: 'graze', t: 99 };
  px = o.x - Math.sin(o.combatYaw) * 15; pz = o.z - Math.cos(o.combatYaw) * 15; _sneaking = true;
  // S1745 — the creep is about the deer's own senses. A foe that sees you wakes everything within 16 m of it (alertPack), a grazing
  // animal too, and an animal woken runs: so a wolf or a bandit near the herd, or a wake left from the run above, made this deer bolt
  // once in three runs (the systems builder, S1711). Every other foe holds still while you creep, and the deer starts unwoken.
  const F = ZONES.world.enemies.filter(q => !q.wild && !q.dead), held = F.map(q => q._duelHold);
  out.foes = F.filter(q => Math.hypot(q.x - o.x, q.z - o.z) < 36).map(q => q.name + ' ' + Math.hypot(q.x - o.x, q.z - o.z).toFixed(0) + ' m');
  out.woken = !!o.alert; o.alert = false; for (const q of F) q._duelHold = true;
  try { for (let k = 0; k < 120; k++) tickZoneEnemies(1 / 60, 0, WORLD.scene); }
  finally { F.forEach((q, i) => { q._duelHold = held[i]; }); }
  out.crept = o._w.mode; _sneaking = false; for (const q of W) q._duelHold = false;
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
// S1759 — the trout (#1014 A): a chunk on a river or a lake rolls one to three, a metre under the surface, head to the current. Seen at
// 15 m one darts 10 m downstream; crept up on from behind while swimming, E takes it by hand. From the bank a sword passes over it and
// the spear reaches it, an arrow a metre over it misses and one at its height strikes; struck, it floats up holding 1 Trout
const trout = await page.evaluate(() => { forceTime(12); for (const ch of [...WILD_CH]) wildDrop(ch);
  const R = WORLD.routed, at = [px, pz]; let best = null;
  for (const rv of R.reaches) for (let i = 0; i < rv.pts.length - 1; i++) { const p = rv.pts[i], q = rv.pts[i + 1], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
    const d = Math.hypot(mx - at[0], mz - at[1]); if (d < 300 || (best && d > best.d)) continue; if (WORLD.worldH(mx, mz) > -2) continue; best = { d, x: mx, z: mz, rv }; }
  if (!best) return { none: true };
  const rv = best.rv, n = rvNearest(rv, best.x, best.z); px = best.x + n.tz * (n.w + 6); pz = best.z - n.tx * (n.w + 6);
  stream(px, pz, true); { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } _wildT = 0; tickWildSpawn(.1);
  const T = ZONES.world.enemies.filter(e => e.swim && !e.dead), per = {}; for (const e of T) per[e._chunk] = (per[e._chunk] || 0) + 1;
  const src = landH(rv.pts[0][0], rv.pts[0][1]), end = landH(rv.pts[rv.pts.length - 1][0], rv.pts[rv.pts.length - 1][1]);
  const out = { n: T.length, per: Object.values(per), wet: T.every(e => wildWet(e.x, e.z) && (wildRiverNear(e.x, e.z, 0) || wildLakeNear(e.x, e.z))), y: [...new Set(T.map(e => e.mesh.position.y))],
    fish: T.every(e => e.limbs.wolf && e.limbs.wolf.fish), falls: +(src - end).toFixed(1) };
  T.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const e = T.find(o => wildDownstream(o.x, o.z) != null); if (!e) return out;
  for (const o of ZE) o._duelHold = o !== e; e._w = { mode: 'graze', t: 99 }; e.alert = false; const bx = px, bz = pz; px = e.x + 60; pz = e.z + 60; /* out of its sight and hearing while it holds */
  for (let i = 0; i < 120; i++) tickZoneEnemies(1 / 60, 0, WORLD.scene);
  const down = wildDownstream(e.x, e.z); out.head = +Math.cos(e.combatYaw - down - Math.PI).toFixed(2);
  px = e.x + Math.sin(e.combatYaw) * 15; pz = e.z + Math.cos(e.combatYaw) * 15; const x0 = e.x, z0 = e.z; let i = 0;
  for (; i < 600; i++) { tickZoneEnemies(1 / 60, 0, WORLD.scene); if (i > 10 && e._w.mode !== 'flee') break; }
  const mv = Math.hypot(e.x - x0, e.z - z0); out.dart = +mv.toFixed(1); out.down = +(((e.x - x0) * Math.sin(down) + (e.z - z0) * Math.cos(down)) / mv).toFixed(2); out.wetAfter = wildWet(e.x, e.z);
  e._w = { mode: 'graze', t: 99 }; px = e.x + 60; pz = e.z + 60; for (let k = 0; k < 120; k++) tickZoneEnemies(1 / 60, 0, WORLD.scene);
  px = e.x - Math.sin(e.combatYaw) * 1.1; pz = e.z - Math.cos(e.combatYaw) * 1.1; jumpY = -1.45; _pStep = false; for (let k = 0; k < 30; k++) tickZoneEnemies(1 / 60, 0, WORLD.scene);
  const has = () => BAG.filter(b => b && ['Trout', 'River Pike', 'Riverjaw Salmon'].includes(b.name) /* S1797 — in the Gatelands' deep water it may be a pike */).reduce((a, b) => a + (b.qty || 1), 0), b0 = has();
  out.prompt = fishPrompt(); out.took = catchFish(); out.got = has() - b0; out.gone = !ZONES.world.enemies.includes(e) && WILD_TAKEN.get(e._wildKey) === lootDay();
  for (const o of ZE) o._duelHold = false;
  const f = ZONES.world.enemies.find(o => o.swim && !o.dead); if (!f) return out; const w0 = EQ.weapon;
  EQ.weapon = { weaponShape: 'sword', atk: [5, 6] }; out.sword = strikeCandidate(f); EQ.weapon = { weaponShape: 'spear', atk: [5, 6] }; out.spear = strikeCandidate(f); EQ.weapon = w0;
  out.over = wildArrowMisses(f, f.mesh.position.y + 1); out.at = wildArrowMisses(f, f.mesh.position.y + .2); const c0 = ZONE_CORPSES.length; killZoneEnemy(f, WORLD.scene);
  const c = ZONE_CORPSES.length > c0 ? ZONE_CORPSES[ZONE_CORPSES.length - 1] : null; out.body = c ? c.items.map(i => i.name + '×' + (i.qty || 1) + ' ' + i.weight + ' ' + i.buyPrice + 'g') : null; out.floats = +f.mesh.position.y.toFixed(2);
  return out; });
console.log('  trout:', JSON.stringify(trout));
check(`trout hold in the river (${trout.n} over ${(trout.per || []).length} chunks, ${JSON.stringify(trout.per)} each), a metre under, head to the current (${trout.head})`,
  trout.n >= 1 && trout.per.every(k => k >= 1 && k <= 3) && trout.wet && trout.y.length === 1 && trout.y[0] === -1 && trout.fish && trout.head > .9 && trout.falls > 0, trout);
check(`one seen at 15 m darts ${trout.dart} m downstream (${trout.down}); crept up on swimming, E takes it (${trout.prompt}, +${trout.got})`,
  Math.abs(trout.dart - 10) < .6 && trout.down > .8 && trout.wetAfter && trout.prompt && trout.took && trout.got === 1 && trout.gone, trout);
check(`from the bank a sword passes over it, the spear reaches it; an arrow a metre over misses, one at its height strikes; struck, it floats up with ${JSON.stringify(trout.body)}`,
  trout.sword === false && trout.spear === true && trout.over === true && trout.at === false && JSON.stringify(trout.body) === '["Trout×1 0.6 9g"]' && Math.abs(trout.floats) < .05, trout);
const wt = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'gatelands'), C = G.map(c => watcherAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._watcher; c._watcher = undefined; const d = watcherAt(c); c._watcher = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const D = C[0], out = { cells: G.length, n: C.length, same, id: D && D.id };
  if (!D) return out; px = D.x + Math.sin(D.ry) * 20; pz = D.z + Math.cos(D.ry) * 20; stream(px, pz, true); { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } _wildT = 0; tickWildSpawn(.1);
  const e = ZONES.world.enemies.find(o => o._wildKey === D.id && !o.dead), sh = ZONES.world.enemies.filter(o => o._wildKey && o._wildKey.startsWith(D.id + ':s'));
  if (!e) return out; let cast = 0, scast = 0; e.mesh.traverse(o => { if ((o.isMesh || o.isPoints) && o.castShadow) cast++; }); sh.forEach(s => { let k = 0; s.mesh.traverse(o => { if (o.isMesh && o.castShadow) k++; }); if (k) scast++; });
  Object.assign(out, { name: e.name, cast, sheep: sh.length, scast, sd: sh.map(s => +Math.hypot(s.x - e.x, s.z - e.z).toFixed(1)) });
  { const rig = e.limbs.wolf; out.built = _drive(() => rig.hc && rig.hc.L < 2, 900); const H = rig.hc; /* S1785 — it sits, in the kit's own sit */
    if (H) { const gy = activeTerrainH(e.x, e.z), w = b => H.C.byName[b].getWorldPosition(new THREE.Vector3()), m0 = Array.from(H.C.skel.boneMatrices);
      _drive(() => false, 40); H.C.root.updateMatrixWorld(true); H.C.skel.update(); let mv = 0; H.C.skel.boneMatrices.forEach((v, i) => { mv = Math.max(mv, Math.abs(v - m0[i])); });
      out.sit = { gait: H.C.gait, hips: +(w('spine0').y - gy).toFixed(3), paws: H.C.B.legs.map(L => +(w(L.names[L.names.length - 1]).y - gy).toFixed(3)), breath: +mv.toFixed(4), shadow: (() => { let k = 0; H.W.traverse(o => { if ((o.isMesh || o.isPoints) && o.castShadow) k++; }); return k; })() }; } }
  const a = D.ry + 1.8; px = D.x + Math.sin(a) * 15; pz = D.z + Math.cos(a) * 15; for (let i = 0; i < 240; i++) tickZoneEnemies(1 / 60, 0, WORLD.scene);
  const face = () => { const f = Math.atan2(px - e.x, pz - e.z); return +Math.abs(Math.atan2(Math.sin(f - e.combatYaw), Math.cos(f - e.combatYaw))).toFixed(3); };
  out.face = face(); out.bolted = sh.filter(s => Math.hypot(s.x - s.homeX, s.z - s.homeZ) > 10).length;
  px = e.x + 2.5; pz = e.z; for (let i = 0; i < 180; i++) tickZoneEnemies(1 / 60, 0, WORLD.scene);
  out.close = face(); out.moved = +Math.hypot(e.x - D.x, e.z - D.z).toFixed(3); out.alert = !!e.alert; out.wild = !!e.wild; out.hp = e.hp; out.dmg = e.dmg;
  killZoneEnemy(e, WORLD.scene); out.dead = !!e.dead; if (e.limbs.wolf.hc) { _drive(() => false, 3); out.up = e.limbs.wolf.hc.sat === false; } return out; });
console.log('  watcher:', JSON.stringify(wt));
check(`${wt.n} of ${wt.cells} Gatelands cells keep a watcher, the same when asked again; ${wt.id} stands with ${wt.sheep} sheep ${JSON.stringify(wt.sd)} m round it`,
  wt.n > 0 && wt.n < wt.cells && wt.same && wt.sheep === 3 && (wt.sd || []).every(d => d >= 4.5 && d <= 7.6), wt);
check(`it casts no shadow (${wt.cast} casters) while its sheep do (${wt.scast} of 3); it turns to keep you in front (off by ${wt.face} rad at 15 m, ${wt.close} at 2.5 m)`,
  wt.cast === 0 && wt.scast === 3 && wt.face < .1 && wt.close < .1, wt);
check(`the wolf never moves (${wt.moved} m; ${wt.bolted} of its 3 sheep ran) nor hunts (alert ${wt.alert}, ${wt.dmg} damage), and one blow takes it`,
  wt.moved === 0 && !wt.alert && wt.wild && wt.hp === 1 && wt.dmg === 0 && wt.dead, wt);
check(`it sits in the kit's own sit (${wt.sit && wt.sit.gait}): hips ${wt.sit && wt.sit.hips} m over the ground, paws at ${JSON.stringify(wt.sit && wt.sit.paws)}, breathing (${wt.sit && wt.sit.breath}), no shadow from its kit body; killed, it leaves the sit (${wt.up})`,
  !!wt.sit && wt.sit.gait === 'sit' && wt.sit.hips < .2 && wt.sit.paws.every(y => Math.abs(y) < .03) && wt.sit.breath > 1e-4 && wt.sit.shadow === 0 && wt.up === true, wt);
// S1796 — animals that answer back (#1050 A): a Gatefen Boar grazes with you 10 m off and does not bolt; within 4 m it turns on you with the
// hostile Boar's blow (5) and 16 health, holds a fight open, and gives up 25 m off; struck from 30 m it comes, and gives up past 34
const ans = await page.evaluate(() => { forceTime(12); stream(px, pz, true);
  let x = px, z = pz; for (let k = 0; k < 40 && !wildGround(x, z); k++) { x = px + (k % 7 - 3) * 9; z = pz + Math.floor(k / 7) * 9; }
  const e = keyFoe(buildZoneEnemy(WORLD.scene, STATIC_SOL, x, z, 'Gatefen Boar', null, { tier: 1, key: 'test:answer' }), 'wild:test:answer');
  e.homeX = x; e.homeZ = z; e.combatYaw = 0; ZONES.world.enemies.push(e); for (const o of ZE) o._duelHold = o !== e; const T = n => { for (let i = 0; i < n; i++) tickZoneEnemies(1 / 60, 0, WORLD.scene); };
  const o = { hp: e.hp, dmg: e.dmg, wild: !!e.wild }; px = x + 10; pz = z; T(120); o.at10 = !!e.angry || (e._w && e._w.mode === 'flee');
  px = e.x + 3; pz = e.z; PHP = PMAXHP = 500; T(60 * 4); o.at3 = !!e.angry; o.lost = 500 - PHP;
  o.fight = ZE.some(q => q && !q.dead && !q.locked && (!q.wild || q.angry) && Math.hypot(px - q.x, pz - q.z) < 20);
  px = e.x + 30; T(30); o.at30 = !!e.angry; e.alert = true; T(30); o.struck = !!e.angry; o.quit = e._quit; PHP = PMAXHP;
  for (const q of ZE) q._duelHold = false; e.dead = true; if (e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); return o; });
console.log('  answer:', JSON.stringify(ans));
check(`a Gatefen Boar (${ans.hp} health, blow ${ans.dmg}) grazes at 10 m, turns on you at 3 m (${ans.lost} lost) and gives up at 30; struck from 30 m it comes (gives up past ${ans.quit && ans.quit.toFixed(1)} m)`,
  ans.wild && ans.hp === 16 && ans.dmg === 5 && !ans.at10 && ans.at3 && ans.lost > 0 && ans.fight && !ans.at30 && ans.struck && ans.quit > 30, ans);
// S1797 — the river fish (#1050 A): along the routed rivers, the Gatelands' deep water holds River Pike, the Mark's rivers Riverjaw Salmon, each
// about half of its chunk's fish, and Aurenne's only trout; taken off the body, 1.2 weight and 18 gold
const fish = await page.evaluate(() => { const seen = new Set(), t = {}, items = {};
  for (const rv of WORLD.routed.reaches) for (let k = 0; k < rv.pts.length; k += 3) { const p = rv.pts[k], cx = Math.floor(p[0] / CHUNK), cz = Math.floor(p[1] / CHUNK), key = cx + ',' + cz;
    if (seen.has(key) || seen.size >= 900) continue; seen.add(key); const ch = { cx, cz, wild: [] }; wildTroutChunk(ch, key);
    let isle = null; try { const [i, j] = cellOf(cx * CHUNK, cz * CHUNK); isle = nationKeyOf(i, j); } catch (e) {}
    for (const e of ch.wild) { const n = isle + ':' + e.baseName; t[n] = (t[n] || 0) + 1; if (!items[e.baseName]) { const it = bodyMeat(e, [], null)[0]; items[e.baseName] = [it.name, it.weight, it.buyPrice]; }
      if (e.baseName === 'River Pike' && !(SEA_Y - worldH(e.x, e.z) > 3)) t.shallowPike = (t.shallowPike || 0) + 1;
      e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); const ix = ZONES.world.enemies.indexOf(e); if (ix >= 0) ZONES.world.enemies.splice(ix, 1); } }
  return { t, items, chunks: seen.size }; });
console.log('  fish:', JSON.stringify(fish));
{ const T = fish.t, I = fish.items, share = (a, b) => (T[a] || 0) / ((T[a] || 0) + (T[b] || 0));
  check(`the river fish: Gatelands ${T['gatelands:River Pike']} pike to ${T['gatelands:Trout']} trout, the Mark ${T['mark:Riverjaw Salmon']} salmon to ${T['mark:Trout']} trout, none elsewhere; each 1.2 weight and 18 gold`,
    share('gatelands:River Pike', 'gatelands:Trout') > .3 && share('gatelands:River Pike', 'gatelands:Trout') < .6 && share('mark:Riverjaw Salmon', 'mark:Trout') > .25 && share('mark:Riverjaw Salmon', 'mark:Trout') < .6
    && !T['aurenne:River Pike'] && !T['aurenne:Riverjaw Salmon'] && !T['mark:River Pike'] && !T['gatelands:Riverjaw Salmon'] && !T.shallowPike
    && I['River Pike'][1] === 1.2 && I['River Pike'][2] === 18 && I['Riverjaw Salmon'][1] === 1.2 && I['Riverjaw Salmon'][2] === 18 && I.Trout[1] === .6, fish); }

// S1870 — OG-040's five strange beasts with bodies (Session 1852) join their islands' tables by the catalogue's habitat and rarity (S1769's
// weights): each builds as a one-blow animal on the wolf's driver with its pace; the Crownstag and the Frostmane give a deer's meat, the
// Lanternfox, the Thornrunner and the Stonejaw none; and rolled across the Mark's snow forests and tundra, the Frostmane and the Stonejaw stand
const SB = await page.evaluate(() => { const out = { k: {}, rows: {} };
  for (const k of ['Crownstag', 'Lanternfox', 'Thornrunner', 'Frostmane', 'Stonejaw']) {
    const e = buildZoneEnemy(sc, STATIC_SOL, px + 6, pz + 6, k, null, { tier: 1, key: 's1870:' + k, island: k === 'Frostmane' || k === 'Stonejaw' ? 'mark' : 'gatelands' });
    out.k[k] = { wild: !!e.wild, hp: e.hp, wolf: !!(e.limbs && e.limbs.wolf), run: WILD_PACE[k] && WILD_PACE[k].run, meat: bodyMeat(e, [], 's1870:' + k).reduce((a, it) => a + (it.qty || 1), 0) };
    if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); }
  for (const [i, t] of Object.entries(WILD_ISLE)) for (const [b, rows] of Object.entries(t)) for (const r of rows) if (out.k[r.name]) out.rows[r.name] = (out.rows[r.name] || []).concat(i + '/' + b + ':' + r.w);
  const per = {}; for (let cz = 12; cz < 245; cz += 4) for (let cx = 25; cx < 220; cx += 4) { const x = cx * CHUNK + CHUNK / 2, z = cz * CHUNK + CHUNK / 2;
    if (nationAt(x, z) !== 'mark' || worldH(x, z) < 2) continue; const b = lairBiome({ x, z }); if (b !== 'forest' && b !== 'tundra') continue;
    const ch = { cx, cz }; try { wildSpawnChunk(ch); } catch (e) { continue; }
    if (ch.wild && ch.wild.length) { const nm = ch.wild[0].name; per[b + ':' + nm] = (per[b + ':' + nm] || 0) + 1; } wildDrop(ch); }
  out.mark = { frostmane: per['forest:Frostmane'] || 0, stonejaw: per['tundra:Stonejaw'] || 0, elsewhere: (per['tundra:Frostmane'] || 0) + (per['forest:Stonejaw'] || 0) };
  return out; });
console.log('  strange:', JSON.stringify(SB));
check(`the strange beasts: five one-blow animals on the wolf's driver, meat ${['Crownstag', 'Frostmane', 'Lanternfox', 'Thornrunner', 'Stonejaw'].map(k => k + ' ' + SB.k[k].meat).join(', ')}; the Mark rolls ${SB.mark.frostmane} Frostmane groups in its forests and ${SB.mark.stonejaw} Stonejaw on its tundra`,
  Object.values(SB.k).every(o => o.wild && o.hp === 1 && o.wolf && o.run > 0) && SB.k.Crownstag.meat >= 2 && SB.k.Frostmane.meat >= 2 && !SB.k.Lanternfox.meat && !SB.k.Thornrunner.meat && !SB.k.Stonejaw.meat
  && SB.rows.Crownstag.join() === 'gatelands/forest:0.5,gatelands/autumn:0.5' && SB.rows.Lanternfox.join() === 'gatelands/forest:0.5,gatelands/autumn:0.5'
  && SB.rows.Thornrunner.join() === 'gatelands/plains:2,gatelands/moor:2' && SB.rows.Frostmane.join() === 'mark/forest:2' && SB.rows.Stonejaw.join() === 'mark/tundra:2'
  && SB.mark.frostmane >= 3 && SB.mark.stonejaw >= 3 && !SB.mark.elsewhere, SB);
await g.close();
