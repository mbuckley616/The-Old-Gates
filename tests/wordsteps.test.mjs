// Magic B's laid things as solids (Session 1590; magic-build.md's session 3, "The five forms" and "Movement against the step table").
// A laid spell puts one thing at a walkable point within 12 m: Cloch Ghéar's pillar (1.2 m, mantled onto), Séideán's updraft (a jump
// in it tops out 2.2 m up), Sioc's floe on open water, and Tonn with Sioc's rider, a bridge 6.2 m long. One a caster; it lives by the
// play clock. Measured in a gate, a room and the world, driven through the game's own loop at fixed steps.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const helpers = () => {
  window._drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  window._reset = (x, z, y, yw) => { for (const k in K) K[k] = false; PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null; FALL.pend = null; FALL.top = null; dead = false; PPOST.stagUntil = 0;
    MANTLE.t0 = null; px = x; pz = z; jumpY = y; velY = 0; onGround = true; yaw = yw; pitch = 0; SKILLS.acrobatics = { lv: 5, p: 0 }; };
  // walk forward (W) for n frames, or jump forward (W and Space on the first); the highest feet and where you ended
  window._go = (n, jump) => { let top = jumpY; _drive(i => { K['KeyW'] = true; K['Space'] = !!jump && i === 0; top = Math.max(top, jumpY); return !!jump && i > 3 && onGround; }, n); for (const k in K) K[k] = false;
    return { x: +px.toFixed(2), z: +pz.toFixed(2), y: +jumpY.toFixed(2), top: +top.toFixed(2), on: onGround }; };
};
await page.evaluate(helpers);

// the world: a pillar in the street, and Sioc's floe on the sea off Portclare's quay
await g.settle('portclare');
const stop = g.keepAlive();
const Wd = await page.evaluate(() => {
  const S = WORLD.siteAnywhere('portclare'), pl = ZONES.world.platforms.find(p => p.site === S.id && !p.river && !p.shallow);
  const sd = WORLD.shoreDir ? WORLD.shoreDir(S) : shoreDir(S);
  // the quay's end, facing the sea
  const ex = sd.dx ? (sd.dx > 0 ? pl.x1 : pl.x0) : (pl.x0 + pl.x1) / 2, ez = sd.dz ? (sd.dz > 0 ? pl.z1 : pl.z0) : (pl.z0 + pl.z1) / 2;
  const yw = Math.atan2(-sd.dx, -sd.dz);
  _reset(ex - sd.dx * 1, ez - sd.dz * 1, pl.y, yw);
  const dry = layWord('sioc', null, px, pz).why || 'laid';
  const fx = ex + sd.dx * 2.2, fz = ez + sd.dz * 2.2, wet = worldH(fx, fz);
  const floe = layWord('sioc', null, fx, fz);
  _drive(i => { K['KeyW'] = Math.hypot(px - fx, pz - fz) > .3; return i > 200 || (!K['KeyW'] && onGround); }, 240); for (const k in K) K[k] = false; _drive(() => false, 20);
  const walk = { y: jumpY }; const onFloe = Math.hypot(px - fx, pz - fz) < 1.5;
  const swim = WORLD.isSwimming();
  // a pillar on open ground: walked into, then jumped onto
  laidEnd(); let spot = null;
  for (let r = 6; r < 60 && !spot; r += 2) for (let a = 0; a < 24 && !spot; a++) { const x = S.x + Math.cos(a / 24 * 6.283) * r, z = S.z + Math.sin(a / 24 * 6.283) * r;
    if (worldH(x, z) < SEA_Y + .3 || ZONES.world.platforms.some(p => x > p.x0 - 3 && x < p.x1 + 3 && z > p.z0 - 3 && z < p.z1 + 3)) continue;
    let ok = true; for (let d = -1; d <= 3.5 && ok; d += .25) for (let w = -1; w <= 1; w += .5) ok = ok && !currentZoneSolid(x + d, z + w) && Math.abs(activeTerrainH(x + d, z + w) - activeTerrainH(x, z)) < .3;
    if (ok) spot = { x, z }; }
  if (!spot) return { floe, dry, onFloe, swim, spot: null };
  const E = -Math.PI / 2, gy = activeTerrainH(spot.x + 2, spot.z);
  _reset(spot.x, spot.z, activeTerrainH(spot.x, spot.z), E);
  const pil = layWord('cloch_ghear', null, spot.x + 2, spot.z);
  const walkP = _go(90); const gap = +(spot.x + 2 - px).toFixed(2);
  _reset(spot.x + .9, spot.z, activeTerrainH(spot.x + .9, spot.z), E); const jump = _go(50, true);
  return { dry, floe, wet: +(wet - SEA_Y).toFixed(2), onFloe, floeY: +(walk.y - SEA_Y).toFixed(2), swim, pil, gap, jumpH: +(jump.y - gy).toFixed(2), jumpOn: jump.on };
});
console.log(JSON.stringify(Wd));
check(`Sioc laid on the quay is refused (${Wd.dry}); on the sea off its end a floe, walked onto from the quay, holds you ${Wd.floeY} m over the sea, not swimming`, Wd.dry === 'dry' && Wd.floe && Wd.floe.ok && Wd.onFloe && Math.abs(Wd.floeY - .1) < .03 && !Wd.swim, Wd);
check(`outdoors a pillar stops the walk at its side (${Wd.gap} m) and a jump forward lands on it (${Wd.jumpH} m over the ground)`, Wd.pil && Wd.pil.ok && Math.abs(Wd.gap - .8) < .1 && Math.abs(Wd.jumpH - 1.2) < .05 && Wd.jumpOn, Wd);
// a room: the pillar blocks the walk and holds you on its top
await page.evaluate(() => { laidEnd(); });
const until = async (fn, arg) => { try { await page.waitForFunction(fn, arg, { polling: 100, timeout: 60000 }); } catch (e) {} };
const room = await page.evaluate(() => { const S = WORLD.settle.get('portclare'); const h = S.houses.find(x => x.type === 'inn') || S.houses.find(x => x.type === 'home') || S.houses[0];
  forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); return { id: h.id }; });
await until(id => currentHouse && currentHouse.id === id && document.getElementById('fd').style.opacity === '0', room.id); await g.hide(); await g.frames(3);
const R = await page.evaluate(() => {
  const W = currentHouse.intW || currentHouse._roomW, Dd = currentHouse.intD || currentHouse._roomD;
  // a clear run of 2.6 m along x or z: the pillar 1.8 m ahead, nothing within 0.6 m of it or of you
  let spot = null; for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let x = .5; x < W - .5 && !spot; x += .1) for (let z = .5; z < Dd - .5 && !spot; z += .1) {
    let ok = true; for (let a = -.3; a <= 2.6 && ok; a += .1) for (let b = -.6; b <= .6 && ok; b += .1) { const qx = x + ux * a - uz * b, qz = z + uz * a + ux * b;
      ok = qx > .1 && qz > .1 && qx < W - .1 && qz < Dd - .1 && !intSolidAt(qx, qz, 0, 0) && footholdY(qx, qz, .5, 0) <= .05; }
    if (ok) { _reset(x, z, 0, 0); if (layWord('cloch_ghear', null, x + ux * 1.8, z + uz * 1.8).ok) spot = { x, z, ux, uz }; } }
  if (!spot) return { spot: null, W, Dd };
  const E = Math.atan2(-spot.ux, -spot.uz), fx = spot.x + spot.ux * 1.8, fz = spot.z + spot.uz * 1.8; _reset(spot.x, spot.z, 0, E);
  const lay = layWord('cloch_ghear', null, fx, fz);
  const walk = _go(90); const gap = +Math.hypot(fx - px, fz - pz).toFixed(2);
  _reset(fx, fz, 1.2, E); _drive(() => false, 10); const stand = +jumpY.toFixed(2);
  return { spot, lay, gap, walkY: walk.y, stand, inside: isInterior() };
});
console.log(JSON.stringify(R));
check(`in a room a pillar stops the walk at its side (${R.gap} m) and holds you on its top (${R.stand} m)`, R.inside && R.lay && R.lay.ok && Math.abs(R.gap - .8) < .06 && R.walkY === 0 && R.stand === 1.2, R);
await page.evaluate(() => { exitInterior(); });
await until(() => currentHouse === null && document.getElementById('fd').style.opacity === '0');
check(`leaving the room ends the pillar laid in it`, await page.evaluate(() => laidLive() === null));
stop();



const seed = await page.evaluate(() => { for (let s = 1; s < 5000; s++) if (gateCondRoll(s) === 'catastrophic' && makeGate('small', s).spaces.some(q => q.type === 'chasm')) return s; });
await enterDungeon(page, { theme: 'ruins', size: 'small', seed });
await page.evaluate(helpers);

// ── a gate: the pillar, the ledge from it, the updraft, the bridge over a chasm, one at a time, the clock
const D = await page.evaluate(() => {
  for (const e of ENEMIES) { e.hp = 0; e.dead = true; }
  currentFloor = 1; knownWords.cloch_ghear = 2; knownWords.sideen = 2; knownWords.sioc = 2; knownWords.tonn = 2;
  const open = (x, z) => !dSolid(x, z) && !dAirAt(x, z) && footholdY(x, z, 9, -99) <= 0 && dCeil(x, z) >= 5.5;
  let spot = null;
  for (let r = 2; r < dR - 2 && !spot; r++) for (let c = 2; c < dC - 4 && !spot; c++) { const x = dAt(c), z = dAt(r); let ok = true;
    for (let dx = -2; dx <= 5 && ok; dx += .5) for (let dz = -2; dz <= 2 && ok; dz += .5) ok = open(x + dx, z + dz);
    if (ok && FOOTHOLDS.every(f => f.kind === 'spiral' || x + 6 < f.x0 || x - 3 > f.x1 || z + 3 < f.z0 || z - 3 > f.z1)) spot = { x, z }; }
  if (!spot) return { spot: null };
  const E = -Math.PI / 2, out = { spot };
  // the reach and the wall: 12.1 m is refused (12 is not), so is a pillar 0.4 m from a wall, and one laid on you
  _reset(spot.x, spot.z, 0, E);
  out.far = layWord('cloch_ghear', null, spot.x + 12.1, spot.z).why || 'laid';
  out.at12 = layWord('cloch_ghear', null, spot.x + 12, spot.z).why === 'far' ? 'far' : 'not far';
  laidEnd();
  let wall = null; for (let c = 1; c < dC - 1 && !wall; c++) for (let r = 1; r < dR - 1 && !wall; r++) if (dMap[r][c] === 0 && dMap[r][c + 1] === 1 && dMap[r][c + 2] === 1 && dMap[r][c + 3] === 1) wall = { x: dAt(c) + DCELL / 2, z: dAt(r) };
  if (wall) { _reset(wall.x + 3, wall.z, 0, E); let edge = wall.x; while (dSolid(edge + .01, wall.z)) edge += .01;
    out.wall = { at04: layWord('cloch_ghear', null, edge + .4 + .5, wall.z).why || 'laid', at11: layWord('cloch_ghear', null, edge + 1.1 + .5, wall.z).why || 'laid' }; laidEnd(); }
  _reset(spot.x, spot.z, 0, E); out.onYou = layWord('cloch_ghear', null, spot.x + .4, spot.z).why || 'laid';
  // the pillar 2 m ahead: a walk stops at its side; a jump forward puts you on its top
  _reset(spot.x, spot.z, 0, E); out.lay = layWord('cloch_ghear', null, spot.x + 2, spot.z);
  out.pillar = { top: +(LAID.top - LAID.base).toFixed(2), r: LAID.r };
  out.walk = _go(90); out.walk.gap = +(spot.x + 2 - px).toFixed(2);
  _reset(spot.x + .9, spot.z, 0, E); out.jump = _go(50, true);
  // from its top, a ledge at 3.6 m is reached by the mantle and one at 3.9 m is not
  const ledge = h => { _reset(spot.x + 2.2, spot.z, 1.2, E); const L = { x0: spot.x + 2.55, x1: spot.x + 5, z0: spot.z - 1, z1: spot.z + 1, y: h, id: 'wordsteps' }; FOOTHOLDS.push(L);
    let pulled = false; _drive(i => { K['KeyW'] = i > 0 && velY < 1.2; K['Space'] = i === 0; if (mantling()) pulled = true; return i > 3 && onGround && !mantling(); }, 300);
    for (const k in K) K[k] = false; FOOTHOLDS.splice(FOOTHOLDS.indexOf(L), 1); return { pulled, y: +jumpY.toFixed(2) }; };
  out.l36 = ledge(3.6); out.l39 = ledge(3.9);
  // walk off the pillar's top: you fall to the floor
  _reset(spot.x + 2, spot.z, 1.2, E); out.off = _go(60);
  // the updraft: a second laid thing ends the pillar; a jump inside it tops out 2.2 m up, with no push
  // S1600 — the look builder's dress: the pillar and the updraft each a group of a few draws, the pillar's top at its rule's top, in the gate's scene
  const cost = m => { let t = 0, d = 0; m.traverse(o => { if (o.isMesh || o.isPoints) { d++; const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / (o.isPoints ? 1 : 3); } }); return { tris: Math.round(t), draws: d }; };
  { const m = LAID.mesh, bb = new THREE.Box3().setFromObject(m); out.dressP = { name: m.name, group: m.isGroup, inScene: m.parent === dScene, top: +(bb.max.y - LAID.base).toFixed(2), ...cost(m) }; }
  const pm = LAID.mesh; _reset(spot.x, spot.z, 0, E);
  out.up = layWord('sideen', null, spot.x + 1.5, spot.z); out.pillarGone = !pm.parent && LAID.kind === 'updraft';
  out.dressU = { name: LAID.mesh.name, ...cost(LAID.mesh) };
  _reset(spot.x + 1.5, spot.z, 0, E); let top = 0; _drive(i => { K['Space'] = i === 0; top = Math.max(top, jumpY); return i > 3 && onGround; }, 200); for (const k in K) K[k] = false;
  out.draft = { top: +top.toFixed(3), x: +(px - spot.x - 1.5).toFixed(3) };
  _reset(spot.x + 4, spot.z, 0, E); top = 0; _drive(i => { K['Space'] = i === 0; top = Math.max(top, jumpY); return i > 3 && onGround; }, 200);
  out.plain = +top.toFixed(3);
  // the clock: 15 s of play and the updraft is gone
  playClockS += 15.1; out.clockGone = laidLive() === null;
  return out;
});
console.log(JSON.stringify(D));
check(`a gate's open floor to lay on`, !!D.spot, D);
check(`laid at 12.1 m is refused (${D.far}); at 12 m it is in reach (${D.at12})`, D.far === 'far' && D.at12 === 'not far', D);
check(`a pillar 0.4 m from a wall is refused (${D.wall && D.wall.at04}); 1.1 m off it stands (${D.wall && D.wall.at11}); on you, refused (${D.onYou})`, D.wall && D.wall.at04 === 'solid' && D.wall.at11 === 'laid' && D.onYou === 'body', D);
check(`Cloch Ghéar laid: a pillar ${D.pillar && D.pillar.top} m high, 1.0 across`, D.lay && D.lay.ok && D.pillar.top === 1.2 && D.pillar.r === .5, D);
check(`a walk into it stops at its side (${D.walk && D.walk.gap} m from its middle, on the floor)`, D.walk && Math.abs(D.walk.gap - .8) < .06 && D.walk.y === 0, D.walk);
check(`a jump forward lands on its top (${D.jump && D.jump.y} m)`, D.jump && D.jump.y === 1.2 && D.jump.on, D.jump);
check(`from the pillar's top a 3.6 m ledge is mantled (${D.l36.y} m); 3.9 m is not (${D.l39.y} m)`, D.l36.pulled && D.l36.y === 3.6 && !D.l39.pulled && D.l39.y < 3.6, D);
check(`walked off its top you fall to the floor (${D.off.y} m)`, D.off.y === 0 && D.off.on, D.off);
check(`a second laid thing ends the first: the updraft took the pillar's place`, D.up && D.up.ok && D.pillarGone, D);
check(`the laid things are dressed: the pillar a group of ${D.dressP.draws} draws, ${D.dressP.tris} triangles, its stone's top at ${D.dressP.top} m; the updraft ${D.dressU.draws} draws, ${D.dressU.tris} triangles`, D.dressP.name === 'laid-pillar' && D.dressP.group && D.dressP.inScene && D.dressP.draws <= 3 && D.dressP.tris < 2000 && Math.abs(D.dressP.top - 1.2) < .03 && D.dressU.name === 'laid-updraft' && D.dressU.draws <= 3 && D.dressU.tris < 1000, D);
check(`a jump in Séideán's updraft tops out ${D.draft.top} m up (2.2), with no push (${D.draft.x} m); out of it ${D.plain} m`, Math.abs(D.draft.top - 2.2) < .05 && Math.abs(D.draft.x) < .01 && D.plain < .9, D);
check(`the updraft ends by the play clock (15 s)`, D.clockGone, D);

// the bridge across the chasm's air: Tonn laid with Sioc's rider holds you 6.2 m out, then you fall
const B = await page.evaluate(() => {
  let at = null;
  for (let r = 1; r < dR - 1 && !at; r++) for (let c = 2; c < dC - 1 && !at; c++) if (dMap[r][c] === 8 && dMap[r][c - 1] === 1 && dMap[r][c - 2] === 1) {
    let n = 0; while (c + n < dC && dMap[r][c + n] === 8) n++; if (n * DCELL >= 7.5) at = { x: dAt(c) - DCELL / 2, z: dAt(r), air: n * DCELL }; }
  if (!at) return { at: null };
  const E = -Math.PI / 2; _reset(at.x - 1.5, at.z, 0, E);
  const lay = layWord('tonn', 'sioc', at.x - .2, at.z, { yaw: E });
  const len = LAID ? +(LAID.hl * 2).toFixed(2) : 0;
  let far = 0, low = 0; _drive(i => { K['KeyW'] = true; if (jumpY > -.05) far = Math.max(far, px - (at.x - .2)); low = Math.min(low, jumpY); return low < -3; }, 400);
  for (const k in K) K[k] = false;
  return { at, lay, len, far: +far.toFixed(2), fell: low < -3 };
});
console.log(JSON.stringify(B));
check(`Tonn with Sioc laid at a chasm's rim: a bridge ${B.len} m long (6.2); you walk ${B.far} m out over the air on it, then fall`, B.at && B.lay.ok && B.len === 6.2 && B.far > 6.1 && B.far < 6.6 && B.fell, B);
check(`Tonn laid alone lays nothing yet`, await page.evaluate(() => layWord('tonn', null, px + 1, pz).ok !== true));

// the cast: the Laid form waits for Evoker; then F lays the book's entry at the crosshair for wordCost's mana
const C = await page.evaluate(() => {
  const S = window._D || null; laidEnd(); FALL.pend = null; PHP = maxHP;
  worldState.guildTasks = worldState.guildTasks || {}; formsGranted.length = 0; worldState.guildRanks = worldState.guildRanks || {};
  const refused = bookMake('laid', 'cloch_ghear', null);
  formsGranted.push('laid'); const made = bookMake('laid', 'cloch_ghear', null); bookSelect(made.i);
  // stand on the open floor facing a clear 5 m, the crosshair on the floor 3 m ahead
  let spot = null; for (let r = 2; r < dR - 2 && !spot; r++) for (let c = 2; c < dC - 4 && !spot; c++) { const x = dAt(c), z = dAt(r); let ok = true;
    for (let dx = -1; dx <= 5 && ok; dx += .5) for (let dz = -1.5; dz <= 1.5 && ok; dz += .5) ok = !dSolid(x + dx, z + dz) && !dAirAt(x + dx, z + dz) && footholdY(x + dx, z + dz, 9, -99) <= 0;
    if (ok) spot = { x, z }; }
  _reset(spot.x, spot.z, 0, -Math.PI / 2); thirdPerson = false;
  _drive(() => false, 3);
  pitch = -Math.atan2(EYE_STAND, 3); _drive(() => false, 2);
  knownWords.cloch_ghear = 2; mana = effMaxMana(); spCd = 0; _castFreeAt = 0; castT = 0; const m0 = mana, want = wordCost('cloch_ghear', 'laid', null);
  castSpell();
  return { refused: refused.say, made: made.i, laid: !!LAID && LAID.kind, d: LAID ? +(LAID.x - spot.x).toFixed(2) : null, paid: +(m0 - mana).toFixed(1), want};
});
console.log(JSON.stringify(C));
check(`at Novice the Laid form is refused ("${C.refused}")`, /not yet yours/.test(C.refused || ''), C);
check(`granted, F lays the pillar at the crosshair, ${C.d} m ahead (3), for ${C.paid} mana (wordCost ${C.want})`, C.laid === 'pillar' && Math.abs(C.d - 3) < .25 && C.paid === C.want, C);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
