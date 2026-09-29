// The shops' furniture on the shape kit (Session 289, H.5 props, Michael's A on #46): every shop's counter is the kit's
// panelled counter; the smithy's forge (and Session 290's armourer, apothecary and general goods), anvil, quench tub, racks of the weapon kit's pieces and grindstone are one bake.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const enter = async type => { await page.evaluate(() => { try { if (interiorScene) exitInterior(); } catch (e) {} }); await page.waitForTimeout(1500); await g.hide();
  const ok = await page.evaluate(type => { let h = null; for (const S of WORLD.settle.values()) { h = S.houses.find(x => x.type === type); if (h) break; } if (!h) return false; window._S = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return true; }, type);
  if (ok) { await page.waitForTimeout(4000); await g.hide(); } return ok; };
const look = () => page.evaluate(() => { const sc = interiorScene, W = _S.intW, D = _S.intD, furn = sc.children.filter(o => o.userData.furn); let meshes = 0; sc.traverse(o => { if (o.isMesh) meshes++; });
  const fh = (x, z, lo, hi) => FOOTHOLDS.some(f => f.y > lo && f.y < hi && x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
  return { type: _S.type, W, D, furn: furn.length, tris: furn.map(f => f.userData.tris), fire: furn.some(f => f.userData.fire), meshes, counter: fh(W / 2, 3.0, .6, .7), forge: fh(1.2, 1.4, .7, .8), anvil: fh(W - 2.0, 1.6, .55, .65), tub: fh(W - 1.0, 3.2, .4, .46) }; });
check('Dunmore (or a town near it) has a smithy', await enter('weapon'));
const sm = await look(); console.log(JSON.stringify(sm));
check('the smithy is two bakes (the room with the forge\'s fire, and the counter), 10–45k triangles in all', sm.furn === 2 && sm.fire && sm.tris.reduce((a, b) => a + b, 0) > 10000 && sm.tris.reduce((a, b) => a + b, 0) < 45000, sm);
check('the counter, the forge, the anvil and the tub are footholds at their tops', sm.counter && sm.forge && sm.anvil && sm.tub, sm);
const fl = await page.evaluate(async () => { const f = interiorScene.children.find(o => o.userData.fire).userData.fire, s = new Set(); for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); s.add(f.scale.y.toFixed(4)); } return s.size; });
check('the forge\'s coals flicker', fl > 1, fl);
// the racks carry the weapon kit's pieces: the bake's colours include the kit's steel (grey or blue-grey, not the wood's
// browns) on the east wall, in front of the back room's partition (the racks used to stand half in the back room)
const steel = await page.evaluate(() => { const W = _S.intW, D = _S.intD, room = interiorScene.children.find(o => o.userData.fire), geo = room.children[0].geometry, P = geo.attributes.position.array, C = geo.attributes.color.array; let n = 0;
  for (let i = 0; i < P.length; i += 3) if (P[i] > W - .5 && P[i + 1] > .3 && P[i + 2] > 3.5 && P[i + 2] < D - 3.2 && C[i + 2] > C[i] * .9 && C[i] > .2) n++; return n; });
check('the racks on the east wall hold steel (the weapon kit baked in)', steel > 500, steel);
const shot = await page.evaluate(() => { const sc = interiorScene, W = _S.intW, D = _S.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(58, CW / CH, .05, 80);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  [[W * .7, 1.3, D * .6, 1.2, .6, 1.2], [W * .45, .95, 5.6, W - .2, .45, 5.5]].forEach((v, i) => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); });
fs.mkdirSync('tests/out', { recursive: true });
fs.writeFileSync('tests/out/smithy.png', Buffer.from(shot.split(',')[1], 'base64'));
// the armourer, the apothecary and the general goods (Session 290): each room one bake beside its counter; the stands,
// the still and the bench solid; one picture of each
const others = [], pics = [];
for (const t of ['armor', 'potion', 'misc']) { if (!(await enter(t))) continue; const o = await look();
  const x = await page.evaluate(() => { const W = _S.intW, D = _S.intD; let barrels = 0, crates = 0; interiorScene.traverse(m => { if (m.isMesh && INT_KIT_GEO.get('barrel') && m.geometry === INT_KIT_GEO.get('barrel').body) barrels++; });
    return { stand: intSolidAt(1.6, 1.6, .1) || FOOTHOLDS.some(f => f.y > 1 && 1.6 > f.x0 && 1.6 < f.x1 && 1.6 > f.z0 && 1.6 < f.z1), still: FOOTHOLDS.some(f => f.y > .55 && f.y < .7 && W - 1.6 > f.x0 && W - 1.6 < f.x1 && 1.8 > f.z0 && 1.8 < f.z1), barrels }; });
  others.push({ type: t, furn: o.furn, tris: o.tris, fire: o.fire, counter: o.counter, meshes: o.meshes, ...x });
  pics.push(await page.evaluate(() => { const sc = interiorScene, W = _S.intW, D = _S.intD, cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 80);
    cam.position.set(W * .5, 1.75, Math.min(D - 3.5, 4.6)); cam.lookAt(W * .5, .35, 1.3); sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o.toDataURL(); })); }
console.log(JSON.stringify(others));
const by = t => others.find(o => o.type === t) || {};
check('the armourer, the apothecary and the general goods are each a room bake and the kit\'s counter, footholds where they were', others.length === 3 && others.every(o => o.furn === 2 && o.counter && o.tris[0] > 3000), others);
check('the armour stands stand, the apothecary\'s still is a foothold and glows (its brew in the flame mesh), the goods\' barrels are the kit\'s', by('armor').stand && by('potion').still && by('potion').fire && by('misc').barrels === 3, others);
const grid = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * ps.length; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); if (++k === ps.length) res(c.toDataURL()); }; im.src = p; }); }), pics);
fs.writeFileSync('tests/out/shops3.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
