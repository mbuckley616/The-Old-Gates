// The legacy builder's shops on the shape kit (Session 300, H.5, Michael's A on #46): Hearthwick's weaponsmith, armourer,
// apothecary and general goods, built by buildInterior (not buildInteriorFor), each one furniture bake with the counter;
// the crates on the floor inside the room (the old calls passed no z); the last legacy bake freed on the next build.
// Session 304: the rugs on the kit.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}, pics = [];
  const cg = () => new Set([...INT_KIT_GEO.entries()].filter(([k]) => k.startsWith('crate')).map(([, v]) => v));
  for (const type of ['weapon', 'armor', 'potion', 'misc']) { buildInterior({ id: 'legacy_' + type, type, name: 'Test', keeper: '' }); const sc = interiorScene; sc.updateMatrixWorld(true);
    const W = { weapon: 11, armor: 11, potion: 9, misc: 10 }[type], D = { weapon: 10, armor: 10, potion: 9, misc: 9 }[type];
    let meshes = 0, boxes = 0, bad = 0; const crates = [], cs = cg();
    sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; const p = new THREE.Vector3(); o.getWorldPosition(p); if (!isFinite(p.x + p.y + p.z)) bad++; if (cs.has(o.geometry)) crates.push([+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)]); } });
    const furn = sc.children.filter(o => o.userData.furn), bb = furn[0] && new THREE.Box3().setFromObject(furn[0]);
    out[type] = { meshes, boxes, bad, furn: furn.length, tris: furn.map(f => f.userData.tris), crates, npc: intNPCPos,
      inside: !!bb && bb.min.x > -.1 && bb.max.x < W + .1 && bb.min.z > -.1 && bb.max.z < D + .1 && bb.min.y > -.05 };
    const cv = REN.domElement, cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 60); cam.position.set(W * .5 - 1, 1.5, D - .6); cam.lookAt(W * .5, .6, 1.5); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); pics.push(o.toDataURL()); }
  // the bake is freed when the next legacy room is built
  let freed = 0; const last = interiorScene.children.find(o => o.userData.legacyFurn); last.traverse(m => { if (m.isMesh) { const d = m.geometry.dispose.bind(m.geometry); m.geometry.dispose = () => { freed++; d(); }; } });
  buildInterior({ id: 'legacy_misc2', type: 'misc', name: 'Test', keeper: '' }); out.freed = freed;
  window._pics = pics; return out; });
console.log(JSON.stringify(r));
for (const t of ['weapon', 'armor', 'potion', 'misc'])
  check(`the ${t} shop's furniture is one bake with the counter, inside the room, nothing at a non-finite place`, r[t].furn === 1 && r[t].tris[0] > 3000 && r[t].inside && r[t].bad === 0, r[t]);
check('the crates stand on the floor at real places (they were at y = D − 2 with no z)', ['weapon', 'armor', 'misc'].every(t => r[t].crates.length >= 2 && r[t].crates.every(([x, y, z]) => y === 0 && z > 5 && x > 0)), ['weapon', 'armor', 'misc'].map(t => r[t].crates));
check('the old box props are gone: a handful of boxes left in each (the door, beams, windows, torches)', ['weapon', 'armor', 'potion', 'misc'].every(t => r[t].boxes < 40), ['weapon', 'armor', 'potion', 'misc'].map(t => r[t].boxes));
check('the last legacy bake is freed on the next build', r.freed >= 1, r.freed);
// Session 304: the flat rug plane is the kit's rug in every legacy room (a runner in the church, none in the keep, whose runner
// is in its hall's bake), freed with the room
const rugs = await page.evaluate(() => { const out = {};
  for (const type of ['weapon', 'armor', 'potion', 'misc', 'inn', 'church', 'castle', 'safehouse', 'home']) { buildInterior({ id: 'rug_' + type, type, name: 'Test', keeper: '' }); const sc = interiorScene; sc.updateMatrixWorld(true);
    let flat = 0; sc.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.x + Math.PI / 2) < 1e-6 && o.position.y > .005 && o.position.y < .02) flat++; });
    const r = sc.children.filter(o => o.userData.rug), bb = r[0] && new THREE.Box3().setFromObject(r[0]);
    out[type] = { flat, rugs: r.length, legacy: r.every(o => o.userData.legacyFurn && !o.userData.furn), z: bb ? [+bb.min.z.toFixed(2), +bb.max.z.toFixed(2)] : null, top: bb ? +bb.max.y.toFixed(3) : null }; }
  return out; });
console.log(JSON.stringify(rugs));
check('every legacy room but the keep has one kit rug and no flat plane; the church\'s runner starts at the dais\'s front (4.1); the rugs lie flat (under .03)',
  Object.entries(rugs).every(([t, v]) => v.flat === 0 && v.legacy && (t === 'castle' ? v.rugs === 0 : v.rugs === 1 && v.top < .03)) && rugs.church.z[0] > 4.05, rugs);
const grid = await page.evaluate(() => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; _pics.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * 2; c.height = im.height * 2; x = c.getContext('2d'); } x.drawImage(im, (i % 2) * im.width, (i >> 1) * im.height); if (++k === _pics.length) res(c.toDataURL()); }; im.src = p; }); }));
fs.writeFileSync('tests/out/legacyshops.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
