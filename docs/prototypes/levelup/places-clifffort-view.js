// The Mark's cliff fort (Session 1053, card F8): places.js's markCliffFort on its headland over the fjord, a winter afternoon.
// ?place=clifffort&view=fort (default): from the road inland, the ditch, the palisade and the gate tower, the hall's roof behind;
// view=gate: on the bridge, up into the burst gate; view=inside: inside the gate, the hall, the storehouse and the point; view=beacon: at
// the point by the cold beacon, back over the fort; view=cliff: from the sea's side, the headland's cliffs; view=far: high over it all.
// The sea-stair (Session 1062, #402 B): view=cut: at the head of the cut behind the hall, down its steps to the door; view=stair: on a landing
// halfway down, the slit's light and the next flight going down; view=foot: on the last landing, down the passage to the cave;
// view=cave: on the quay, the boat and the mouth; view=mouth: from the water outside, the cave's mouth and the slits up the cliff.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markCliffFort } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'fort';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .006);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markCliffFort({ key: 'clifffort:skarv' }, stream('clifffort:skarv')); scene.add(A.group);
// a winter afternoon: a low sun behind the road, over the land, a pale sky
const SUN = (VIEW === 'mouth' ? new THREE.Vector3(-.62, .36, -.68) : VIEW === 'cut' ? new THREE.Vector3(.85, .42, .25) : new THREE.Vector3(.62, .36, -.68)).normalize() /* the sun put in the west for the mouth, down the cut for the cut */, sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 2.4);
sun.position.copy(SUN).multiplyScalar(140); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 400 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .84), new THREE.Color(.5, .5, .52), 1.1)); skyDome(scene, SUN);
const g = A.ground, P = A.palisade, Hl = A.hall, Bc = A.beacon, St = A.stair, Cv = A.cave;
let eye, at;
// inside the rock the sky's light is only what the slits and the mouth let in: a cool lamp in each slit, the sky light turned down
const INSIDE = ['stair', 'foot', 'cave'].includes(VIEW);
if (INSIDE) { scene.children.filter(o => o.isHemisphereLight).forEach(h => h.intensity = .05); scene.fog = new THREE.FogExp2(new THREE.Color(.05, .06, .07), .02);
  for (const s of St.slits) { const l = new THREE.PointLight(new THREE.Color(.78, .86, 1), 7, 7, 1.4); l.position.set(s.x + .35, s.yc, s.z); scene.add(l); }
  const m = Cv.mouth, mz = (m.z0 + m.z1) / 2; for (const [dx, y, i] of [[3, A.sea + 2.5, 60], [7, A.sea + 1, 30]]) { const l = new THREE.PointLight(new THREE.Color(.72, .84, .95), i, 16, 1.3); l.position.set(St.xw - 2 - dx + 6, y, mz); scene.add(l); } }
if (VIEW === 'gate') { eye = [.4, A.bridge.at(A.bridge.z0 + .6) + 1.62, A.bridge.z0 + .6]; at = [0, 3.4, P.z + 4]; cam.fov = 62; }
else if (VIEW === 'inside') { eye = [1.2, g(1.2, P.z + 3.5) + 1.62, P.z + 3.5]; at = [-1, 2.5, 30]; cam.fov = 64; }
else if (VIEW === 'beacon') { eye = [Bc.x + 2.2, g(Bc.x + 2.2, Bc.z - 3.5) + 1.62, Bc.z - 3.5]; at = [-2, 2.5, 10]; cam.fov = 62; }
else if (VIEW === 'cliff') { scene.fog.density = .003; eye = [62, A.sea + 6, 60]; at = [5, -10, 25]; cam.fov = 55; }
else if (VIEW === 'far') { scene.fog.density = .003; eye = [52, 38, -40]; at = [0, -6, 18]; cam.fov = 50; }
else if (VIEW === 'cut') { const c = St.cut; eye = [c.x1 + 1.2, g(c.x1 + 1.2, 30.4) + 1.62, 30.4]; at = [c.x0, St.levels[0] + 1, 29.95]; cam.fov = 62; }
else if (VIEW === 'stair') { const y = St.levels[4]; eye = [St.xi + .3, y + 1.62, St.z1 - .25]; at = [St.xw, y + .5, St.z1 - 2.2]; cam.fov = 72; }
else if (VIEW === 'foot') { const y = St.levels[St.n]; eye = [St.xi, y + 1.62, St.z0 + .5]; at = [St.xi - 1.6, y + .2, Cv.z1 - 5]; cam.fov = 66; }
else if (VIEW === 'cave') { const m = Cv.mouth; eye = [Cv.quay.x0 + 1, Cv.quay.y + 1.62, Cv.z1 - 2.2]; at = [St.xw - 6, A.sea + 1, (m.z0 + m.z1) / 2 - 1]; cam.fov = 66; }
else if (VIEW === 'mouth') { scene.fog.density = .003; const m = Cv.mouth, mz = (m.z0 + m.z1) / 2; eye = [St.xw - 26, A.sea + 3, mz - 9]; at = [St.xw - 3, A.sea + 9, (mz + St.z1) / 2]; cam.fov = 60; }
else { eye = [7, g(7, -24) + 1.62, -24]; at = [-1, 3.2, 8]; cam.fov = 58; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'clifffort', view: VIEW, tris: A.tris, draws: A.draws, logs: P.logs };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
