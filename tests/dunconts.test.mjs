// The dungeon rooms' containers on the shape kit (Session 318, H.7 props, Michael's A on #46): the urn, the sarcophagus and
// the weapon rack are each one shared kit bake with no box or cylinder parts left, stand at the old sizes, are still found by
// the look-at and loot code, and their lids open (the urn's pops, the sarcophagus's slides aside).
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const found = {}, pics = {};
for (const [theme, seed] of [['undead', 11], ['ruins', 12], ['ruins', 13], ['undead', 14], ['ruins', 15], ['haunted', 16], ['ruins', 17], ['undead', 18], ['ruins', 19], ['elemental', 20], ['deep', 21], ['undead', 22], ['ruins', 23], ['undead', 24]]) {
  if (found.Urn && found.Sarcophagus && found['Weapon Rack']) break;
  await enterDungeon(page, { theme, seed, size: 'medium' });
  const r = await page.evaluate(() => { const out = [], shots = {}; dScene.updateMatrixWorld(true);
    for (const c of BARRELS.filter(b => ['Urn', 'Sarcophagus', 'Weapon Rack'].includes(b.displayName))) { const G = c.mesh; let boxes = 0, meshes = 0, tris = 0;
      G.traverse(o => { if (!o.isMesh) return; meshes++; const t = o.geometry.type; if (t === 'BoxGeometry' || t === 'CylinderGeometry') boxes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
      const bb = new THREE.Box3().setFromObject(G), sz = bb.getSize(new THREE.Vector3());
      // pictured on its own on a flagged floor, lit by a lantern, from the front quarter (the rack's weapons face +z)
      const shot = () => { const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .05, 40), S = new THREE.Scene(), C = G.clone(true), h = c.displayName === 'Urn' ? .75 : c.displayName === 'Sarcophagus' ? 1.1 : 1.9;
        S.background = new THREE.Color(0x141210); C.position.set(0, 0, 0); C.rotation.set(0, 0, 0); S.add(C); const F = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({ color: 0x3a3630 })); F.rotation.x = -Math.PI / 2; S.add(F);
        S.add(new THREE.HemisphereLight(0x8a8070, 0x201810, .6)); const L = new THREE.PointLight(0xffc080, 1.6, 12); L.position.set(1.5, 2.2, 2.5); S.add(L);
        const d = h * 1.6 + (c.displayName === 'Sarcophagus' ? 2.0 : .6); cam.position.set(d * .55, h * .5 + d * .45, d * .85); cam.lookAt(0, h * .42, 0);
        REN.render(S, cam); const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o.toDataURL(); };
      const need = !shots[c.displayName]; const before = need ? shot() : null;
      const lid0 = c.top ? c.top.position.clone() : null; const items = c.items.length;
      openLoot(c); const panel = document.getElementById('loot-panel').style.display, title = document.getElementById('lp-title').textContent;
      const lid1 = c.top ? c.top.position.clone() : null; closeLoot();
      dScene.updateMatrixWorld(true); if (need) shots[c.displayName] = [before, shot()];
      out.push({ kind: c.displayName, boxes, meshes, tris: Math.round(tris), size: [sz.x, sz.y, sz.z].map(v => +v.toFixed(2)), items, panel, title, lidMoved: lid0 ? +lid0.distanceTo(lid1).toFixed(3) : null, shared: !!(G.children[0] && G.children[0].userData.dunCont) }); }
    return { out, shots }; });
  for (const x of r.out) (found[x.kind] = found[x.kind] || []).push(x);
  for (const [k, u] of Object.entries(r.shots)) if (!pics[k]) pics[k] = u;
}
console.log(JSON.stringify(found));
const all = Object.values(found).flat();
check('an urn, a sarcophagus and a weapon rack turn up', !!(found.Urn && found.Sarcophagus && found['Weapon Rack']), Object.keys(found));
check('each is the kit bake, no box or cylinder parts', all.every(x => x.boxes === 0 && x.shared), all.map(x => [x.kind, x.boxes]));
check('each has substance (urn > 400, rack > 600, sarcophagus > 1000 triangles)', all.every(x => x.tris > ({ Urn: 400, 'Weapon Rack': 600, Sarcophagus: 1000 })[x.kind]), all.map(x => [x.kind, x.tris]));
check('each stands at about the old size', all.every(x => x.kind === 'Urn' ? x.size[1] > .6 && x.size[1] < .8 : x.kind === 'Sarcophagus' ? x.size[1] > .8 && x.size[1] < 1.1 && Math.max(x.size[0], x.size[2]) > 1.9 && Math.max(x.size[0], x.size[2]) < 2.4 : x.size[1] > 1.4 && x.size[1] < 2.0), all.map(x => [x.kind, x.size]));
check('each opens as a container, with loot, under its own name', all.every(x => x.panel === 'flex' && x.title === x.kind && x.items > 0), all.map(x => [x.kind, x.panel, x.title, x.items]));
check('the urn and the sarcophagus lids move when opened; the rack has none', all.every(x => x.kind === 'Weapon Rack' ? x.lidMoved === null : x.lidMoved > .1), all.map(x => [x.kind, x.lidMoved]));
const list = Object.entries(pics).flatMap(([k, [a, b]]) => [[k + ' shut', a], [k + ' open', b]]);
const grid = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach(([, p], i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * 2; c.height = im.height * Math.ceil(ps.length / 2); x = c.getContext('2d'); } x.drawImage(im, (i % 2) * im.width, Math.floor(i / 2) * im.height); if (++k === ps.length) res(c.toDataURL()); }; im.src = p; }); }), list);
fs.writeFileSync('tests/out/dunconts.png', Buffer.from(grid.split(',')[1], 'base64'));
console.log('pictures:', list.map(p => p[0]).join(', '));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
