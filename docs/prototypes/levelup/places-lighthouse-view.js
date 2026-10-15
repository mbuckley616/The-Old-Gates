// The Gatelands' lighthouse (Session 963, card F8): places.js's gatelandsLighthouse on its headland over the sea.
// ?place=lighthouse&view=light (default): from the landward path, the house, the yard and the tower; view=sea: from the water under the
// cliff; view=gallery: on the gallery by the lantern; view=far: the headland from along the coast. &night: the lamp lit under a night sky.
// &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsLighthouse } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'light', NIGHT = Q.has('night');
const R = makeRenderer(NIGHT ? 1.2 : .85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.05, .07, .1) : new THREE.Color(.74, .80, .86), NIGHT ? .004 : .0045);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = gatelandsLighthouse({ lit: NIGHT }, stream('lighthouse:hook')); scene.add(A.group);
const SUN = NIGHT ? new THREE.Vector3(.3, .5, -.6).normalize() : new THREE.Vector3(-.5, .5, .7).normalize(), sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.45, .55, .8) : new THREE.Color(1, .94, .82), NIGHT ? .35 : 2.9);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 240 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.10, .13, .2) : new THREE.Color(.66, .72, .86), NIGHT ? new THREE.Color(.03, .03, .04) : new THREE.Color(.30, .33, .22), NIGHT ? .6 : 1.1));
if (NIGHT) { scene.background = new THREE.Color(.03, .05, .09); const l = new THREE.PointLight(new THREE.Color(1, .85, .55), 30, 40, 1.4); l.position.set(...A.focal); scene.add(l);
  /* the beam: a long faint cone out to sea, turned to the view */ const g = new THREE.ConeGeometry(4, 80, 24, 1, true); g.translate(0, -40, 0); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: .04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(...A.focal); m.rotation.y = .9; scene.add(m); } else skyDome(scene, SUN);
const g = A.ground, F = A.focal;
let eye, at;
if (VIEW === 'sea') { eye = [30, A.sea + 1.5, 46]; at = [0, 4, 0]; cam.fov = 50; }
else if (VIEW === 'gallery') { eye = [2.2, A.gallery.y + 1.62, 2.6]; at = [-.4, A.lantern.y0 + 1.2, -.4]; cam.fov = 70; }
else if (VIEW === 'far') { eye = [-60, 6, 40]; at = [0, 6, 0]; cam.fov = 40; }
else { eye = [6, g(6, -31) + 1.7, -31]; at = [-.5, 9, -2]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'lighthouse', view: VIEW, night: NIGHT, tris: A.tris, draws: A.draws, focal: +(F[1] - A.sea).toFixed(2) };
run(makeComposer(R, scene, cam, { bloom: NIGHT ? .5 : .1, sat: 1.0, vig: .3 }), cam);
