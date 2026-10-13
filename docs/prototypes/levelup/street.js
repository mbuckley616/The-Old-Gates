// The village lane at eye level (Session 769): what a Gatelands village looks like close up when the houses are
// built as pieces (footings, framing, recessed windows, thick thatch) and the surfaces carry relief.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadPack, makePerson, markGenome } from './people.js';
import { gatelandsHouse } from './pieces.js';
import { STILL, W, H, STATS, rnd, fbm, sstep, mix, makeRenderer, makeComposer, buildTextures, TEX, mat, worldUV, skyDome, clouds, treeKit, run, leafTex, WIND, windVS } from './common.js';

const R = makeRenderer(.8);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .80, .90), .0022);
const cam = new THREE.PerspectiveCamera(52, W / H, .1, 30000);
buildTextures();

// ground: the lane climbs gently away from the camera; a hill with the ruin closes the view
const gy = (x, z) => .045 * Math.max(0, -z) + .25 * fbm(x / 9, z / 9, 3) * sstep(3.5, 6, Math.abs(x)) + 62 * Math.exp(-((x + 30) ** 2 + (z + 300) ** 2) / (2 * 95 ** 2)) + 18 * sstep(40, 140, Math.abs(x)) * (fbm(x / 120, z / 120, 3) + .6);
const SUN = new THREE.Vector3(.80, .36, .30).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .88, .72), 3.6);
sun.position.copy(SUN).multiplyScalar(120).add(new THREE.Vector3(0, 0, -18)); sun.target.position.set(0, 0, -18);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 320 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.40, .34, .24), 1.15));
skyDome(scene, SUN); clouds(scene, SUN, { n: 22, d0: 1800, dw: 5000, y0: 260 });

// the ground, grass and earth in its shader
{
  const g = new THREE.PlaneGeometry(1600, 1600, 400, 400); g.rotateX(-Math.PI / 2); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 200; P.setXYZ(i, x, gy(x, z), z); } g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ roughness: .95 });
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;\n' + `float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }
      float f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p = p * 2.03 + 17.1; m *= .5; } return a; }\n` + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
      float n1 = f1(vW.xz / 6.), n2 = f1(vW.xz * 1.7);
      vec3 grass = mix(vec3(.20,.36,.09), vec3(.40,.52,.15), n1) * (.85 + .3 * n2);
      vec3 earth = mix(vec3(.36,.30,.21), vec3(.46,.39,.28), n2);
      float worn = (1. - smoothstep(3.6, 5.2, abs(vW.x))) * step(vW.z, 8.) * step(-60., vW.z);
      vec4 diffuseColor = vec4(mix(grass, earth, worn * (.6 + .4 * n1)), opacity );`); };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh);
}
// the cobbled lane
{
  const g = new THREE.PlaneGeometry(6.6, 70, 33, 280); g.rotateX(-Math.PI / 2); const P = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 27; P.setXYZ(i, x, gy(x, z) + .03 - .06 * (Math.abs(x) > 3.0 ? 1 : 0), z); uv.setXY(i, x / 2.6, z / 2.6); }
  g.computeVertexNormals(); const m = mat('cobble', { ns: 1.6, rough: .82 }); const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh);
}

// ── the house kit ──
const M = {
  plaster: [0xf4efe4, 0xf3ead2, 0xece2c6, 0xf1e6d8, 0xe9d7b0].map(c => mat('plaster', { ns: .5, color: c, rough: .95 })),
  stone: mat('stone', { ns: 1.3 }), beam: mat('beam', { ns: 1 }), thatch: mat('thatch', { ns: 1.4, rough: 1, color: 0xffe8c8 }), slate: mat('slate', { ns: 1.2, rough: .6 }),
  wood: mat('wood', { ns: 1.1 }), glass: new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .06, .07), roughness: .06, metalness: .1 }),
  lit: new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .08, .05), emissive: new THREE.Color(1, .66, .32), emissiveIntensity: .55, roughness: .2 }),
  frame: new THREE.MeshStandardMaterial({ color: new THREE.Color(.86, .83, .76), roughness: .7 }), iron: new THREE.MeshStandardMaterial({ color: new THREE.Color(.08, .08, .08), roughness: .5, metalness: .6 }),
  pot: new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .32, .2), roughness: .8 }),
};
const PAINT = [[.16, .30, .48], [.20, .38, .26], [.56, .14, .11], [.72, .58, .20], [.30, .44, .52]].map(c => { const m = mat('wood', { ns: .8 }); m.color.setRGB(c[0] * 2.2, c[1] * 2.2, c[2] * 2.2, THREE.SRGBColorSpace); return m; });
const flowerBits = [];
// the house itself is pieces.js's gatelandsHouse (Session 818); the lane places it and keeps its flowers for the instancing
function house(o) {
  const { group: g, flowers } = gatelandsHouse(o, rnd); g.position.set(o.x, o.y, o.z); g.rotation.y = o.ry; scene.add(g); STATS.houses = (STATS.houses || 0) + 1;
  for (const f of flowers) flowerBits.push([g, ...f]); return g;
}
// the lane's houses, both sides, fronts to the lane
const rows = [[-1, [-1, -10.5, -20, -30.5, -41, -52]], [1, [-3, -13, -23.5, -34, -45]]];
let hi = 0;
for (const [side, zs] of rows) for (const z of zs) { const w = 7.2 + rnd() * 2.6, d = 5.4 + rnd() * .8, h = rnd() < .35 ? 5.4 : 3.5 + rnd() * .5, x = side * (4.3 + d / 2);
  house({ x, z, y: gy(x, z) - .25, ry: -side * Math.PI / 2, w, d, h, thatch: h < 4.6 ? rnd() < .8 : rnd() < .3, timber: rnd() < .45, wash: hi, paint: hi * 3 + 1, shutters: rnd() < .75, boxes: rnd() < .7, pots: rnd() < .5, lantern: rnd() < .5, chim: rnd() < .5 ? 1 : -1 }); hi++; }

// flowers in boxes and pots
{
  const fg = new THREE.IcosahedronGeometry(.055, 1), lg = new THREE.IcosahedronGeometry(.075, 0), N = flowerBits.length * 16;
  const fm = new THREE.InstancedMesh(fg, new THREE.MeshStandardMaterial({ roughness: .7 }), N), lm = new THREE.InstancedMesh(lg, new THREE.MeshStandardMaterial({ color: new THREE.Color(.12, .26, .07), roughness: .8 }), N);
  const pal = [[.85, .2, .3], [.95, .55, .7], [.98, .95, .9], [.95, .75, .2], [.6, .3, .75]], Mx = new THREE.Matrix4(), v = new THREE.Vector3(), c = new THREE.Color(); let k = 0;
  for (const [g, x, y, z, span] of flowerBits) { g.updateMatrixWorld(true); const pc = pal[Math.floor(rnd() * pal.length)];
    for (let i = 0; i < 16; i++) { v.set(x + (rnd() - .5) * span * 2, y + .1 + rnd() * .16, z + (rnd() - .5) * .16).applyMatrix4(g.matrixWorld); Mx.makeTranslation(v.x, v.y, v.z); fm.setMatrixAt(k, Mx); c.setRGB(...pc, THREE.SRGBColorSpace); fm.setColorAt(k, c);
      v.y -= .08; Mx.makeTranslation(v.x, v.y, v.z); lm.setMatrixAt(k, Mx); k++; } }
  fm.count = lm.count = k; fm.castShadow = lm.castShadow = true; scene.add(fm, lm);
}

// ── props: barrels, crates, a cart, a stall, sacks, a bench, an inn sign ──
function barrel(x, z, s = 1, ry = 0) {
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(.36 + .07 * Math.sin(t * Math.PI), t * .95)); }
  const g = new THREE.LatheGeometry(pts, 20); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * .9);
  const grp = new THREE.Group(); const b = new THREE.Mesh(g, M.wood); b.castShadow = b.receiveShadow = true; grp.add(b);
  for (const y of [.14, .81]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.385 + .03 * Math.sin(y / .95 * Math.PI), .022, 6, 24), M.iron); r.rotation.x = Math.PI / 2; r.position.y = y; grp.add(r); }
  const lid = new THREE.Mesh(new THREE.CircleGeometry(.36, 20), M.wood); lid.rotation.x = -Math.PI / 2; lid.position.y = .94; grp.add(lid);
  grp.position.set(x, gy(x, z), z); grp.scale.setScalar(s); grp.rotation.y = ry; scene.add(grp);
}
function crate(x, z, s = .7, ry = 0, y0) { const g = new THREE.BoxGeometry(s, s, s); worldUV(g, 1.4); const m = new THREE.Mesh(g, M.wood); m.position.set(x, (y0 ?? gy(x, z)) + s / 2, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m);
  const eg = new THREE.EdgesGeometry(g); const e = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0x2a1c12 })); e.position.copy(m.position); e.rotation.copy(m.rotation); scene.add(e); return m; }
function sack(x, z, ry) { const g = new THREE.SphereGeometry(.3, 14, 10); g.scale(1, 1.25, .8); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(.42, .34, .22), roughness: 1 })); m.position.set(x, gy(x, z) + .32, z); m.rotation.y = ry; m.castShadow = true; scene.add(m); }
barrel(-3.55, -4.2); barrel(-3.5, -3.3, .95, 1); barrel(3.6, -8.6, 1.05); crate(3.7, -9.6, .72, .3); crate(3.6, -9.5, .5, .9, gy(3.7, -9.6) + .72); sack(-3.6, -6.0, .2); sack(-3.3, -5.6, 1.4);
barrel(-3.6, -15.8); barrel(3.65, -19.8, .9); crate(-3.7, -27, .7, .5); sack(3.6, -28.5, .7);
// the cart
{ const x = 2.7, z = -16.5, y = gy(x, z), grp = new THREE.Group(); const bed = new THREE.BoxGeometry(1.5, .14, 2.6); worldUV(bed, 1.2); grp.add(new THREE.Mesh(bed, M.wood).translateY(.78));
  for (const sx of [-1, 1]) { const sd = new THREE.BoxGeometry(.08, .45, 2.6); worldUV(sd, 1.2); grp.add(new THREE.Mesh(sd, M.wood).translateX(sx * .72).translateY(1.05));
    const wheel = new THREE.Group(); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(.55, .06, 8, 24), M.wood)); for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.06, .05), M.wood); sp.rotation.z = k * Math.PI / 6; wheel.add(sp); }
    wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .2, 10).rotateZ(Math.PI / 2), M.iron)); wheel.rotation.y = Math.PI / 2; wheel.position.set(sx * .86, .58, -.2); grp.add(wheel); }
  for (const sx of [-1, 1]) grp.add(new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 2.2, 6).rotateX(Math.PI / 2 - .25), M.wood).translateX(sx * .45).translateY(.62).translateZ(2.1));
  const hay = new THREE.BoxGeometry(1.3, .55, 2.2, 1, 1, 1); worldUV(hay, .8); const hm = new THREE.Mesh(hay, M.thatch); hm.position.y = 1.15; grp.add(hm);
  grp.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); grp.position.set(x, y, z); grp.rotation.y = .12; scene.add(grp); }
// the market stall, striped awning
{ const x = -2.4, z = -24, y = gy(x, z), grp = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 128; cv.height = 16; const cx = cv.getContext('2d'); for (let i = 0; i < 8; i++) { cx.fillStyle = i % 2 ? '#efe6d2' : '#9e2a1e'; cx.fillRect(i * 16, 0, 16, 16); }
  const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace; const aw = new THREE.PlaneGeometry(3.2, 2.0, 12, 6); { const p = aw.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * .04); aw.computeVertexNormals(); }
  const awn = new THREE.Mesh(aw, new THREE.MeshStandardMaterial({ map: st, side: THREE.DoubleSide, roughness: .9 })); awn.rotation.x = -Math.PI / 2 + .35; awn.position.set(0, 2.45, .2); grp.add(awn);
  for (const [px, pz, ph] of [[-1.5, -.6, 2.8], [1.5, -.6, 2.8], [-1.5, .9, 2.25], [1.5, .9, 2.25]]) grp.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, ph, 8), M.wood).translateX(px).translateY(ph / 2).translateZ(pz));
  const ctr = new THREE.BoxGeometry(3.0, .9, .9); worldUV(ctr, 1.2); grp.add(new THREE.Mesh(ctr, M.wood).translateY(.45).translateZ(.4));
  const ap = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07, 1), new THREE.MeshStandardMaterial({ roughness: .5 }), 90), Mx = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < 90; i++) { const tray = Math.floor(i / 30); Mx.makeTranslation(-1.0 + tray * 1.0 + (rnd() - .5) * .7, .95 + rnd() * .08, .25 + rnd() * .35); ap.setMatrixAt(i, Mx); c.setRGB(...[[.7, .1, .08], [.45, .62, .15], [.95, .62, .12]][tray], THREE.SRGBColorSpace); ap.setColorAt(i, c); } grp.add(ap);
  grp.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); grp.position.set(x, y, z); grp.rotation.y = Math.PI / 2; scene.add(grp); }
// the inn sign over the lane
{ const x = 3.95, z = -30, y = gy(x, z); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, .07, .07), M.iron); arm.position.set(x - .65, y + 3.6, z); scene.add(arm);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const k = cv.getContext('2d'); k.fillStyle = '#2b3d2c'; k.fillRect(0, 0, 128, 96); k.strokeStyle = '#d7b25a'; k.lineWidth = 5; k.strokeRect(6, 6, 116, 84);
  k.fillStyle = '#d7b25a'; k.beginPath(); k.ellipse(64, 46, 22, 26, 0, 0, 7); k.fill(); k.fillStyle = '#2b3d2c'; k.beginPath(); k.ellipse(64, 46, 12, 16, 0, 0, 7); k.fill();
  const sg = new THREE.Mesh(new THREE.BoxGeometry(.95, .7, .06), [M.wood, M.wood, M.wood, M.wood, new THREE.MeshStandardMaterial({ map: Object.assign(new THREE.CanvasTexture(cv), { colorSpace: THREE.SRGBColorSpace }) }), new THREE.MeshStandardMaterial({ map: Object.assign(new THREE.CanvasTexture(cv), { colorSpace: THREE.SRGBColorSpace }) })]);
  sg.position.set(x - .85, y + 3.15, z); sg.castShadow = true; scene.add(sg); }

// ivy on two walls, grass along the wall foots
{
  const im = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: .45, side: THREE.DoubleSide, color: new THREE.Color(.55, .75, .45), roughness: .8 });
  const cards = []; for (const [bx, bz, side] of [[-4.32, -12, 1], [4.32, -36, -1], [-4.32, -44, 1]]) for (let i = 0; i < 60; i++) { const u = rnd(), hgt = 3.2 * Math.sqrt(rnd()) * (1 - u * .3); const pg = new THREE.PlaneGeometry(.75, .75); pg.rotateY(side * Math.PI / 2 + (rnd() - .5) * .6); pg.rotateZ((rnd() - .5) * .8); pg.translate(bx + side * (.02 + rnd() * .06), gy(bx, bz) + .2 + hgt, bz + (u - .5) * 3.6 * (1 - hgt / 4)); cards.push(pg); }
  const iv = new THREE.Mesh(mergeGeometries(cards), im); iv.castShadow = true; iv.receiveShadow = true; scene.add(iv);
  const seg = 3, posA = [], colA = [], idx = []; for (let k = 0; k <= seg; k++) { const t = k / seg, w = .05 * (1 - t); posA.push(-w, t, 0, w, t, 0); const c = [.08 + .3 * t, .17 + .38 * t, .04 + .1 * t]; colA.push(...c, ...c); } for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(posA.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); bg.setIndex(idx);
  const gm = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .8 }); gm.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.18, 1.4)); s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);'); };
  const N = 60000, gr = new THREE.InstancedMesh(bg, gm, N), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let n = 0;
  while (n < N) { const side = rnd() < .5 ? -1 : 1, x = side * (3.25 + rnd() * 1.0), z = 6 - rnd() * 66; if (rnd() < .45 * sstep(.8, 1, (Math.abs(x) - 3.25))) continue; p.set(x, gy(x, z) - .02, z); q.setFromAxisAngle(up, rnd() * 6.3); s.set(1, .25 + rnd() * .45, 1); Mx.compose(p, q, s); gr.setMatrixAt(n++, Mx); }
  gr.receiveShadow = true; scene.add(gr);
  // and wide grass beyond the houses
  const N2 = 70000, g2 = new THREE.InstancedMesh(bg, gm, N2); n = 0; while (n < N2) { const x = (rnd() - .5) * 90, z = 10 - rnd() * 90; if (Math.abs(x) < 10.5) continue; p.set(x, gy(x, z) - .02, z); q.setFromAxisAngle(up, rnd() * 6.3); s.set(1.4, .4 + rnd() * .5, 1); Mx.compose(p, q, s); g2.setMatrixAt(n++, Mx); }
  g2.receiveShadow = true; scene.add(g2);
}

// trees around the village, the ruin on the hill
const trees = treeKit(SUN), tl = [];
for (let i = 0; i < 260; i++) { const x = (rnd() - .5) * 420, z = 20 - rnd() * 420; if (Math.abs(x) < 12 && z > -70) continue; if (Math.hypot(x + 30, z + 300) < 60) continue; tl.push([x, gy(x, z), z, .7 + rnd() * .6, rnd() * 6.3, new THREE.Color(.86 + .2 * rnd(), .95 + .1 * rnd(), .62 + .1 * rnd())]); }
tl.push([-9, gy(-9, -4), -4, 1.25, .4], [11, gy(11, -26), -26, 1.15, 1.2], [-12, gy(-12, -38), -38, 1.3, 2]);
trees.plant(scene, tl);
{ const rx = -30, rz = -300, y = gy(rx, rz) - 2, parts = [], pale = mat('lichen', { ns: 1 }); pale.color.setRGB(1.18, 1.1, .95);
  const add = (geo, x, yy, z) => { worldUV(geo, .25); geo.translate(rx + x, y + yy, rz + z); parts.push(geo.index ? geo.toNonIndexed() : geo); };
  for (const [x, hh] of [[-12, 30], [12, 28.5]]) add(new THREE.BoxGeometry(6, hh, 6).translate(0, hh / 2, 0), x, 0, 0);
  { const sh = new THREE.Shape(); sh.absarc(0, 0, 15, 0, Math.PI, false); sh.lineTo(-9, 0); sh.absarc(0, 0, 9, Math.PI, 0, true); sh.lineTo(15, 0); const ag = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false, curveSegments: 24 }); ag.translate(0, 0, -3); add(ag.translate(0, 28, 0), 0, 0, 0); }
  for (const [x, z, hh, ww] of [[-30, 8, 18, 14], [27, 12, 12, 10], [-6, -16, 9, 18]]) add(new THREE.BoxGeometry(ww, hh, 3).translate(0, hh / 2, 0), x, -1, z);
  const m = new THREE.Mesh(mergeGeometries(parts), pale); m.castShadow = true; scene.add(m); }

// ── the camera and the people ──
const CAM = new THREE.Vector3(.4, gy(.4, 7) + 1.65, 7); cam.position.copy(CAM); cam.lookAt(0, gy(0, -30) + 1.6, -30);
const comp = makeComposer(R, scene, cam, { bloom: .18, sat: 1.08 });
// Markfolk from the genome (Session 770): MakeHuman's body, our wardrobe and hair
loadPack('mh/').then(() => {
  for (const [x, z, g, ry, o] of [[1.0, -6.5, 1, .25, {}], [2.7, -10.6, 0, -1.2, { mantle: false }], [-1.9, -14, 1, 1.1, { age: .75, hair: [.85, .84, .8] }], [-1.55, -22.4, 0, -1.6, {}], [2.3, -29, 1, -2.6, { mantle: false }]]) {
    const p = makePerson(markGenome(rnd, g, o)); p.root.position.x = x; p.root.position.z = z; p.root.position.y += gy(x, z) - .02; p.root.rotation.y = ry; scene.add(p.root); STATS.people = (STATS.people || 0) + 1; }
  run(comp, cam); }).catch(e => { window.__err = String(e); console.error(e); run(comp, cam); });
