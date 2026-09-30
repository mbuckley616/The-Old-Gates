// node docs/prototypes/houseao/shoot.mjs -> docs/prototypes/houseao-grid.png
// Backlog H.1 (Michael's A on Session 243: the creases shaded at this strength, the people, then the creatures and houses).
// The people's pass (personAO) run over a house's bake, part by part, as Session 276 wired it behind HAO:
//   today;  A: the people's strength (every part shades every other it faces, x.75, capped at .5);
//   B: the same strength, but only parts at least .35 thick shade (walls, roof slabs, the chimney, the lean-to; not the
//      thousands of slates, turfs, stones and course blocks, which darken each other wholesale under A).
// Each house is built once and shaded three ways from the same bake. Afternoon, from the front corner.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g; await g.intoWorld();
const out = await page.evaluate(() => { const OPTS = [null, { k: .75, max: .5, on: true }, { k: .75, max: .5, on: true, minR: .35 }], KS = ['irish', 'stone', 'aurenne', 'mark', 'french'];
  forceTime(15); const sc = WORLD.scene, cv = REN.domElement, W = cv.width, H = cv.height, TW = 400, TH = 260, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), cam = new THREE.PerspectiveCamera(45, W / H, .3, 300), tiles = [], stats = {};
  for (const k of KS) { HAO.keep = true; const geo = WORLD.houseProto(k, 8, 6, 11).hi; HAO.keep = false; const raw = geo.userData.raw; const m = new THREE.Mesh(geo, mat); m.position.set(bx, y, bz); sc.add(m); stats[k] = [];
    for (const o of OPTS) { const col = raw.col.slice(); if (o) personAO(raw.pos, raw.nor, col, raw.PR, Object.assign({ cut: 4 }, o)); let dk = 0; for (let i = 0; i < col.length; i += 3) dk += 1 - col[i] / (raw.col[i] || 1e-6); stats[k].push(+(dk / (col.length / 3)).toFixed(3));
      geo.attributes.color.array.set(col); geo.attributes.color.needsUpdate = true;
      cam.position.set(bx + 7, y + 4.5, bz + 13); cam.lookAt(bx, y + 2.4, bz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
      const t = document.createElement('canvas'); t.width = TW; t.height = TH; t.getContext('2d').drawImage(cv, (W - H * TW / TH) / 2, 0, H * TW / TH, H, 0, 0, TW, TH); tiles.push(t); }
    sc.remove(m); }
  sc.remove(floor); const c = document.createElement('canvas'); c.width = TW * 3; c.height = TH * KS.length; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, (i % 3) * TW, Math.floor(i / 3) * TH));
  x.fillStyle = '#fff'; x.font = '15px sans-serif'; KS.forEach((k, i) => ['today', 'A: the people\'s strength', 'B: large parts only'].forEach((l, j) => x.fillText(k + ' — ' + l, j * TW + 8, i * TH + 18)));
  return { png: c.toDataURL(), stats }; });
fs.writeFileSync(path.join(here, '..', 'houseao-grid.png'), Buffer.from(out.png.split(',')[1], 'base64')); console.log('mean darkening [today, A, B]', JSON.stringify(out.stats), 'errors', g.errs); await g.close();
