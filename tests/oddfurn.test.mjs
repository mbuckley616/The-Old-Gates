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
const grid = await page.evaluate(() => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; _pics.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * 3; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); if (++k === 3) res(c.toDataURL()); }; im.src = p; }); }));
fs.writeFileSync('tests/out/oddrooms.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
