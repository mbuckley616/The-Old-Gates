// A home's furniture on the shape kit (Session 286, H.5 props, Michael's A on the concept artist's prototype #46): the bed,
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
