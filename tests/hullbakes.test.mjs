// Session 665 (Michael's A on DECISION #202): the Mark's cutter and Aurenne's caravel on hulls of their own, as the
// Session 643 prototype showed them. The bakes, their sizes and rigs, the caravel's lateens trimmed to leeward, your own
// ship taking her class's hull, the three older hulls untouched; writes docs/prototypes/shiphulls-ingame-*.png and, since
// Session 1538, shipdress-*.png (your sloop in each island's dress). Session 1544: your caravel is the kit's Aurenne caravel, her
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
// Session 1544: your caravel on the new look is the kit's Aurenne caravel. Her sterncastle is a deck 2.15 m over the main one: up its
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
  /* S1565: the cabin furnished; beside the bunk *Your berth — press 'E' to rest*, and E opens the rest slip; the bunk is a solid you walk into */
  const Bt = m.userData.berth; out.berth = Bt; out.cabinItems = (shipBake('caravel', 'player').kit.cabinItems || []).map(q => q.name).join();
  if (Bt) { put(Bt.x, Bt.z, D, false); yaw = ry + Math.PI / 2; _drive(() => false, 3); out.berthPrompt = shipPrompt(); out.rest = shipInteract(); out.slip = sleepOpen; closeSleepUI();
    put(Bt.x + .4, Bt.z, D, false); yaw = ry + Math.PI / 2; out.intoBunk = walk(60); put(0, Bt.z, D + 2.15, false); _drive(() => false, 3); out.berthUp = shipPrompt(); }
  sc.remove(SHIP.mesh); SHIP.mesh = null; worldState.ship = was; return out; });
console.log(JSON.stringify(cv));
if (cv.bake.kit) {
  check('your caravel is the kit\'s Aurenne caravel: three lateens, under 36,000 triangles and 20 draws, her castle 2.15 m over the deck', cv.bake.dress === 'aurenne' && cv.key === 'caravel|player|aurenne' && cv.bake.rigs === 'lateen,lateen,lateen' && cv.bake.tris < 36000 && cv.bake.draws <= 20 && Math.abs(cv.bake.castleY - 3.15) < .01, cv.bake);
  check(`her cabin under the castle is furnished (${cv.cabinItems}); beside the bunk "${cv.berthPrompt}", and E opens the rest slip; the bunk stops you; not from the castle over it`, /bunk/.test(cv.cabinItems) && /chart table/.test(cv.cabinItems) && /rest/.test(cv.berthPrompt || '') && cv.rest && cv.slip && cv.intoBunk.end[0] > cv.berth.x - .45 && cv.intoBunk.top === 0 && !/rest/.test(cv.berthUp || ''), [cv.berth, cv.berthPrompt, cv.rest, cv.slip, cv.intoBunk, cv.berthUp]);
  check('her hold\'s stowage keeps forward of the castle and its ladders, enough for her base hold three high', cv.slots * 3 >= 55, cv.slots);
  check('up the ladder to stand on the castle, and down it again to the deck', cv.up.end[2] === 2.15 && cv.up.end[1] < cv.z1 && !cv.up.swim && cv.down.end[2] === 0 && cv.down.end[1] > cv.z1 + cv.lad && !cv.down.swim, [cv.up, cv.down]);
  check('through the doorway into the cabin under the castle, on the main deck', cv.cabin.end[1] < cv.z1 - 2 && cv.cabin.top === 0, cv.cabin);
  check('the bulkhead stops you on the deck, under a ladder too; the castle\'s rail stops you up there', cv.bulk.end[1] > cv.z1 + .3 && cv.under.end[1] > cv.z1 + .3 && cv.under.top === 0 && cv.rail.end[1] < cv.z1 - .3 && cv.rail.end[2] === 2.15, [cv.bulk, cv.under, cv.rail]);
  check('the wheel answers from the castle, not from the cabin under it, and takes you to the helm up there', cv.promptDown === null && /pilot/.test(cv.promptUp || '') && cv.take && cv.sailing && cv.atHelm[2] === 2.15, [cv.promptDown, cv.promptUp, cv.atHelm]);
  await inspShots(g, [[key('caravel/player'), 'shipdress-caravel.png', 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;']]);
}
// Session 1551: your cog on the new look is the kit's cog in the yard's dress (#839 A): the square sail with the harp, the Mark's gaff,
// Aurenne's lateen. Her aftcastle is walked as the caravel's; her forecastle is a deck 2.15 m up too, open beneath on two posts, its
// ladder up the middle running aft from its edge: up it you stand on the forecastle, under it you walk at the deck's height to the bow.
/* Session 1552: the galleon walked the same way (shipWalk's arguments: her class, length, beam, the dress she is walked in, the aftcastle's ladder's x) */
const shipWalk = ([cls, Ln, Wd, wdr, alx]) => { const out = {}, was = worldState.ship;
  for (const dr of ['gatelands', 'mark', 'aurenne']) { worldState.ship = { cls, dress: dr }; const m = WORLD.buildShipMesh(Ln, Wd), b = shipBake(cls, 'player'); shipTrim(m, Math.PI / 2); const a = m.userData.rigs.map(q => +q.m.rotation.y.toFixed(2)); shipTrim(m, -Math.PI / 2);
    out[dr] = { kit: !!b.kit, dress: b.kit && b.kit.dress, key: m.userData.bakeKey, tris: b.kit && b.kit.tris, draws: b.kit && b.kit.draws, rigs: b.rigs.map(q => q.type).join(), a, c: m.userData.rigs.map(q => +q.m.rotation.y.toFixed(2)), fore: b.fore && b.fore.y, hatchZ: b.hatchZ, stow: ((shipStowSlots(m.userData.bakeKey) || {}).slots || []).length }; }
  if (!out.gatelands.kit) { worldState.ship = was; return out; }
  closeInspector(); /* the caravel's pictures left it open, and it takes the loop's frames */
  const s = WORLD.allPorts().sort((a, c) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(c.x - px, c.z - pz))[0];
  let sx = null, sz = null; for (let rr = 300; rr < 3000 && sx === null; rr += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * rr, z = s.z + Math.sin(a) * rr;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; }
  worldState.ship = { cls, dress: wdr, name: 'Test Ship', sails: 0, cargo: 0 }; WORLD.spawnShip(sx, sz, -1.1);
  const m = SHIP.mesh, C = m.userData.castle, F = m.userData.fore, D = DECK_Y, ry = m.rotation.y; out.walkKey = m.userData.bakeKey; out.C = [C.z1, C.lad]; out.F = [F.z0, F.lad, F.z1];
  const put = (lx, lz, jy, fwd) => { m.updateMatrixWorld(true); const v = new THREE.Vector3(lx, 1, lz).applyMatrix4(m.matrixWorld); px = v.x; pz = v.z; jumpY = jy; velY = 0; onGround = true; yaw = fwd ? ry + Math.PI : ry; pitch = 0; };
  const loc = () => { const [lx, lz] = shipLocal(m, px, pz); return [+lx.toFixed(2), +lz.toFixed(2), +(jumpY - D).toFixed(2)]; };
  const walk = n => { let top = -9; _drive(() => { PHP = maxHP; stamina = maxStamina; K['KeyW'] = true; top = Math.max(top, jumpY - D); }, n); return { end: loc(), top: +top.toFixed(2), swim: isSwimming() }; };
  put(0, F.z0 - 1.7, D, true); out.fup = walk(80);
  put(0, F.z0 + .8, D + 2.15, false); out.fdown = walk(80);
  put(1.0, F.z0 - 1.5, D, true); out.under = walk(80);
  put(1.0, F.z0 + 1.2, D + 2.15, false); out.frail = walk(60);
  put(0, F.z0 + .7, D, false); out.ladUnder = walk(40);
  put(0, F.z0 + 1.2, D + 2.15, true); out.bow = walk(80);
  put(alx, C.z1 + 1.7, D, false); out.aup = walk(80);
  put(0, C.z1 + .9, D, false); out.cabin = walk(70);
  cabinUpdate(); { const h = CABIN.house; out.exit = shipLocal(m, h.exitX, h.exitZ).map(v => +v.toFixed(2)); out.exitFree = !shipPropSolid(h.exitX, h.exitZ); }
  put(0, m.userData.helm.z, D + 2.15, true); pitch = -.25; _drive(() => false, 3); out.promptUp = shipPrompt();
  out.take = shipInteract(); out.sailing = SHIP.sailing; _drive(() => false, 20); out.atHelm = loc(); shipInteract();
  /* S1579: the cog's cabin furnished, her berth beside the bunk as the caravel's */
  const Bt = m.userData.berth; out.berth = Bt; out.cabinItems = (shipBake(cls, 'player').kit.cabinItems || []).map(q => q.name).join();
  if (Bt) { put(Bt.x, Bt.z, D, false); yaw = ry + Math.PI / 2; _drive(() => false, 3); out.berthPrompt = shipPrompt(); out.rest = shipInteract(); out.slip = sleepOpen; closeSleepUI();
    put(Bt.x + .4, Bt.z, D, false); yaw = ry + Math.PI / 2; out.intoBunk = walk(60); put(0, Bt.z, D + 2.15, false); _drive(() => false, 3); out.berthUp = shipPrompt(); }
  sc.remove(SHIP.mesh); SHIP.mesh = null; worldState.ship = was; return out; };
const cg = await page.evaluate(shipWalk, ['cog', 17, 5.6, 'mark', 1.6]);
console.log(JSON.stringify(cg));
const gl = cg.gatelands.kit ? await page.evaluate(shipWalk, ['galleon', 22, 7, 'aurenne', 2.0]) : null; console.log(JSON.stringify(gl));
if (cg.gatelands.kit) {
  check(`her cabin under the aftcastle is furnished (${cg.cabinItems}); beside the bunk "${cg.berthPrompt}", and E opens the rest slip; the bunk stops you; not from the castle over it`, /bunk/.test(cg.cabinItems) && /chart table/.test(cg.cabinItems) && /rest/.test(cg.berthPrompt || '') && cg.rest && cg.slip && cg.intoBunk.end[0] > cg.berth.x - .45 && cg.intoBunk.top === 0 && !/rest/.test(cg.berthUp || ''), [cg.berth, cg.berthPrompt, cg.rest, cg.slip, cg.intoBunk, cg.berthUp]);
  check('your cog bakes in the yard\'s three dresses, each under 36,000 triangles and 16 draws, both castles 2.15 m over the deck', ['gatelands', 'mark', 'aurenne'].every(k => cg[k].dress === k && cg[k].key === 'cog|player|' + k && cg[k].tris < 36000 && cg[k].draws <= 16 && Math.abs(cg[k].fore - 3.15) < .01), ['gatelands', 'mark', 'aurenne'].map(k => [k, cg[k].tris, cg[k].draws, cg[k].fore]));
  check('each island its rig on the cog: the square sail, the gaff, the lateen; the gaff and the lateen swing to leeward and over', cg.gatelands.rigs === 'square' && cg.mark.rigs === 'gaff' && cg.aurenne.rigs === 'lateen' && cg.mark.a[0] < -.2 && cg.mark.c[0] > .2 && cg.aurenne.a[0] < -.1 && cg.aurenne.c[0] > .1, [cg.mark.a, cg.mark.c, cg.aurenne.a, cg.aurenne.c]);
  check('her hold\'s stowage stands between the castles, off the ladders, enough for her 60 three high, the same in every dress', ['gatelands', 'mark', 'aurenne'].every(k => cg[k].stow === cg.gatelands.stow) && cg.gatelands.stow * 3 >= 60, ['gatelands', 'mark', 'aurenne'].map(k => cg[k].stow));
  check('up the forecastle\'s ladder to stand on it, and down it again to the deck', cg.fup.end[2] === 2.15 && cg.fup.end[1] > cg.F[0] && !cg.fup.swim && cg.fdown.end[2] === 0 && cg.fdown.end[1] < cg.F[0] - cg.F[1] && !cg.fdown.swim, [cg.fup, cg.fdown]);
  check('under the forecastle at the deck\'s height, past its posts towards the bow', cg.under.end[1] > cg.F[0] + .8 && cg.under.top === 0 && !cg.under.swim, cg.under);
  check('the forecastle\'s rail stops you up there; nobody walks in under its ladder from the bow', cg.frail.end[1] > cg.F[0] + .2 && cg.frail.end[2] === 2.15 && cg.ladUnder.end[1] > cg.F[0] - .1 && cg.ladUnder.top < .5, [cg.frail, cg.ladUnder]);
  check('the forecastle\'s forward end stops you at the bow up there', cg.bow.end[2] === 2.15 && cg.bow.end[1] < cg.F[2] - .2, cg.bow);
  check('the aftcastle as the caravel\'s: up its ladder, the cabin through the doorway, the wheel from up there', cg.aup.end[2] === 2.15 && cg.aup.end[1] < cg.C[0] && cg.aup.end[1] > -8.5 + .3 /* the after end stops you */ && cg.cabin.end[1] < cg.C[0] - 1.5 && cg.cabin.top === 0 && cg.exitFree && /pilot/.test(cg.promptUp || '') && cg.take && cg.atHelm[2] === 2.15, [cg.aup, cg.cabin, cg.exit, cg.exitFree, cg.promptUp, cg.atHelm]);
  for (const k of ['gatelands', 'mark', 'aurenne']) { await page.evaluate(([dr, sk]) => { if (!INSPECTOR.open) openInspector(); worldState.ship = Object.assign(worldState.ship || {}, { dress: dr }); INSPECTOR.select('ships/sloop/player'); const e = INSPECTOR.entries.find(x => x.key === sk); INSPECTOR.built.delete(e.id); }, [k, key('cog/player')]);
    await inspShots(g, [[key('cog/player'), `shipdress-cog-${k}.png`, 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;']]); }
}
// Session 1552: your galleon on the new look is the kit's galleon in the yard's dress: the Gatelands' squares with the harp and the gaff
// mizzen, the same in the Mark's tanned cloths, Aurenne's square fore between two lateens; her quarterdeck and forecastle walked as the cog's
// (in Aurenne's dress, whose main and mizzen are raked)
if (gl && gl.gatelands.kit) {
  check(`her great cabin under the quarterdeck is furnished (${gl.cabinItems}); beside the bed "${gl.berthPrompt}", and E opens the rest slip; the bed stops you; not from the quarterdeck over it`, /bunk/.test(gl.cabinItems) && /captain's table/.test(gl.cabinItems) && /chart table/.test(gl.cabinItems) && /firebox/.test(gl.cabinItems) && /water cask/.test(gl.cabinItems) /* S1585: her galley */ && /rest/.test(gl.berthPrompt || '') && gl.rest && gl.slip && gl.intoBunk.end[0] > gl.berth.x - .45 && gl.intoBunk.top === 0 && !/rest/.test(gl.berthUp || ''), [gl.berth, gl.berthPrompt, gl.rest, gl.slip, gl.intoBunk, gl.berthUp]);
  check('your galleon bakes in the yard\'s three dresses, each under 40,000 triangles and 20 draws, both castles 2.15 m over the deck', ['gatelands', 'mark', 'aurenne'].every(k => gl[k].dress === k && gl[k].key === 'galleon|player|' + k && gl[k].tris < 40000 && gl[k].draws <= 20 && Math.abs(gl[k].fore - 3.15) < .01), ['gatelands', 'mark', 'aurenne'].map(k => [k, gl[k].tris, gl[k].draws, gl[k].fore]));
  check('each island its rig on the galleon: two squares and the gaff mizzen, the same in the Mark\'s, Aurenne\'s square fore between lateens; all trim to leeward and over', gl.gatelands.rigs === 'square,square,gaff' && gl.mark.rigs === 'square,square,gaff' && gl.aurenne.rigs === 'lateen,square,lateen' && gl.mark.a[2] < -.2 && gl.mark.c[2] > .2 && gl.aurenne.a[0] < -.1 && gl.aurenne.c[2] > .1 && gl.gatelands.a[0] > .3 && gl.gatelands.c[0] < -.3, [gl.gatelands.a, gl.gatelands.c, gl.aurenne.a, gl.aurenne.c]);
  check('her hold\'s stowage stands between the castles, off the ladders and both hatches, enough for her 90 three high', ['gatelands', 'mark', 'aurenne'].every(k => gl[k].stow * 3 >= 90), ['gatelands', 'mark', 'aurenne'].map(k => gl[k].stow));
  check('up the forecastle\'s ladder and down again; under it at the deck\'s height; its rail and forward end stop you up there', gl.fup.end[2] === 2.15 && gl.fup.end[1] > gl.F[0] && !gl.fup.swim && gl.fdown.end[2] === 0 && gl.fdown.end[1] < gl.F[0] - gl.F[1] && gl.under.end[1] > gl.F[0] + .8 && gl.under.top === 0 && gl.frail.end[1] > gl.F[0] + .2 && gl.frail.end[2] === 2.15 && gl.ladUnder.top < .5 && gl.bow.end[2] === 2.15 && gl.bow.end[1] < gl.F[2] - .2, [gl.fup, gl.fdown, gl.under, gl.frail, gl.ladUnder, gl.bow]);
  check('the quarterdeck: up its ladder, the great cabin through the doorway, the way below clear, the wheel from up there', gl.aup.end[2] === 2.15 && gl.aup.end[1] < gl.C[0] && gl.aup.end[1] > -11 + .3 && gl.cabin.end[1] < gl.C[0] - 1.5 && gl.cabin.top === 0 && gl.exitFree && /pilot/.test(gl.promptUp || '') && gl.take && gl.atHelm[2] === 2.15, [gl.aup, gl.cabin, gl.exit, gl.exitFree, gl.promptUp, gl.atHelm]);
  for (const k of ['gatelands', 'mark', 'aurenne']) { await page.evaluate(([dr, sk]) => { if (!INSPECTOR.open) openInspector(); worldState.ship = Object.assign(worldState.ship || {}, { dress: dr }); INSPECTOR.select('ships/sloop/player'); const e = INSPECTOR.entries.find(x => x.key === sk); INSPECTOR.built.delete(e.id); }, [k, key('galleon/player')]);
    await inspShots(g, [[key('galleon/player'), `shipdress-galleon-${k}.png`, 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;']]); }
}
/* Session 1555 (backlog L6; Michael's A on #418: the base in the hull's own lines): below deck on your kit sloop is her hold, built
   inside her own planking (PKIT.ships.sloopBase), the ladder's foot its door; the berth rests, the sea chest is the stash */
const hd = {};
for (const dr of ['gatelands', 'mark', 'aurenne']) {
  await page.evaluate((d) => { if (typeof INSPECTOR !== 'undefined' && INSPECTOR.open) closeInspector(); /* the inspector holds the loop's frame */ if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
    worldState.ship = { cls: 'sloop', dress: d, name: 'Test Gull', sails: 0, cargo: 0 }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = false; cabinUpdate(); goToInterior(CABIN.house); }, dr);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!currentHouse._base)); k++) await page.waitForTimeout(250);
  hd[dr] = await page.evaluate(() => { const h = currentHouse, B = h._base; if (!B) return { base: false };
    const walk = (x, z, yw, n) => { px = x; pz = z; yaw = yw; pitch = 0; jumpY = 0; velY = 0; onGround = true; _drive(() => { K['KeyW'] = true; }, n); return [+px.toFixed(2), +pz.toFixed(2)]; };
    const o = { base: true, tris: B.tris, draws: B.draws, W: h.intW, D: h.intD, roomH: h._roomH, eye: h._eyeMax, beds: INT_BEDS.length, stash: !!intStashPos, hatch: B.hatch, arrive: [px, pz] };
    o.fwd = walk(h._arriveX, h._arriveZ, 0, 150); o.port = walk(h._arriveX, 3.5, -Math.PI / 2, 80); o.stbd = walk(h._arriveX, 3.5, Math.PI / 2, 80);
    _drive(() => false, 20); o.cam = +CAM.position.y.toFixed(2);
    const b = INT_BEDS[0]; px = h._arriveX - .1; pz = b.z; yaw = -Math.PI / 2; pitch = -.4; CAM.position.set(px, 1.3, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); o.bed = !!intBedTarget();
    px = h._arriveX; pz = h._arriveZ; o.exitText = h._exitText; o.out = (interact(), 0); return o; });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  hd[dr].left = await page.evaluate(() => !isInterior());
}
console.log(JSON.stringify(hd));
check('below deck on your sloop is her hold in her own lines, in all three dresses: 4.4 by 6 m, 1.75 m to the deck, under 32,000 triangles and 24 draws', ['gatelands', 'mark', 'aurenne'].every(k => hd[k].base && hd[k].D === 6 && hd[k].roomH === 1.75 && hd[k].tris < 32000 && hd[k].draws <= 24), hd);
check('her hatch is aft of the mast, where the hold\'s ladder comes up', ['gatelands', 'mark', 'aurenne'].every(k => hd[k].hatch && Math.abs((hd[k].hatch.z0 + hd[k].hatch.z1) / 2 + 2) < .01), hd.gatelands.hatch);
check('you come down at the ladder\'s foot and walk forward to the berth and the chest, stooped under the beams (the eye at 1.38)', ['gatelands', 'mark', 'aurenne'].every(k => hd[k].fwd[1] < hd[k].arrive[1] - 2 && hd[k].fwd[1] > 2 && hd[k].eye < 1.45 && hd[k].cam < 1.45), ['gatelands', 'mark', 'aurenne'].map(k => [hd[k].fwd, hd[k].cam]));
check('the planking stops you on either side, inside the hull', ['gatelands', 'mark', 'aurenne'].every(k => hd[k].port[0] > 2.2 && hd[k].port[0] < 3.2 && hd[k].stbd[0] < 2.2 && hd[k].stbd[0] > 1.2), ['gatelands', 'mark', 'aurenne'].map(k => [hd[k].port, hd[k].stbd]));
check('the berth rests (and saves), the chest is the stash, and E at the ladder\'s foot takes you on deck', ['gatelands', 'mark', 'aurenne'].every(k => hd[k].beds === 1 && hd[k].bed && hd[k].stash && /on deck/.test(hd[k].exitText) && hd[k].left), hd);
/* Session 1558 (backlog L6; #418 A): and below deck on your kit cutter is hers (PKIT.ships.cutterBase): 0.4 m deeper, so you stand up
   between the beams; the ladder's foot is mid-hold, the berth and the chart table aft of it, the chest and the workbench forward */
await page.evaluate(() => { if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = { cls: 'cutter', name: 'Test Tern', sails: 0, cargo: 0 }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = false; cabinUpdate(); goToInterior(CABIN.house); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!currentHouse._base)); k++) await page.waitForTimeout(250);
const ct = await page.evaluate(() => { const h = currentHouse, B = h._base; if (!B || B.kind !== 'cutter') return { base: !!B };
  const walk = (x, z, yw, n) => { px = x; pz = z; yaw = yw; pitch = 0; jumpY = 0; velY = 0; onGround = true; _drive(() => { K['KeyW'] = true; }, n); return [+px.toFixed(2), +pz.toFixed(2)]; };
  const o = { base: true, tris: B.tris, draws: B.draws, W: h.intW, D: h.intD, roomH: h._roomH, eye: h._eyeMax, beds: INT_BEDS.length, stash: !!intStashPos, hatch: B.hatch, arrive: [px, pz], exitZ: h._exitZ, sols: INT_SOL.length };
  o.fwd = walk(h._arriveX - .2, h._arriveZ, 0, 200); o.aft = walk(h._arriveX - .3, h._arriveZ, Math.PI, 200); /* the gangway: 0.2 m to starboard of the keel between the chest and the bench, 0.3 past the berth's front */ o.port = walk(h._arriveX, 4, -Math.PI / 2, 80); o.stbd = walk(h._arriveX, 4, Math.PI / 2, 80);
  _drive(() => false, 20); o.cam = +CAM.position.y.toFixed(2);
  /* S1572 (the critic's s1030): in third person the camera keeps under the beams and stands behind you, not in the timber */
  thirdPerson = true; TP.want = 1.94; TP.cur = 0; px = h._arriveX; pz = h._arriveZ - 1; yaw = 0; pitch = -.15; _drive(() => false, 60); o.tp = [+CAM.position.y.toFixed(2), +TP.near.toFixed(2)]; o.beamUnder = +(B.beamBottom - B.floor).toFixed(2); thirdPerson = false;
  px = h._arriveX; pz = h._arriveZ - 3; o.exitFar = intExitZ(h, pz, h._roomD || h.intD); px = h._bench.x + .9; pz = h._bench.z; o.bench = benchNear();
  const b = INT_BEDS[0]; px = h._arriveX - .1; pz = b.z; yaw = -Math.PI / 2; pitch = -.4; CAM.position.set(px, 1.5, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); o.bed = !!intBedTarget(); o.bedExit = intExitZ(h, pz, h._roomD || h.intD);
  px = h._arriveX; pz = h._arriveZ; updateHUD(); o.hud = document.getElementById('ob').textContent; o.out = (interact(), 0); return o; });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
ct.left = await page.evaluate(() => !isInterior());
console.log(JSON.stringify(ct));
check(`below deck on your cutter is her hold in her own lines: ${ct.W} by ${ct.D} m, ${ct.roomH} m to the deck, ${ct.tris} triangles in ${ct.draws} draws`, ct.base && ct.W === 4 && ct.D === 7.8 && ct.roomH > 1.8 && ct.tris < 36000 && ct.draws <= 26, ct);
check(`her hatch is aft of the mast at z -1.05, and the eye stands at ${ct.eye} (under the beams, over the sloop's 1.38)`, ct.hatch && Math.abs((ct.hatch.z0 + ct.hatch.z1) / 2 + 1.05) < .01 && ct.eye > 1.45 && ct.eye <= 1.65 && ct.cam > 1.45, [ct.hatch, ct.eye, ct.cam]);
check('from the ladder\'s foot mid-hold you walk forward to the stores and aft to the bulkhead; the planking stops you either side', ct.fwd[1] < ct.arrive[1] - 3 && ct.aft[1] > ct.arrive[1] + 1.5 && ct.aft[1] < 7.8 && ct.port[0] > 2 && ct.port[0] < 3.2 && ct.stbd[0] < 2 && ct.stbd[0] > .8, [ct.arrive, ct.fwd, ct.aft, ct.port, ct.stbd]);
check('the berth rests, the chest is the stash, the workbench is the bench (E at it), and E at the ladder\'s foot (only there) takes you on deck', ct.beds === 1 && ct.bed && !ct.bedExit && ct.stash && ct.bench && !ct.exitFar && ct.left, ct);
/* Session 1564 (backlog L6; #418 A): and below deck on your caravel is her hold (PKIT.ships.caravelBase): under the main deck from the
   cabin's bulkhead to the stem's, the ladder's foot mid-hold by the main mast; the workbench and the alchemist's table aft past the two
   chests, the barrels forward. Her berth is in the cabin under the castle, not here */
await page.evaluate(() => { if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = { cls: 'caravel', name: 'Test Swift', sails: 0, cargo: 0 }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = false; cabinUpdate(); goToInterior(CABIN.house); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!currentHouse._base)); k++) await page.waitForTimeout(250);
const cvh = await page.evaluate(() => { const h = currentHouse, B = h._base; if (!B || B.kind !== 'caravel') return { base: !!B };
  const walk = (x, z, yw, n) => { px = x; pz = z; yaw = yw; pitch = 0; jumpY = 0; velY = 0; onGround = true; _drive(() => { K['KeyW'] = true; }, n); return [+px.toFixed(2), +pz.toFixed(2)]; };
  /* a walk by waypoints, each leg along one axis: round the main mast to port, between the chests, to the bench past the alchemist's table */
  const route = pts => { px = pts[0][0]; pz = pts[0][1]; jumpY = 0; velY = 0; onGround = true; let i = 1;
    _drive(() => { const [tx, tz] = pts[i], dx = tx - px, dz = tz - pz; if (Math.hypot(dx, dz) < .12) return ++i >= pts.length; yaw = Math.atan2(-dx, -dz); pitch = 0; K['KeyW'] = true; return false; }, 900); return { legs: i - 1, at: [+px.toFixed(2), +pz.toFixed(2)] }; };
  const o = { base: true, tris: B.tris, draws: B.draws, W: h.intW, D: h.intD, roomH: h._roomH, eye: h._eyeMax, beds: INT_BEDS.length, stash: !!intStashPos, hatch: B.hatch, arrive: [px, pz], exitZ: h._exitZ };
  o.fwd = walk(h._arriveX, h._arriveZ, 0, 250); o.port = walk(h._arriveX, 3, -Math.PI / 2, 80); o.stbd = walk(h._arriveX, 3, Math.PI / 2, 80);
  o.route = route([[h._arriveX, h._arriveZ], [h._arriveX + .6, h._arriveZ], [h._arriveX + .6, 6.15], [2.2, 6.15], [2.2, 7.75], [2.5, 7.75], [2.5, 8.7]]);
  _drive(() => false, 20); o.cam = +CAM.position.y.toFixed(2); o.bench = benchNear(); o.benchExit = intExitZ(h, pz, h._roomD || h.intD);
  px = h._arriveX; pz = h._arriveZ; o.out = (interact(), 0); return o; });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
cvh.left = await page.evaluate(() => !isInterior());
console.log(JSON.stringify(cvh));
check(`below deck on your caravel is her hold in her own lines: ${cvh.W} by ${cvh.D} m, ${cvh.roomH} m to the deck, ${cvh.tris} triangles in ${cvh.draws} draws`, cvh.base && cvh.W === 5 && cvh.D === 9.8 && cvh.roomH > 1.8 && cvh.tris < 38000 && cvh.draws <= 26, cvh);
check(`her hatch is between the main mast and the fore at z 2.8, and the eye stands at ${cvh.eye}`, cvh.hatch && Math.abs((cvh.hatch.z0 + cvh.hatch.z1) / 2 - 2.8) < .01 && cvh.eye > 1.45 && cvh.eye <= 1.65 && cvh.cam > 1.45, [cvh.hatch, cvh.eye, cvh.cam]);
check('from the ladder\'s foot you walk forward to the barrels, and round the main mast and between the chests aft to the bench; the planking stops you either side', cvh.fwd[1] < cvh.arrive[1] - 1.5 && cvh.route.legs === 6 && cvh.route.at[1] > 8.5 && cvh.port[0] > 2.5 && cvh.port[0] < 3.6 && cvh.stbd[0] < 2.5 && cvh.stbd[0] > 1.4, [cvh.arrive, cvh.fwd, cvh.route, cvh.port, cvh.stbd]);
check('the starboard chest is the stash, the workbench is the bench (E at it, clear of the way out), no berth below, and E at the ladder\'s foot takes you on deck', cvh.beds === 0 && cvh.stash && cvh.bench && !cvh.benchExit && cvh.left, cvh);
/* Session 1578 (backlog L6; #418 A): and below deck on your cog is her hold (PKIT.ships.cogBase, shipbase.js's shipBase) in her yard's
   dress: from under the aftcastle's bulkhead to under the forecastle's edge, the ladder's foot at the hatch's after end, the mast through
   it; round the mast to port and on to the bench and the chests forward; the alchemist's table aft. Her berth will be in the cabin */
await page.evaluate(() => { if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = { cls: 'cog', name: 'Test Cog', sails: 0, cargo: 0, dress: 'mark' }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = false; cabinUpdate(); goToInterior(CABIN.house); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!currentHouse._base)); k++) await page.waitForTimeout(250);
const cgh = await page.evaluate(() => { const h = currentHouse, B = h._base; if (!B || B.kind !== 'cog') return { base: !!B };
  const route = pts => { px = pts[0][0]; pz = pts[0][1]; jumpY = 0; velY = 0; onGround = true; let i = 1;
    _drive(() => { const [tx, tz] = pts[i], dx = tx - px, dz = tz - pz; if (Math.hypot(dx, dz) < .12) return ++i >= pts.length; yaw = Math.atan2(-dx, -dz); pitch = 0; K['KeyW'] = true; return false; }, 900); return { legs: i - 1, at: [+px.toFixed(2), +pz.toFixed(2)] }; };
  const a = [h._arriveX, h._arriveZ], o = { base: true, dress: B.dress, tris: B.tris, draws: B.draws, W: h.intW, D: h.intD, roomH: h._roomH, eye: h._eyeMax, beds: INT_BEDS.length, hatch: B.hatch, arrive: a };
  o.bench = route([a, [3.42, a[1] - .4], [3.42, 4.4], [3.1, 4.3], [3.1, 2.9]]); o.benchNear = benchNear();
  o.chests = route([a, [3.42, a[1] - .4], [3.42, 4.4], [2.8, 4.3], [2.8, 1.2]]); o.stash = +Math.hypot(px - intStashPos.x, pz - intStashPos.z).toFixed(2);
  o.alch = route([a, [2.0, a[1]], [2.0, 8.0], [1.6, 8.6]]); o.side = route([a, [4.6, a[1]]]);
  px = a[0]; pz = a[1]; o.out = (interact(), 0); return o; });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
cgh.left = await page.evaluate(() => !isInterior());
console.log(JSON.stringify(cgh));
check(`below deck on your cog is her hold in her own lines (the Mark's): ${cgh.W} by ${cgh.D} m, ${cgh.roomH} m to the deck, the eye at ${cgh.eye}, ${cgh.tris} triangles in ${cgh.draws} draws`, cgh.base && cgh.dress === 'mark' && cgh.W === 5.6 && cgh.D === 11 && cgh.roomH > 1.8 && cgh.eye > 1.4 && cgh.tris < 36000 && cgh.draws <= 24 && cgh.hatch && Math.abs((cgh.hatch.z0 + cgh.hatch.z1) / 2 + 2.1) < .01, cgh);
check('in the cog\'s hold you walk round the mast to the bench (E at it) and on to the chests (the stash), and aft to the alchemist\'s table; the barrels stop you to port; E at the ladder takes you on deck',
  cgh.bench.legs === 4 && cgh.benchNear && cgh.chests.legs === 4 && cgh.stash < 1.3 && cgh.alch.legs === 3 && cgh.side.at[0] < 3.5 && cgh.beds === 0 && cgh.left, cgh);
/* Session 1584 (backlog L6; #418 A): and below deck on your galleon is her hold (PKIT.ships.galleonBase, shipbase.js's galleonBase) in
   her yard's dress, Aurenne's here (her main mast raked): from under the quarterdeck's bulkhead to aft of the forecastle, both hatches open,
   the ladder's foot aft; forward between the chests, round the main mast, between the barrels and the hammocks to the fore mast */
await page.evaluate(() => { if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = { cls: 'galleon', name: 'Test Galleon', sails: 0, cargo: 0, dress: 'aurenne' }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = false; cabinUpdate(); goToInterior(CABIN.house); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && !!currentHouse._base)); k++) await page.waitForTimeout(250);
const glh = await page.evaluate(() => { const h = currentHouse, B = h._base; if (!B || B.kind !== 'galleon') return { base: !!B };
  const route = pts => { px = pts[0][0]; pz = pts[0][1]; jumpY = 0; velY = 0; onGround = true; let i = 1;
    _drive(() => { const [tx, tz] = pts[i], dx = tx - px, dz = tz - pz; if (Math.hypot(dx, dz) < .12) return ++i >= pts.length; yaw = Math.atan2(-dx, -dz); pitch = 0; K['KeyW'] = true; return false; }, 1200); return { legs: i - 1, at: [+px.toFixed(2), +pz.toFixed(2)] }; };
  const a = [h._arriveX, h._arriveZ], o = { base: true, dress: B.dress, tris: B.tris, draws: B.draws, W: h.intW, D: h.intD, roomH: h._roomH, eye: h._eyeMax, beds: INT_BEDS.length, hatches: (B.hatches || []).length, arrive: a };
  o.fwd = route([a, [3.5, 7.9], [4.12, 7.9], [4.12, 6.43], [3.5, 6.43], [3.5, 2.3]]);
  o.hammock = route([[3.5, 2.9], [4.8, 2.9]]); o.stash = route([a, [3.5, 8.7]]); o.stashD = +Math.hypot(px - intStashPos.x, pz - intStashPos.z).toFixed(2);
  o.bench = route([a, [3.8, 10.55]]); o.benchNear = benchNear(); o.benchExit = intExitZ(h, pz, h._roomD || h.intD);
  px = a[0]; pz = a[1]; o.out = (interact(), 0); return o; });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
glh.left = await page.evaluate(() => !isInterior());
console.log(JSON.stringify(glh));
check(`below deck on your galleon is her hold in her own lines (Aurenne's): ${glh.W} by ${glh.D} m, ${glh.roomH} m to the deck, the eye at ${glh.eye}, ${glh.tris} triangles in ${glh.draws} draws`, glh.base && glh.dress === 'aurenne' && glh.W === 7 && Math.abs(glh.D - 11.7) < .01 && glh.roomH > 1.9 && glh.eye > 1.6 && glh.tris < 40000 && glh.draws <= 26 && glh.hatches === 2, glh);
check('in the galleon\'s hold you walk forward between the chests (the stash), round the main mast, between the barrels and the hammocks to the fore mast; a hammock stops you; the bench is E at it, clear of the way out; E at the ladder takes you on deck',
  glh.fwd.legs === 5 && glh.hammock.at[0] < 3.95 && glh.stash.legs === 1 && glh.stashD < 1 && glh.bench.legs === 1 && glh.benchNear && !glh.benchExit && glh.beds === 0 && glh.left, glh);
/* Session 1566 (the critic's s1030 lines): below deck the HUD names the ladder, not *Walk south to exit*; at a tiller the prompt says tiller */
check(`in third person below deck on the cutter the camera stands ${ct.tp && ct.tp[1]} m behind you at ${ct.tp && ct.tp[0]} m, under the beams' ${ct.beamUnder}`, ct.tp && ct.tp[0] < ct.beamUnder - .05 && ct.tp[0] > 1.3 && ct.tp[1] > 1, [ct.tp, ct.beamUnder]);
check(`below deck on the cutter the HUD reads "${ct.hud}"`, /ladder/.test(ct.hud || '') && !/south/.test(ct.hud || ''), ct.hud);
const tl = await page.evaluate(() => { const o = {}; for (const cls of ['sloop', 'caravel']) { if (SHIP.mesh) { sc.remove(SHIP.mesh); SHIP.mesh = null; } worldState.ship = { cls, name: 'Test Helm', sails: 0, cargo: 0 }; WORLD.spawnShip(px + 1, pz + 1, .7); SHIP.sailing = true; o[cls] = shipPrompt(); SHIP.sailing = false; } return o; });
check(`at the helm: the sloop "${tl.sloop}", the caravel "${tl.caravel}"`, /tiller/.test(tl.sloop) && /wheel/.test(tl.caravel), tl);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
