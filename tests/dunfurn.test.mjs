// The dungeons' furnished rooms on the shape kit (Session 309, H.7 props, Michael's A on #46): a shrine, a library and a
// barracks (Session 310: the ossuary and the collapsed room too) are each one bake at the kit's sizes inside the room, and none of the old box furniture is left in them.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const found = {}, pics = {};
for (const [theme, seed] of [['undead', 11], ['ruins', 12], ['ruins', 13], ['undead', 14], ['ruins', 15], ['haunted', 16], ['ruins', 17], ['undead', 18], ['ruins', 19], ['elemental', 20], ['deep', 21], ['undead', 22]]) {
  if (found.shrine && found.library && found.barracks && found.ossuary && found.collapsed) break;
  await enterDungeon(page, { theme, seed, size: 'medium' });
  const r = await page.evaluate(() => { const out = [], shots = {}; dScene.updateMatrixWorld(true);
    const OLD = [0x8a8478, 0xb8b0a0, 0xe8e0d0, 0x4a3018, 0x6a2a2a, 0x2a4a6a, 0x4a5a2a, 0x6a5a2a, 0x5a3a1a, 0x5a4a3a, 0x8a7a6a, 0x9a9488, 0x5a564e, 0x4a4640];
    for (const G of dScene.children.filter(o => o.userData && o.userData.dunFurn)) { const R = G.userData.dunFurn, bb = new THREE.Box3().setFromObject(G), y0 = G.position.y;
      let old = 0; dScene.traverse(o => { if (!o.isMesh || o.parent !== dScene) return; const t = o.geometry.type; if (t !== 'BoxGeometry' && t !== 'CylinderGeometry') return; const p = o.position;
        if (p.x > R.x0 && p.x < R.x0 + R.w && p.z > R.z0 && p.z < R.z0 + R.h && Math.abs(p.y - y0) < 2.4 && o.material.color && OLD.includes(o.material.color.getHex())) old++; });
      out.push({ type: R.type, tris: G.userData.tris, old, inside: bb.min.x > R.x0 - .05 && bb.max.x < R.x0 + R.w + .05 && bb.min.z > R.z0 - .05 && bb.max.z < R.z0 + R.h + .05 && bb.min.y > y0 - .05 && bb.max.y < y0 + 3.2 });
      if (!shots[R.type]) { const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60), L = new THREE.PointLight(0xffa860, 1.8, 12);
        cam.position.set(R.x0 + R.w * .75, y0 + 1.5, R.z0 + R.h - .4); cam.lookAt(R.x0 + R.w * .4, y0 + .5, R.z0 + R.h * .35); L.position.copy(cam.position); dScene.add(L);
        REN.render(dScene, cam); dScene.remove(L); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); shots[R.type] = o.toDataURL(); } }
    return { out, shots }; });
  for (const x of r.out) (found[x.type] = found[x.type] || []).push(x);
  for (const [k, u] of Object.entries(r.shots)) if (!pics[k]) pics[k] = u;
}
console.log(JSON.stringify(found));
check('a shrine, a library and a barracks turn up', !!(found.shrine && found.library && found.barracks), Object.keys(found));
check('the ossuary and the collapsed room turn up too', !!(found.ossuary && found.collapsed), Object.keys(found));
check('each is one bake with some substance, inside its room and under the ceiling', Object.values(found).flat().every(x => x.tris > (x.type === 'collapsed' ? 150 : 1000) && x.inside), found);
check('none of the old box furniture is left in them', Object.values(found).flat().every(x => x.old === 0), Object.values(found).flat().map(x => [x.type, x.old]));
const list = Object.entries(pics);
const grid = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach(([, p], i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * ps.length; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); if (++k === ps.length) res(c.toDataURL()); }; im.src = p; }); }), list);
fs.writeFileSync('tests/out/dunfurn.png', Buffer.from(grid.split(',')[1], 'base64'));
console.log('pictures:', list.map(p => p[0]).join(', '));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
