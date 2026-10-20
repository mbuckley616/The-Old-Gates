// The world's corruption, 0 to 6, seen (the concept artist, 20 Oct 2026; backlog L12, OG-145; card F12): corruption.js's rows over one
// Gatelands view: a lane between limewashed cottages (pieces.js), hedgerow trees and a copse (common.js's treeKit), and on a hill 200 m
// off a Weaver ruin, a lesser gate's arch (gatekit.js's arch, cracked and dead, as ruins.js lays them), with Gatelanders on the lane.
// ?level=0..6 (fractions blend two rows), &torn=tine,uisce,... (the gates torn; by default the first <level> of TEAR_ORDER),
// &cast=none (A: the drain alone) | sky (B: each torn gate's colour low on the horizon toward it; the default) | world (C: the last-torn
// school's colour over the whole frame), &cam=field (default: on the lane, eye height) | hill (57 m from the arch) | scale (the cottage
// door, a person at it) | x,y,z,tx,ty,tz. &nopeople. The live page has a slider and the cast switch (top left).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q, STILL, W, H, STATS, rnd, reseed, fbm, sstep, makeRenderer, buildTextures, mat, worldUV, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { shrineTextures } from './shrines.js';
import { gatePiece } from './gatekit.js';
import { GL_PLANS, gatelandsBuilding } from './pieces.js';
import { LEVELS, lerpLevel, TEAR_ORDER, corruptGrade, setGrade, corruptSky, setSky, worldCast, corruptTrees, setTrees, corruptSigns } from './corruption.js';

let LEVEL = Math.max(0, Math.min(6, +(Q.get('level') ?? 0))), MODE = Q.get('cast') || 'sky';
const CAM = Q.get('cam') || 'field';
// where each great gate lies from here, as a bearing (0 north, the view looks a little west of it): the prototype's choice, the game's comes from the map
const BEAR = { tine: -.55, uisce: .5, scath: -1.15, cloch: 1.2, gaoth: 2.5, solas: -2.4 };
const tornFor = x => (Q.get('torn') ? Q.get('torn').split(',') : TEAR_ORDER.slice(0, Math.ceil(x))).map((s, i, a) => [s, BEAR[s], Q.get('torn') ? 1 : Math.min(1, x - i)]);

const R = makeRenderer(.82), scene = new THREE.Scene(); R.info.autoReset = false;
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .0016);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 40000); buildTextures(); shrineTextures(); reseed(20);
const SUN = new THREE.Vector3(-.45, .5, .75).normalize();
const sun = new THREE.DirectionalLight(0xffffff, 3.3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
const hemi = new THREE.HemisphereLight(0xa0b4e0, 0x5c5242, 1.15); scene.add(sun, sun.target, hemi);
const HILL = [-14, -150], ringDir = new THREE.Vector3(HILL[0] - 0, 0, HILL[1] - 22).normalize().setY(.32).normalize();
const sky = corruptSky(SUN, ringDir); scene.add(sky.mesh);

// ── the land: a field round the lane, rolling past 40 m, the hill with the ruin, a ridge on the horizon ──
const laneX = z => 2 * Math.sin(z * .02);
function gy(x, z) {
  const d = Math.hypot(x, z - 5), hill = 30 * Math.exp(-((x - HILL[0]) ** 2 + (z - HILL[1]) ** 2) / (2 * 50 * 50));
  const roll = fbm(x * .006 + 3, z * .006 - 2) * 14 * sstep(40, 150, d), ridge = sstep(320, 700, -z) * (70 + 50 * fbm(x * .003, 9));
  return hill + roll + ridge;
}
const grassM = mat('grass', { ns: 1, rough: 1 });
{ const g = new THREE.PlaneGeometry(2400, 2400, 300, 300); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, gy(P.getX(i), P.getZ(i)));
  g.computeVertexNormals(); worldUV(g, .5); const m = new THREE.Mesh(g, grassM); m.receiveShadow = true; scene.add(m); }
{ const N = 120, pos = [], idx = []; for (let i = 0; i <= N; i++) { const z = 30 - i * 1.0, x = laneX(z); for (const s of [-1.6, 1.6]) pos.push(x + s, gy(x + s, z) + .04 + .3 * sstep(-30, -60, z), z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .6);
  const m = new THREE.Mesh(g, mat('rock', { ns: .6, color: 0xb09a7c, rough: 1 })); m.receiveShadow = true; scene.add(m); }

// ── the cottages along the lane (the Gatelands kit's cottage: 9.6 × 5.4 m, the door 2.05 m) ──
const BUILT = STATS.built = [];
function cottage(x, z, ry, paint) { const P = GL_PLANS.cottage({ paint }), g = gatelandsBuilding(P); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); BUILT.push({ kind: 'cottage', tris: g.userData.tris, w: P.w, d: P.d }); return g; }
cottage(11.7, 2, -Math.PI / 2, 'red'); cottage(11.7, -13, -Math.PI / 2, 'green'); cottage(-12.7, -26, Math.PI / 2, 'blue');

// ── the ruin on the hill: a lesser gate's arch and two piers, cracked and dead (OG-145's dormant stage, as ruins.js lays them) ──
const top = gy(...HILL); let ruinTris = 0;
{ const a = gatePiece('arch', { cond: 'cracked', school: 'cloch', key: 'corrupt:arch', ruin: true }); a.position.set(HILL[0], top - .4, HILL[1]); a.rotation.y = -.1; scene.add(a); ruinTris += a.userData.tris; STATS.arch = a.userData.size;
  for (const [dx, dz, k] of [[-17, 4, 'p1'], [15, -6, 'p2']]) { const p = gatePiece('pier', { cond: 'broken', school: 'cloch', key: 'corrupt:' + k, ruin: true }); p.position.set(HILL[0] + dx, gy(HILL[0] + dx, HILL[1] + dz) - .5, HILL[1] + dz); p.rotation.y = rnd() * .4; scene.add(p); ruinTris += p.userData.tris; } }
const signs = corruptSigns({ ground: gy, at: HILL, r: 34, rift: { x: HILL[0], y: top - .4, z: HILL[1] + .2, ry: -.1, h: 15, w: 8 } }); scene.add(signs.group);

// ── trees: a hedgerow along the field's edges, a copse on the hill's flanks, a few by the cottages ──
const TK = treeKit(SUN), trees = [];
const free = (x, z) => Math.abs(x - laneX(z)) > 6 && !(x > 7 && x < 18 && z > -20 && z < 8) && !(x < -8 && x > -19 && z > -32 && z < -20) && Math.hypot(x - HILL[0], z - HILL[1]) > 26;
for (let i = 0; i < 70; i++) { const s = i < 35 ? -1 : 1, z = 20 - (i % 35) * 7 - rnd() * 3, x = s * (24 + rnd() * 8 + Math.max(0, -z - 40) * .5) + laneX(z); if (free(x, z)) trees.push([x, gy(x, z), z, .85 + rnd() * .3, rnd() * 6.3]); }
for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, d = 30 + rnd() * 50, x = HILL[0] + Math.cos(a) * d * 1.3, z = HILL[1] + Math.sin(a) * d * .8 - 10; if (free(x, z) && (z < HILL[1] - 12 || Math.abs(x - HILL[0]) > 40)) trees.push([x, gy(x, z), z, .9 + rnd() * .35, rnd() * 6.3]); }
for (const [x, z] of [[20, 6], [19, -20], [-20, -18], [-16, 10], [16, -44], [-19, -62]]) trees.push([x, gy(x, z), z, 1, rnd() * 6.3]);
TK.plant(scene, trees.map(t => [...t, new THREE.Color(.95, 1, .7)])); corruptTrees(scene);

// ── clouds: common.js's, each puff's colour kept so the level can multiply it ──
const before = new Set(scene.children); clouds(scene, SUN, { n: 16, d0: 1600, dw: 5200, y0: 320 });
const puffs = scene.children.filter(o => !before.has(o) && o.isSprite).map(o => [o, o.material.color.clone()]);

// ── the post and the people ──
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const people = [[-1.1, 11, .25, 'lane:a', 0], [.9, 6.5, 2.9, 'lane:b', 1], [8.35, 1.6, -Math.PI / 2 + .5, 'door:a', 1]];
if (CAM === 'hill') people.push([HILL[0] + 4.5, HILL[1] + 9, .3, 'hill:a', 0]);

// ── cameras ──
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(120).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix(); };
if (CAM === 'hill') { const y = gy(-8, -120); cam.fov = 50; cam.position.set(-8, y + 1.65, -120); cam.lookAt(HILL[0], top + 8, HILL[1]); post.position.set(HILL[0] + 6, gy(HILL[0] + 6, HILL[1] + 9), HILL[1] + 9); sunBox(HILL[0], HILL[1] + 10, 50); }
else if (CAM === 'scale') { cam.fov = 40; cam.position.set(3.6, 1.6, 7.4); cam.lookAt(9.0, 1.4, 1.4); post.position.set(8.5, 0, 3.6); sunBox(6, 0, 20); }
else { cam.fov = 50; cam.position.set(.4, 1.65, 22); cam.lookAt(-9, 14, -150); post.position.set(2.6, 0, 13); sunBox(2, -12, 55); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();

// ── the post-process: the slices' bloom, then the corruption's grade in place of common.js's ──
const comp = new EffectComposer(R); comp.setSize(W, H); comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .26, .6, .9));
const grade = corruptGrade(); comp.addPass(grade); comp.addPass(new OutputPass());

function apply(x, t = 0) {
  const torn = tornFor(x), L = worldCast(lerpLevel(x), torn, MODE);
  setGrade(grade, L); setSky(sky, L, torn, MODE); setTrees(L); signs.set(L, t);
  sun.color.setRGB(...L.sun); sun.intensity = L.sunK; hemi.color.setRGB(...L.hemi); hemi.groundColor.setRGB(...L.gnd); hemi.intensity = L.hemiK;
  scene.fog.color.setRGB(...L.fog); scene.fog.density = L.fogD; grassM.color.setRGB(...L.grass);
  for (const [p, c] of puffs) p.material.color.setRGB(c.r * L.cloud[0], c.g * L.cloud[1], c.b * L.cloud[2]);
  STATS.level = +x.toFixed(2); STATS.torn = torn.map(t => t[0]); STATS.cast = MODE; STATS.row = { sat: +L.sat.toFixed(2), thin: +L.thin.toFixed(2), rocks: L.rocks, rift: +L.rift.toFixed(2), ring: +L.ring.toFixed(2) };
}
apply(LEVEL);

// the live page's controls
if (!STILL) { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:10px;color:#f3ead6;font:13px system-ui;background:rgba(0,0,0,.5);padding:8px 10px;border-radius:6px;display:grid;gap:6px';
  d.innerHTML = `<label>Corruption <b id="lv">${LEVEL}</b> <input id="sl" type="range" min="0" max="6" step=".1" value="${LEVEL}" style="width:220px;vertical-align:middle"></label>
    <label>Torn gates shown <select id="md"><option value="none">A · the drain alone</option><option value="sky">B · each gate's colour on its horizon</option><option value="world">C · the last gate's colour over all</option></select></label>`;
  document.body.appendChild(d); d.querySelector('#md').value = MODE;
  d.querySelector('#sl').oninput = e => { LEVEL = +e.target.value; d.querySelector('#lv').textContent = LEVEL.toFixed(1); apply(LEVEL); };
  d.querySelector('#md').onchange = e => { MODE = e.target.value; apply(LEVEL); }; }

let tris = 0; scene.traverse(o => { if (o.isMesh && o !== sky.mesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
STATS.scene = { trees: trees.length, cottages: BUILT.map(b => b.tris), ruin: ruinTris, rocks: signs.tris, trisNoPeople: Math.round(tris) };
const go = () => { run(comp, cam, { tick: t => { if (!STILL) signs.set(lerpLevel(LEVEL), t); R.info.reset(); } }); STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; };
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, seed, g] of people) { const G = rollGenome(seed, { people: 'gatelander', g }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + gy(x, z), z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
