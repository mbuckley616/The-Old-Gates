// A great gate's ring and its knot (Session 1376): props.js's greatKnot in the ring chamber as the game lays it (gate-interiors-build.md:
// 60 m square, a dome to 38 m, the dais of 10 m in the middle, 0.4 high), lit by the script, two braziers and the knot's own light.
// ?place=low (default): the knot before the dark over the dais, in reach; ?place=high: the knot at the ring's heart, a cord to a stone.
// &state=untied (default) | torn | sealed; &school=cloch (default) | tine | uisce | scath | solas | gaoth.
// ?view=far (default): from the chamber's door, 26 m off; ?view=near: from the dais's front edge, at a standing eye.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, run } from './common.js';
import { greatKnot } from './props.js';
import { stream } from './pieces.js';

const R = makeRenderer(1.0), scene = new THREE.Scene(), VIEW = Q.get('view') || 'far', PLACE = Q.get('place') === 'high' ? 'high' : 'low', STATE = Q.get('state') || 'untied', SCHOOL = Q.get('school') || 'cloch';
buildTextures(); scene.background = new THREE.Color(.012, .011, .014); scene.fog = new THREE.FogExp2(new THREE.Color(.02, .018, .022), .012);
const cam = new THREE.PerspectiveCamera(VIEW === 'near' ? 55 : 60, W / H, .05, 600);
scene.add(new THREE.HemisphereLight(new THREE.Color(.30, .32, .40), new THREE.Color(.10, .08, .07), .5));
// the chamber: floor, four walls of 22 m and a dome to 38 m
const stone = mat('ashlar', { ns: 1.0, color: 0x6c665e }), slab = mat('slab', { ns: .8, color: 0x5a554e, rough: .45 });
{ const g = new THREE.PlaneGeometry(60, 60); g.rotateX(-Math.PI / 2); worldUV(g, .2); const m = new THREE.Mesh(g, slab); m.position.y = -.4; m.receiveShadow = true; scene.add(m); }
{ const g = new THREE.BoxGeometry(60, 22, 60); worldUV(g, .12); const keep = g.groups.filter((q, i) => i !== 2); g.clearGroups(); keep.forEach(q => g.addGroup(q.start, q.count, 0)); /* S1400 — no top face: the dome is the roof (the critic, 25 Oct: the box's lid at 21.6 m cut the ring) */ const m = new THREE.Mesh(g, [stone.clone()]); m.material[0].side = THREE.BackSide; m.position.y = 10.6; m.receiveShadow = true; scene.add(m); }
{ const g = new THREE.SphereGeometry(30, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 16 / 30, 1); worldUV(g, .12); const m = new THREE.Mesh(g, stone.clone()); m.material.side = THREE.BackSide; m.position.y = 21.6; scene.add(m); }
// the dais, the game's 10 m by 0.4
{ const g = new THREE.BoxGeometry(10, .4, 10); worldUV(g, .3); const m = new THREE.Mesh(g, mat('ashlar', { ns: .8, color: 0x8a847a })); m.position.y = -.2; m.receiveShadow = m.castShadow = true; scene.add(m); }
const P = greatKnot({ place: PLACE, state: STATE, school: SCHOOL }, stream('knot:' + SCHOOL)); scene.add(P.group);
const GL = { tine: [1, .34, .1], uisce: [.3, .72, 1], cloch: [1, .66, .3], scath: [.7, .34, 1], solas: [1, .86, .52], gaoth: [.66, .92, 1] }[SCHOOL] || [1, .66, .3];
{ const k = new THREE.PointLight(new THREE.Color(...GL), STATE === 'torn' ? 3 : 5, 12, 1.6); k.position.set(...P.knot); k.position.z += 1.2; scene.add(k);
  const u = new THREE.PointLight(new THREE.Color(...GL), 120, 40, 1.4); u.position.set(0, P.ring.centre[1], P.ring.centre[2] + 6); scene.add(u); }
// two braziers at the dais's front corners, and the carried torch
for (const sx of [-1, 1]) { const bx = sx * 4.2, bz = 4.2, bowl = new THREE.Mesh(new THREE.CylinderGeometry(.7, .4, .55, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1612, metalness: .6, roughness: .5, side: THREE.DoubleSide }));
  bowl.position.set(bx, 1.3, bz); scene.add(bowl); const leg = new THREE.Mesh(new THREE.CylinderGeometry(.1, .18, 1.1, 8), bowl.material); leg.position.set(bx, .55, bz); scene.add(leg);
  const f = new THREE.Mesh(new THREE.ConeGeometry(.4, .9, 10), new THREE.MeshStandardMaterial({ color: 0xffb050, emissive: new THREE.Color(1, .55, .2), emissiveIntensity: 3 })); f.position.set(bx, 1.95, bz); scene.add(f);
  const l = new THREE.PointLight(new THREE.Color(1, .6, .3), 30, 22, 1.6); l.position.set(bx, 2.4, bz); l.castShadow = true; scene.add(l); }
// a 1.8 m figure at the knot for scale (or by the stone)
{ const FIG = new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .14, .13), roughness: .9 }), g = new THREE.Group(), add = (geo, y) => { const m = new THREE.Mesh(geo, FIG); m.position.y = y; m.castShadow = true; g.add(m); };
  add(new THREE.CylinderGeometry(.17, .14, .82, 10), .41); add(new THREE.CylinderGeometry(.21, .17, .62, 10), 1.12); add(new THREE.SphereGeometry(.12, 12, 10), 1.67); add(new THREE.CylinderGeometry(.06, .06, .1, 8), 1.48);
  g.position.set(-1.3, 0, -.6); g.rotation.y = 1.9; if (!Q.has('nofig')) scene.add(g); }
if (VIEW === 'near') { cam.position.set(1.0, 1.65, 2.4); cam.lookAt(-.2, PLACE === 'high' ? 2.6 : 1.8, -1.6); if (PLACE === 'high') cam.fov = 75; }
else { cam.position.set(2, 1.65, 28); cam.lookAt(0, 14, -7); }
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.prop = { tris: P.tris, draws: P.draws, knot: P.knot, ring: P.ring, threads: P.threads, ends: P.ends, stone: P.stone, place: P.place, state: P.state };
run(makeComposer(R, scene, cam, { bloom: .7, bloomR: .5, bloomT: .55, sat: 1.0, vig: .45 }), cam);
