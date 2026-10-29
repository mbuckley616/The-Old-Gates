// Strange places (the concept artist, 29 Oct 2026; backlog L5, OG-106): wonders.js's three wonders, each on its island, by day or night.
// ?kind=lough|skyfall|orrery (the Gatelands' Drowned Ring, the Mark's Skyfall Fields, Aurenne's Broken Orrery)
// &mode=quiet|alive|hour (A the shape alone, B always awake, C awake from dusk to dawn), &hour=day|night, &cam=wide|near,
// &t=<seconds> (the moment a still is taken: where the stones and rings are), &nopeople, &cam=x,y,z,tx,ty,tz.
// A person of the island stands where you would first see the wonder close (`stand`), for the scale.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, rnd, reseed, makeRenderer, makeComposer, buildTextures, skyDome, clouds, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { wonder, W_KINDS } from './wonders.js';

const KIND = W_KINDS[Q.get('kind')] ? Q.get('kind') : 'lough', MODE = Q.get('mode') || 'hour', NIGHT = Q.get('hour') === 'night', CAM = Q.get('cam') || 'wide', T0 = +(Q.get('t') || 7);
const ISL = W_KINDS[KIND].island;
// each island's day after air.js's B (the Gatelands soft, the Mark hard and low, Aurenne high and white); the night one moon for all
const DAY = {
  gatelands: { sun: [-.5, .42, .62], sunC: [1, .9, .76], sunI: 3.0, sky: { zen: [.12, .27, .58], mid: [.36, .54, .82], hor: [.78, .84, .9] }, hemi: [[.62, .72, .86], [.3, .32, .2], 1.2], fog: [.78, .82, .86, .0017] },
  mark: { sun: [-.55, .42, .7], sunC: [1, .92, .82], sunI: 3.4, sky: { zen: [.08, .2, .5], mid: [.3, .48, .78], hor: [.72, .8, .9] }, hemi: [[.6, .7, .9], [.4, .42, .46], 1.0], fog: [.74, .8, .88, .0016] },
  aurenne: { sun: [-.3, .7, .45], sunC: [1, .96, .88], sunI: 3.6, sky: { zen: [.14, .32, .66], mid: [.4, .6, .86], hor: [.86, .86, .84] }, hemi: [[.7, .76, .86], [.46, .38, .26], 1.25], fog: [.86, .84, .8, .0014] },
}[ISL];
const L = NIGHT ? { sun: [.35, .62, -.5], sunC: [.55, .66, 1], sunI: .55, sky: { zen: [.004, .007, .02], mid: [.01, .016, .04], hor: [.03, .04, .07], glow: [.3, .35, .5], glowK: .1 }, hemi: [[.16, .2, .34], [.03, .03, .04], .45], fog: [.03, .04, .07, DAY.fog[3] * .8] } : DAY;
const R = makeRenderer(NIGHT ? 1.05 : .84), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, .1, 30000); buildTextures();
const SUN = new THREE.Vector3(...L.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...L.fog.slice(0, 3)), L.fog[3]);
const sun = new THREE.DirectionalLight(new THREE.Color(...L.sunC), L.sunI); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...L.hemi[0]), new THREE.Color(...L.hemi[1]), L.hemi[2]));
skyDome(scene, SUN, L.sky); reseed(5); if (!NIGHT) clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 420 });
function sunBox(cx, cy, cz, half) { sun.position.copy(SUN).multiplyScalar(400).add(new THREE.Vector3(cx, cy, cz)); sun.target.position.set(cx, cy, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 10, far: 900 }); sun.shadow.camera.updateProjectionMatrix(); }
// the night: stars, and over the Mark the aurora (it is the Mark's own sky, in every mode: the wonder is what the mode changes)
if (NIGHT) { reseed(9); const n = 2600, p = new Float32Array(n * 3), c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rnd(), v = .06 + rnd() * .94, a = u * 6.283, y = v, rr = Math.sqrt(1 - y * y); p.set([Math.cos(a) * rr * 20000, y * 20000, Math.sin(a) * rr * 20000], i * 3); const b = .4 + rnd() * rnd() * 1.6; c.set([b, b, b * 1.08], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })));
  if (ISL === 'mark') { const g2 = new THREE.PlaneGeometry(9000, 2200, 120, 1), P = g2.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i); P.setZ(i, Math.sin(x / 900) * 900 + Math.sin(x / 330) * 220); }
    const m = new THREE.Mesh(g2, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; varying float vX; void main(){ vU = uv; vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec2 vU; varying float vX; void main(){ float f = pow(1. - vU.y, 2.) * smoothstep(0., .12, vU.y) * (.55 + .45 * sin(vX / 70.) * sin(vX / 23.)); vec3 c = mix(vec3(.15, 1., .45), vec3(.6, .3, 1.), smoothstep(.45, 1., vU.y)); gl_FragColor = vec4(c * f * .55, 1.); }' }));
    m.position.set(0, 2400, -5200); m.rotation.x = -.25; scene.add(m); } }

const w = wonder(KIND, { mode: MODE, night: NIGHT, t: T0 }); scene.add(w.group);
const V = w.view[CAM] || w.view.wide; cam.fov = CAM === 'near' ? 58 : 50; cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix(); sunBox(V[3], V[4], V[5], CAM === 'near' ? 90 : 180);
STATS.kind = KIND; STATS.name = w.name; STATS.mode = MODE; STATS.night = NIGHT; STATS.awake = w.awake; STATS.wonderTris = w.tris; STATS.wonderDraws = w.draws; STATS.setting = w.setting; STATS.size = w.size;
const comp = makeComposer(R, scene, cam, { bloom: NIGHT ? .7 : .3, bloomT: NIGHT ? .55 : .86, bloomR: .5, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
const kind = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' }[ISL];
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { const G = rollGenome('wonders:' + KIND, { people: kind, g: ISL === 'aurenne' ? 1 : 0 }); G.dress = { ...G.dress, shield: false, spear: false };
  const p = makePerson(G), s = w.stand; let y = w.ground(s.x, s.z); if (KIND === 'lough') y = .58; p.root.position.set(s.x, p.root.position.y + y, s.z); p.root.rotation.y = s.ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  STATS.person = { kind, height: +statureOf(G).toFixed(3) };
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => w.tick(T0 + t / 1000) }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
