// The barber and dyer in the towns (Session 512, Michael's B on DECISION #144): one shop in every town and city, its sign
// the three brass basins on an iron arm, its room the Session 505 prototype's pieces on the furniture kit (the chair facing
// the mirror, the washstand, the bench of razors, the dyer's vat and wool), and its keeper talks rather than trades.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
// every town and city near the start has one barber; villages, ports and garrisons have none
const census = await page.evaluate(() => { const out = [];
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town', 'village', 'port', 'garrison'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 16)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); if (!S || S.dead) continue;
    out.push({ id: t.id, kind: t.kind, hero: !!(typeof heroShops === 'function' && heroShops(t)), barbers: S.houses.filter(h => h.type === 'barber').length }); }
  return out; });
console.log(JSON.stringify(census));
const big = census.filter(s => (s.kind === 'town' || s.kind === 'city') && !s.hero), small = census.filter(s => !(s.kind === 'town' || s.kind === 'city'));
check('every generated town and city has one barber', big.length > 0 && big.every(s => s.barbers === 1), big);
check('no village, port or garrison has one', small.every(s => s.barbers === 0), small);
// the shop: its name, its keeper, its sign
const shop = await page.evaluate(() => { let h = null, S0 = null;
  for (const S of WORLD.settle.values()) { h = S.houses.find(x => x.type === 'barber'); if (h) { S0 = S; break; } }
  if (!h) { const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
    for (const t of c) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === 'barber'); if (h) { S0 = S; break; } } }
  if (!h) return null; window._S = h;
  // the settlement's bake merges the sign into the town's batches (and the town may be built before the test can watch),
  // so the shop's sign is built again here, by the same call, from the shop's own door
  const fx = h.exitX - h.doorX, fz = h.exitZ - h.doorZ, L = Math.hypot(fx, fz) || 1, tx = fx / L, tz = fz / L, y0 = worldH(h.doorX, h.doorZ), G = new THREE.Group();
  buildTradeSign(G, h.type, h.name, h.doorX, h.doorZ, tx, tz, Math.atan2(tx, tz), y0); const m = G.children.find(o => o.userData.sign === 'barber');
  const b = m ? { tris: m.geometry.index.count / 3, up: +(m.position.y - y0).toFixed(2), ry: m.rotation.y, tx, tz, faces: G.children.length } : null, board = []; sc.traverse(o => { if (o.userData && o.userData.sign === h.name) board.push(o); });
  const out = b ? new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), b.ry) : null;
  return { name: h.name, keeper: h.keeper, role: h.dlg && h.dlg.role, talks: !!h.dlg, sign: !!b, signTris: b ? b.tris : 0, signY: b ? b.up : null, outward: out ? +(out.x * b.tx + out.z * b.tz).toFixed(3) : null, boards: board.length, parts: b ? b.faces : 0,
    map: bldOf('barber').label }; });
console.log(JSON.stringify(shop));
check('a barber is found in a town', !!shop);
check('the shop is named for its keeper, who is a Barber and talks (no shop panel)', /'s Barb(er|ier)$/.test(shop.name) && shop.role === 'Barber' && shop.talks, shop);
check('its sign is the three basins on an iron arm over the door, the arm out from the wall, and no painted board', shop.sign && shop.signTris > 500 && shop.signY > 2 && shop.signY < 3 && shop.outward > .99 && shop.boards === 0 && shop.parts === 1, shop);
check('the map has its own colour for it', shop.map === 'Barber · dyer', shop.map);
// outside: the door and the sign
const outside = await page.evaluate(() => { const h = _S, cv = REN.domElement, cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .1, 400);
  const fx = h.exitX - h.doorX, fz = h.exitZ - h.doorZ, L = Math.hypot(fx, fz) || 1, ux = fx / L, uz = fz / L, y = worldH(h.doorX, h.doorZ);
  cam.position.set(h.doorX + ux * 3.2 + uz * 2.2, y + 1.7, h.doorZ + uz * 3.2 - ux * 2.2); cam.lookAt(h.doorX + ux * 1.0, y + 2.45, h.doorZ + uz * 1.0); sc.updateMatrixWorld(true); REN.render(sc, cam); return cv.toDataURL(); });
fs.mkdirSync('tests/out', { recursive: true }); fs.writeFileSync('tests/out/barber-outside.png', Buffer.from(outside.split(',')[1], 'base64'));
// inside
await g.hide();
await page.evaluate(() => { forceTime(12); const h = _S; px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4000); await g.hide();
const room = await page.evaluate(() => { const sc_ = interiorScene, W = _S.intW, D = _S.intD, furn = sc_.children.filter(o => o.userData.furn), cx = W * .36;
  const fh = (x, z, lo, hi) => FOOTHOLDS.some(f => f.y > lo && f.y < hi && x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
  return { W, D, furn: furn.length, tris: furn.map(f => f.userData.tris), fire: furn.some(f => f.userData.fire), chair: fh(cx, 1.35, .6, .8), vat: fh(W - 3.0, 1.0, .4, .5), bench: fh(.3, 2.6, .4, .5),
    npc: intNPCPos ? [+intNPCPos.x.toFixed(2), +intNPCPos.z.toFixed(2)] : null, npcMesh: !!intNPCMesh, doorClear: !intSolidAt(W / 2, D - 1.0, .1) && !intSolidAt(W / 2, D * .5, .1) }; });
console.log(JSON.stringify(room));
check('the room is one bake on the kit with no flames, 5–30k triangles', room.furn === 1 && !room.fire && room.tris[0] > 5000 && room.tris[0] < 30000, room);
check('the chair, the vat and the bench stand where the bake puts them (footholds)', room.chair && room.vat && room.bench, room);
check('the barber stands beside the chair, and the way in from the door is clear', room.npcMesh && room.npc && Math.abs(room.npc[0] - (room.W * .36 - .8)) < .6 && room.npc[1] < 2.4 && room.doorClear, room);
// talking to the barber opens the keeper's dialogue, not the shop
const talk = await page.evaluate(() => { px = intNPCPos.x + .6; pz = intNPCPos.z + .9; jumpY = 0; interact(); const d = document.getElementById('dlg') || document.getElementById('dialog');
  return { shop: !!shopOpen, dlg: !!(typeof dlgNPC !== 'undefined' && dlgNPC && dlgNPC.name), who: typeof dlgNPC !== 'undefined' && dlgNPC ? dlgNPC.name : null, keeper: _S.keeper }; });
console.log(JSON.stringify(talk));
check('E at the barber opens a conversation with them, not a shop panel', !talk.shop && talk.dlg && talk.who === talk.keeper, talk);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
const shot = await page.evaluate(() => { const sc_ = interiorScene, W = _S.intW, D = _S.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(60, CW / CH, .05, 120);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  [[W / 2, 1.4, D - 1.6, W * .45, .5, 1.0], [W * .36 + 1.6, 1.0, 3.0, W * .36 - .2, .5, .6]].forEach((f, i) => { cam.position.set(f[0], f[1], f[2]); cam.lookAt(f[3], f[4], f[5]); sc_.updateMatrixWorld(true); REN.render(sc_, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); });
fs.writeFileSync('tests/out/barber-room.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
