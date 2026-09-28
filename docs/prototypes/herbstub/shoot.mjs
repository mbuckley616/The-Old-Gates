// node docs/prototypes/herbstub/shoot.mjs -> docs/prototypes/herbstub-*.png
// Session 235: what a picked herb leaves (backlog H.5a, owed since Session 167). Today a picked bush, sapling, shrub,
// bramble or bracket stump stays, bare (Michael's answer on Session 164); the other seventeen kinds vanish until they
// regrow. Two proposals, built from the game's own baked plants (index.html is not changed):
//   A. a stub: the plant cut near the ground (every triangle wholly under a cut height kept: stalk bases, the crown,
//      the lowest leaves; for the flat kinds, mosses and rosettes, a torn half) on a small patch of turned earth;
//   B. the turned earth alone.
// Rows: the whole plant, A, B. Two pictures of the seventeen kinds.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(31, cv.width / cv.height, .05, 100);
  const keys = Object.keys(PLANT_KIND).filter(k => !PLANT_STAYS.has(PLANT_KIND[k]) && HERB_DEF[k]);
  const earth = (r, seed) => { const e = SK.bumpy(SK.ball(1, 12, 6, 0, 6.283, 0, 1.6), .25, 7, seed); const p = e.attributes.position, c = [];
    for (let i = 0; i < p.count; i++) { const k = .8 + .2 * Math.sin(i * 7.1 + seed); c.push(.29 * k, .22 * k, .15 * k); } e.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); e.scale(r, .018, r); e.translate(0, -.006, 0); return e; };
  const stub = (whole, key) => { const top = whole.userData.top, cut = Math.max(.035, Math.min(.09, top * .22)), flat = top < .13; const p = whole.attributes.position, n = whole.attributes.normal, c = whole.attributes.color;
    const P = [], N = [], C = []; let h = 7; for (const ch of key) h = h * 31 + ch.charCodeAt(0);
    for (let t = 0; t < p.count; t += 3) { let keep; if (flat) { const cx = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3, cz = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3; keep = Math.sin(Math.atan2(cx, cz) * 2 + h) > .15; }
      else keep = Math.max(p.getY(t), p.getY(t + 1), p.getY(t + 2)) < cut;
      if (!keep) continue; for (let v = t; v < t + 3; v++) { P.push(p.getX(v), p.getY(v), p.getZ(v)); N.push(n.getX(v), n.getY(v), n.getZ(v)); C.push(c.getX(v) * .8, c.getY(v) * .75, c.getZ(v) * .7); } }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return { geo: o, tris: P.length / 9 }; };
  const info = {}; const shots = [];
  const floor = () => { const f = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshLambertMaterial({ color: 0x5a6a3a })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y, bz); sc.add(f); return f; };
  const put = (geo, x, z, list) => { const m = new THREE.Mesh(geo, PLANT_MAT); m.position.set(bx + x, y, bz + z); sc.add(m); list.push(m); return m; };
  forceTime(11);
  for (const half of [keys.slice(0, 9), keys.slice(9)]) { const objs = [floor()]; const sp = .72, x0 = -(half.length - 1) * sp / 2;
    half.forEach((k, i) => { const whole = plantGeo(k, false); const bb = whole.boundingBox; const r = Math.max(.08, Math.min(.18, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * .3)); const x = x0 + i * sp;
      put(whole, x, -.75, objs); const s = stub(whole, k); put(earth(r, i), x, 0, objs); put(s.geo, x, 0, objs); put(earth(r, i), x, .75, objs);
      info[k] = { kind: PLANT_KIND[k], top: +whole.userData.top.toFixed(2), tris: whole.index ? whole.index.count / 3 : whole.attributes.position.count / 3, stubTris: s.tris }; });
    cam.position.set(bx, y + 3.6, bz + 4.4); cam.lookAt(bx, y + .05, bz + .05); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); shots.push(o.toDataURL()); objs.forEach(m => sc.remove(m)); }
  return { shots, info }; });
out.shots.forEach((u, i) => fs.writeFileSync(path.join(here, '..', 'herbstub-' + (i + 1) + '.png'), Buffer.from(u.split(',')[1], 'base64')));
console.log(JSON.stringify(out.info)); console.log('errors', g.errs); await g.close();
