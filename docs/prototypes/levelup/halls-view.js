// Lighting the halls (concept, 27 Oct 2026; backlog L12, "Light indoors", OG-141): light.js's rule (Michael's C on #765, the lights with
// the eye half open) over four halls of rooms.js, dressed by halls.js. ?hall=guild (the Gatelands Fighters' Guild, its wheel of candles;
// default) | alehall (the Mark's, its long hearth) | tavern (Aurenne's over the harbour) | inn (the Gatelands inn's taproom),
// &fix=own|torches|island (the question's A, B, C; default island), &hour=night (default) | golden | noon, &view=hall (default) | scale
// (a person under a fixture) | crowd (the inn with eight people in the evening), &nopeople, &cam=x,y,z,tx,ty,tz. The page measures its
// frame (window.__stats.luma, as light-view.js does) and opens the eye as C does.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, run } from './common.js';
import { gatelandsGuildHall, markAlehall, aurenneTavern, gatelandsInn } from './rooms.js';
import { stream } from './pieces.js';
import { LIGHT_HOURS, lightRoom, lumaStats } from './light.js';
import { dressHall } from './halls.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';

const HALL = Q.get('hall') || 'guild', FIX = Q.get('fix') || 'island', HOUR = Q.get('hour') || (HALL === 'inn' ? 'golden' : 'night'), VIEW = Q.get('view') || 'hall';
const BASE = 1.3, R = makeRenderer(BASE), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(70, W / H, .02, 30000); scene.add(cam);
const Hr = LIGHT_HOURS[HOUR], SUN = new THREE.Vector3(...Hr.dir).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...Hr.fog), .004);
skyDome(scene, SUN, HOUR === 'night' ? { hor: [.05, .07, .12], mid: [.02, .035, .07], zen: [.01, .015, .04] } : HOUR === 'golden' ? { hor: [1, .7, .45], mid: [.6, .55, .62], zen: [.3, .36, .55] } : {});
{ const g = new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: HALL === 'alehall' ? 0xb8bca6 : HALL === 'tavern' ? 0xd8c8a8 : 0x7a8a5a, rough: 1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
if (HALL === 'tavern') { const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .26, .34), roughness: .12, metalness: .1 })); sea.position.set(0, -3.2, 210); scene.add(sea); }

const C = HALL === 'alehall' ? markAlehall({}, stream('alehall:skarvik')) : HALL === 'tavern' ? aurenneTavern({}, stream('tavern:qasr')) : HALL === 'inn' ? gatelandsInn({ bays: 3 }, stream('inn:kilbride')) : gatelandsGuildHall({ guild: 'fighters' }, stream('guild:kilbride'));
scene.add(C.group);
const F0 = C.floor ?? C.floors[0], Dz = dressHall(scene, C, HALL, FIX);
const L = lightRoom(scene, C, HALL, HOUR, 'eye', { floorY: F0, shadowR: HALL === 'alehall' ? 12 : 9, fixtures: Dz.fixtures });

// the cameras: each sees the hall's hearth or its pendants and the walls the fixtures hang on
const X = C.inner.x1, Z = C.inner.z1; let eye, at, who = [];
const P = (x, z, ry) => who.push([x, z, ry]);
if (HALL === 'guild') {
  if (VIEW === 'scale') { eye = [-1.5, F0 + 1.62, .2]; at = [-4.0, F0 + 1.55, 3.8]; P(-3.2, 3.15, Math.PI * .85); cam.fov = 66; }
  else { eye = [1.5, F0 + 1.62, -.4]; at = [-6.2, F0 + 2.3, .6]; cam.fov = 84; }
} else if (HALL === 'alehall') {
  if (VIEW === 'scale') { eye = [-1.4, F0 + 1.62, 5.8]; at = [-4.75, F0 + 1.7, 2.2]; P(-3.6, 3.6, -Math.PI * .4); cam.fov = 66; }
  else { eye = [-.9, F0 + 1.62, Z - 1.3]; at = [-.2, F0 + 1.2, C.hearth.z0 - 2]; cam.fov = 72; }
} else if (HALL === 'tavern') {
  if (VIEW === 'scale') { eye = [0, F0 + 1.62, 2.0]; at = [-4.4, F0 + 1.5, -.6]; P(-3.4, -.6, Math.PI * .45); cam.fov = 66; }
  else { eye = [C.door.x + .3, F0 + 1.62, Z - .2]; at = [-.6, F0 + 1.1, -Z]; cam.fov = 72; }
} else {
  if (VIEW === 'crowd' || VIEW === 'scale') { eye = [3.4, F0 + 1.62, 1.9]; at = [-3.6, F0 + 1.15, -.4]; cam.fov = 70;
    // the evening's custom: two at the bar, two at the near table, two at the far one, one at the settle, one by the hearth
    P(-.9, -.75, Math.PI); P(.25, -.7, Math.PI * 1.1); P(2.0, -.25, .3); P(2.3, 1.2, Math.PI * .85); P(-1.6, .6, Math.PI * .1); P(-.9, 2.15, Math.PI * 1.05); P(-3.0, .55, -Math.PI * .45); P(-3.5, -1.3, Math.PI * .3);
    if (VIEW === 'scale') who.length = 1; }
  else { eye = [3.4, F0 + 1.62, 1.9]; at = [-3.6, F0 + 1.15, -.4]; cam.fov = 70; }
}
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();

const comp = makeComposer(R, scene, cam, { bloom: .2, sat: 1.0, vig: .3 });
STATS.hall = { hall: HALL, fix: FIX, hour: HOUR, view: VIEW, roomTris: C.tris, fixtures: Dz.count, fixTris: Dz.tris, fixDraws: Dz.draws, flames: Dz.flames, lights: L.lights.length,
  pointLights: L.lights.filter(l => l.isPointLight).length, byType: Dz.fixtures.reduce((a, f) => (a[f.type] = (a[f.type] || 0) + 1, a), {}) };
const tick = t => { L.tick(t); Dz.tick(t); };
const go = () => {
  comp.render(); const m0 = lumaStats(R.domElement).median, E = L.eye(BASE, m0); STATS.m0 = m0; STATS.goal = Math.round(E.goal);
  for (let i = 0; i < 6 && E.hi > E.lo; i++) { const m = i ? lumaStats(R.domElement).median : m0; if (Math.abs(m - E.goal) < 1.5) break; R.toneMappingExposure = Math.min(E.hi, Math.max(E.lo, R.toneMappingExposure * Math.pow(E.goal / Math.max(2, m), .9))); comp.render(); }
  R.info.autoReset = false; R.info.reset(); comp.render(); STATS.luma = lumaStats(R.domElement); STATS.exposure = +R.toneMappingExposure.toFixed(3);
  STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; R.info.autoReset = true;
  run(comp, cam, { tick });
};
const PEOPLE = { guild: 'gatelander', inn: 'gatelander', alehall: 'markman', tavern: 'aurennais' };
(!who.length || Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  STATS.people = [];
  who.forEach(([x, z, ry], i) => { const G = rollGenome('halls:' + HALL + ':' + i, { people: PEOPLE[HALL] }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + F0, z); p.root.rotation.y = ry; scene.add(p.root);
    p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); STATS.people.push(+statureOf(G).toFixed(3)); });
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
