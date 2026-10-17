// The Gatelands' merchants' halt (Session 1021, card F8): places.js's gatelandsMerchantCamp, carriers' waggons on a green by a ford.
// ?place=merchants&view=camp (default): from the road, the stall under its fly, the waggons, the fire beyond; view=stall: under the fly
// before the tables; view=fire: by the fire, the tent and the second waggon; view=ford: from the stepping stones, the road through the
// water and the camp up the green; view=far: high over the road, the halt on its green. &dusk: the evening, the lantern and the fire lit.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsMerchantCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .44, .42) : new THREE.Color(.72, .76, .78), .012);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsMerchantCamp({ key: 'merchants:athbuidhe', lit: DUSK }, stream('merchants:athbuidhe')); scene.add(A.group);
// a fair late-summer afternoon, the sun in the south-west over the road; &dusk, low in the west
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(-.45, .6, .66).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .66, .42) : new THREE.Color(1, .95, .86), DUSK ? 1.3 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.target.position.set(2, 0, 3); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .24), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
// the glow: the fire, and the lantern on the stall's right pole, both weak by day
{ const f = new THREE.PointLight(new THREE.Color(1, .55, .25), DUSK ? 16 : 3, 10, 1.6); f.position.set(A.fire.x, A.fire.embers + .5, A.fire.z); scene.add(f);
  const p = A.awning.poles[1], l = new THREE.PointLight(new THREE.Color(1, .72, .4), DUSK ? 8 : 0, 7, 1.6); l.position.set(p.x - .1, p.y1 - .45, p.z - .1); scene.add(l); }
const g = A.ground, Wa = A.wagons[0], Fi = A.fire, Te = A.tent, St = A.stream;
let eye, at;
if (VIEW === 'stall') { eye = [Wa.x + 1.6, g(Wa.x + 1.6, Wa.z + 3.3) + 1.62, Wa.z + 3.3]; at = [Wa.x - 1.2, A.tables[0].top, Wa.z + 1.8]; cam.fov = 64; }
else if (VIEW === 'fire') { eye = [Fi.x - 3.4, g(Fi.x - 3.4, Fi.z + 3.4) + 1.62, Fi.z + 3.4]; at = [Te.x - 1, Te.floor + .8, Te.z]; cam.fov = 62; }
else if (VIEW === 'ford') { const z = A.road.z - 2.6, x = St.xAt(z) + 1.2; eye = [x + 2.2, St.water(z) + 1.75, z - 1.0]; at = [Wa.x + 2, Wa.bed + .8, Wa.z + 2]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .005; eye = [20, 16, 36]; at = [0, 0, 2]; cam.fov = 50; }
else { eye = [2.6, g(2.6, A.road.z + .6) + 1.62, A.road.z + .6]; at = [-3.5, Wa.bed + .5, Wa.z]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'merchants', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
