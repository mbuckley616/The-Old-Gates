// node docs/prototypes/coach/shoot.mjs -> docs/prototypes/coach-*.png
// Session 230: the last box bodies in the open world outside the foes — the road coach and its two horses (boxes on sticks)
// and the shark (a cylinder and four cones). Built in the game from SK shapes as plain meshes, beside today's, with a
// person for scale. A prototype: index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(32, cv.width / cv.height, .05, 200);
  const Ms = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {}));
  const add = (par, geo, mat, p, r, s) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); par.add(m); return m; };
  const rod = (par, a, c, r0, r1, mat) => { const d = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); const g2 = SK.cyl(r1, r0, L, 8); g2.translate(0, L / 2, 0); const m = new THREE.Mesh(g2, mat); m.position.set(...a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; };
  const zl = (pts, n) => { const g2 = SK.lathe(pts, n || 16); g2.rotateX(Math.PI / 2); return g2; };
  // ── the horse: a barrel on four long legs, a deep chest, a long neck and head, a mane and a tail; harnessed
  const horse = (coat, mane, pose) => { const G = new THREE.Group(); const C = Ms(coat), M = Ms(mane, { roughness: 1 }), H = Ms(0x1e1a16, { roughness: .5 }), L = Ms(new THREE.Color(coat).multiplyScalar(.8).getHex()), T = Ms(0x3a2616, { roughness: .6 }), BR = Ms(0xc8a050, { metalness: .6, roughness: .4 });
    add(G, zl([[0, -.62], [.14, -.6], [.26, -.45], [.3, -.2], [.3, .1], [.28, .35], [.2, .55], [0, .62]], 18), C, [0, 1.12, 0], null, [.82, 1.02, 1]);
    add(G, SK.ball(.28, 14, 10), C, [0, 1.16, -.46], null, [.9, .95, 1]); add(G, SK.ball(.27, 14, 10), C, [0, 1.12, .42], null, [.88, 1.05, 1]);
    // legs: a muscled forearm or gaskin, a slim cannon, a fetlock, a dark hoof; the hind legs angled at the hock
    const legs = pose === 'walk' ? [[.16, .5, .25], [-.16, .5, -.2], [.16, -.5, -.25], [-.16, -.5, .2]] : [[.16, .5, 0], [-.16, .5, 0], [.16, -.5, 0], [-.16, -.5, 0]];
    for (const [x, z, sw] of legs) { const fore = z > 0; const top = [x, 1.02, z * (fore ? .82 : .9)], knee = [x, .58, z * (fore ? .84 : .95) + sw * .3 + (fore ? 0 : -.08)], fet = [x, .14, z * .86 + sw * .5], hoof = [x, .05, z * .86 + sw * .52 + .03];
      rod(G, top, knee, fore ? .09 : .12, .055, C); add(G, SK.ball(.055, 8, 6), L, knee); rod(G, knee, fet, .042, .036, L); add(G, SK.ball(.048, 8, 6), L, fet); rod(G, fet, hoof, .045, .06, H); }
    // neck and head
    const nk = [0, 1.28, .5], hd = [0, 1.78, .86]; rod(G, nk, hd, .2, .12, C); add(G, SK.ball(.13, 10, 8), C, hd, null, [.85, 1, 1]);
    add(G, zl([[0, 0], [.1, 0], [.095, .14], [.075, .3], [.06, .38], [0, .4]], 12), C, [0, 1.76, .86], [1.15, 0, 0], [1, .85, 1]);
    for (const s of [1, -1]) { add(G, SK.cone(.035, .12, 6), C, [s * .06, 1.9, .8], [-.2, 0, -s * .2], [1, 1, .5]); add(G, SK.ball(.022, 8, 6), H, [s * .075, 1.74, .95]); }
    for (let i = 0; i < 9; i++) { const t = i / 8; add(G, SK.bumpy(SK.ball(.06, 8, 6), .015, 11, i), M, [0, 1.3 + t * .52, .44 + t * .4 - .02], null, [.5, 1.3, 1]); }
    rod(G, [0, 1.22, -.6], [0, .72, -.78], .07, .04, M); add(G, SK.bumpy(SK.ball(.08, 8, 6), .02, 9, 3), M, [0, .66, -.8], null, [.8, 1.4, .8]);
    // harness: a padded collar, a saddle pad and girth, the bridle, brass on the collar
    add(G, SK.torus(.2, .05, 8, 18), T, [0, 1.3, .55], [-1.0, 0, 0], [1, 1.25, 1]); add(G, SK.ball(.03, 8, 6), BR, [0, 1.5, .66]);
    add(G, SK.cyl(.33, .33, .12, 16, 1, true, 0, Math.PI), T, [0, 1.12, .02], [0, 0, Math.PI / 2], [1, 1, 1]);
    for (const s of [1, -1]) rod(G, [s * .07, 1.58, 1.1], [s * .16, 1.28, .62], .012, .012, T); add(G, SK.torus(.075, .012, 5, 12), T, [0, 1.6, 1.06], [.5, 0, 0]);
    G.scale.setScalar(.95); return G; };
  // ── the coach: a panelled body on springs, windows with frames, a door each side, a roof with a rail and luggage,
  // the driver's bench and footboard, lamps, four spoked wheels, the pole to the horses
  const coach = () => { const G = new THREE.Group(); const B = Ms(0x5a2a1a, { roughness: .55 }), D = Ms(0x2a1410), W = Ms(0x8aa0b0, { roughness: .2, metalness: .1 }), I = Ms(0x2a2a2e, { metalness: .5, roughness: .5 }), BR = Ms(0xc8a050, { metalness: .6, roughness: .35 }), WD = Ms(0x4a3018), Y = Ms(0xb08a30);
    add(G, SK.rbox(1.6, 1.15, 2.3, .12, 3), B, [0, 1.45, 0]); add(G, SK.rbox(1.72, .12, 2.46, .04, 2), D, [0, 2.07, 0]); add(G, SK.rbox(1.5, .26, 1.9, .08, 2), B, [0, .86, 0]);
    for (const s of [1, -1]) { for (const z of [-.62, .62]) { add(G, SK.rbox(.03, .46, .5, .02, 1), W, [s * .8, 1.62, z]); add(G, SK.rbox(.05, .52, .56, .02, 1), D, [s * .79, 1.62, z], null, [1, 1, 1]).scale.set(1, 1, 1); }
      add(G, SK.rbox(.04, .9, .62, .02, 1), D, [s * .81, 1.38, 0]); add(G, SK.ball(.025, 8, 6), BR, [s * .84, 1.38, .22]); add(G, SK.rbox(.02, .24, .3, .01, 1), Y, [s * .83, 1.22, 0]); }
    for (const [x, z] of [[.8, 1.2], [-.8, 1.2], [.8, -1.2], [-.8, -1.2]]) rod(G, [x, 2.13, z], [x, 2.3, z], .015, .015, I);
    for (const s of [1, -1]) rod(G, [s * .8, 2.3, -1.2], [s * .8, 2.3, 1.2], .015, .015, I); rod(G, [.8, 2.3, 1.2], [-.8, 2.3, 1.2], .015, .015, I); rod(G, [.8, 2.3, -1.2], [-.8, 2.3, -1.2], .015, .015, I);
    add(G, SK.rbox(.9, .35, .7, .06, 2), Ms(0x6a5030), [.15, 2.3, -.4]); add(G, SK.rbox(.5, .3, .5, .05, 2), Ms(0x3a3a2a), [-.35, 2.28, .35]);
    // the driver's bench out in front, a footboard, the lamps
    add(G, SK.rbox(1.4, .1, .5, .03, 2), WD, [0, 2.0, 1.45]); add(G, SK.rbox(1.4, .4, .08, .03, 2), WD, [0, 2.2, 1.24]); add(G, SK.rbox(1.3, .06, .5, .02, 1), WD, [0, 1.55, 1.75], [.5, 0, 0]);
    for (const s of [1, -1]) { add(G, SK.cyl(.06, .05, .16, 8), I, [s * .82, 1.95, 1.2]); add(G, SK.ball(.045, 8, 6), Ms(0xffd070, { emissive: 0xffa030, emissiveIntensity: .6 }), [s * .82, 1.96, 1.2]); }
    // wheels: an iron tyre, a felloe, twelve spokes, a hub; larger behind; leaf springs over the axles
    const wheel = (r, x, z) => { const w = new THREE.Group(); add(w, SK.torus(r, .035, 6, 28), I, null, [0, Math.PI / 2, 0]); add(w, SK.torus(r - .05, .03, 5, 24), Y, null, [0, Math.PI / 2, 0]);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rod(w, [0, 0, 0], [0, Math.cos(a) * (r - .06), Math.sin(a) * (r - .06)], .018, .014, Y); } add(w, SK.cyl(.08, .08, .16, 10), Y, null, [0, 0, Math.PI / 2]); add(w, SK.cyl(.05, .05, .2, 8), I, null, [0, 0, Math.PI / 2]);
      w.position.set(x, r + .02, z); G.add(w); };
    wheel(.55, .95, -.95); wheel(.55, -.95, -.95); wheel(.42, .95, .95); wheel(.42, -.95, .95);
    for (const z of [.95, -.95]) { rod(G, [.95, z > 0 ? .44 : .57, z], [-.95, z > 0 ? .44 : .57, z], .03, .03, I); for (const s of [1, -1]) add(G, SK.ball(.1, 8, 6), I, [s * .55, z > 0 ? .62 : .72, z], null, [1.6, .3, .5]); }
    rod(G, [0, .5, 1.1], [0, .75, 3.1], .04, .035, WD); return G; };
  // ── the shark: a lathe body counter-shaded (grey back, pale belly), a pointed snout, a crescent tail, a tall dorsal, pectorals, gill slits
  const shark = () => { const G = new THREE.Group(); const back = Ms(0x5a6a74, { roughness: .45 }), belly = Ms(0xd8dcd8, { roughness: .5 }), E = Ms(0x0a0a0a, { roughness: .1 });
    const pts = [[0, -1.5], [.07, -1.3], [.14, -.9], [.24, -.4], [.31, .1], [.32, .45], [.27, .85], [.17, 1.2], [.07, 1.45], [0, 1.56]]; add(G, zl(pts, 20), back, [0, .38, 0], null, [.78, .88, 1]);
    add(G, zl(pts.map(p => [p[0] * .97, p[1] * .96]), 20), belly, [0, .34, .02], null, [.76, .74, 1]);
    const fin = (pts2, mat, p, r) => { const sh = new THREE.Shape(); sh.moveTo(...pts2[0]); for (let i = 1; i < pts2.length; i++) sh.lineTo(...pts2[i]); const g2 = new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2 }); g2.translate(0, 0, -.015); const m = add(G, g2, mat, p, r); return m; };
    fin([[0, 0], [.18, .55], [.3, .56], [.42, 0]], back, [0, .66, .05], [0, Math.PI / 2, 0]);
    fin([[0, 0], [-.2, .75], [-.08, .75], [.22, .06], [-.18, -.5], [-.28, -.48], [0, 0]], back, [0, .4, -1.45], [0, Math.PI / 2, 0]);
    for (const s of [1, -1]) { fin([[0, 0], [.55, -.18], [.5, -.26], [0, -.12]], back, [s * .22, .28, .5], [0, s > 0 ? 0 : Math.PI, -s * .25]); add(G, SK.ball(.03, 8, 6), E, [s * .15, .47, 1.12]);
      for (let i = 0; i < 4; i++) add(G, SK.cyl(.006, .006, .14, 4), Ms(0x3a4a54), [s * .25, .4, .78 - i * .06], [0, 0, 0]); }
    fin([[0, 0], [.1, .22], [.2, 0]], back, [0, .5, -.95], [0, Math.PI / 2, 0]).scale.setScalar(.8);
    G.scale.setScalar(1.2); return G; };
  const out = {};
  const grab = (key, objs, cp, look) => { cam.position.set(bx + cp[0], y + cp[1], bz + cp[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); objs.forEach(x => sc.remove(x)); };
  const put = (o, x, z, ry, yy) => { o.position.set(bx + x, y + (yy || 0), bz + z); o.rotation.y = ry || 0; sc.add(o); return o; };
  const floor = (col, w, d) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color: col })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y + .001, bz); sc.add(f); return f; };
  const person = () => { const r = buildFoe('Highwayman', 3, 3); PEOPLE_RIGS.delete(r); pwApply(r, pwIdle(1, { holds: r.holds, gear: r.g.gear })); return r.root; };
  // today's coach and horse, as the world builds them
  const VC = new THREE.MeshLambertMaterial({ color: 0x5a2a1a }); const todayCoach = () => { const G = new THREE.Group(); add(G, new THREE.BoxGeometry(1.7, 1.3, 3.0), VC, [0, 1.15, 0]); add(G, new THREE.BoxGeometry(1.8, .1, 3.1), Ms(0x3a1a10), [0, 1.85, 0]);
    for (const [x, yy, z, r] of [[.95, .55, 1, .55], [-.95, .55, 1, .55], [.95, .45, -1, .45], [-.95, .45, -1, .45]]) add(G, new THREE.CylinderGeometry(r, r, .14, 12), Ms(0x2a1a10), [x, yy, z], [0, 0, Math.PI / 2]); add(G, new THREE.BoxGeometry(1.4, .3, .6), Ms(0x4a3018), [0, 1.9, 1.6]); return G; };
  const todayHorse = () => { const G = new THREE.Group(); const c = Ms(0x4a3020), l = Ms(0x3a2418); add(G, new THREE.BoxGeometry(.55, .7, 1.5), c, [0, 1.05, 0]); add(G, new THREE.BoxGeometry(.32, .5, .7), c, [0, 1.5, .95], [-.5, 0, 0]); for (const [x, z] of [[.2, .55], [-.2, .55], [.2, -.55], [-.2, -.55]]) add(G, new THREE.BoxGeometry(.12, .9, .12), l, [x, .45, z]); return G; };
  forceTime(10.5);
  // 1. the coach and pair, today's (left) and proposed (right), a person between
  let objs = [floor(0x6a7048, 40, 24)];
  objs.push(put(todayCoach(), -3.6, -1.2, .5), put(todayHorse(), -3.0 + 1.6, 1.4, .5), put(todayHorse(), -3.0 + .6, 2.0, .5));
  objs.push(put(person(), 0, 1.5, .2));
  objs.push(put(coach(), 3.2, -1.2, -.5), put(horse(0x5a3a22, 0x1a1210, 'walk'), 3.2 - 1.4, 1.4, -.5), put(horse(0x8a8a88, 0x5a5a58), 3.2 - .45, 2.05, -.5));
  grab('pair', objs, [0, 3.2, 11.5], [0, 1.1, 0]);
  // 2. the horses close, two coats, standing and walking
  objs = [floor(0x6a7048, 30, 20), put(person(), -1.9, .6, .4), put(horse(0x5a3a22, 0x1a1210), -.4, 0, Math.PI / 2 - .3), put(horse(0x8a8a88, 0x5a5a58, 'walk'), 1.9, .3, -Math.PI / 2 + .4)];
  grab('horses', objs, [0, 1.8, 6.4], [0, 1.0, 0]);
  // 3. the shark in the water, today's and proposed
  const water = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ color: 0x2a5a7a, transparent: true, opacity: .55, roughness: .2 })); water.rotation.x = -Math.PI / 2; water.position.set(bx, y + .55, bz);
  const todayShark = () => { const G = new THREE.Group(); const m = new THREE.MeshLambertMaterial({ color: 0x5a6a74 }); const s2 = 1.2; add(G, new THREE.CylinderGeometry(.22 * s2, .42 * s2, 2.6 * s2, 8), m, [0, .2 * s2, 0], [Math.PI / 2, 0, 0]); add(G, new THREE.ConeGeometry(.22 * s2, .7 * s2, 8), m, [0, .2 * s2, 1.6 * s2], [Math.PI / 2, 0, 0]);
    add(G, new THREE.ConeGeometry(.18 * s2, .7 * s2, 4), m, [0, .85 * s2, -.1 * s2]); add(G, new THREE.ConeGeometry(.16 * s2, .9 * s2, 4), m, [0, .5 * s2, -1.6 * s2], [.3, 0, Math.PI]); for (const s of [-1, 1]) add(G, new THREE.ConeGeometry(.12 * s2, .5 * s2, 4), m, [s * .45 * s2, .1 * s2, .4 * s2], [0, 0, s * Math.PI / 2]); return G; };
  objs = [floor(0xc8b27a, 30, 20), put(todayShark(), -2.4, 0, 1.3), put(shark(), 2.2, 0, -1.3)];
  grab('shark', objs, [0, 1.6, 7.5], [0, .45, 0]);
  return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'coach-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
