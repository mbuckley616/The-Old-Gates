// The Forgotten Aqueducts (Session 2445; OG-104, the Gatelands): ruins.js's forgottenAqueducts, a gate's nave buried under the limestone, its
// vault fallen in where the land has opened in a sinkhole, the halls flooded and running on under the land both ways.
// ?place=aqueducts&view=lip (default): on the south lip by the stair's head, down into the hole and the halls going west; view=stair: halfway
// down the flight, across to the nave's west mouth; view=scree: by the scale post at the water, along the nave west into the halls;
// view=nave: low over the water under the land in the west halls, back toward the light; view=far: high over the land, the hole and the
// nave's line. &dusk: the light gone grey and low. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { forgottenAqueducts } from './ruins.js';

const VIEW = Q.get('view') || 'lip', DUSK = Q.has('dusk');
const R = makeRenderer(DUSK ? 1.3 : .85), scene = new THREE.Scene(); buildTextures();
const A = forgottenAqueducts(); scene.add(A.group);
scene.background = DUSK ? new THREE.Color(.36, .38, .46) : new THREE.Color(.66, .76, .86);
// the fog: the land's haze outside; in the halls under the land a dark one, so they fall away into the dark
scene.fog = VIEW === 'nave' ? new THREE.FogExp2(new THREE.Color(.02, .035, .035), .009) : new THREE.FogExp2(DUSK ? new THREE.Color(.42, .42, .48) : new THREE.Color(.62, .68, .74), VIEW === 'far' ? .0012 : .0016);
const cam = new THREE.PerspectiveCamera(60, W / H, .1, 3000);
// the sun, high in the south-east (the Gatelands' noon); grey and low at dusk
const SUN = DUSK ? new THREE.Vector3(.5, .45, .6).normalize() : new THREE.Vector3(.25, 1, .38).normalize();
const sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(.65, .66, .8) : new THREE.Color(1, .95, .86), DUSK ? 1.2 : 3.0);
sun.position.copy(SUN).multiplyScalar(400); sun.target.position.set(0, -40, 0); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0005; sun.shadow.normalBias = .15;
Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 100, far: 800 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.5, .56, .62), new THREE.Color(.1, .12, .11), DUSK ? .3 : .45)); skyDome(scene, SUN);
// the light off the water in the hole, cool and green, which is all that reaches the halls under the land
{ const l = new THREE.PointLight(DUSK ? new THREE.Color(.3, .4, .45) : new THREE.Color(.45, .85, .8), DUSK ? 120 : 350, 200, 1.4); l.position.set(0, A.water + 14, 0); scene.add(l); }
const g = A.ground, E = 1.65, s0 = A.stair.a0, sm = (A.stair.a0 + A.stair.a1) / 2; let eye, at;
if (VIEW === 'stair') { const rr = A.lip(sm) - 4, y = (A.stair.y0 + A.stair.y1) / 2; eye = [Math.sin(sm) * rr, y + E + 1.5, Math.cos(sm) * rr]; at = [-70, -56, -8]; cam.fov = 70; }
else if (VIEW === 'scree') { eye = [A.figure.x + 9, A.figure.y + 6, A.figure.z + 7]; at = [-110, -50, -6]; cam.fov = 66; }
else if (VIEW === 'nave') { eye = [-104, A.water + 2.2, 8]; at = [0, -46, -2]; cam.fov = 70; }
else if (VIEW === 'far') { eye = [40, 120, 150]; at = [-10, -50, 0]; cam.fov = 58; }
else { const b = 22 * Math.PI / 180, rr = A.lip(b) + .6; eye = [Math.sin(b) * rr, A.landAt(Math.sin(b) * rr, Math.cos(b) * rr) + E, Math.cos(b) * rr]; at = [-40, -62, -10]; cam.fov = 66; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'aqueducts', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, arches: A.arches.length, broken: A.arches.filter(a => a.cond === 'broken').length, falls: A.falls.length };
run(makeComposer(R, scene, cam, { bloom: .3, bloomT: .85, sat: 1.0, vig: .4 }), cam);
