// The odd rooms on the shape kit (Session 293, H.5 props, Michael's A on #46): the cellar, the ship's cabin and the chapel,
// built through the game's own buildInteriorFor; the crates sit on the floor (or on each other), not half their size above it.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}, pics = [];
  for (const type of ['cellar', 'cabin', 'chapel']) { const house = { id: 'test_' + type, type, w: 6, d: 5, doorX: px, doorZ: pz, style: 'irish', reg: 'irish' };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; sc.updateMatrixWorld(true);
    const furn = sc.children.filter(o => o.userData.furn); let meshes = 0, cyl = 0, boxes = 0; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'CylinderGeometry' && !(INT_KIT_GEO.get('barrel') && o.geometry === INT_KIT_GEO.get('barrel').top)) cyl++; if (o.geometry.type === 'BoxGeometry') boxes++; } });
    const crates = []; const cg = new Set([...INT_KIT_GEO.entries()].filter(([k]) => k.startsWith('crate')).map(([, v]) => v));
    sc.traverse(o => { if (o.isMesh && cg.has(o.geometry)) crates.push(+o.position.y.toFixed(3)); });
    out[type] = { W, D, furn: furn.length, tris: furn.map(f => f.userData.tris), meshes, cyl, boxes, crates };
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60);
    const V = { cellar: [W * .35, 1.5, D - .6, W * .8, .4, D * .4], cabin: [1.2, 1.4, D - .8, W * .7, .4, D * .35], chapel: [W / 2 - 1.5, 1.5, D * .5, W / 2, .6, 1.8] }[type];
    cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); pics.push(o.toDataURL()); }
  window._pics = pics; return out; });
console.log(JSON.stringify(r));
check('the cellar is one bake with the kit barrels and crates, no cylinders left (the kit barrels\' lids aside), the crates on the floor (three) and one on them at .5', r.cellar.furn === 1 && r.cellar.cyl === 0 && r.cellar.crates.filter(y => y === 0).length === 3 && r.cellar.crates.includes(.5), r.cellar);
check('the cabin is one bake beside the bunk and the stash chest, no cylinders left', r.cabin.furn === 1 && r.cabin.cyl === 0, r.cabin);
check('the chapel is one bake, no cylinders left', r.chapel.furn === 1 && r.chapel.cyl === 0 && r.chapel.tris[0] > 5000, r.chapel);
// the wizard's tower (Session 294): the helix, the post, the rail and the chest one bake; the chest and its glow on the floor
// at 30 (they were F-scaled to 18.8, inside the shaft); the post solid the whole height
const tw = await page.evaluate(() => { const house = { id: 'test_tower', type: 'tower', w: 6, d: 6, doorX: px, doorZ: pz, style: 'stone', reg: 'irish' };
  const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; sc.updateMatrixWorld(true); let meshes = 0, boxes = 0, glows = []; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; if (o.geometry.type === 'SphereGeometry' && o.material.isMeshBasicMaterial) glows.push(+o.position.y.toFixed(2)); } });
  const furn = sc.children.filter(o => o.userData.furn), bb = new THREE.Box3().setFromObject(furn[0]); const post = INT_SOL.find(q => Math.abs((q.x0 + q.x1) / 2 - W / 2) < .01 && Math.abs((q.z0 + q.z1) / 2 - D / 2) < .01);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 80); cam.position.set(W * .9, 14, D * .9); cam.lookAt(W / 2, 12, D / 2); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); window._pics.push(o.toDataURL());
  return { meshes, boxes, furn: furn.length, top: +bb.max.y.toFixed(2), glows, postTop: post && +post.y1.toFixed(2), loot: WORLD.intLoot && WORLD.intLoot.y, spiral: FOOTHOLDS.some(f => f.kind === 'spiral') }; });
console.log(JSON.stringify(tw));
check('the tower\'s helix, post, rail and chest are one bake reaching past the top floor (30), a handful of boxes left (the floor slabs), the spiral foothold as before', tw.furn === 1 && tw.top > 31 && tw.boxes < 10 && tw.meshes < 30 && tw.spiral, tw);
check('the chest\'s glow and the four window glows are up at the top floor, the post solid to 30, the loot where it was', tw.glows.length >= 5 && tw.glows.filter(y => y > 30).length >= 5 && tw.postTop >= 29.9 && tw.loot === 30, tw);
// the safehouse (Session 295): the legacy builder's room, its side table, bookcase, chair and hearth one bake; the bed and
// the stash chest where they were
const sf = await page.evaluate(() => { buildInterior({ type: 'safehouse', name: 'Test', keeper: '' }); const sc = interiorScene; sc.updateMatrixWorld(true);
  let meshes = 0, boxes = 0; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; } });
  const furn = sc.children.filter(o => o.userData.furn);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60); cam.position.set(1.5, 1.4, 7.2); cam.lookAt(6, .5, 2); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); window._pics.push(o.toDataURL());
  return { meshes, boxes, furn: furn.length, tris: furn[0] && furn[0].userData.tris, bed: intBedPos, stash: intStashPos }; });
console.log(JSON.stringify(sf));
check('the safehouse\'s furniture is one bake beside the bed and the stash chest, which stand where they were', sf.furn === 1 && sf.tris > 3000 && sf.bed && sf.bed.x === 1 && sf.stash && sf.stash.z === 1, sf);
const grid = await page.evaluate(() => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; _pics.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * _pics.length; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); if (++k === _pics.length) res(c.toDataURL()); }; im.src = p; }); }));
fs.writeFileSync('tests/out/oddrooms.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
