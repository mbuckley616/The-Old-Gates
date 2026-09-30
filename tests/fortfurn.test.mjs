// The fort's rooms on the shape kit (Session 306, H.5 and H.7, Michael's A on #46): the great hall, the lord's chamber, the
// chapel and the courtyard hall (Session 307: the barracks, kitchen, armoury and guardroom too; Session 308: the library, the storeroom and
// the entrance cot) each one bake at the kit's sizes, inside the room, with no box or cylinder props left in them
// and their collision footprints registered.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const rooms = {}, pics = [], cots = [];
for (const [interior, seed] of [['fort_tee', 23], ['fort_linear', 31], ['fort_courtyard', 47], ['fort_tee', 59]]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior, size: 'medium' });
  const r = await page.evaluate(() => { const out = [], shots = [];
    dScene.updateMatrixWorld(true);
    for (const G of dScene.children.filter(o => o.userData && o.userData.fortFurn)) { const R = G.userData.fortFurn, bb = new THREE.Box3().setFromObject(G);
      // props that are still boxes or cylinders inside this room, below the ceiling and off the walls (the shell, doors,
      // columns and the staircase aside: they are separate meshes of their own kinds, counted only if small and in the room)
      let old = 0; dScene.traverse(o => { if (!o.isMesh || o === G || o.parent === G) return; const t = o.geometry.type; if (t !== 'BoxGeometry' && t !== 'CylinderGeometry') return;
        const p = o.position; if (p.x > R.x0 + .3 && p.x < R.x0 + R.w - .3 && p.z > R.z0 + .3 && p.z < R.z0 + R.h - .3 && p.y < 2.2 && o.material && o.material.color && [0x3a2a18, 0x5a4028, 0x4a4540, 0x9a8a70, 0x2a2218, 0xc8b890].includes(o.material.color.getHex())) old++; });
      const props = DUNGEON_PROPS.filter(q => (q.x0 + q.x1) / 2 > R.x0 && (q.x0 + q.x1) / 2 < R.x0 + R.w && (q.z0 + q.z1) / 2 > R.z0 && (q.z0 + q.z1) / 2 < R.z0 + R.h).length;
      const shelves = BARRELS.filter(b => b.displayName === 'Bookshelf' && b.x > R.x0 && b.x < R.x0 + R.w && b.z > R.z0 && b.z < R.z0 + R.h).length;
      out.push({ kind: R.kind, shelves, tris: G.userData.tris, fire: !!G.userData.fire, old, props,
        inside: bb.min.x > R.x0 - .05 && bb.max.x < R.x0 + R.w + .05 && bb.min.z > R.z0 - .05 && bb.max.z < R.z0 + R.h + .05 && bb.min.y > -.05 && bb.max.y < 3.25 });
      const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60), L = new THREE.PointLight(0xffa860, 1.6, 12);
      cam.position.set(R.cx + R.w * .3, 1.6, R.z0 + R.h - .7); cam.lookAt(R.cx, .5, R.z0 + R.h * .3); L.position.copy(cam.position); dScene.add(L);
      REN.render(dScene, cam); dScene.remove(L); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); shots.push([R.kind, o.toDataURL()]); }
    const cot = dScene.children.find(o => o.userData && o.userData.fortCot);
    return { out, shots, cot: { kit: !!cot && cot.userData.tris > 300, bed: D_BEDS.length > 0 } }; });
  for (const x of r.out) (rooms[x.kind] = rooms[x.kind] || []).push(x);
  cots.push(r.cot);
  for (const [k, u] of r.shots) if (!pics.some(p => p[0] === k)) pics.push([k, u]);
}
console.log(JSON.stringify(rooms));
check('at least eight of the ten rooms turn up in four forts', Object.keys(rooms).length >= 8, Object.keys(rooms));
check('each is one bake at the kit\'s sizes inside its room and under the ceiling, with its footprints registered', Object.values(rooms).flat().every(x => x.tris > 500 && x.inside && x.props >= 1), rooms);
check('no box or cylinder furniture of the old materials is left in them', Object.values(rooms).flat().every(x => x.old === 0), Object.values(rooms).flat().map(x => [x.kind, x.old]));
if (rooms.courtyard_hall) check('the courtyard\'s brazier burns in the bake\'s fire mesh', rooms.courtyard_hall.every(x => x.fire), rooms.courtyard_hall);
if (rooms.library) check('the library\'s bookcases are still lootable shelves, six to a library', rooms.library.every(x => x.shelves === 6), rooms.library);
// (the entrance cot is not checked: no fort layout places it, since the cells beside a fort's entrance are 7, not 1; see Session 308)
if (rooms.armory) check('the armoury\'s forge and smelter burn in the bake\'s fire mesh', rooms.armory.every(x => x.fire), rooms.armory);
if (rooms.chapel) check('the chapel\'s altar candles burn in the bake\'s fire mesh', rooms.chapel.every(x => x.fire), rooms.chapel);
const grid = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach(([, p], i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * 2; c.height = im.height * Math.ceil(ps.length / 2); x = c.getContext('2d'); } x.drawImage(im, (i % 2) * im.width, (i >> 1) * im.height); if (++k === ps.length) res(c.toDataURL()); }; im.src = p; }); }), pics);
fs.writeFileSync('tests/out/fortfurn.png', Buffer.from(grid.split(',')[1], 'base64'));
console.log('pictures:', pics.map(p => p[0]).join(', '));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
