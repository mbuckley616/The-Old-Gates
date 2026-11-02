// Wagons and carts by island (the concept artist, 2 Nov 2026; backlog L3, OG-046): wagons.js's vehicles on a road of their island.
// ?view=road (the island's three along its road, a person by each), close (one vehicle, three-quarter from the front), side (one,
// side-on beside a person, for the scale), front (one, from ahead of its team); &island=gatelands|mark|aurenne; &mode=one|own|snow
// (A one kit painted by island, B each island its own, C B and the Mark on runners while snow lies); &piece=<key> for close, side
// and front (glCart, glWagon, glCoach, mkCart, mkWagon, mkKjerre, auCart, auWagon, auCarriage); &nopeople; &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, reseed, rnd, fbm, makeRenderer, makeComposer, buildTextures, skyDome, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { vehicle, packCamel, merged, VEH, ROADS, VH_MODES, PAL } from './wagons.js';

const MODE = VH_MODES[Q.get('mode')] ? Q.get('mode') : 'own', VIEW = Q.get('view') || 'road';
let ISLE = Q.get('island') || (Q.get('piece') && VEH[Q.get('piece')]?.island) || 'gatelands';
const SNOW = MODE === 'snow' && ISLE === 'mark';
const LOOK = {
  gatelands: { sun: [-.55, .5, .55], sunC: [1, .92, .8], sunI: 3.2, hemi: [[.62, .72, .86], [.3, .32, .2], 1.15], fog: [.8, .84, .87, .0035], sky: { zen: [.14, .3, .6], mid: [.38, .56, .82], hor: [.8, .85, .88] }, grass: [.26, .4, .14], grass2: [.34, .46, .18], road: [.42, .36, .27], people: 'gatelander' },
  mark: { sun: [.6, .28, .5], sunC: [1, .86, .7], sunI: 3.0, hemi: [[.6, .68, .84], [.28, .27, .24], 1.25], fog: [.74, .79, .86, .004], sky: { zen: [.16, .26, .48], mid: [.42, .54, .74], hor: [.78, .82, .88] }, grass: [.3, .33, .2], grass2: [.36, .3, .24], road: [.36, .33, .3], people: 'markman' },
  aurenne: { sun: [-.4, .72, .4], sunC: [1, .94, .82], sunI: 3.6, hemi: [[.66, .76, .9], [.42, .36, .26], 1.05], fog: [.86, .86, .84, .0028], sky: { zen: [.1, .28, .62], mid: [.34, .56, .86], hor: [.84, .86, .86] }, grass: [.56, .48, .3], grass2: [.48, .44, .26], road: [.66, .6, .5], people: 'aurennais' }
}, L = LOOK[ISLE];
if (SNOW) Object.assign(L, { grass: [.88, .9, .94], grass2: [.8, .83, .88], road: [.7, .72, .76], sunI: 2.6, fog: [.82, .85, .9, .0045] });
const R = makeRenderer(SNOW ? .78 : .85), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(VIEW === 'road' ? 46 : 40, W / H, .05, 30000); buildTextures();
const SUN = new THREE.Vector3(...L.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...L.fog.slice(0, 3)), L.fog[3]);
const sun = new THREE.DirectionalLight(new THREE.Color(...L.sunC), L.sunI); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...L.hemi[0]), new THREE.Color(...L.hemi[1]), L.hemi[2]));
skyDome(scene, SUN, L.sky); reseed(11); clouds(scene, SUN, { n: 10, d0: 1600, dw: 4500, y0: 420 });
function sunBox(cx, cy, cz, half) { sun.position.copy(SUN).multiplyScalar(200).add(new THREE.Vector3(cx, cy, cz)); sun.target.position.set(cx, cy, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 10, far: 500 }); sun.shadow.camera.updateProjectionMatrix(); }

// ── the land: a road along x, 4.5 m wide, flat within 6 m of its line; the island's verges and its few landmarks ──
const ground = (x, z) => { const off = Math.max(0, Math.abs(z) - 6); return off ? fbm(x / 30, z / 30, 4) * Math.min(1, off / 12) * 3 + off * .02 : 0; };
{ const g = new THREE.PlaneGeometry(600, 600, 300, 300); g.rotateX(-Math.PI / 2); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, ground(x, z) - .02); const n = fbm(x / 6, z / 6, 3), rd = Math.max(0, 1 - Math.max(0, Math.abs(z + Math.sin(x * .7) * .05) - 2.0) / .8), rut = rd * (Math.abs(Math.abs(z) - .8) < .25 ? .82 : 1);
    const gc = L.grass.map((v, k) => v + (L.grass2[k] - v) * n), col = gc.map((v, k) => (v + (L.road[k] - v) * rd) * (rd ? rut : 1) * (.9 + .2 * fbm(x * 1.3, z * 1.3, 2))); c.set(col, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); m.receiveShadow = true; scene.add(m); }
{ const T = treeKit(SUN), list = [], stone = new THREE.MeshStandardMaterial({ color: new THREE.Color(.27, .27, .25), roughness: .95, flatShading: true }), rr = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  if (ISLE === 'gatelands') { // a drystone wall on the far side of the road: rough stones in two courses and a row of copes, 1.1 m high
    const gs = []; for (let x = -70; x < 90;) { const w = .35 + rr() * .4; for (const [y0, h] of [[0, .38 + rr() * .1], [.45, .3 + rr() * .1]]) { const g = new THREE.DodecahedronGeometry(.5, 0); g.scale(w * .95, h, .55 + rr() * .15); g.rotateY((rr() - .5) * .3); g.translate(x + (rr() - .5) * .08, y0 + h * .5, -4.3 + (rr() - .5) * .1); gs.push(g); }
      const c = new THREE.BoxGeometry(.16 + rr() * .06, .36, .5); c.rotateX((rr() - .5) * .2); c.rotateZ((rr() - .5) * .4); c.translate(x, 1.0, -4.3); gs.push(c); x += w * .9; }
    const m = new THREE.Mesh(merged(gs.map(g => g.index ? g.toNonIndexed() : g)), stone); m.geometry.computeVertexNormals(); m.castShadow = m.receiveShadow = true; scene.add(m);
    for (let i = 0; i < 26; i++) list.push([-50 + rr() * 140, 0, (rr() < .5 ? -1 : 1) * (14 + rr() * 40), .8 + rr() * .5, rr() * 6, null]); }
  if (ISLE === 'mark') { const wood = new THREE.MeshStandardMaterial({ color: new THREE.Color(.3, .24, .18), roughness: .9 }); for (const s of [-1, 1]) for (let x = -60; x < 90; x += 2.6) { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.3, .12), wood); p.position.set(x, .65, s * 4.6); p.castShadow = true; scene.add(p); const rl = new THREE.Mesh(new THREE.BoxGeometry(2.6, .08, .06), wood); rl.position.set(x + 1.3, .95 + (x % 5) * .01, s * 4.6); rl.rotation.z = .05; scene.add(rl); }
    const pine = new THREE.MeshStandardMaterial({ color: SNOW ? new THREE.Color(.16, .22, .2) : new THREE.Color(.1, .18, .12), roughness: .9 }); for (let i = 0; i < 70; i++) { const x = -60 + rr() * 160, z = (rr() < .5 ? -1 : 1) * (12 + rr() * 60), h = 6 + rr() * 8, y = ground(x, z); for (let t = 0; t < 4; t++) { const th = h * (.42 - t * .06), c = new THREE.Mesh(new THREE.ConeGeometry(h * (.2 - t * .035), th, 9), pine); c.position.set(x, y + 1 + t * h * .2 + th / 2, z); c.castShadow = true; scene.add(c); }
      { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1e })); tr.position.set(x, y + .7, z); scene.add(tr); }
      if (SNOW) { const s = new THREE.Mesh(new THREE.ConeGeometry(h * .16, h * .35, 9), new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: .9 })); s.position.set(x, y + h * .82 + .6, z); scene.add(s); } } }
  if (ISLE === 'aurenne') { const cyp = new THREE.MeshStandardMaterial({ color: new THREE.Color(.12, .2, .1), roughness: .9 }); for (let i = 0; i < 40; i++) { const x = -60 + rr() * 160, z = (rr() < .5 ? -1 : 1) * (9 + rr() * 50), h = 6 + rr() * 5, y = ground(x, z), c = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), cyp); c.scale.set(h * .12, h / 2, h * .12); c.position.set(x, y + h / 2, z); c.castShadow = true; scene.add(c); }
    for (let i = 0; i < 18; i++) list.push([-50 + rr() * 140, 0, (rr() < .5 ? -1 : 1) * (16 + rr() * 40), .55 + rr() * .3, rr() * 6, new THREE.Color(.75, .85, .6)]);
    const flag = new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .57, .48), roughness: .9 }); for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(150, .18, .3), flag); k.position.set(15, .05, s * 2.4); k.receiveShadow = true; scene.add(k); } }
  list.forEach(t => t[1] = ground(t[0], t[2])); if (list.length) T.plant(scene, list); }

// ── the vehicles ──
const keys = VIEW === 'road' ? ROADS[ISLE][MODE] : [Q.get('piece') || ROADS[ISLE][MODE][0]];
const pal = MODE === 'one' ? PAL[ISLE] : undefined, built = []; let x = 0;
for (const k of keys) { const v = vehicle(k, { island: ISLE, pal, runners: SNOW && (k === 'mkCart' || k === 'mkKjerre'), key: `${ISLE}:${MODE}:${k}` });
  v.group.rotation.y = Math.PI / 2; v.group.position.set(x, 0, VIEW === 'road' ? (built.length % 2 ? .35 : -.35) : 0); scene.add(v.group); built.push({ v, x }); x -= v.len + 5; }
if (VIEW === 'road' && ISLE === 'aurenne' && MODE !== 'one') { const C = packCamel('aurenne:camel'); C.root.rotation.y = Math.PI / 2; C.root.position.set(x + 1.5, 0, 1.2); C.root.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); scene.add(C.root); built.push({ camel: C, x: x + 1.5 }); }
const toW = (b, p) => new THREE.Vector3(b.x + p.z, 0, -p.x + (b.v ? b.v.group.position.z : 0));

// ── the camera ──
const F = built[0].v, front = built[0].x + F.rear + F.len, tail = built.filter(b => b.v).at(-1), back = tail.x + tail.v.rear;
let eye, look;
if (VIEW === 'road') { const mid = (front + back) / 2; eye = new THREE.Vector3(mid + 9, 3.6, 14.5); look = new THREE.Vector3(mid - .5, .9, -1); sunBox((front + back) / 2, 0, 0, 26); }
else { const lz = F.rear + F.len / 2; // the rig's middle, in its frame (z forward = +x in the world)
  if (VIEW === 'side') { eye = new THREE.Vector3(lz, 1.35, F.len * .95 + 2.5); look = new THREE.Vector3(lz, 1.05, 0); }
  else if (VIEW === 'front') { eye = new THREE.Vector3(F.rear + F.len + 3.2, 1.8, 2.6); look = new THREE.Vector3(lz, 1.2, 0); }
  else { eye = new THREE.Vector3(lz + F.len * .45 + 1.5, 2.3, F.len * .55 + 2.2); look = new THREE.Vector3(lz - .3, 1.1, 0); } sunBox(lz, 0, 0, 10); }
cam.position.copy(eye); cam.lookAt(look);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
Object.assign(STATS, { mode: MODE, island: ISLE, view: VIEW, vehicles: built.filter(b => b.v).map(b => ({ key: b.v.key, name: b.v.name, tris: b.v.tris, draws: b.v.draws, beastTris: b.v.beastTris, team: b.v.team, len: +b.v.len.toFixed(2), width: +b.v.width.toFixed(2), height: +b.v.height.toFixed(2), wheels: b.v.wheels.map(w => +(w.r * 2).toFixed(2)) })) });
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .92, bloomR: .4, sat: 1.05, vig: .26 });
R.info.autoReset = !STILL;
// the people: one at each vehicle's stand (a carter at the lead beast's head, a passenger by the coach's door), or one at the side view's
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  const spots = built.filter(b => b.v).map(b => ({ p: toW(b, { x: b.v.stand.x, z: b.v.stand.z }), ry: b.v.stand.ry + Math.PI / 2 }));
  if (VIEW === 'side') spots.splice(0, spots.length, { p: new THREE.Vector3(F.len / 2 - 1.5, 0, 2.2), ry: 0 });
  if (VIEW === 'road' && built.at(-1).camel) spots.push({ p: new THREE.Vector3(built.at(-1).x + 4.2, 0, 1.9), ry: Math.PI / 2 + .3 });
  spots.forEach((s, i) => { const G = rollGenome(`wagons:${ISLE}:${i}`, { people: L.people, g: i % 2 }); G.dress = { ...G.dress, shield: false, spear: false, crossbow: null, staff: null };
    const p = makePerson(G); p.root.position.set(s.p.x, p.root.position.y + ground(s.p.x, s.p.z), s.p.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); });
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.reset(); const t0 = performance.now(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
