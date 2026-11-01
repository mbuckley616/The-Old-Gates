// Small wrongnesses (the concept artist, 1 Nov 2026; backlog L5, OG-096): wrongness.js's lane and its three vignettes, late afternoon in the
// Gatelands (air.js's B: a soft sun). ?mode=plain|one|marked (A no impossible element, B one each and nothing lit, C the element and a faint
// light), &cam=wide|door|doorWide|watcher|watcherHigh|carving, &who=lane|carving|door|watcher|all (where the Gatelanders stand; all puts one at each),
// &nopeople, &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, reseed, makeRenderer, makeComposer, buildTextures, skyDome, clouds, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { wrongness, WR_MODES } from './wrongness.js';

const MODE = WR_MODES[Q.get('mode')] ? Q.get('mode') : 'one', CAM = Q.get('cam') || 'wide', WHO = Q.get('who') || ({ wide: 'lane', carving: 'carving', door: 'none', doorWide: 'door', watcherHigh: 'none', watcher: 'watcher', all: 'all' }[CAM] || 'lane');
const R = makeRenderer(.86), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM === 'carving' ? 40 : CAM === 'door' ? 40 : CAM === 'watcher' ? 32 : CAM === 'watcherHigh' ? 42 : 50, W / H, .05, 30000); buildTextures();
const SUN = new THREE.Vector3(-.62, .42, .45).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .82, .84), .0028);
const sun = new THREE.DirectionalLight(new THREE.Color(1, .88, .72), 3.1); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .72, .86), new THREE.Color(.3, .32, .2), 1.15));
skyDome(scene, SUN, { zen: [.12, .27, .58], mid: [.36, .54, .82], hor: [.8, .84, .88] }); reseed(7); clouds(scene, SUN, { n: 12, d0: 1600, dw: 4500, y0: 420 });
function sunBox(cx, cy, cz, half) { sun.position.copy(SUN).multiplyScalar(300).add(new THREE.Vector3(cx, cy, cz)); sun.target.position.set(cx, cy, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 10, far: 700 }); sun.shadow.camera.updateProjectionMatrix(); }

const w = wrongness({ mode: MODE }); scene.add(w.group);
const V = w.view[CAM] || w.view.wide; cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
const box = { wide: [-8, 0, -30, 50], door: [-23, 0, -45, 6], doorWide: [-26, 0, -44, 18], watcher: [19, 2, -48, 14], watcherHigh: [21, 2, -47, 10], carving: [2.4, 0, -15.5, 5] }[CAM] || [-8, 0, -30, 50]; sunBox(...box);
Object.assign(STATS, { mode: MODE, cam: CAM, wrongTris: w.tris, wrongDraws: w.draws, parts: w.parts, census: w.census });
const comp = makeComposer(R, scene, cam, { bloom: MODE === 'marked' ? .45 : .25, bloomT: MODE === 'marked' ? .8 : .9, bloomR: .45, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
const spots = WHO === 'all' ? ['lane', 'door', 'watcher'] : [WHO];
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  spots.forEach((k, i) => { const s = w.stand[k]; if (!s) return; const G = rollGenome('wrongness:' + k, { people: 'gatelander', g: i % 2 }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(s.x, p.root.position.y + w.ground(s.x, s.z), s.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push({ at: k, height: +statureOf(G).toFixed(3) }); });
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.reset(); const t0 = performance.now(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
