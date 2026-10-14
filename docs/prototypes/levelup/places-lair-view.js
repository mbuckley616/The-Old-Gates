// The smugglers' lair (Session 873, card F8): places.js's smugglersLair, a sea cave lit by its lanterns, the day coming in at the sea arch.
// ?place=lair&view=lair (default): from the passage's end across the rock floor and the deck to the arch; view=jetty: from the jetty's
// end back to the storeroom and the ladder; view=store: at the storeroom's door; view=escape: the ladder up to the ledge and the tunnel.
// &empty: the lair abandoned (o.held false), no lantern lit. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { smugglersLair } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'lair', R = makeRenderer(1.2), scene = new THREE.Scene(); buildTextures();
scene.background = new THREE.Color(.62, .7, .78) /* the sky beyond the arch and the mouth */; scene.fog = new THREE.FogExp2(new THREE.Color(.05, .07, .08), .018);
const cam = new THREE.PerspectiveCamera(64, W / H, .02, 400);
const C = smugglersLair({ key: 'lair:cuas', held: !Q.has('empty') }, stream('lair:cuas')); scene.add(C.group); if (Q.get('hide')) for (const n of Q.get('hide').split(',')) { const m = C.group.getObjectByName(n); if (m) m.visible = false; } /* debugging: hide meshes by name */
scene.add(new THREE.HemisphereLight(new THREE.Color(.3, .36, .42), new THREE.Color(.06, .07, .08), .25));
// the lanterns, warm, two of them casting shadows
C.lamps.forEach((p, i) => { const l = new THREE.PointLight(new THREE.Color(1, .66, .34), 16, 11, 1.6); l.position.set(p[0], p[1] - .02, p[2]); if (i < 2) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.002; } scene.add(l); });
// the day at the sea arch: a cool light from outside it, low over the water, and its glow on the sea
{ const s = new THREE.SpotLight(new THREE.Color(.75, .85, 1), 320, 45, .6, .8, 1.2); s.position.set(0, 4, C.arch.z - 8); s.target.position.set(0, 0, C.arch.z + 10); scene.add(s, s.target); }
const Z0 = C.chamber.z0, F = C.deck + 1.62; let eye, at;
if (VIEW === 'jetty') { eye = [0.6, F, C.ladder.z - 8.8]; at = [-5, C.deck + .8, Z0 - 2]; }
else if (VIEW === 'store') { eye = [C.door.x + 2.2, F, C.door.z - .4]; at = [C.room.x0, C.deck + .6, C.door.z + .2]; }
else if (VIEW === 'escape') { eye = [C.ladder.x - 4, F, C.ladder.z + 1.6]; at = [C.ladder.x, C.ledge + .8, C.ladder.z]; }
else { eye = [.4, F, Z0 - .6]; at = [-1.5, .8, C.arch.z]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
{ const t = new THREE.PointLight(new THREE.Color(1, .6, .28), C.held ? 10 : 30, 14, 1.6); const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'lair', view: VIEW, tris: C.tris, draws: C.draws, lamps: C.lamps.length };
run(makeComposer(R, scene, cam, { bloom: .25, sat: 1.0, vig: .35 }), cam);
