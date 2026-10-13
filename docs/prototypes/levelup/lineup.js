// A line-up of Markmen from the genome (Session 770), lit like a character sheet: OG-025's eight, made from numbers.
import * as THREE from 'three';
import { Q, W, H, STATS, rnd, makeRenderer, makeComposer, run } from './common.js';
import { loadPack, makePerson, markGenome } from './people.js';

const R = makeRenderer(.95);
const scene = new THREE.Scene(); scene.background = new THREE.Color(.035, .04, .05);
const cam = new THREE.PerspectiveCamera(30, W / H, .1, 200);
// a studio: warm key, cool rim, a soft fill, a floor that fades into the dark
const key = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 3.2); key.position.set(-4, 6, 7); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 4, bottom: -2, near: 1, far: 30 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
const rim = new THREE.DirectionalLight(new THREE.Color(.6, .72, 1), 2.6); rim.position.set(5, 4, -6);
scene.add(key, rim, new THREE.HemisphereLight(new THREE.Color(.5, .55, .65), new THREE.Color(.18, .14, .1), .8));
{ const f = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: new THREE.Color(.035, .033, .031), roughness: .95 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); }

const markman = (i, g, o) => markGenome(rnd, g, o);
const N = 8, G0 = [markman(0, 1), markman(1, 0), markman(2, 1, { mantle: false }), markman(3, 0), markman(4, 1, { age: .78, hair: [.78, .76, .72] }), markman(5, 0, { mantle: false }), markman(6, 1), markman(7, 0, { age: .8, hair: [.8, .8, .78] })], G = G0;
const VIEW = Q.get('view') || 'line';
cam.position.set(0, 1.1, 10.2); cam.lookAt(0, .95, 0);
const comp = makeComposer(R, scene, cam, { bloom: .12, sat: 1.0, vig: .45, warm: [1.05, 1, .94], cool: [.95, .98, 1.05] });
loadPack().then(() => { const P = G.map((g, i) => { const p = makePerson(g); p.root.position.x = (i - (N - 1) / 2) * .92; p.root.rotation.y = (rnd() - .5) * .3; scene.add(p.root); STATS.people = (STATS.people || 0) + 1; return p; });
  if (VIEW === 'faces') { const who = +(Q.get('who') || 0), h = new THREE.Vector3(); scene.updateMatrixWorld(true); P[who].byName['head'].getWorldPosition(h); h.y += .1; const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(P[who].root.quaternion);
    cam.fov = 18; cam.updateProjectionMatrix(); cam.position.copy(h).addScaledVector(fwd, 1.25).add(new THREE.Vector3(.25, .02, 0)); cam.lookAt(h.x, h.y - .03, h.z); }
  run(comp, cam); })
  .catch(e => { window.__err = String(e); console.error(e); run(comp, cam); });
