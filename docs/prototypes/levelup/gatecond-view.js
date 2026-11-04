// A gate's condition, seen (the concept artist, 4 Nov 2026; backlog L10, OG-120): gatecond.js's nave in one condition, lit by a mode.
// ?cond=steady|failing|catastrophic, &mode=stones|drawn|school (A one light, B OG-120 as drawn, C the school's colour holds),
// &school=cloch|tine|uisce|scath|solas|gaoth (the stone and the script; Cloch by default), &cam=wide|high|door|scale|script or x,y,z,tx,ty,tz,
// &t=<seconds> (where the flicker and the lift stand), &nopeople. A Gatelander stands on the threshold bay for the scale.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { gateHall, GC_CONDS, GC_MODES } from './gatecond.js';

const COND = GC_CONDS[Q.get('cond')] ? Q.get('cond') : 'steady', MODE = GC_MODES[Q.get('mode')] ? Q.get('mode') : 'school', CAM = Q.get('cam') || 'wide', T0 = +(Q.get('t') || 4), SCHOOL = Q.get('school') || 'cloch';
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM === 'script' ? 48 : 60, W / H, .05, 2000); buildTextures();
scene.background = new THREE.Color(0, 0, 0);
const v = gateHall({ cond: COND, mode: MODE, school: SCHOOL, t: T0 }); scene.add(v.group);
scene.fog = new THREE.FogExp2(new THREE.Color(...v.fog.color), v.fog.density); scene.background = new THREE.Color(...v.fog.color);
const V = v.view[CAM] || v.view.wide; cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]);
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
let nan = 0; v.group.traverse(o => { if (o.isMesh) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { nan++; STATS.nanIn = o.name; break; } } });
Object.assign(STATS, { cond: COND, mode: MODE, school: SCHOOL, cam: CAM, hallTris: v.tris, hallDraws: v.draws, lights: v.lights.length, counts: v.counts, nan });
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .6, bloomR: .45, sat: 1.04, vig: .34 });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { const G = rollGenome('gatecond:delver', { people: 'gatelander', g: 1 }); G.dress = { ...G.dress, shield: false };
  const p = makePerson(G), s = v.stand; p.root.position.set(s.x, p.root.position.y + s.y, s.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  STATS.person = { height: +statureOf(G).toFixed(3) };
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.autoReset = !STILL; R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => v.tick(T0 + t / 1000) }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
