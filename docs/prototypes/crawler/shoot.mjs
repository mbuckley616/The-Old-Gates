// node docs/prototypes/crawler/shoot.mjs -> docs/prototypes/crawler-*.png
// Session 225: the Bog Crawler's own six-legged body (Michael's answer B on Session 214: "a beetle or a giant water-bug,
// prototyped first"). Two bodies built in the game from SK shapes, in the fen's colours, beside a bandit for scale and a
// spider for comparison: A a great diving beetle (a domed, glossy carapace split down the back, a small head with
// mandibles, fringed swimming hind legs); B a giant water bug (a flat oval body, a pointed beak, raptorial front legs held
// up to grab, flattened hind legs). A prototype: index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const Ms = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {}));
  const add = (par, geo, mat, p, r, s) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); par.add(m); return m; };
  const rod = (par, a, c, r0, r1, mat) => { const d = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); const g2 = SK.cyl(r1, r0, L, 7); g2.translate(0, L / 2, 0); const m = new THREE.Mesh(g2, mat); m.position.set(...a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; };
  // a leg: hip -> knee (up and out) -> foot on the ground, with a joint ball and a tarsus
  const leg = (G, hip, knee, foot, r, mat, jm) => { rod(G, hip, knee, r, r * .8, mat); add(G, SK.ball(r * .95, 7, 5), jm || mat, knee); rod(G, knee, foot, r * .8, r * .35, mat); };
  const moss = Ms(0x4a6a2a, { roughness: 1 });
  // ── A: the great diving beetle — a glossy olive-black dome split down the back, a bronze rim, a small head, fringed hind legs
  const beetle = s => { const G = new THREE.Group(); const shell = Ms(0x2a3420, { roughness: .28, metalness: .15 }), rim = Ms(0x7a6a30, { roughness: .4, metalness: .2 }), under = Ms(0x1e2418), dk = Ms(0x141810);
    const cara = SK.ball(.3, 26, 16); const p = cara.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i); if (yy < 0) p.setY(i, yy * .25); } cara.computeVertexNormals();
    add(G, cara, shell, [0, .2, -.05], null, [.95, .7, 1.35]);
    add(G, SK.torus(.3, .016, 6, 36), rim, [0, .2, -.05], [Math.PI / 2, 0, 0], [.95, 1.35, 1]);
    add(G, cara.clone(), dk, [0, .202, -.05], null, [.035, .705, 1.36]);
    add(G, SK.ball(.16, 16, 10), shell, [0, .2, .32], null, [1.25, .55, .6]);
    add(G, SK.ball(.1, 12, 8), under, [0, .17, .45], null, [1.1, .7, .8]);
    for (const sd of [1, -1]) { add(G, SK.ball(.028, 8, 6), Ms(0x0a0a0a, { roughness: .2 }), [sd * .075, .21, .5]);
      rod(G, [sd * .04, .14, .52], [sd * .02, .12, .6], .018, .006, rim); rod(G, [sd * .08, .2, .52], [sd * .22, .26, .66], .006, .003, dk);
      leg(G, [sd * .16, .14, .22], [sd * .34, .26, .34], [sd * .44, 0, .5], .026, under);
      leg(G, [sd * .18, .13, .02], [sd * .4, .24, .06], [sd * .52, 0, .02], .028, under);
      // the hind leg: long and flattened, a fringe of hairs, swept back like an oar
      leg(G, [sd * .16, .13, -.18], [sd * .42, .22, -.3], [sd * .58, 0, -.62], .032, under);
      for (let k = 0; k < 7; k++) { const t = k / 7; rod(G, [sd * (.42 + .16 * t), .22 - .22 * t, -.3 - .32 * t], [sd * (.46 + .16 * t), .2 - .22 * t, -.3 - .32 * t - .06], .004, .002, rim); } }
    for (let i = 0; i < 7; i++) add(G, SK.bumpy(SK.ball(.035 + (i % 3) * .012, 7, 5), .01, 9, i), moss, [Math.sin(i * 2.3) * .14, .4 - Math.abs(Math.sin(i * 2.3)) * .08, -.12 + Math.cos(i * 1.7) * .16]);
    G.scale.setScalar(s); return G; };
  // ── B: the giant water bug — flat and oval, mottled mud-brown, a short pointed beak, the forelegs raptorial and raised
  const bug = s => { const G = new THREE.Group(); const back = Ms(0x4a4230, { roughness: .7 }), dk = Ms(0x2a2418), pale = Ms(0x7a6a48), mem = Ms(0x3a3424, { roughness: .6 });
    const body = SK.ball(.3, 24, 14); const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const zz = p.getZ(i); p.setX(i, p.getX(i) * (1 - .18 * Math.max(0, zz / .3))); } body.computeVertexNormals();
    add(G, body, back, [0, .16, -.08], null, [.95, .32, 1.45]);
    // the wing covers: two overlapping flat plates, the membrane tips crossing at the tail
    for (const sd of [1, -1]) { add(G, SK.ball(.2, 14, 8), mem, [sd * .09, .23, -.2], [0, sd * .12, 0], [.85, .12, 1.6]); }
    add(G, SK.ball(.18, 14, 8), back, [0, .2, .2], null, [1.15, .3, .6]);
    add(G, SK.ball(.09, 12, 8), back, [0, .17, .34], null, [1, .6, .9]);
    rod(G, [0, .14, .4], [0, .08, .5], .03, .006, dk);
    for (let i = 0; i < 14; i++) add(G, SK.ball(.03 + (i % 3) * .01, 6, 4), pale, [Math.sin(i * 2.1) * .2, .245, -.35 + i * .05], null, [1.4, .15, 1]);
    for (const sd of [1, -1]) { add(G, SK.ball(.035, 8, 6), Ms(0x1a1410, { roughness: .2 }), [sd * .085, .2, .37], null, [1, .8, 1.3]);
      // the raptorial forelegs: a thick femur raised forward, a folding tibia that closes on it like a jack-knife, a hook
      const k = [sd * .24, .32, .46], t = [sd * .16, .2, .62]; rod(G, [sd * .1, .12, .34], k, .04, .034, back); add(G, SK.ball(.03, 8, 6), dk, k); rod(G, k, t, .022, .012, back); rod(G, t, [sd * .12, .16, .58], .01, .003, dk);
      leg(G, [sd * .2, .12, .04], [sd * .42, .2, .1], [sd * .56, 0, .06], .024, back, dk);
      // the hind leg: flattened, a paddle of hairs
      leg(G, [sd * .2, .12, -.22], [sd * .44, .18, -.36], [sd * .62, 0, -.62], .026, back, dk);
      add(G, SK.ball(.06, 8, 6), pale, [sd * .56, .05, -.54], [0, sd * .5, 0], [.35, .15, 1.6]); }
    for (let i = 0; i < 6; i++) add(G, SK.bumpy(SK.ball(.035 + (i % 3) * .01, 7, 5), .01, 9, i), moss, [Math.sin(i * 2.7) * .12, .26, -.3 + Math.cos(i * 1.3) * .2]);
    G.scale.setScalar(s); return G; };
  const out = {};
  const floorOf = col => { const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: col })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y, bz); sc.add(f); return f; };
  const grab = (key, objs, camPos, look) => { cam.position.set(bx + camPos[0], y + camPos[1], bz + camPos[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); objs.forEach(x => sc.remove(x)); };
  const place = (o, x, z, ry) => { const r = o.root || o; r.position.set(bx + x, y, bz + z); r.rotation.y = ry || 0; sc.add(r); return r; };
  const bandit = () => { const m = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(m); pwApply(m, pwIdle(1, { holds: m.holds, gear: m.g.gear })); return m; };
  const spider = () => { const w = buildSpider('Spider', .8 * 1.4); WOLF_RIGS.delete(w); sgApply(w, sgStand(1)); return w; };
  forceTime(12);
  // 1. both side by side with a bandit and a spider at the Bog Crawler's size (scale .8)
  let objs = [floorOf(0x4e5a3a), place(bandit(), -2.6, 0, .35), place(spider(), -1.3, .2, .6), place(beetle(.8 * 1.4), .3, 0, .7), place(bug(.8 * 1.4), 2.0, 0, -.6)];
  grab('both', objs, [0, 2.1, 5.6], [0, .25, 0]);
  // 2. close: each from above and three-quarters
  objs = [floorOf(0x4e5a3a), place(beetle(1.6), -1.1, 0, .9), place(bug(1.6), 1.1, 0, -.9)];
  grab('close', objs, [0, 2.4, 3.4], [0, .2, 0]);
  return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'crawler-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
