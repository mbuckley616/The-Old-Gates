// The Lamps on the Water in a harbour at dusk (the look builder, Session 2352; lamps.js): an ashlar quay with its water stairs, a row
// of plastered houses with lit windows, two moles to the harbour mouth 70 m out, and the line of lamps on the ebb from the stairs toward
// the mouth. ?cam=quay|near|high|mouth (or x,y,z,tx,ty,tz), &how=flame|pool|light (the question), &n=14 lamps, &t=5 minutes since the first
// went in, &h=dusk|night.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, run, reseed, rnd } from './common.js';
import { LAMP, line, streak, tris } from './lamps.js';

const CAM = Q.get('cam') || 'quay', HOW = ['flame', 'pool', 'light'].includes(Q.get('how')) ? Q.get('how') : 'pool', N = +(Q.get('n') || 14), T = +(Q.get('t') || 5), NIGHT = Q.get('h') === 'night';
const R = makeRenderer(NIGHT ? 1.1 : .9), scene = new THREE.Scene(); buildTextures(); reseed(23);
const SUN = new THREE.Vector3(-.25, NIGHT ? -.12 : -.02, -.97).normalize();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.03, .04, .08) : new THREE.Color(.09, .08, .12), .007);
const cam = new THREE.PerspectiveCamera(44, W / H, .02, 30000);
skyDome(scene, SUN, NIGHT ? { zen: [.01, .015, .05], mid: [.03, .04, .1], hor: [.08, .08, .16], glow: [.3, .18, .2] } : { zen: [.03, .04, .14], mid: [.12, .1, .22], hor: [.42, .24, .2], glow: [.5, .26, .14] });
const dusk = new THREE.DirectionalLight(new THREE.Color(1, .55, .35), NIGHT ? 0 : .5); dusk.position.set(-20, 6, -80); scene.add(dusk);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.12, .15, .3) : new THREE.Color(.42, .4, .62), new THREE.Color(.08, .07, .08), NIGHT ? .35 : .7));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ——— the water: dark and smooth, the sky's last light in its sheen
const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: NIGHT ? 0x05080e : 0x141a2a, roughness: .22, metalness: .55 }));
scene.add(sea);
// ——— the quay: an ashlar face 1.6 m over the water from x -40 to 40 at z = 0, the paving behind; the water stairs at x 0 to 4.2 down its face
const ash = mat('ashlar', { ns: .6, color: 0xd8c8a8 }), pave = mat('flag', { ns: .6, color: 0xc8b898 }), plast = mat('plaster', { ns: .4, color: 0xf0e4d0 }), tile = new THREE.MeshStandardMaterial({ color: 0xa8582f, roughness: .85 });
const box = (w, h, d, m, x, y, z, uv = .5) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
box(80, 3.2, 30, ash, 0, 0, 15); box(80, .06, 30, pave, 0, 1.63, 15);
for (let k = 0; k < 8; k++) box(4.2, .2, .32 * (k + 1), ash, 2.1, 1.6 - .2 * k - .1, -.16 * (k + 1)); /* the water stairs, out from the face, the lowest under the water */
for (const x of [-12, -6, 7, 13]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .55, 10), ash); b.position.set(x, 1.9, .5); scene.add(b); }
// the moles to the mouth, and a light at the head of each (the harbour's own lamps, not the feast's)
for (const s of [-1, 1]) { const g = new THREE.Group(); const L = 34, a = s * .3; const m = box(L, 2.2, 4, ash, 0, 0, 0); scene.remove(m); g.add(m); g.position.set(s * 22, .1, -64); g.rotation.y = a; scene.add(g); m.position.set(0, 1, 0);
  const head = V(s * 22 - Math.cos(a) * L / 2 * s, 2.4, -64 + Math.sin(a) * L / 2 * s); const post = box(.5, 2.6, .5, ash, head.x, 3.3, head.z); const fl = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 })); fl.position.set(head.x, 4.8, head.z); scene.add(fl); }
// the houses on the quay: plastered blocks of two and three storeys under pantiles, windows lit
const winM = new THREE.MeshBasicMaterial({ color: NIGHT ? 0xffb060 : 0xd89050 });
for (let i = 0; i < 9; i++) { const w = 6 + rnd() * 3, h = 5.4 + Math.floor(rnd() * 2) * 2.7, x = -38 + i * 8.6, z = 7 + rnd() * 1.5; box(w, h, 7, plast, x, 1.63 + h / 2, z + 3.5);
  const roof = box(w + .4, .3, 7.6, tile, x, 1.63 + h + .15, z + 3.5); roof.castShadow = false;
  for (let f = 0; f < h / 2.7 - .5; f++) for (const dx of [-w / 4, w / 4]) if (rnd() < .6) { const q = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.1), winM); q.position.set(x + dx, 1.63 + 1.5 + f * 2.7, z - .01); q.rotation.y = Math.PI; scene.add(q); } }

// ——— the lamps on the ebb, from the foot of the stairs to the harbour mouth
const FROM = V(2.1, 0, -3.2), TO = V(0, 0, -72), LN = line(N, FROM, TO, T, 5, HOW); scene.add(LN.g);
// ——— the cameras
const CAMS = { quay: [[-2.8, 3.3, 2.2], [1.2, .2, -30]], near: [[3.4, 1.0, -4.4], [1.6, .02, -9.5]], high: [[-24, 22, 20], [2, 0, -36]], mouth: [[-14, 4.5, -52], [1, 0, -22]] };
let c = CAMS[CAM] || CAMS.quay; if (CAM.includes(',')) { const n = CAM.split(',').map(Number); c = [n.slice(0, 3), n.slice(3)]; }
cam.position.set(...c[0]); cam.lookAt(...c[1]); cam.fov = CAM === 'near' ? 40 : 44; cam.updateProjectionMatrix();
if (HOW !== 'flame') for (const L of LN.lamps) scene.add(streak(L.p, cam.position));

const comp = makeComposer(R, scene, cam, { bloom: .45, bloomR: .4, bloomT: .8, sat: 1.05, vig: .32 });
R.info.autoReset = !STILL;
let lights = 0; scene.traverse(o => { if (o.isPointLight) lights++; });
STATS.how = HOW; STATS.lamps = LN.lamps.map(l => ({ s: +l.s.toFixed(2), x: +l.p.x.toFixed(2), z: +l.p.z.toFixed(2) })); STATS.lampTris = LN.tris; STATS.lights = lights; STATS.LAMP = LAMP;
R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls;
