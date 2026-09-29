// A home's and an inn's furniture on the shape kit (Sessions 286–287, H.5 props, Michael's A on the concept artist's prototype #46): the bed,
// the stone hearth, a table and chairs with a candle, a chest, shelves and a rug, one baked mesh and the flames, by the
// nation's wood; the bed, the table's and the hearth's solids, and the strongbox where they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'home'); window._H = h; px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(5000); await g.hide();
const r = await page.evaluate(() => { const sc = interiorScene, h = _H, W = h.intW, D = h.intD; const furn = sc.children.filter(o => o.userData.furn);
  let meshes = 0, lambertBoxes = 0; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') lambertBoxes++; } });
  const f = furn[0], tris = f ? f.userData.tris : 0, parts = f ? f.children.length : 0;
  return { W, D, furn: furn.length, parts, tris, fire: !!(f && f.userData.fire), meshes, boxes: lambertBoxes, bed: INT_BEDS.length && INT_BEDS[0].owner, table: FOOTHOLDS.some(f => f.y > .4 && f.y < .5 && W / 2 > f.x0 && W / 2 < f.x1 && D * .5 > f.z0 && D * .5 < f.z1), hearth: intSolidAt(W - .3, D * .4, .1), clear: !intSolidAt(W / 2, D * .5 + 1.4, .1), box: !!WORLD.intBox }; });
console.log(JSON.stringify(r));
check('the home has one baked furniture group: the wood and stone, and the flames', r.furn === 1 && r.parts === 2 && r.fire, r);
check('the furniture is 8–25k triangles', r.tris > 8000 && r.tris < 25000, r.tris);
check('the bed is still the home\'s, the table a foothold at its top (as before) and the hearth solid, the floor beside the table is clear, the strongbox stands', r.bed === 'home' && r.table && r.hearth && r.clear && r.box, r);
// the flames flicker in the game's own loop
const fl = await page.evaluate(async () => { const f = interiorScene.children.find(o => o.userData.furn).userData.fire, s = new Set(); for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); s.add(f.scale.y.toFixed(4)); } return s.size; });
check('the hearth\'s flames flicker', fl > 1, fl);
// by nation: the Mark's dark pine and Aurenne's walnut and blue paint differ from the Gatelands' oak
const nat = await page.evaluate(() => { const K = furnKit(), out = {}; for (const n of ['gatelands', 'mark', 'aurenne']) { const G = K.bake(K.home(10, 10, 2.1, n, 5)); const c = G.children[0].geometry.attributes.color.array; let r = 0, b = 0; for (let i = 0; i < c.length; i += 3) { r += c[i]; b += c[i + 2]; } out[n] = [+(r / c.length * 3).toFixed(3), +(b / c.length * 3).toFixed(3)]; G.children.forEach(m => m.geometry.dispose()); } return out; });
check('the three nations\' homes are coloured differently (mean red and blue)', nat.gatelands.join() !== nat.mark.join() && nat.mark.join() !== nat.aurenne.join() && nat.aurenne[1] > nat.gatelands[1], nat);
// the picture: two views, as the prototype's
const shot = await page.evaluate(() => { const sc = interiorScene, W = _H.intW, D = _H.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(58, CW / CH, .05, 80);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  [[W * .4, 1.15, D * .74, W * .72, .4, D * .4], [W * .62, 1.15, D * .3, W * .08, .3, D * .1]].forEach((v, i) => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); });
fs.mkdirSync('tests/out', { recursive: true });
fs.writeFileSync('tests/out/homefurn.png', Buffer.from(shot.split(',')[1], 'base64'));
// the inn's taproom (Session 287): the bar, dresser, casks, hearth, tables and benches on the kit; the beds, the bar's,
// tables' and benches' footholds and the hearth's solid as before
await page.evaluate(() => { try { exitInterior(); } catch (e) {} });
await page.waitForTimeout(2500); await g.hide();
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn'); window._I = h; px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(5000); await g.hide();
const inn = await page.evaluate(() => { const sc = interiorScene, W = _I.intW, D = _I.intD, furn = sc.children.filter(o => o.userData.furn); let meshes = 0; sc.traverse(o => { if (o.isMesh) meshes++; });
  const fh = (x, z, lo, hi) => FOOTHOLDS.some(f => f.y > lo && f.y < hi && x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
  const T = [[3.4, D * .42], [3.4, D * .66], [W - 3.4, D * .7], [W / 2, D * .6]];
  const bedGeos = new Set(INT_BED_GEO.values()); let kitBeds = 0, oldBeds = 0; sc.traverse(o => { if (o.isMesh && bedGeos.has(o.geometry)) kitBeds++; if (o.isMesh && o.geometry.type === 'BoxGeometry' && Math.abs(o.geometry.parameters.depth - 1.95) < 1e-6) oldBeds++; });
  const big = furn.reduce((a, f) => !a || f.userData.tris > a.userData.tris ? f : a, null);
  return { kitBeds, oldBeds, W, D, two: !!_I.two, furn: furn.length, chests: furn.filter(f => f !== big).length, parts: big ? big.children.length : 0, tris: big ? big.userData.tris : 0, meshes, beds: INT_BEDS.length, bar: fh(W / 2, 2.2, .65, .75), hearth: intSolidAt(W - .3, D * .5, .1), tables: T.filter(([x, z]) => fh(x, z, .4, .5) && fh(x, z + .9, .2, .3) && fh(x, z - .9, .2, .3)).length }; });
console.log(JSON.stringify(inn));
check('the inn has one baked furniture group, the wood and stone and the flames, 15–40k triangles (and in a two-storey inn the gallery\'s chest, Session 293)', inn.furn === 1 + (inn.two ? 1 : 0) && inn.parts === 2 && inn.tris > 15000 && inn.tris < 40000, inn);
check('the bar and the four tables with their benches are footholds as before, the hearth solid, the beds all there', inn.bar && inn.tables === 4 && inn.hearth && inn.beds >= 1, inn);
check('every bed in the inn is the kit\'s box bed (Session 288), one shared mesh a bed, none of the old boxes', inn.kitBeds === inn.beds && inn.oldBeds === 0, { kit: inn.kitBeds, beds: inn.beds, old: inn.oldBeds });
const shot2 = await page.evaluate(() => { const sc = interiorScene, W = _I.intW, D = _I.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(58, CW / CH, .05, 80);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  [[W * .8, 1.6, D - .8, W * .42, .45, D * .28], [W * .32, 1.3, D * .84, W - .5, .7, D * .48]].forEach((v, i) => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); });
fs.writeFileSync('tests/out/innfurn.png', Buffer.from(shot2.split(',')[1], 'base64'));
// a coaching inn (Session 296): with a coach line ending at Dunmore the inn gets its board, tack and bales, one more bake
await page.evaluate(() => { try { exitInterior(); } catch (e) {} const rd = WORLD.roads.find(r => (r.def.a === 'dunmore' || r.def.b === 'dunmore') && r.def.via !== 'spur'); if (!rd) return; const a = rd.def.a, b = rd.def.b; const key = a < b ? a + '|' + b : b + '|' + a; (worldState.coaches || (worldState.coaches = {}))[key] = { a, b }; });
await page.waitForTimeout(2000); await g.hide();
await page.evaluate(() => { px = _I.exitX; pz = _I.exitZ; goToInterior(_I); });
await page.waitForTimeout(4000); await g.hide();
const coach = await page.evaluate(() => ({ coaching: !!_I._coaching, furn: interiorScene.children.filter(o => o.userData.furn).length, boxes: (() => { let n = 0; interiorScene.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.material.color && o.material.color.getHex() === 0xc8a850) n++; }); return n; })() }));
check('the coaching inn\'s board, tack and bales are one more bake, and the old straw boxes are gone', coach.coaching && coach.furn === inn.furn + 1 && coach.boxes === 0, { coach, before: inn.furn });
// the picture: an inn room's bed upstairs, close
const shot3 = await page.evaluate(() => { const b = INT_BEDS[0], sc = interiorScene, cv = REN.domElement, cam = new THREE.PerspectiveCamera(55, cv.width / cv.height, .05, 60); const y = b.y || 0;
  cam.position.set(b.x + 1.5, y + 1.2, b.z + 1.9); cam.lookAt(b.x, y + .3, b.z); sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o.toDataURL(); });
fs.writeFileSync('tests/out/bedfurn.png', Buffer.from(shot3.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
