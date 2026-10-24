// Weather that matters, seen (the concept artist, 24 Oct 2026; backlog L12 "Weather that matters", OG-138; card F3): weather.js's rows
// over the Gatelands lane of seasons.html: limewashed cottages (pieces.js), a hedgerow and a copse (common.js's treeKit, with seasons.js's
// twigs and lying snow), a Weaver arch on the hill 200 m off, Gatelanders on the lane, a pennant on a pole by the lane for the wind.
// ?wx=clear|partly|overcast|rain|heavy|storm|snow|blizzard|fog|rainbow|gate (rain the default), &sight=veil|drawn|kind (A, B, C; kind
// the default), &season=spring|summer|autumn|winter (the row's own by default), &flash=0|1 (the storm's bolt; 1 in a still),
// &cam=field (default: on the lane, eye height, looking north to the hill) | hill (the arch from 57 m) | scale (the cottage door, a
// person at it) | high (16 m up over the lane) | x,y,z,tx,ty,tz. &nopeople. The live page has the weather, the sight and the season (top left).
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
import { SEASONS, SEASON_NAMES, lerpSeason, seasonTrees, seasonTwigs, seasonSnow, seasonLitter, seasonFlowers, setSeason } from './seasons.js';
import { WEATHERS, WX_NAMES, SIGHT, fogFor, wxDeck, wxRain, wxSnow, wetAll, WU, wxBolt, wxBow, wxFlag, wxGateStorm } from './weather.js';

let WXK = WEATHERS[Q.get('wx')] ? Q.get('wx') : 'rain', MODE = SIGHT[Q.get('sight')] ? Q.get('sight') : 'kind', SEASON = Q.has('season') ? Math.max(0, SEASON_NAMES.indexOf(Q.get('season'))) : null;
const FLASH = Q.has('flash') ? +Q.get('flash') : 1, ROWS = 'full';
const CAM = Q.get('cam') || 'field';

const R = makeRenderer(.82), scene = new THREE.Scene(); R.info.autoReset = false;
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .0016);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 40000); buildTextures(); shrineTextures(); reseed(20); const GM = glMats();
// the sun keeps its bearing (south-west of the view, mid-afternoon) and the season sets its height
const AZ = new THREE.Vector2(-.45, .75).normalize(), SUN = new THREE.Vector3();
const sunAt = el => SUN.set(AZ.x * Math.cos(el), Math.sin(el), AZ.y * Math.cos(el));
sunAt(.5);
const sun = new THREE.DirectionalLight(0xffffff, 3.3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
const hemi = new THREE.HemisphereLight(0xa0b4e0, 0x5c5242, 1.15); scene.add(sun, sun.target, hemi);
const HILL = [-14, -150];
const sky = corruptSky(SUN, new THREE.Vector3(0, 1, 0)); scene.add(sky.mesh); sky.mesh.userData.noSnow = true;
const deck = wxDeck(scene), bow = wxBow(scene); deck.mesh.userData.noSnow = bow.mesh.userData.noSnow = true;

// ── the land: corruption.html's field, lane and hill ──
const laneX = z => 2 * Math.sin(z * .02);
function gy(x, z) {
  const d = Math.hypot(x, z - 5), hill = 30 * Math.exp(-((x - HILL[0]) ** 2 + (z - HILL[1]) ** 2) / (2 * 50 * 50));
  const roll = fbm(x * .006 + 3, z * .006 - 2) * 14 * sstep(40, 150, d), ridge = sstep(320, 700, -z) * (70 + 50 * fbm(x * .003, 9));
  return hill + roll + ridge;
}
const grassM = mat('grass', { ns: 1, rough: 1 });
{ const g = new THREE.PlaneGeometry(2400, 2400, 300, 300); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, gy(P.getX(i), P.getZ(i)));
  g.computeVertexNormals(); worldUV(g, .5); const m = new THREE.Mesh(g, grassM); m.receiveShadow = true; scene.add(m); }
const LANE = new THREE.Color(0xb09a7c), laneM = mat('rock', { ns: .6, color: 0xb09a7c, rough: 1 });
{ const N = 120, pos = [], idx = []; for (let i = 0; i <= N; i++) { const z = 30 - i * 1.0, x = laneX(z); for (const s of [-1.6, 1.6]) pos.push(x + s, gy(x + s, z) + .04 + .3 * sstep(-30, -60, z), z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .6);
  const m = new THREE.Mesh(g, laneM); m.receiveShadow = true; scene.add(m); }

// ── the cottages (the Gatelands kit's cottage: 9.6 × 5.4 m, the door 2.05 m) and the arch on the hill ──
const BUILT = STATS.built = [];
function cottage(x, z, ry, paint) { const P = GL_PLANS.cottage({ paint }), g = gatelandsBuilding(P); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); BUILT.push(g.userData.tris); return g; }
cottage(11.7, 2, -Math.PI / 2, 'red'); cottage(11.7, -13, -Math.PI / 2, 'green'); cottage(-12.7, -26, Math.PI / 2, 'blue');
const top = gy(...HILL);
{ const a = gatePiece('arch', { cond: 'cracked', school: 'cloch', key: 'corrupt:arch', ruin: true }); a.position.set(HILL[0], top - .4, HILL[1]); a.rotation.y = -.1; scene.add(a);
  for (const [dx, dz, k] of [[-17, 4, 'p1'], [15, -6, 'p2']]) { const p = gatePiece('pier', { cond: 'broken', school: 'cloch', key: 'corrupt:' + k, ruin: true }); p.position.set(HILL[0] + dx, gy(HILL[0] + dx, HILL[1] + dz) - .5, HILL[1] + dz); p.rotation.y = rnd() * .4; scene.add(p); } }

// ── trees: corruption.html's hedgerow, copse and cottage trees, each with its template named so the twigs can follow ──
const TK = treeKit(SUN), trees = [];
const free = (x, z) => Math.abs(x - laneX(z)) > 6 && !(x > 7 && x < 18 && z > -20 && z < 8) && !(x < -8 && x > -19 && z > -32 && z < -20) && Math.hypot(x - HILL[0], z - HILL[1]) > 26;
for (let i = 0; i < 70; i++) { const s = i < 35 ? -1 : 1, z = 20 - (i % 35) * 7 - rnd() * 3, x = s * (24 + rnd() * 8 + Math.max(0, -z - 40) * .5) + laneX(z); if (free(x, z)) trees.push([x, gy(x, z), z, .85 + rnd() * .3, rnd() * 6.3]); }
for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, d = 30 + rnd() * 50, x = HILL[0] + Math.cos(a) * d * 1.3, z = HILL[1] + Math.sin(a) * d * .8 - 10; if (free(x, z) && (z < HILL[1] - 12 || Math.abs(x - HILL[0]) > 40)) trees.push([x, gy(x, z), z, .9 + rnd() * .35, rnd() * 6.3]); }
for (const [x, z] of [[20, 6], [19, -20], [-20, -18], [-16, 10], [16, -44], [-19, -62]]) trees.push([x, gy(x, z), z, 1, rnd() * 6.3]);
const planted = trees.map(t => [...t, new THREE.Color(.95, 1, .7), rnd() < .65 ? 0 : 1]);
TK.plant(scene, planted); seasonTrees(scene);
const twigs = seasonTwigs(scene, planted);

// ── the litter under the crowns and along the hedges and the lane; the flowers in the field near the lane ──
const spots = planted.map(t => [t[0], t[2], (t[6] ? 4.6 : 6) * t[3], 1]);
{ const r = Math.random; let k = 7; const h = () => (k = (k * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 40; i++) { const z = 28 - h() * 118, s = h() < .5 ? -1 : 1, x = laneX(z) + s * (2.2 + h() * 1.6); spots.push([x, z, .8 + h() * 1.4, .25]); } }
const litter = seasonLitter(scene, spots, gy, 5200);
const flowers = seasonFlowers(scene, (x, z) => free(x, z) || (Math.abs(x - laneX(z)) > 3.2 && Math.abs(x - laneX(z)) < 6 && !(x > 6 && x < 18 && z > -20 && z < 8)), gy, [-46, -95, 46, 32], 6000);

// ── clouds, each puff's colour kept so the season can multiply it ──
const before = new Set(scene.children); clouds(scene, SUN, { n: 16, d0: 1600, dw: 5200, y0: 320 });
const puffs = scene.children.filter(o => !before.has(o) && o.isSprite).map(o => [o, o.material.color.clone()]);

// ── the post and the people ──
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const people = [[-1.1, 11, .25, 'lane:a', 0], [.9, 6.5, 2.9, 'lane:b', 1], [8.35, 1.6, -Math.PI / 2 + .5, 'door:a', 1]];
if (CAM === 'hill') people.push([HILL[0] + 4.5, HILL[1] + 9, .3, 'hill:a', 0]);
// the wind blows toward the east-north-east (heading 1.15 from -z), across the view and a little away
const HEAD = 1.15, WDIR = new THREE.Vector2(Math.sin(HEAD), -Math.cos(HEAD));
const flag = wxFlag(scene, -4.6, gy(-4.6, 6), 6), rain = wxRain(scene), drive = wxRain(scene, 9000, [40, 16, 40]), snowF = wxSnow(scene);
const bolt = wxBolt(scene, [-150, -620], gy(-150, -620)), storm = wxGateStorm(scene, HILL, top);
[rain.lines, drive.lines, snowF.points, bolt.lines].forEach(o => o.userData.noSnow = o.userData.noWet = true); storm.group.traverse(o => o.userData.noSnow = o.userData.noWet = true);

// ── cameras ──
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(260).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 700 }); sun.shadow.camera.updateProjectionMatrix(); };
let BOX = [2, -12, 55];
if (CAM === 'hill') { const y = gy(-8, -120); cam.fov = 50; cam.position.set(-8, y + 1.65, -120); cam.lookAt(HILL[0], top + 8, HILL[1]); post.position.set(HILL[0] + 6, gy(HILL[0] + 6, HILL[1] + 9), HILL[1] + 9); BOX = [HILL[0], HILL[1] + 10, 60]; }
else if (CAM === 'scale') { cam.fov = 40; cam.position.set(3.6, 1.6, 7.4); cam.lookAt(9.0, 1.4, 1.4); post.position.set(8.5, 0, 3.6); BOX = [6, 0, 22]; }
else if (CAM === 'hedge') { const h = planted.filter(t => t[0] < 0 && t[2] < 10 && t[2] > -30).sort((a, b) => b[2] - a[2])[0]; cam.fov = 55; cam.position.set(h[0] + 9, gy(h[0] + 9, h[2] + 8) + 1.65, h[2] + 8); cam.lookAt(h[0] - 2, gy(h[0], h[2]) + 6.5, h[2] - 6); post.position.set(h[0] + 4, gy(h[0] + 4, h[2] + 3), h[2] + 3); BOX = [h[0], h[2] - 4, 30]; }
else if (CAM === 'high') { cam.fov = 50; cam.position.set(6, 16, 40); cam.lookAt(-10, 6, -120); post.position.set(2.6, 0, 13); BOX = [-5, -60, 110]; }
else { cam.fov = 50; cam.position.set(.4, 1.65, 22); cam.lookAt(-9, 14, -150); post.position.set(2.6, 0, 13); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();

// ── the post-process: the slices' bloom, then corruption.js's grade (as P10b at level 0, its saturation taken from the season) ──
const comp = new EffectComposer(R); comp.setSize(W, H); comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .24, .6, .9));
const grade = corruptGrade(); comp.addPass(grade); comp.addPass(new OutputPass());

const GREY = (c, k) => c.map(v => v * k);
function apply() {
  const X = WEATHERS[WXK], L = { ...lerpSeason(SEASONS[ROWS], SEASON ?? X.season) }, g = X.grey, lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  setSeason(L, { snow: X.lie, twigs, litter, flowers });
  sunAt(X.elev ?? L.elev); sunBox(...BOX);
  const flash = X.flash * FLASH;
  setGrade(grade, { sat: L.sat * X.sat, keep: 0, con: X.con, cast: L.cast.map((v, i) => v * X.cast[i]), vig: .28 + .06 * g });
  const U = sky.U; U.uZen.value.set(...lerp3(L.zen, GREY(X.fog, .74), g)); U.uMid.value.set(...lerp3(L.mid, GREY(X.fog, .88), g)); U.uHor.value.set(...lerp3(L.hor, X.fog, Math.max(g, .5)));
  U.uGlow.value.set(...GREY(L.glow, (1 - g) * X.sunK)); U.uRing.value = 0; for (let i = 0; i < 6; i++) U.uLobe.value[i].set(0, -1, 0, 0);
  sun.color.setRGB(...L.sun); sun.intensity = L.sunK * X.sunK; sun.castShadow = sun.intensity > .15;
  hemi.color.setRGB(...lerp3(L.hemi, GREY(X.fog, .95), g)); hemi.groundColor.setRGB(...L.gnd); hemi.intensity = L.hemiK * X.hemiK * (1 + .8 * flash);
  scene.fog.color.setRGB(...X.fog); scene.fog.density = Math.max(L.fogD * (1 - g * .5), fogFor(X, MODE));
  grassM.color.setRGB(...L.grass); laneM.color.copy(LANE).multiplyScalar(1.08 - .5 * Math.max(L.mud, X.wet * .6)); laneM.roughness = 1;
  for (const [p, c] of puffs) { p.material.color.setRGB(...lerp3([c.r * L.cloud[0], c.g * L.cloud[1], c.b * L.cloud[2]], GREY(X.fog, .9), g)); p.visible = X.cover < .9; }
  deck.set(cam, X, lerp3([1.25, 1.24, 1.2], GREY(X.fog, 1.02), g), GREY(X.fog, .62), flash);
  WU.uWet.value = X.wet; WU.uPud.value = X.puddle; WU.uSkyRef.value.setRGB(...lerp3(L.hor, X.fog, Math.max(g, .4))).multiplyScalar(1 + .4 * flash);
  const rc = GREY(X.fog, 1.15); rain.set(cam, X.rain, WDIR, .12 + .5 * X.wind, 1, rc, .16 + .14 * X.rain);
  drive.set(cam, X.drive * .9, WDIR, 3.2, .4, GREY(X.fog, 1.25), .55); snowF.set(cam, X.snow, GREY(X.fog, 1.2));
  bolt.set(flash); bow.set(cam, SUN, X.bow); storm.set(X.gate, X.fog); flag.set(X.wind, HEAD, 0);
  STATS.wx = WXK; STATS.sight = MODE; STATS.season = L.name; STATS.row = { fogD: +scene.fog.density.toFixed(5), sightM: X.sight[SIGHT[MODE].i], sunK: +sun.intensity.toFixed(2), hemi: +hemi.intensity.toFixed(2), rain: Math.round(16000 * X.rain), flakes: Math.round(22000 * X.snow), driven: Math.round(9000 * X.drive * .9), lie: X.lie, wet: X.wet, puddle: X.puddle };
}
seasonSnow(scene); wetAll(scene, new Set([laneM, ...['rubble', 'ashlar', 'dress', 'slate', 'board'].map(k => GM[k])])); apply();

if (!STILL) { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:10px;color:#f3ead6;font:13px system-ui;background:rgba(0,0,0,.5);padding:8px 10px;border-radius:6px;display:grid;gap:6px';
  d.innerHTML = `<label>The weather <select id="wx">${WX_NAMES.map(k => `<option value="${k}">${WEATHERS[k].label}</option>`).join('')}</select></label>
    <label>How far you see <select id="md">${Object.entries(SIGHT).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
    <label>The season <select id="se"><option value="">the weather’s own</option>${SEASON_NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label>`;
  document.body.appendChild(d); d.querySelector('#wx').value = WXK; d.querySelector('#md').value = MODE; d.querySelector('#se').value = SEASON ?? '';
  d.querySelector('#wx').onchange = e => { WXK = e.target.value; apply(); }; d.querySelector('#md').onchange = e => { MODE = e.target.value; apply(); };
  d.querySelector('#se').onchange = e => { SEASON = e.target.value === '' ? null : +e.target.value; apply(); }; }
let tris = 0; scene.traverse(o => { if (o.isMesh && o !== sky.mesh && o.visible) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
STATS.scene = { trees: trees.length, cottages: BUILT, trisNoPeople: Math.round(tris) };
let nextFlash = 0;
const tick = t => { R.info.reset(); if (STILL) return; const X = WEATHERS[WXK]; flag.set(X.wind, HEAD, t * .001);
  if (X.flash) { if (t > nextFlash) nextFlash = t + 3000 + Math.random() * 6000; const left = nextFlash - t, f = Math.max(0, 1 - Math.abs(left - 2700) / 200); bolt.set(f); deck.U.uFlash.value = f; hemi.intensity = lerpSeason(SEASONS[ROWS], SEASON ?? X.season).hemiK * X.hemiK * (1 + .8 * f); } };
const go = () => { run(comp, cam, { tick }); STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; };
const W0 = WEATHERS[WXK], cloaked = (SEASON ?? W0.season) !== 1 || W0.rain > 0 || W0.snow > 0;
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, seed, g] of people) { const G = rollGenome(seed, { people: 'gatelander', g }); G.dress = { ...G.dress, shield: false, spear: false };
    if (cloaked && !G.dress.cloak) G.dress.cloak = g ? [.46, .14, .10] : [.30, .36, .20];
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + gy(x, z), z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
