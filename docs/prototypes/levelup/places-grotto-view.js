// Aurenne's sea grotto (Session 914, card F8): places.js's aurenneGrotto, lit from under its water by the day through the drowned gate.
// ?place=grotto&view=grotto (default): from the stair's foot over the landing and the glowing water to the sea arch; view=stair: down the
// rock-cut stair from the terrace toward the frame at its foot; view=quay: along the quay toward the arch, the skiff at the water stairs;
// view=spring: the apse and its basin on the landing; view=back: from the water stairs back over the water to the landing and the beach.
// &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { aurenneGrotto } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'grotto', R = makeRenderer(VIEW === 'stair' ? .95 : 1.2), scene = new THREE.Scene(); buildTextures();
scene.background = new THREE.Color(.7, .8, .9) /* the sky beyond the arch and over the terrace */; scene.fog = new THREE.FogExp2(new THREE.Color(.03, .08, .14), .012);
const cam = new THREE.PerspectiveCamera(66, W / H, .02, 500);
const G = aurenneGrotto({ key: 'grotto:sarrat' }, stream('grotto:sarrat')); scene.add(G.group);
scene.add(new THREE.HemisphereLight(new THREE.Color(.25, .45, .7), new THREE.Color(.05, .12, .2), .25));
// the water's light: blue lights just under the surface along the hall, and the day through the drowned gate, up and in
G.glow.forEach(p => { const l = new THREE.PointLight(new THREE.Color(.2, .6, 1), 120, 26, 1.3); l.position.set(...p); scene.add(l); });
{ const s = new THREE.SpotLight(new THREE.Color(.3, .7, 1), 1600, 90, .6, .7, 1.1); s.position.set(0, -5, G.arch.z - 8); s.target.position.set(0, 2, G.arch.z + 40); s.castShadow = true; s.shadow.mapSize.set(1024, 1024); scene.add(s, s.target); }
{ const s = new THREE.SpotLight(new THREE.Color(.85, .9, 1), 60, 40, .35, .8, 1.2); s.position.set(0, 1.3, G.arch.z - 6); s.target.position.set(0, .6, G.arch.z + 20); scene.add(s, s.target); }
// the day down the stair from the terrace
{ const s = new THREE.SpotLight(new THREE.Color(1, .94, .82), 70, 30, .5, .7, 1.2); s.position.set(0, G.stair.top + 3, G.mouth.z + 5); s.target.position.set(0, G.stair.top - 4, G.mouth.z - 14); scene.add(s, s.target); }
{ const d = new THREE.DirectionalLight(new THREE.Color(1, .92, .78), 1.1); d.position.set(10, G.stair.top + 30, G.mouth.z + 25); d.target.position.set(0, G.stair.top, G.mouth.z); scene.add(d, d.target); }
const Z0 = G.chamber.z0, F = G.quay.y + 1.62, Qx = G.quay.x; let eye, at;
if (VIEW === 'stair') { eye = [0, G.stair.top + 1.62, G.mouth.z + 3]; at = [0, G.quay.y + 1.4, Z0]; cam.fov = 60; }
else if (VIEW === 'quay') { const z = G.quay.z0 - 4; eye = [Qx(z) + 2.2, F, z]; at = [-2, 1.2, G.arch.z + 6]; cam.fov = 70; }
else if (VIEW === 'spring') { eye = [G.spring.x + 4.2, F, G.spring.z - 2.8]; at = [G.spring.x - 1, G.quay.y + 1.4, G.spring.z]; cam.fov = 70; }
else if (VIEW === 'back') { const z = G.quay.z1 + .5; eye = [Qx(z) + 1.6, F, z]; at = [-6, 2.4, Z0 - 4]; cam.fov = 72; }
else { eye = [.4, F + .2, Z0 - 1.2]; at = [-1.5, .8, G.arch.z + 6]; cam.fov = 72; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'grotto', view: VIEW, tris: G.tris, draws: G.draws };
run(makeComposer(R, scene, cam, { bloom: .3, sat: 1.05, vig: .35 }), cam);
