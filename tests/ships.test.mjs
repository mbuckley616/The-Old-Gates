// Ships on the shape kit (Session 168): lofted hulls with a rig per class, the black sail and the merchantman as
// looks, open clinker boats in the harbours, and a deck you can stand on only where the hull is.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

// open the world module's builders to the test through the ships it already exposes: an other-ship spawned at sea
const bakes = await page.evaluate(() => {
  // find open water near the start: deep enough for a ship
  let sx = null, sz = null; for (let r = 30; r < 2000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; if (WORLD.worldH(x, z) < -4 && WORLD.worldH(x + 12, z) < -4 && WORLD.worldH(x - 12, z) < -4 && WORLD.worldH(x, z + 12) < -4 && WORLD.worldH(x, z - 12) < -4) { sx = x; sz = z; break; } }
  window._sea = [sx, sz]; if (sx === null) return { noSea: true };
  const m = WORLD.spawnOtherShip('merchant', sx, sz), p = WORLD.spawnOtherShip('pirate', sx + 40, sz); window._O = [m, p];
  const tri = o => o.mesh.geometry.attributes.position.count / 3;
  return { merchant: { tris: tri(m), kind: m.mesh.userData.kind, L: m.L, W: m.W, pirateKind: p.mesh.userData.kind, pirateL: p.L, deck: !!m.mesh.userData.deck, wheel: !!m.mesh.userData.wheel, meshes: (() => { let n = 0; m.mesh.traverse(c => { if (c.isMesh) n++; }); return n; })() },
    pirate: { tris: tri(p), sameGeoAsMerchant: p.mesh.geometry === m.mesh.geometry }, sea: [Math.round(sx), Math.round(sz)] }; });
check('found open water for a ship', !bakes.noSea, bakes.sea);
check('the merchantman is a lofted cog (Session 285, Michael\'s A on #50), one baked hull, its wheel and its one square rig (Session 330: the rig trims to the wind); the black sail stays a sloop, a look of its own (a different bake), not a tint',
  bakes.merchant.kind === 'cog' && bakes.merchant.L === 17 && bakes.merchant.W === 5.6 && bakes.merchant.pirateKind === 'sloop' && bakes.merchant.pirateL === 13 && bakes.merchant.deck && bakes.merchant.wheel && bakes.merchant.meshes === 3 && !bakes.pirate.sameGeoAsMerchant && bakes.merchant.tris > 3000 && bakes.merchant.tris < 9000, bakes);

// the deck follows the hull: stand at the middle and you are on it; the old box's bow corners are water now; the bow's
// deck reaches past where the box ended
const deck = await page.evaluate(() => { const o = _O[1], m = o.mesh; const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
  const toW = (lx, lz) => [m.position.x + lx * c + lz * s, m.position.z - lx * s + lz * c]; const D = 1 + (typeof SEA_Y !== 'undefined' ? SEA_Y : 0);
  const y = (lx, lz) => { const [x, z] = toW(lx, lz); return +activeTerrainH(x, z).toFixed(2); }; const dk = o.plat.y;
  const r = { deckY: dk, mid: y(0, 0), side: y(1.9, 0), oldBowCorner: y(2.0, 6.2), oldSternCorner: y(2.1, -6.4), bowPastBox: y(0, 7.6), wheel: y(0, -6.5 + 2.8), hatch: y(0, 6.5 - 3.2), out: y(3, 0) };
  // and turned: the same at 37° off the axis (the old box's bounding square was widest there)
  o.yaw += .65; o.mesh.rotation.y = o.yaw + Math.PI; const c2 = Math.cos(o.mesh.rotation.y), s2 = Math.sin(o.mesh.rotation.y);
  r.turnedCorner = +activeTerrainH(m.position.x + 2.0 * c2 + 6.2 * s2, m.position.z - 2.0 * s2 + 6.2 * c2).toFixed(2); r.turnedMid = +activeTerrainH(m.position.x, m.position.z).toFixed(2);
  return r; });
check('you stand on the deck where the hull is (middle, beside the rail, the wheel, the hatch, the bow past the old box), not beside the bow or the stern',
  deck.mid === deck.deckY && deck.side === deck.deckY && deck.wheel === deck.deckY && deck.hatch === deck.deckY && deck.bowPastBox === deck.deckY && deck.oldBowCorner < deck.deckY - .5 && deck.oldSternCorner < deck.deckY - .5 && deck.out < deck.deckY - .5, deck);
check('turned, the deck turns with the hull', deck.turnedMid === deck.deckY, { turnedMid: deck.turnedMid, turnedCorner: deck.turnedCorner });

// the merchantman's deck is the cog's (17 long): its middle and its bow past the sloop's length are deck, the water beside
// is not; boarding her puts you on her deck and her cargo chest on it too
const mdeck = await page.evaluate(() => { const o = _O[0], m = o.mesh; m.rotation.y = o.yaw + Math.PI; WORLD.tick(1 / 60, performance.now()); const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
  const y = (lx, lz) => +activeTerrainH(m.position.x + lx * c + lz * s, m.position.z - lx * s + lz * c).toFixed(2); const dk = o.plat.y;
  const r = { deckY: dk, mid: y(0, 0), beam: y(2.5, 0), bowPastSloop: y(0, 7.2), sternPastSloop: y(0, -7.2), out: y(4, 0) };
  WORLD.boardOther(o); r.onDeck = +jumpY.toFixed(2); r.chest = !!o.chest; r.chestDeck = o.chest ? +activeTerrainH(o.chest.x, o.chest.z).toFixed(2) : null; return r; });
check('the merchantman\'s deck follows the cog\'s hull (the middle, 2.5 out beside the rail, 7.2 fore and aft) and not the water beside it; boarding her stands you and her cargo chest on it',
  mdeck.mid === mdeck.deckY && mdeck.beam === mdeck.deckY && mdeck.bowPastSloop === mdeck.deckY && mdeck.sternPastSloop === mdeck.deckY && mdeck.out < mdeck.deckY - .5 && mdeck.onDeck === mdeck.deckY && mdeck.chest && mdeck.chestDeck === mdeck.deckY, mdeck);

// the three classes differ in rig as well as size; every bake is made once and shared; the harbour boats
const cls = await page.evaluate(() => { const out = {};
  for (const k of ['sloop', 'cog', 'galleon']) { const r = WORLD.shipBake(k, 'player'); const bb = r.geo.boundingBox; out[k] = { tris: r.geo.attributes.position.count / 3, L: r.L, len: +(bb.max.z - bb.min.z).toFixed(1), top: +bb.max.y.toFixed(1), beam: +(bb.max.x - bb.min.x).toFixed(1), deckTo: +r.deck.z1.toFixed(2) }; }
  const m1 = WORLD.buildShipMesh(17, 5.6), m2 = WORLD.buildShipMesh(17, 5.6); out.shared = m1.geometry === m2.geometry && m1.userData.kind === 'cog';
  out.boats = [0, 1, 2, 3].map(v => WORLD.boatBake(v).geo.attributes.position.count / 3); out.boatShared = WORLD.boatBake(2) === WORLD.boatBake(2);
  return out; });
check('sloop, cog and galleon: longer, taller and broader in turn, 4–8k triangles each, one bake shared by every ship of a class',
  cls.sloop.len < cls.cog.len && cls.cog.len < cls.galleon.len && cls.sloop.top < cls.cog.top && cls.cog.top < cls.galleon.top && ['sloop', 'cog', 'galleon'].every(k => cls[k].tris > 3500 && cls[k].tris < 9000) && cls.shared, cls);
check('the harbour boats are four paints of an open boat, 1–2.5k triangles, baked once each', cls.boats.every(t => t > 1000 && t < 2500) && cls.boatShared, { boats: cls.boats });

// the photograph: the classes with the player's look side on; below, the merchantman (a cog) and the black sail from the bow
// quarter with a harbour boat
const shot = await page.evaluate(() => { forceTime(11); const cv = REN.domElement, sc = WORLD.scene; const [sx, sz] = _sea; const y0 = _O[0].mesh.position.y;
  _O.forEach(o => { o.mesh.visible = false; });
  const out = document.createElement('canvas'); out.width = 1280; out.height = 720; const x2 = out.getContext('2d'); const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .1, 400); const added = [];
  const put = (m, x, z, ry) => { m.position.set(x, y0, z); m.rotation.y = ry; sc.add(m); added.push(m); return m; };
  put(WORLD.buildShipMesh(13, 4.4), sx - 20, sz, Math.PI / 2); put(WORLD.buildShipMesh(17, 5.6), sx + 2, sz, Math.PI / 2); put(WORLD.buildShipMesh(22, 7), sx + 28, sz, Math.PI / 2);
  cam.position.set(sx + 4, y0 + 7, sz + 62); cam.lookAt(sx + 4, y0 + 5, sz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 0, 1280, 360);
  added.splice(0).forEach(m => sc.remove(m));
  put(WORLD.buildShipMesh(17, 5.6, 'merchant'), sx - 4, sz - 2, .5); put(WORLD.buildShipMesh(13, 4.4, 'pirate'), sx + 14, sz - 6, .5); put(new THREE.Mesh(WORLD.boatBake(1).geo, _O[0].mesh.material), sx + 6, sz + 9, .9);
  cam.position.set(sx + 30, y0 + 9, sz + 38); cam.lookAt(sx + 7, y0 + 3, sz + 2); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 360, 1280, 360);
  added.forEach(m => sc.remove(m)); _O.forEach(o => { o.mesh.visible = true; }); return out.toDataURL(); });
fs.writeFileSync('tests/out/ships.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
