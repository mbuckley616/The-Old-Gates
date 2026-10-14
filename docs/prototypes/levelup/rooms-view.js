// Rooms in the new kit (Session 852): rooms.js's gatelandsCottage in its lane, under the sky at four hours (OG-141's natural light).
// ?view=kitchen (default): from the door lobby past the jamb wall to the hearth; ?view=table: from the hearth to the table under the
// window and the box bed; ?view=dresser: the dresser and the back door; ?view=outside: the cottage from the lane, its windows by the hour.
// &hour=morning | noon (default) | golden | night. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
// ?room=longhouse (Session 870): the Markish longhouse. view=hall (default): from inside the door down the hall past the fire;
// view=hearth: across the fire to the benches; view=larder: the larder and the workshop by the door; view=back: through the partition's
// doorway into the family quarters; view=outside: the hall from its yard.
// ?room=home (Session 891): Aurenne's flat over a dyer's shop. view=shop (default): from the door into the shop; view=stair: from the shop
// to the stair's foot; view=flat: upstairs from the landing to the divan; view=kitchen: the cooking bench and its pots; view=roof: the
// terrace from the hatch; view=outside: the house from the street. &shell=<key> turns the door to the other side.
// ?room=inn (Session 893): the Gatelander inn. view=tap (default): from by the bar across the taproom to the hearth; view=bar: the bar
// and its kegs; view=hearth: from the settle's end into the fire; view=upstairs: the passage from the landing; view=chamber: a guest
// room; view=outside: the inn from the lane.
// ?room=alehall (Session 894): the Mark's inn. view=hall (default): from inside the door down the hall past the fire; view=tables:
// along a long table from its end; view=counter: the counter and the kegs; view=outside: the hall from its yard.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { gatelandsCottage, markLonghouse, aurenneHome, gatelandsInn, markAlehall } from './rooms.js';
import { stream } from './pieces.js';

const ROOM = Q.get('room') || 'cottage', ALE = ROOM === 'alehall', LONG = ROOM === 'longhouse' || ALE, HOME = ROOM === 'home', INN = ROOM === 'inn', VIEW = Q.get('view') || (HOME ? 'shop' : INN ? 'tap' : ALE ? 'hall' : 'kitchen'), HOUR = Q.get('hour') || 'noon';
const R = makeRenderer(LONG && VIEW !== 'outside' ? 1.5 : (HOME || INN) && !['outside', 'roof'].includes(VIEW) ? 1.4 : .9), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(62, W / H, .02, 30000);
// the hours: the sun's direction (the cottage's front faces +z, south), its colour and strength, the sky's light, the fog
const HOURS = { morning: { dir: [.5, .3, .82], c: [1, .82, .62], i: 3.2, sky: .5, fog: [.78, .8, .84] }, noon: { dir: [.15, .78, .6], c: [1, .96, .9], i: 3.6, sky: .7, fog: [.74, .8, .88] },
  golden: { dir: [-.8, .2, .55], c: [1, .62, .34], i: 2.8, sky: .4, fog: [.85, .7, .55] }, night: { dir: [.3, .45, .84], c: [.55, .66, 1], i: .35, sky: .06, fog: [.06, .08, .14] } };
const Hh = HOURS[HOUR] || HOURS.noon, SUN = new THREE.Vector3(...Hh.dir).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...Hh.fog), .004);
const sun = new THREE.DirectionalLight(new THREE.Color(...Hh.c), Hh.i); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 90 }); scene.add(sun, sun.target);
const sky = new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), Hh.sky * (VIEW === 'outside' ? 1.6 : .8)); scene.add(sky);
skyDome(scene, SUN); if (HOUR !== 'night') clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
{ const g = new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: 0x7a8a5a, rough: 1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
const C = ALE ? markAlehall({}, stream('alehall:skarvik')) : INN ? gatelandsInn({}, stream('inn:kilbride')) : HOME ? aurenneHome({ shell: Q.get('shell') || 'aurhome-shell' }, stream('aurhome:qasr')) : LONG ? markLonghouse({}, stream('longhouse:skarvik')) : gatelandsCottage({}, stream('cottage:kilbride')); scene.add(C.group);
if (LONG) Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 });
if (ALE) Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
// the fire's light, low and warm in the hearth; the lantern's at the golden hour and night; the candle's at night
if (HOME) { for (const b of C.braziers.slice(0, 1)) { const f = new THREE.PointLight(new THREE.Color(1, .5, .2), 2.5, 4, 1.6); f.position.set(b[0] - .2, b[1] + .25, b[2] + .45); scene.add(f); }
  const l0 = new THREE.PointLight(new THREE.Color(1, .72, .42), HOUR === 'night' ? 2.5 : 1.2, 6, 1.6); l0.position.set(C.lamp0[0], C.lamp0[1] + .15, C.lamp0[2]); scene.add(l0);
  const l1 = new THREE.PointLight(new THREE.Color(1, .74, .44), HOUR === 'night' ? 5 : 2.2, 8, 1.6); l1.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l1);
  sky.groundColor = new THREE.Color(.55, .45, .32); }
else if (INN) { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 9, 10, 1.6); f.position.set(C.fire[0] + .35, C.fire[1] + .2, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2, 7, 1.6); l.position.set(C.lamp[0], C.lamp[1] - .1, C.lamp[2]); scene.add(l);
  const u = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 2.5 : 1, 6, 1.6); u.position.set(-.5, C.floors[1] + 1.9, (C.passage + C.inner.z0) / 2); scene.add(u); }
else { const f = new THREE.PointLight(new THREE.Color(1, .55, .24), LONG ? 14 : 7, LONG ? 13 : 9, 1.6); f.position.set(C.fire[0] + (LONG ? 0 : .35), C.fire[1] + (LONG ? .45 : .2), C.fire[2]); if (LONG) { f.intensity = HOUR === 'night' ? 36 : 30; f.distance = 16; } f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f); }
// the family quarters' stone lamp on the chest
if (ALE) for (const L of C.lamps) { const q = new THREE.PointLight(new THREE.Color(1, .66, .34), HOUR === 'night' ? 6 : 3, 9, 1.6); q.position.set(L[0], L[1] + .1, L[2]); scene.add(q); }
if (LONG && !ALE) { const q = new THREE.PointLight(new THREE.Color(1, .66, .34), 3, 6, 1.6); q.position.set(C.lamp2[0], C.lamp2[1] + .08, C.lamp2[2] + .05); scene.add(q); }
// the longhouse's louver lets a grey shaft of day down onto the hearth's smoke (none at night)
if (LONG && HOUR !== 'night') { const l = new THREE.SpotLight(new THREE.Color(.8, .85, .95), 80 * Hh.sky, 14, .5, .9, 1.2); l.position.set(0, C.under(0) - .2, C.louver); l.target.position.set(0, C.floor, C.louver); scene.add(l, l.target); }
if (!HOME && !INN && !ALE && (HOUR === 'night' || HOUR === 'golden')) { const L = LONG ? C.lamp : C.lantern, l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2, 7, 1.6); l.position.set(L[0], L[1] + (LONG ? .1 : -.1), L[2]); scene.add(l); }
const inside = VIEW !== 'outside'; let eye, at;
if (INN) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1] = C.floors;
  if (VIEW === 'bar') { eye = [1.6, F0 + 1.62, 1.6]; at = [-.3, F0 + 1.1, -Z]; }
  else if (VIEW === 'hearth') { eye = [C.settle.x1 + .5, F0 + 1.5, 1.6]; at = [C.hearth[0] - .2, F0 + .6, -.1]; }
  else if (VIEW === 'upstairs') { eye = [X - .45, F1 + 1.62, (C.stair.z0 - C.inner.z1) / 2 + .1]; at = [-X, F1 + 1.1, (C.passage + C.inner.z0) / 2]; cam.fov = 66; }
  else if (VIEW === 'chamber') { const R0 = C.rooms[1]; eye = [R0.door.x - .1, F1 + 1.62, C.passage + .2]; at = [R0.door.x - .2, F1 + .6, Z]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 10]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [1.2, F0 + 1.62, -1.75]; at = [C.hearth[0] - .3, F0 + .9, .9]; cam.fov = 66; } }
else if (HOME) { const Z = C.inner.z1, X = C.inner.x1, [F0, F1, F2] = C.floors, ds = C.door.x < 0 ? -1 : 1;
  if (VIEW === 'stair') { eye = [C.door.x, F0 + 1.62, 1.6]; at = [C.stair.x0 + 1.2, F0 + 1.2, -Z]; cam.fov = 70; }
  else if (VIEW === 'flat') { eye = [X - .45, F1 + 1.62, -2.0]; at = [-2.2, F1 + .6, Z - .6]; cam.fov = 70; }
  else if (VIEW === 'kitchen') { eye = [.3, F1 + 1.6, -.6]; at = [X, F1 + 1.0, 1.8]; cam.fov = 66; }
  else if (VIEW === 'roof') { eye = [-1.9, F2 + 1.62, -2.9]; at = [2.0, F2 + .8, 2.6]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [5.5, 1.7, C.d / 2 + 10]; at = [0, 3.0, 0]; cam.fov = 45; }
  else { eye = [C.door.x, F0 + 1.62, Z - .2]; at = [-ds * (X - 1.0), F0 + 1.0, -1.2]; cam.fov = 70; } }
else if (ALE) { const Z = C.inner.z1, F = C.floor + 1.62, T = C.tables[1];
  if (VIEW === 'tables') { eye = [T.x1 + .35, F, T.z1 + .4]; at = [T.x0 - .2, C.floor + .7, T.z0 + 2]; cam.fov = 66; }
  else if (VIEW === 'counter') { eye = [1.0, F, C.counter.z1 + 3.2]; at = [-.3, C.floor + 1.0, -Z]; cam.fov = 66; }
  else if (VIEW === 'outside') { eye = [15, 3.2, C.d / 2 + 17]; at = [0, 3.0, 0]; cam.fov = 45; }
  else { eye = [.4, F, Z - .4]; at = [-.4, C.floor + 1.0, C.hearth.z0 - 2]; cam.fov = 66; } }
else if (LONG) { const Z = C.inner.z1, F = C.floor + 1.62;
  if (VIEW === 'hearth') { eye = [-2.0, F, C.fire[2] + 2.2]; at = [1.8, C.floor + .5, C.fire[2] - 1.2]; }
  else if (VIEW === 'larder') { eye = [-.6, F, Z - 3.6]; at = [1.6, C.floor + 1.3, Z - .4]; }
  else if (VIEW === 'back') { eye = [C.doors[0].x + .1, F, C.partition - .4]; at = [-1.8, C.floor + .4, -Z + .9]; cam.fov = 70; }
  else if (VIEW === 'outside') { eye = [7.5, 1.9, C.d / 2 + 9]; at = [0, 2.6, 0]; cam.fov = 45; }
  else { eye = [.3, F, Z - .4]; at = [-.2, C.floor + 1.0, C.partition]; } }
else if (VIEW === 'table') { eye = [C.fire[0] + 1.1, 1.62, C.fire[2] - .4]; at = [1.9, .9, .6]; }
else if (VIEW === 'dresser') { eye = [.6, 1.6, 1.0]; at = [-.6, 1.3, -2.1]; }
else if (VIEW === 'outside') { eye = [6.5, 1.65, 11]; at = [0, 2.2, 0]; cam.fov = 45; }
else { eye = [2.2, 1.62, 1.75]; at = [C.hearth[0], .9, C.hearth[2]]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.room = { room: ROOM, view: VIEW, hour: HOUR, tris: C.tris, draws: C.draws, shellTris: C.shellTris, shellCalls: C.shellCalls };
run(makeComposer(R, scene, cam, { bloom: .14, sat: 1.0, vig: .3 }), cam);
