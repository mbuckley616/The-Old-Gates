// Light indoors (concept, 26 Oct 2026; backlog L12, OG-141): light.js's one rule over three rooms of rooms.js, one an island, at
// OG-141's four hours. ?room=cottage (default; the Gatelands cottage lit by its hearth) | longhouse (the Mark's, shut and fire-lit) |
// home (Aurenne's flat over the dyer's shop, its lattice windows over the street). &hour=morning|noon|golden|night (default night),
// &mode=even|sources|eye (the question's A, B, C; default eye), &view=room (default) | door (the cottage from its lobby) | scale (a
// person in the room), &hand=1 (magic light from the right hand), &nopeople, &cam=x,y,z,tx,ty,tz. The page measures its own frame
// (window.__stats.luma: the median and p90 on 0..255, as the critic reads a room) and opens the eye from the median it has at the day's
// exposure (m0) toward the mode's goal.
import * as THREE from 'three';
import { Q, W, H, STATS, STILL, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, run } from './common.js';
import { gatelandsCottage, markLonghouse, aurenneHome } from './rooms.js';
import { stream } from './pieces.js';
import { LIGHT_HOURS, lightRoom, lumaStats, handLight } from './light.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';

const ROOM = Q.get('room') || 'cottage', HOUR = Q.get('hour') || 'night', MODE = Q.get('mode') || 'eye', VIEW = Q.get('view') || 'room';
const BASE = 1.3, R = makeRenderer(BASE), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(74, W / H, .02, 30000); scene.add(cam);
const Hr = LIGHT_HOURS[HOUR], SUN = new THREE.Vector3(...Hr.dir).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...Hr.fog), .004);
skyDome(scene, SUN, HOUR === 'night' ? { hor: [.05, .07, .12], mid: [.02, .035, .07], zen: [.01, .015, .04] } : HOUR === 'golden' ? { hor: [1, .7, .45], mid: [.6, .55, .62], zen: [.3, .36, .55] } : {});
{ const g = new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: ROOM === 'longhouse' ? 0xb8bca6 : ROOM === 'home' ? 0xd8c8a8 : 0x7a8a5a, rough: 1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }

const C = ROOM === 'longhouse' ? markLonghouse({}, stream('longhouse:skarvhaug')) : ROOM === 'home' ? aurenneHome({}, stream('aurhome:qasr')) : gatelandsCottage({}, stream('cottage:kilbride'));
scene.add(C.group);
const FL = ROOM === 'home' ? 1 : 0, FY = ROOM === 'home' ? C.floors[1] : ROOM === 'longhouse' ? C.floor : 0;
const L = lightRoom(scene, C, ROOM, HOUR, MODE, { floor: FL, floorY: FY, shadowR: ROOM === 'longhouse' ? 11 : 9 });
if (Q.get('hand') === '1') handLight(cam);

// the cameras: each sees the room's fire or lamp and an opening the day comes in by
const X = C.inner.x1, Z = C.inner.z1; let eye, at, who = null;
if (ROOM === 'cottage') {
  const hz = C.hearth[2], hx = C.hearth[0];
  if (VIEW === 'door') { eye = [C.door.x + .1, 1.62, Z - .3]; at = [hx, .9, hz]; cam.fov = 80; }
  else if (VIEW === 'scale') { eye = [1.3, 1.6, -1.75]; at = [-.9, 1.0, 1.0]; who = [-.1, .9, 2.4]; cam.fov = 72; }
  else if (VIEW === 'west') { eye = [2.3, 1.62, 1.75]; at = [-1.2, .8, -.4]; cam.fov = 78; }
  else { eye = [1.3, 1.62, -1.8]; at = [-1.0, .85, 1.5]; cam.fov = 80; }
} else if (ROOM === 'longhouse') {
  const F = C.floor;
  if (VIEW === 'scale') { eye = [.4, F + 1.62, Z - .5]; at = [-.2, F + 1.1, C.fire[2] - 1.5]; who = [-.75, C.fire[2] + 1.6, 2.6]; cam.fov = 70; }
  else { eye = [.35, F + 1.62, Z - .45]; at = [-.2, F + 1.0, C.partition ?? -Z + 1]; cam.fov = 74; }
} else {
  const F = C.floors[1];
  if (VIEW === 'scale') { eye = [X - .45, F + 1.62, -2.0]; at = [-2.2, F + .9, Z - .6]; who = [-1.3, Z - 1.5, -2.6]; cam.fov = 70; }
  else { eye = [X - .45, F + 1.62, -2.0]; at = [-2.2, F + .6, Z - .6]; cam.fov = 74; }
}
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();

const comp = makeComposer(R, scene, cam, { bloom: .16, sat: 1.0, vig: .3 });
STATS.room = { room: ROOM, hour: HOUR, mode: MODE, view: VIEW, tris: C.tris, draws: C.draws, lights: L.lights.length, shafts: L.shafts.length, beamTris: L.tris,
  dbg: Q.has('dbg') ? JSON.parse(JSON.stringify({ inner: C.inner, hearth: C.hearth, fire: C.fire, kitchen: C.kitchen, door: C.door, lantern: C.lantern, lamp: C.lamp, part: C.partition, floor: C.floor, floors: C.floors, d: C.d, w: C.w, braziers: C.braziers, bed: C.bed, table: C.table, divan: C.divan, windows: C.windows })) : 0,
  openings: L.sources.openings.map(o => ({ c: o.c.map(v => +v.toFixed(2)), n: o.n, w: o.w, h: o.h })) };
const go = () => {
  // the eye: three frames to settle the exposure from the frame's own median (C only; A and B keep the day's)
  comp.render(); const m0 = lumaStats(R.domElement).median, E = L.eye(BASE, m0); STATS.m0 = m0; STATS.goal = Math.round(E.goal);
  for (let i = 0; i < 6 && E.hi > E.lo; i++) { const m = i ? lumaStats(R.domElement).median : m0; if (Math.abs(m - E.goal) < 1.5) break; R.toneMappingExposure = Math.min(E.hi, Math.max(E.lo, R.toneMappingExposure * Math.pow(E.goal / Math.max(2, m), .9))); comp.render(); }
  R.info.autoReset = false; R.info.reset(); comp.render(); STATS.luma = lumaStats(R.domElement); STATS.exposure = +R.toneMappingExposure.toFixed(3);
  STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; R.info.autoReset = true;
  run(comp, cam, { tick: L.tick });
};
const PEOPLE = { cottage: 'gatelander', longhouse: 'markman', home: 'aurennais' };
(!who || Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  const G = rollGenome('light:' + ROOM, { people: PEOPLE[ROOM] }); G.dress = { ...G.dress, shield: false, spear: false };
  const p = makePerson(G); p.root.position.set(who[0], p.root.position.y + FY, who[1]); p.root.rotation.y = who[2]; scene.add(p.root);
  p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); STATS.person = +statureOf(G).toFixed(3);
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
