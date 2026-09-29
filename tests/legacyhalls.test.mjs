// The legacy builder's inn and church on the shape kit (Session 301, H.5, Michael's A on #46): Hearthwick's taproom and church,
// built by buildInterior, each one furniture bake; the priest behind the altar (he stood inside it at D × .08).
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}, pics = [];
  for (const type of ['inn', 'church']) { buildInterior({ id: 'legacy_' + type, type, name: 'Test', keeper: '' }); const sc = interiorScene; sc.updateMatrixWorld(true);
    const W = { inn: 13, church: 10 }[type], D = { inn: 11, church: 16 }[type];
    let meshes = 0, boxes = 0, cyl = 0, bad = 0;
    sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; if (o.geometry.type === 'CylinderGeometry' && !(INT_KIT_GEO.get('barrel') && o.geometry === INT_KIT_GEO.get('barrel').top)) cyl++; const p = new THREE.Vector3(); o.getWorldPosition(p); if (!isFinite(p.x + p.y + p.z)) bad++; } });
    const furn = sc.children.filter(o => o.userData.furn), bb = furn[0] && new THREE.Box3().setFromObject(furn[0]);
    out[type] = { meshes, boxes, cyl, bad, furn: furn.length, tris: furn.map(f => f.userData.tris), npc: intNPCPos,
      inside: !!bb && bb.min.x > -.1 && bb.max.x < W + .1 && bb.min.z > -.1 && bb.max.z < D + .1 && bb.min.y > -.05 && bb.max.y < ({ inn: 2.5, church: 3.8 }[type]) + .05 };
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60);
    if (type === 'inn') { cam.position.set(2, 1.5, D - .6); cam.lookAt(W * .6, .5, 2); } else { cam.position.set(W / 2 - 1.2, 1.6, D - .6); cam.lookAt(W / 2, .8, 1.5); }
    REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); pics.push(o.toDataURL()); }
  window._pics = pics; return out; });
console.log(JSON.stringify(r));
for (const t of ['inn', 'church'])
  check(`the ${t}'s furniture is one bake inside the room, under the ceiling, nothing at a non-finite place`, r[t].furn === 1 && r[t].tris[0] > 5000 && r[t].inside && r[t].bad === 0, r[t]);
check('the old box props are gone: no cylinders left (the kit barrels\' lids aside), under half the boxes (the old rooms had 46 and 97; left are the door, beams, windows, torches, the sigil)', r.inn.cyl === 0 && r.church.cyl === 0 && r.inn.boxes < 23 && r.church.boxes < 48, ['inn', 'church'].map(t => [r[t].cyl, r[t].boxes]));
check('the priest stands behind the altar (its back at z 1.15), the innkeeper between the dresser and the bar', r.church.npc.z < 1.1 && r.inn.npc.z > .5 && r.inn.npc.z < 1.8, [r.church.npc, r.inn.npc]);
const grid = await page.evaluate(() => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; _pics.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * _pics.length; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); if (++k === _pics.length) res(c.toDataURL()); }; im.src = p; }); }));
fs.writeFileSync('tests/out/legacyhalls.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
