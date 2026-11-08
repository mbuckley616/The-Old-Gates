// The six schools' great halls, inside (the concept artist, 8 Nov 2026; backlog L10, OG-119): naves.js's nave dressed by a school.
// ?school=tine|uisce|cloch|scath|solas|gaoth, &level=colour|dressed|drawn (A the kit as built, B dressed, C OG-119 as drawn),
// &cam=wide|high|aisle|up|scale|door or x,y,z,tx,ty,tz, &t=<seconds>, &nopeople. A Gatelander stands on the threshold bay for the scale.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { naveOf } from './naves.js';

const SCHOOL = Q.get('school') || 'tine', LEVEL = Q.get('level') || 'dressed', CAM = Q.get('cam') || 'wide', T0 = +(Q.get('t') || 4);
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, W / H, .05, 2000); buildTextures();
const v = naveOf({ school: SCHOOL, level: LEVEL, t: T0 }); scene.add(v.group);
scene.fog = new THREE.FogExp2(new THREE.Color(...v.fog.color), v.fog.density); scene.background = new THREE.Color(...v.fog.color);
const V = CAM.includes(',') ? CAM.split(',').map(Number) : (v.view[CAM] || v.view.wide); cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]); cam.updateProjectionMatrix();
let nan = 0; v.group.traverse(o => { if (o.isMesh) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { nan++; STATS.nanIn = o.name; break; } } });
Object.assign(STATS, { school: v.school, level: v.level, cam: CAM, hallTris: v.tris, dress: v.dress, lights: v.lights.length, nan });
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .6, bloomR: .45, sat: 1.04, vig: .34 });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { const G = rollGenome('gatecond:delver', { people: 'gatelander', g: 1 }); G.dress = { ...G.dress, shield: false };
  const p = makePerson(G), s = v.stand; p.root.position.set(s.x, p.root.position.y + s.y, s.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  STATS.person = { height: +statureOf(G).toFixed(3) };
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.autoReset = !STILL; R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => v.tick(T0 + t / 1000) }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
