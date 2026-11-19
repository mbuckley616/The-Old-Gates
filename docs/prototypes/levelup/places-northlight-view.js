// The Northlight Altar (Session 2395; OG-104, the Mark): ruins.js's northlightAltar, a ring of Weaver monoliths on a snowed fell, at night
// under places.js's auroraCurtains (the gap in the ring is to the north, where they hang).
// ?place=northlight&view=ring (default): on the snow 40 m south of the ring, across the altar and through the gap to the aurora; view=heart: on the
// dais by the altar, north through the gap; view=stone: at the foot of a standing stone by the scale post, up its face and the script; view=fallen:
// beside a fallen stone; view=far: high over the fell from the south, the ring, the tarn and the sky.
// &lit: the script burning in its grooves (OG-104 as painted; the DECISION's B). &day: a grey noon and no aurora. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { northlightAltar } from './ruins.js';
import { auroraCurtains } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'ring', NIGHT = !Q.has('day');
const R = makeRenderer(NIGHT ? 1.3 : 1.0), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.03, .05, .08) : new THREE.Color(.78, .81, .86), VIEW === 'far' ? .0012 : .0022);
const cam = new THREE.PerspectiveCamera(58, W / H, .1, 30000);
const A = northlightAltar({ lit: Q.has('lit') }); scene.add(A.group);
// at night the moon from the south-east, low, and the aurora's own light from the north (green, low, no shadow), which the stones' polish catches
const SUN = NIGHT ? new THREE.Vector3(.5, .4, .75).normalize() : new THREE.Vector3(.45, .35, .8).normalize(), sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.55, .62, .78) : new THREE.Color(1, .93, .84), NIGHT ? .55 : 2.0);
sun.position.copy(SUN).multiplyScalar(300); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .1;
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 800 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.12, .2, .24) : new THREE.Color(.66, .72, .84), NIGHT ? new THREE.Color(.05, .06, .08) : new THREE.Color(.5, .5, .52), NIGHT ? .75 : 1.3));
let AU = null;
if (NIGHT) { scene.background = new THREE.Color(.015, .03, .055); AU = auroraCurtains(stream('northlight:sky')); scene.add(AU.group);
  { const l = new THREE.DirectionalLight(new THREE.Color(.35, 1, .6), .55); l.position.set(0, 120, -400); scene.add(l, l.target); }
  { const n = 900, p = []; const rs = stream('northlight:stars'); for (let k = 0; k < n; k++) { const a = rs() * Math.PI * 2, e = Math.asin(.08 + rs() * .9), d = 4000; p.push(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8e8, size: 1.6, sizeAttenuation: false, fog: false }))); } }
else skyDome(scene, SUN, { zen: [.32, .4, .55], mid: [.55, .62, .72], hor: [.8, .83, .88], glowK: .15 });
const g = A.ground, E = 1.65, st = A.stones.find(s => s.i === A.figure.stone), fl = A.stones.find(s => s.cond === 'fallen');
let eye, at;
if (VIEW === 'heart') { eye = [3.6, A.altar.y + E, 7]; at = [-2, 14, -A.R - 30]; cam.fov = 66; }
else if (VIEW === 'stone') { const x = A.figure.x * .9, z = A.figure.z * .9 + 3; eye = [x, g(x, z) + E, z]; at = [st.x, g(st.x, st.z) + 20, st.z]; cam.fov = 70; }
else if (VIEW === 'fallen' && fl) { const ix = -Math.sin(fl.a), iz = -Math.cos(fl.a), x = fl.x + ix * 20 - iz * 26, z = fl.z + iz * 20 + ix * 26; eye = [x, g(x, z) + E, z]; at = [fl.x + ix * 22, g(fl.x, fl.z) + 3, fl.z + iz * 22]; cam.fov = 62; }
else if (VIEW === 'far') { eye = [60, 90, 230]; at = [-20, 8, -10]; cam.fov = 50; }
else { const x = 8, z = A.R + 42; eye = [x, g(x, z) + E, z]; at = [0, 22, -A.R - 40]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'northlight', view: VIEW, night: NIGHT, tris: A.tris, draws: A.draws + (AU ? AU.draws : 0), stones: A.stones.length };
run(makeComposer(R, scene, cam, { bloom: NIGHT ? .35 : .08, sat: 1.0, vig: .35 }), cam);
