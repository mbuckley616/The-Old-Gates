// What a gate keeps (the concept artist, 3 Nov 2026; backlog L10, OG-123): vaults.js's two rooms, lit by what is in them.
// ?room=great|lesser (a great gate's vault, a lesser gate's keep), &mode=relics|hoard|left (A the gate's own things, B the hoard as drawn,
// C the gate's own and what the delvers left), &cam=door|dais|close|high|scale, &school=tine|uisce|cloch|scath|solas|gaoth (the stone and
// the light; Cloch by default), &t=<seconds> (where the rings stand), &nopeople, &cam=x,y,z,tx,ty,tz.
// A Gatelander stands at `stand` for the scale: on the bridge in the great vault, before the dais in the keep.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { greatVault, lesserKeep, V_MODES } from './vaults.js';

const ROOM = Q.get('room') === 'lesser' ? 'lesser' : 'great', MODE = V_MODES[Q.get('mode')] ? Q.get('mode') : 'left', CAM = Q.get('cam') || 'door', T0 = +(Q.get('t') || 14), SCHOOL = Q.get('school') || 'cloch';
const R = makeRenderer(ROOM === 'great' ? 1.0 : 1.1), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(ROOM === 'great' ? 58 : 62, W / H, .05, 2000); buildTextures();
scene.background = new THREE.Color(0, 0, 0); scene.fog = new THREE.FogExp2(new THREE.Color(.02, .016, .012), ROOM === 'great' ? .011 : .02);
scene.add(new THREE.HemisphereLight(new THREE.Color(.28, .26, .3), new THREE.Color(.1, .07, .04), ROOM === 'great' ? .22 : .3));
// the metal wants something to reflect (helms-view.js's way): a dark hall with warm fires low and the school's glow, filtered once
{ const es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 50, a = Math.atan2(P.getX(i), P.getZ(i)), fire = Math.max(0, Math.cos(a * 2)) ** 6 * Math.max(0, 1 - Math.abs(y - .05) * 5);
    const c = new THREE.Color(.05, .045, .04).lerp(new THREE.Color(.2, .16, .12), Math.max(0, 1 - Math.abs(y) * 2)).add(new THREE.Color(1.6, .8, .3).multiplyScalar(fire)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(es, .02).texture; scene.environmentIntensity = .9; }
const v = (ROOM === 'great' ? greatVault : lesserKeep)({ mode: MODE, school: SCHOOL, t: T0 }); scene.add(v.group);
const V = v.view[CAM] || v.view.door; cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
if (CAM === 'close') cam.fov = 50; cam.updateProjectionMatrix();
// a NaN in the positions blacks the frame through the bloom: counted so a broken part is named
let nan = 0; v.group.traverse(o => { if (o.isMesh) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { nan++; STATS.nanIn = o.name; break; } } });
Object.assign(STATS, { room: ROOM, mode: MODE, school: SCHOOL, cam: CAM, vaultTris: v.tris, vaultDraws: v.draws, lights: v.lights.length, counts: v.counts, size: v.size, nan });
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .62, bloomR: .45, sat: 1.04, vig: .34 });
R.info.autoReset = !STILL;
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { const G = rollGenome('vaults:' + ROOM, { people: 'gatelander', g: 0 }); G.dress = { ...G.dress, shield: false };
  const p = makePerson(G), s = v.stand; p.root.position.set(s.x, p.root.position.y + s.y, s.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  STATS.person = { height: +statureOf(G).toFixed(3) };
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => v.tick(T0 + t / 1000) }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
