// The smugglers' lair (Session 873, card F8; rebuilt in Session 879): places.js's smugglersLair, a sea cave lit by its lanterns and its
// fire, the day coming in at the sea arch (Michael's A on #314: a sea cave with its own landing).
// ?place=lair&view=lair (default): from the passage's end over the landing, the deck and the jetty to the arch; view=jetty: from the T-head
// back over the sloop to the deck and the gallery; view=store: on the landing by the fire, the storeroom's door; view=escape: the ladder
// up to the ledge and the tunnel; view=deck: on the deck under the gallery, the cargo along the rock.
// &empty: the lair abandoned (o.held false): no lantern lit, the fire cold, the sloop gone. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { smugglersLair } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'lair', R = makeRenderer(1.25), scene = new THREE.Scene(); buildTextures();
scene.background = new THREE.Color(.62, .7, .78) /* the sky beyond the arch and the mouth */; scene.fog = new THREE.FogExp2(new THREE.Color(.06, .08, .09), .011);
const cam = new THREE.PerspectiveCamera(64, W / H, .02, 500);
const C = smugglersLair({ key: 'lair:cuas', held: !Q.has('empty') }, stream('lair:cuas')); scene.add(C.group); if (Q.get('hide')) for (const n of Q.get('hide').split(',')) { const m = C.group.getObjectByName(n); if (m) m.visible = false; } /* debugging: hide meshes by name */
scene.add(new THREE.HemisphereLight(new THREE.Color(.3, .36, .42), new THREE.Color(.06, .07, .08), .2));
// the lanterns, warm, two of them casting shadows; the fire, warmer and brighter
C.lamps.forEach((p, i) => { const l = new THREE.PointLight(new THREE.Color(1, .66, .34), 18, 12, 1.6); l.position.set(p[0], p[1] - .02, p[2]); if (i < 2) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.002; } scene.add(l); });
if (C.held) { const f = new THREE.PointLight(new THREE.Color(1, .55, .22), 60, 16, 1.5); f.position.set(C.fire.x, C.deck + .7, C.fire.z); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); f.shadow.bias = -.002; scene.add(f); }
// the day at the sea arch: a cool light from outside it, low over the water, and its glow on the sea and the vault
{ const s = new THREE.SpotLight(new THREE.Color(.75, .85, 1), 600, 80, .55, .8, 1.1); s.position.set(0, 3, C.arch.z - 14); s.target.position.set(0, 0, C.arch.z + 24); scene.add(s, s.target); }
{ const p = new THREE.PointLight(new THREE.Color(.6, .75, .95), 40, 34, 1.4); p.position.set(0, 7, C.arch.z + 8); scene.add(p); }
const Z0 = C.chamber.z0, F = C.deck + 1.62, P = C.path; let eye, at;
if (VIEW === 'jetty') { const e = P[P.length - 1]; eye = [e[0] + .4, F, e[1]]; at = [-8, C.deck + 2.2, Z0 - 8]; cam.fov = 70; }
else if (VIEW === 'store') { eye = [C.fire.x + 2.2, F, C.fire.z - 2.4]; at = [C.door.x, C.deck + 1.2, C.door.z]; cam.fov = 70; }
else if (VIEW === 'escape') { eye = [C.ladder.x - 5, F, C.ladder.z - 3]; at = [C.ladder.x, C.ledge + .6, C.ladder.z]; }
else if (VIEW === 'deck') { const p = P.find(q => q[1] < C.gallery.z0 + 1); eye = [p[0] - .7, F, p[1] + 1]; at = [p[0] - 1.2, C.deck + 1.0, p[1] - 12]; cam.fov = 70; }
else { eye = [.4, F + .2, Z0 - .8]; at = [-2, 1.2, C.arch.z + 6]; cam.fov = 72; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
{ const t = new THREE.PointLight(new THREE.Color(1, .6, .28), C.held ? 10 : 30, 14, 1.6); const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'lair', view: VIEW, tris: C.tris, draws: C.draws, lamps: C.lamps.length };
run(makeComposer(R, scene, cam, { bloom: .25, sat: 1.0, vig: .35 }), cam);
