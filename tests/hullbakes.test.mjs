// Session 665 (Michael's A on DECISION #202): the Mark's cutter and Aurenne's caravel on hulls of their own, as the
// Session 643 prototype showed them. The bakes, their sizes and rigs, the caravel's lateens trimmed to leeward, your own
// ship taking her class's hull, the three older hulls untouched; writes docs/prototypes/shiphulls-ingame-*.png and, since
// Session 1538, shipdress-*.png (your sloop in each island's dress). Session 1543: your caravel is the kit's Aurenne caravel, her
// sterncastle a second deck walked by its ladders, her wheel on it (shipdress-caravel.png).
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const tris = b => { let t = b.geo.attributes.position.count / 3; for (const q of b.rigs) t += q.geo.attributes.position.count / 3 + (q.extra ? q.extra.attributes.position.count / 3 : 0); return Math.round(t); };
  for (const k of ['sloop', 'cog', 'galleon', 'cutter', 'caravel']) for (const look of ['player', 'pirate', 'merchant']) {
    const b = shipBake(k, look); out[k + '|' + look] = { tris: tris(b), L: b.L, W: b.W, rigs: b.rigs.map(q => q.type).join(','), extra: b.rigs.some(q => q.extra), deck: typeof b.deck, kit: !!b.kit }; }
  // the caravel's lateens to leeward: wind on the starboard beam, then the port
  const m = WORLD.buildShipMesh(17.5, 5, 'player', 'caravel'); const lat = m.userData.rigs.filter(q => q.type === 'lateen');
  shipTrim(m, Math.PI / 2); out.latA = lat.map(q => +q.m.rotation.y.toFixed(2)); shipTrim(m, -Math.PI / 2); out.latB = lat.map(q => +q.m.rotation.y.toFixed(2));
  const c = WORLD.buildShipMesh(14, 4, 'player', 'cutter'); out.cutterTop = c.userData.rigs.filter(q => q.m.children.length).length;
  // your own ship: no look, her class from the save
  const was = worldState.ship; const own = {};
  for (const cls of ['sloop', 'cutter', 'caravel', 'cog']) { worldState.ship = { cls }; const L = { sloop: 13, cutter: 14, caravel: 17.5, cog: 17 }[cls];
    own[cls] = WORLD.buildShipMesh(L, 4, undefined).userData.kind; }
  worldState.ship = was; out.own = own;
  out.lengthRule = [WORLD.buildShipMesh(13, 4.4).userData.kind, WORLD.buildShipMesh(17, 5.6, 'merchant').userData.kind, WORLD.buildShipMesh(22, 7, 'pirate').userData.kind];
  openInspector(); out.keys = INSPECTOR.entries.filter(e => e.group === 'Ships').map(e => e.key || e.id); return out; });
console.log(JSON.stringify(r));
for (const look of ['player', 'pirate', 'merchant']) {
  /* S1539: your own cutter on the new look is the kit's (its topsail on the gaff's rig, its two headsails one rig in the hull's frame) */
  check(`the cutter (${look}) bakes 14 × 4.0 with a gaff, a topsail on it and two headsails`, r['cutter|' + look].L === 14 && r['cutter|' + look].W === 4 && /gaff/.test(r['cutter|' + look].rigs) && (r['cutter|' + look].kit ? r['cutter|' + look].rigs === 'gaff,jib' : (r['cutter|' + look].rigs.match(/jib/g) || []).length === 2 && r['cutter|' + look].extra), r['cutter|' + look]);
  check(`the caravel (${look}) bakes 17.5 × 5.0 with three lateens`, r['caravel|' + look].L === 17.5 && r['caravel|' + look].W === 5 && (r['caravel|' + look].rigs.match(/lateen/g) || []).length === 3, r['caravel|' + look]);
}
check('the two new hulls stay in the old ones\' range of triangles (under 7,000; the kit\'s cutter under 30,000, its caravel under 36,000)', r['cutter|player'].tris < (r['cutter|player'].kit ? 30000 : 7000) && r['caravel|player'].tris < (r['caravel|player'].kit ? 36000 : 7000), [r['cutter|player'].tris, r['caravel|player'].tris]);
check('the sloop, cog and galleon keep their rigs', r['sloop|player'].rigs === (r['sloop|player'].kit ? 'square' : 'gaff,jib') /* S1531: the kit's Gatelands sloop on the new look, #306's square sail */ && /square/.test(r['cog|player'].rigs) && !/lateen/.test(r['galleon|player'].rigs), [r['sloop|player'].rigs, r['cog|player'].rigs, r['galleon|player'].rigs]);
check('the caravel\'s three yards swing to leeward, and over when the wind crosses', r.latA.length === 3 && r.latA.every(a => a < -.1) && r.latB.every(a => a > .1), [r.latA, r.latB]);
check('the cutter\'s gaff carries its topsail', r.cutterTop === 1 || r['cutter|player'].kit, r.cutterTop);
check('your own ship takes her class\'s hull', r.own.cutter === 'cutter' && r.own.caravel === 'caravel' && r.own.sloop === 'sloop' && r.own.cog === 'cog', r.own);
check('other ships still go by length', r.lengthRule.join() === 'sloop,cog,galleon', r.lengthRule);
check('the inspector has six new pieces', ['cutter/player', 'cutter/pirate', 'cutter/merchant', 'caravel/player', 'caravel/pirate', 'caravel/merchant'].every(n => r.keys.some(k => k.includes(n))), r.keys);
const key = n => r.keys.find(k => k.includes(n));
const side = 'INSPECTOR.orbit.theta=Math.PI/2+.12;INSPECTOR.orbit.phi=1.42;INSPECTOR.orbit.dist*=1.05;';
await inspShots(g, [[key('cutter/player'), 'shiphulls-ingame-cutter.png'], [key('caravel/player'), 'shiphulls-ingame-caravel.png'],
  [key('cutter/player'), 'shiphulls-ingame-cutter-side.png', side], [key('caravel/player'), 'shiphulls-ingame-caravel-side.png', side]]);
// Session 1538 (Michael's A on #839): on the new look your sloop wears the dress of the island whose yard sold or last refitted her,
// kept on the ship: the Gatelands' square sail, the Mark's gaff and headsails with the beast's head and shields, Aurenne's lateen.
const d = await page.evaluate(() => { const out = {}, was = worldState.ship;
  for (const dr of ['gatelands', 'mark', 'aurenne', null]) { worldState.ship = dr ? { dress: dr } : {}; const m = WORLD.buildShipMesh(13, 4.4), b = shipBake('sloop', 'player');
    const R = m.userData.rigs; shipTrim(m, Math.PI / 2); const a = R.map(q => [q.type, +q.m.rotation.y.toFixed(2), q.m.scale.x]); shipTrim(m, -Math.PI / 2); const c = R.map(q => [q.type, +q.m.rotation.y.toFixed(2), q.m.scale.x]);
    out[dr || 'none'] = { kit: !!b.kit, dress: b.kit && b.kit.dress, key: m.userData.bakeKey, tris: b.kit && b.kit.tris, draws: b.kit && b.kit.draws, rigs: b.rigs.map(q => q.type).join(), a, c, head: b.kit && b.kit.head, shields: b.kit ? b.kit.shields.length : 0, stow: ((shipStowSlots(m.userData.bakeKey) || {}).slots || []).length }; }
  worldState.ship = { cls: 'cutter', dress: 'gatelands' }; { const m = WORLD.buildShipMesh(13, 4.4), b = shipBake('cutter', 'player'); out.cutter = { kit: !!b.kit, dress: b.kit && b.kit.dress, key: m.userData.bakeKey, tris: b.kit && b.kit.tris, draws: b.kit && b.kit.draws, rigs: b.rigs.map(q => q.type).join(), head: b.kit && b.kit.head, boomY: b.kit && b.kit.boom.y, tiller: !!m.userData.tiller, stow: ((shipStowSlots(m.userData.bakeKey) || {}).slots || []).length }; }
  // a refit at one of the Mark's yards: a cog taken down to a sloop comes out in the Mark's dress
  const mk = allPorts().find(p => nationAt(p.x, p.z) === 'mark'); const g0 = gold; gold = 99999; worldState.ship = { cls: 'cog', dress: 'gatelands', hull: 140, rig: 100 };
  const o = yardOffers(mk).find(q => q.cls === 'sloop' && /Refit/.test(q.label)); if (o) o.fn(); out.refit = { port: mk && mk.name, cls: worldState.ship.cls, dress: worldState.ship.dress, key: WORLD.buildShipMesh(13, 4.4).userData.bakeKey };
  gold = g0; worldState.ship = was; return out; });
console.log(JSON.stringify(d));
if (d.gatelands.kit) {
  check('the three dresses bake as three sloops, each under 30,000 triangles and 16 draws', ['gatelands', 'mark', 'aurenne'].every(k => d[k].dress === k && d[k].key === 'sloop|player|' + k && d[k].tris < 30000 && d[k].draws <= 16), ['gatelands', 'mark', 'aurenne'].map(k => [k, d[k].dress, d[k].tris, d[k].draws]));
  check('a ship from before the dress is the Gatelands\'', d.none.dress === 'gatelands', d.none);
  check('each island its rig: the square sail, the gaff with its headsails, the lateen', d.gatelands.rigs === 'square' && d.mark.rigs === 'gaff,jib' && d.aurenne.rigs === 'lateen', [d.gatelands.rigs, d.mark.rigs, d.aurenne.rigs]);
  check('the Mark\'s carries the beast\'s head and a row of shields; the others neither', d.mark.head && d.mark.shields >= 8 && !d.aurenne.head && !d.gatelands.shields, [d.mark.head, d.mark.shields]);
  check('the boom and the lateen swing to leeward and over when the wind crosses; the headsails only belly over', d.mark.a[0][1] < -.2 && d.mark.c[0][1] > .2 && d.mark.a[1][1] === 0 && d.mark.a[1][2] === -d.mark.c[1][2] && d.aurenne.a[0][1] < -.1 && d.aurenne.c[0][1] > .1, [d.mark.a, d.mark.c, d.aurenne.a, d.aurenne.c]);
  check('every dress keeps the hold\'s stowage on deck', ['gatelands', 'mark', 'aurenne'].every(k => d[k].stow === d.gatelands.stow && d[k].stow > 0), ['gatelands', 'mark', 'aurenne'].map(k => d[k].stow));
  check('your own cutter is the kit\'s Mark cutter: carvel, the head on her plumb stem, the boom 2.15 m over the deck, under 30,000 triangles', d.cutter.kit && d.cutter.dress === 'mark' && d.cutter.key === 'cutter|player|mark' && d.cutter.head && Math.abs(d.cutter.boomY - 3.15) < .01 && d.cutter.tris < 30000 && d.cutter.stow > 0 && d.cutter.tiller, d.cutter);
  check('refitted at a Mark yard, she wears the Mark\'s dress', d.refit.cls === 'sloop' && d.refit.dress === 'mark' && d.refit.key === 'sloop|player|mark', d.refit);
  const quarter = 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;';
  await page.evaluate(sk => { INSPECTOR.select('ships/cog/player'); const e = INSPECTOR.entries.find(x => x.key === sk); INSPECTOR.built.delete(e.id); }, key('cutter/player')); await inspShots(g, [[key('cutter/player'), 'shipdress-cutter.png', quarter]]);
  for (const k of ['gatelands', 'mark', 'aurenne']) { await page.evaluate(([dr, sk]) => { worldState.ship = Object.assign(worldState.ship || {}, { dress: dr }); INSPECTOR.select('ships/cog/player'); const e = INSPECTOR.entries.find(x => x.key === sk); INSPECTOR.built.delete(e.id); }, [k, key('sloop/player')]); /* the inspector keeps what it built: build the sloop again in this dress */ await inspShots(g, [[key('sloop/player'), `shipdress-${k}.png`, quarter]]); }
}
// Session 1543: your caravel on the new look is the kit's Aurenne caravel. Her sterncastle is a deck 2.15 m over the main one: up its
// ladders you stand on it, through the bulkhead's doorway you walk into the cabin under it; the bulkhead stops you on the main deck,
// the castle's forward rail up there; the wheel stands on the castle and answers only from it, and taking it puts you up there.
const cv = await page.evaluate(() => { const out = {};
  closeInspector(); /* the inspector takes the loop's frames while it is open */
  window._drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; for (const k in K) K[k] = false; } return n; };
  const b = shipBake('caravel', 'player'); out.bake = { kit: !!b.kit, dress: b.kit && b.kit.dress, tris: b.kit && b.kit.tris, draws: b.kit && b.kit.draws, rigs: b.rigs.map(q => q.type).join(), castleY: b.castle && b.castle.y, hatchZ: b.hatchZ };
  if (!b.kit) return out;
  const s = WORLD.allPorts().sort((a, c) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(c.x - px, c.z - pz))[0];
  let sx = null, sz = null; for (let rr = 300; rr < 3000 && sx === null; rr += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * rr, z = s.z + Math.sin(a) * rr;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; }
  const was = worldState.ship; worldState.ship = { cls: 'caravel', name: 'Test Swift', sails: 0, cargo: 0 }; WORLD.spawnShip(sx, sz, 0.7);
  const m = SHIP.mesh, C = m.userData.castle, D = DECK_Y, ry = m.rotation.y; out.key = m.userData.bakeKey; out.slots = shipStowSlots(out.key).slots.length;
  const put = (lx, lz, jy, fwd) => { m.updateMatrixWorld(true); const v = new THREE.Vector3(lx, 1, lz).applyMatrix4(m.matrixWorld); px = v.x; pz = v.z; jumpY = jy; velY = 0; onGround = true; yaw = fwd ? ry + Math.PI : ry; pitch = 0; };
  const loc = () => { const [lx, lz] = shipLocal(m, px, pz); return [+lx.toFixed(2), +lz.toFixed(2), +(jumpY - D).toFixed(2)]; };
  const walk = n => { let top = -9; _drive(() => { PHP = maxHP; stamina = maxStamina; K['KeyW'] = true; top = Math.max(top, jumpY - D); }, n); return { end: loc(), top: +top.toFixed(2), swim: isSwimming() }; };
  out.z1 = C.z1; out.lad = C.lad;
  put(1.55, C.z1 + 1.7, D, false); out.up = walk(80);
  put(1.55, C.z1 - .8, D + 2.15, true); out.down = walk(80);
  put(0, C.z1 + 1.5, D, false); out.cabin = walk(70);
  put(1.1, C.z1 + 1.5, D, false); out.bulk = walk(60);
  put(1.55, C.z1 + .7, D, false); out.under = walk(40);
  put(.8, C.z1 - 1.0, D + 2.15, true); out.rail = walk(60);
  put(0, m.userData.helm.z, D, true); pitch = .5; _drive(() => false, 3); out.promptDown = shipPrompt();
  put(0, m.userData.helm.z, D + 2.15, true); pitch = -.25; _drive(() => false, 3); out.promptUp = shipPrompt();
  out.take = shipInteract(); out.sailing = SHIP.sailing; _drive(() => false, 20); out.atHelm = loc(); shipInteract();
  sc.remove(SHIP.mesh); SHIP.mesh = null; worldState.ship = was; return out; });
console.log(JSON.stringify(cv));
if (cv.bake.kit) {
  check('your caravel is the kit\'s Aurenne caravel: three lateens, under 36,000 triangles and 20 draws, her castle 2.15 m over the deck', cv.bake.dress === 'aurenne' && cv.key === 'caravel|player|aurenne' && cv.bake.rigs === 'lateen,lateen,lateen' && cv.bake.tris < 36000 && cv.bake.draws <= 20 && Math.abs(cv.bake.castleY - 3.15) < .01, cv.bake);
  check('her hold\'s stowage keeps forward of the castle and its ladders, enough for her base hold three high', cv.slots * 3 >= 55, cv.slots);
  check('up the ladder to stand on the castle, and down it again to the deck', cv.up.end[2] === 2.15 && cv.up.end[1] < cv.z1 && !cv.up.swim && cv.down.end[2] === 0 && cv.down.end[1] > cv.z1 + cv.lad && !cv.down.swim, [cv.up, cv.down]);
  check('through the doorway into the cabin under the castle, on the main deck', cv.cabin.end[1] < cv.z1 - 2 && cv.cabin.top === 0, cv.cabin);
  check('the bulkhead stops you on the deck, under a ladder too; the castle\'s rail stops you up there', cv.bulk.end[1] > cv.z1 + .3 && cv.under.end[1] > cv.z1 + .3 && cv.under.top === 0 && cv.rail.end[1] < cv.z1 - .3 && cv.rail.end[2] === 2.15, [cv.bulk, cv.under, cv.rail]);
  check('the wheel answers from the castle, not from the cabin under it, and takes you to the helm up there', cv.promptDown === null && /pilot/.test(cv.promptUp || '') && cv.take && cv.sailing && cv.atHelm[2] === 2.15, [cv.promptDown, cv.promptUp, cv.atHelm]);
  await inspShots(g, [[key('caravel/player'), 'shipdress-caravel.png', 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;']]);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
