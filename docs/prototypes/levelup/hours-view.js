// The hours, seen (the concept artist, 22 Oct 2026; backlog L12 "The hours, island by island", OG-137; card F3): hours.js's rows over
// the Gatelands lane of seasons.html in high summer: limewashed cottages (pieces.js), a hedgerow and a copse (common.js's treeKit), a
// Weaver arch on the hill 200 m off, Gatelanders on the lane.
// ?hour=dawn|sunrise|midday|golden|twilight|moonlit|deep or ?t=0..7 (fractions blend), &night=readable|phase|floor (A, B, C; floor the
// default), &moon=0..1 (the moon's lit share: 0 new, 1 full; 1 the default), &cam=field (default: on the lane, eye height, looking north
// to the hill) | hill (the arch from 57 m) | scale (the cottage door and its lantern, a person at it) | high (16 m up over the lane) |
// x,y,z,tx,ty,tz. &nopeople. The live page has a slider for the hour, the night's option and the moon (top left).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q, STILL, W, H, STATS, rnd, reseed, fbm, sstep, makeRenderer, buildTextures, mat, worldUV, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { shrineTextures } from './shrines.js';
import { gatePiece } from './gatekit.js';
import { GL_PLANS, gatelandsBuilding, glMats } from './pieces.js';
import { corruptGrade, setGrade, corruptSky } from './corruption.js';
import { HOURS, lerpHour, clockText, dirOf, NIGHT, nightRow, hourMoon, hourStars, hourMist, hourLamps, setWindows } from './hours.js';

const HK = { dawn: 0, sunrise: 1, midday: 2, golden: 3, twilight: 4, moonlit: 5, deep: 6 };
let T = Q.has('hour') ? (HK[Q.get('hour')] ?? 2) : +(Q.get('t') ?? 2), MODE = NIGHT[Q.get('night')] ? Q.get('night') : 'floor', PHASE = +(Q.get('moon') ?? 1);
const CAM = Q.get('cam') || 'field';

const R = makeRenderer(.82), EXP = .82, scene = new THREE.Scene(); R.info.autoReset = false;
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .0016);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 40000); buildTextures(); shrineTextures(); reseed(20);
// one shadow-casting key light: the sun by day, the moon by night
const SUN = new THREE.Vector3(), MOON = new THREE.Vector3(), SKYD = new THREE.Vector3(), KEY = new THREE.Vector3();
dirOf(185, 57, SUN);
const key = new THREE.DirectionalLight(0xffffff, 3.3); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0002; key.shadow.normalBias = .03;
const hemi = new THREE.HemisphereLight(0xa0b4e0, 0x5c5242, 1.15); scene.add(key, key.target, hemi);
const HILL = [-14, -150];
const sky = corruptSky(SKYD, new THREE.Vector3(0, 1, 0)); scene.add(sky.mesh);

// ── the land: seasons.html's field, lane and hill ──
const laneX = z => 2 * Math.sin(z * .02);
function gy(x, z) {
  const d = Math.hypot(x, z - 5), hill = 30 * Math.exp(-((x - HILL[0]) ** 2 + (z - HILL[1]) ** 2) / (2 * 50 * 50));
  const roll = fbm(x * .006 + 3, z * .006 - 2) * 14 * sstep(40, 150, d), ridge = sstep(320, 700, -z) * (70 + 50 * fbm(x * .003, 9));
  return hill + roll + ridge;
}
const grassM = mat('grass', { ns: 1, rough: 1 });
{ const g = new THREE.PlaneGeometry(2400, 2400, 300, 300); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, gy(P.getX(i), P.getZ(i)));
  g.computeVertexNormals(); worldUV(g, .5); const m = new THREE.Mesh(g, grassM); m.receiveShadow = true; scene.add(m); }
const laneM = mat('rock', { ns: .6, color: 0xc0aa8a, rough: 1 });
{ const N = 120, pos = [], idx = []; for (let i = 0; i <= N; i++) { const z = 30 - i * 1.0, x = laneX(z); for (const s of [-1.6, 1.6]) pos.push(x + s, gy(x + s, z) + .04 + .3 * sstep(-30, -60, z), z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .6);
  const m = new THREE.Mesh(g, laneM); m.receiveShadow = true; scene.add(m); }

// ── the cottages (the Gatelands kit's cottage: 9.6 × 5.4 m, the door 2.05 m), the arch on the hill ──
const BUILT = STATS.built = [];
function cottage(x, z, ry, paint) { const P = GL_PLANS.cottage({ paint }), g = gatelandsBuilding(P); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); BUILT.push(g.userData.tris); return g; }
cottage(11.7, 2, -Math.PI / 2, 'red'); cottage(11.7, -13, -Math.PI / 2, 'green'); cottage(-12.7, -26, Math.PI / 2, 'blue');
const top = gy(...HILL);
{ const a = gatePiece('arch', { cond: 'cracked', school: 'cloch', key: 'corrupt:arch', ruin: true }); a.position.set(HILL[0], top - .4, HILL[1]); a.rotation.y = -.1; scene.add(a);
  for (const [dx, dz, k] of [[-17, 4, 'p1'], [15, -6, 'p2']]) { const p = gatePiece('pier', { cond: 'broken', school: 'cloch', key: 'corrupt:' + k, ruin: true }); p.position.set(HILL[0] + dx, gy(HILL[0] + dx, HILL[1] + dz) - .5, HILL[1] + dz); p.rotation.y = rnd() * .4; scene.add(p); } }

// ── trees: the hedgerow, the copse and the cottage trees, in summer leaf ──
const TK = treeKit(SUN), trees = [];
const free = (x, z) => Math.abs(x - laneX(z)) > 6 && !(x > 7 && x < 18 && z > -20 && z < 8) && !(x < -8 && x > -19 && z > -32 && z < -20) && Math.hypot(x - HILL[0], z - HILL[1]) > 26;
for (let i = 0; i < 70; i++) { const s = i < 35 ? -1 : 1, z = 20 - (i % 35) * 7 - rnd() * 3, x = s * (24 + rnd() * 8 + Math.max(0, -z - 40) * .5) + laneX(z); if (free(x, z)) trees.push([x, gy(x, z), z, .85 + rnd() * .3, rnd() * 6.3]); }
for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, d = 30 + rnd() * 50, x = HILL[0] + Math.cos(a) * d * 1.3, z = HILL[1] + Math.sin(a) * d * .8 - 10; if (free(x, z) && (z < HILL[1] - 12 || Math.abs(x - HILL[0]) > 40)) trees.push([x, gy(x, z), z, .9 + rnd() * .35, rnd() * 6.3]); }
for (const [x, z] of [[20, 6], [19, -20], [-20, -18], [-16, 10], [16, -44], [-19, -62]]) trees.push([x, gy(x, z), z, 1, rnd() * 6.3]);
TK.plant(scene, trees.map(t => [...t, new THREE.Color(.95, 1, .7), rnd() < .65 ? 0 : 1]));

// ── the clouds, each puff's colour kept so the hour can multiply it; the moon, the stars, the mist, the lamps ──
const before = new Set(scene.children); clouds(scene, SUN, { n: 16, d0: 1600, dw: 5200, y0: 320 });
const puffs = scene.children.filter(o => !before.has(o) && o.isSprite).map(o => [o, o.material.color.clone()]);
const moon = hourMoon(scene), stars = hourStars(scene);
const mist = hourMist(scene, [[-40, -60, 40], [30, -90, 45], [-60, -20, 30], [10, -200, 70], [-90, -160, 60], [60, -40, 30]], gy);
// a pool before each cottage's door (the door is 0.4 m south of the house's middle, on its street face) and a lantern beside the first
const lamps = hourLamps(scene, [[8.2, 2.3, 1.6], [8.2, 2.3, -13.4], [-9.2, 2.3, -25.6]], [9.0, 1.75, 2.95, -Math.PI / 2]);
const GM = glMats();

// ── the post and the people ──
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const people = [[-1.1, 11, .25, 'lane:a', 0], [.9, 6.5, 2.9, 'lane:b', 1], [8.35, 1.6, -Math.PI / 2 + .5, 'door:a', 1]];
if (CAM === 'hill') people.push([HILL[0] + 4.5, HILL[1] + 9, .3, 'hill:a', 0]);

// ── cameras ──
const keyBox = (cx, cz, half) => { key.position.copy(KEY).multiplyScalar(260).add(new THREE.Vector3(cx, 0, cz)); key.target.position.set(cx, 0, cz); Object.assign(key.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 700 }); key.shadow.camera.updateProjectionMatrix(); };
let BOX = [2, -12, 55];
if (CAM === 'hill') { const y = gy(-8, -120); cam.fov = 50; cam.position.set(-8, y + 1.65, -120); cam.lookAt(HILL[0], top + 8, HILL[1]); post.position.set(HILL[0] + 6, gy(HILL[0] + 6, HILL[1] + 9), HILL[1] + 9); BOX = [HILL[0], HILL[1] + 10, 60]; }
else if (CAM === 'scale') { cam.fov = 40; cam.position.set(3.6, 1.6, 7.4); cam.lookAt(9.0, 1.4, 1.4); post.position.set(8.5, 0, 3.6); BOX = [6, 0, 22]; }
else if (CAM === 'high') { cam.fov = 50; cam.position.set(6, 16, 40); cam.lookAt(-10, 6, -120); post.position.set(2.6, 0, 13); BOX = [-5, -60, 110]; }
else { cam.fov = 50; cam.position.set(.4, 1.65, 22); cam.lookAt(-6, 16, -150); post.position.set(2.6, 0, 13); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();

// ── the post-process: the slices' bloom, then corruption.js's grade at level 0 with the hour's numbers ──
const comp = new EffectComposer(R); comp.setSize(W, H); comp.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .24, .6, .9); comp.addPass(bloom);
const grade = corruptGrade(); comp.addPass(grade); comp.addPass(new OutputPass());

const tmpC = new THREE.Color();
function apply(t) {
  const L = nightRow(lerpHour(t), PHASE, MODE);
  dirOf(L.az, L.elev, SUN); dirOf(L.moonAz, L.moonEl, MOON);
  // the key: the sun while it is up (it fades in over its first two degrees), else the moon
  const sunUp = sstep(-1, 2, L.elev), sunK = L.sunK * sunUp, moonK = L.moonK * sstep(-1, 4, L.moonEl);
  if (sunK >= moonK) { KEY.copy(SUN); key.color.setRGB(...L.sun); key.intensity = sunK; } else { KEY.copy(MOON); key.color.setRGB(.62, .74, 1); key.intensity = moonK; }
  key.castShadow = key.intensity > .02; keyBox(...BOX);
  // the sky's glow follows the sun, or the moon once the sun is well down
  SKYD.copy(L.elev > -8 ? SUN : MOON);
  const U = sky.U; U.uZen.value.set(...L.zen); U.uMid.value.set(...L.mid); U.uHor.value.set(...L.hor); U.uGlow.value.set(...L.glow).multiplyScalar(L.elev > -8 ? 1 : .4 * PHASE * L.moonUp); U.uRing.value = 0;
  for (let i = 0; i < 6; i++) U.uLobe.value[i].set(0, -1, 0, 0);
  hemi.color.setRGB(...L.hemi); hemi.groundColor.setRGB(...L.gnd); hemi.intensity = L.hemiK;
  scene.fog.color.setRGB(...L.fog); scene.fog.density = L.fogD;
  for (const [p, c] of puffs) p.material.color.setRGB(c.r * L.cloud[0], c.g * L.cloud[1], c.b * L.cloud[2]);
  setGrade(grade, { sat: L.sat, keep: 0, con: L.con, cast: L.cast, vig: L.vig }); R.toneMappingExposure = EXP * L.exp;
  moon.set(MOON, cam, PHASE, L.moonUp); stars.set(cam, L.stars);
  mist.set(L.mist, tmpC.setRGB(...L.fog).lerp(new THREE.Color(...L.sun), .25 * sunUp).multiplyScalar(1.1));
  setWindows(GM, L.lit, L.win); lamps.set(L.lamp);
  STATS.hour = L.name; STATS.clock = clockText(L.clock); STATS.t = +t.toFixed(2); STATS.night = MODE; STATS.moon = PHASE;
  STATS.row = { sunDeg: +L.elev.toFixed(1), sunAz: Math.round(L.az), key: +key.intensity.toFixed(2), hemi: +L.hemiK.toFixed(2), dark: +L.dark.toFixed(2), exp: +(EXP * L.exp).toFixed(2), stars: +L.stars.toFixed(2), win: +L.win.toFixed(2), lamp: +L.lamp.toFixed(2) };
}
apply(T);

if (!STILL) { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:10px;color:#f3ead6;font:13px system-ui;background:rgba(0,0,0,.5);padding:8px 10px;border-radius:6px;display:grid;gap:6px';
  d.innerHTML = `<label>The hour <b id="lv"></b> <input id="sl" type="range" min="0" max="7" step=".02" value="${T}" style="width:240px;vertical-align:middle"></label>
    <label>The night <select id="md">${Object.entries(NIGHT).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
    <label>The moon <input id="mn" type="range" min="0" max="1" step=".05" value="${PHASE}" style="width:140px;vertical-align:middle"> <span id="mv"></span></label>`;
  document.body.appendChild(d); d.querySelector('#md').value = MODE;
  const name = () => { const L = lerpHour(T); d.querySelector('#lv').textContent = clockText(L.clock) + ' · ' + L.name; d.querySelector('#mv').textContent = PHASE < .08 ? 'new' : PHASE > .92 ? 'full' : Math.round(PHASE * 100) + '% lit'; };
  name(); d.querySelector('#sl').oninput = e => { T = +e.target.value; name(); apply(T); };
  d.querySelector('#md').onchange = e => { MODE = e.target.value; apply(T); }; d.querySelector('#mn').oninput = e => { PHASE = +e.target.value; name(); apply(T); }; }

let tris = 0; scene.traverse(o => { if (o.isMesh && o !== sky.mesh && o.visible) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
STATS.scene = { trees: trees.length, cottages: BUILT, trisNoPeople: Math.round(tris), lights: lamps.lights.length + 2, mist: mist.sprites.length, stars: 2600 };
const go = () => { run(comp, cam, { tick: () => R.info.reset() }); STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; };
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, seed, g] of people) { const G = rollGenome(seed, { people: 'gatelander', g }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + gy(x, z), z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
