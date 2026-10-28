// Every herb's look, by island (the concept artist, 28 Oct 2026; backlog L8, OG-039): herbs.js's kit on the ground of its island.
// ?view=atlas&island=gatelands|mark|aurenne (default): every herb of the island in rows a metre and more apart, named, beside the
//   1.8 m post and a person of the island.
// ?view=field&island=…&mode=true|glow|lifted: a 26 m patch of the island's ground at the game's grass and wildflowers (the new look's
//   landGrassChunk: blades 0.2–0.5 m, its five flower colours), twelve of the island's herbs at 2 to 14 m, seen from the eye (1.65 m).
//   true: the plant alone at its size. glow: today's rule, every herb its light and halo. lifted (C): the plant 1.15 larger and its
//   colour lifted, the grass short in a ring about it, and a glint within 6 m of the eye.
// ?view=scale: the tallest and the lowest herbs of the three islands in a line, side on, beside the post and three people.
// ?view=close&herb=<key>&mode=…: one herb close, from a crouch.
// &nopeople leaves the people out; &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, rnd, reseed, fbm, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { HERBS, HERB_K, byIsland, herb } from './herbs.js';

const VIEW = Q.get('view') || 'atlas', ISL = Q.get('island') || 'gatelands', MODE = Q.get('mode') || 'true';
const R = makeRenderer(.84), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, .02, 30000); buildTextures();
// each island's ground, grass and light (after air.js's rows, B: the Gatelands soft, the Mark hard and low, Aurenne high and white)
const ISLE = {
  gatelands: { sun: [-.5, .55, .62], sunC: [1, .9, .76], sunI: 3.1, sky: { zen: [.12, .27, .58], mid: [.36, .54, .82], hor: [.78, .84, .9] }, hemi: [[.62, .72, .86], [.3, .32, .2], 1.2], fog: [.78, .82, .86, .012],
    soil: [.26, .22, .14], soil2: [.2, .26, .12], grass: [[.10, .18, .05], [.42, .60, .17]], gH: [.22, .5], gD: 120, flowers: .05, person: 'gatelander', trees: [.95, 1, .7] },
  mark: { sun: [-.6, .36, .7], sunC: [1, .92, .82], sunI: 3.4, sky: { zen: [.08, .2, .5], mid: [.3, .48, .78], hor: [.72, .8, .9] }, hemi: [[.6, .7, .9], [.22, .22, .2], 1.0], fog: [.74, .8, .88, .006],
    soil: [.24, .22, .2], soil2: [.3, .28, .22], grass: [[.12, .14, .06], [.46, .46, .22]], gH: [.12, .3], gD: 80, flowers: .03, heath: 1, person: 'markman', trees: [.32, .48, .4], snow: 1 },
  aurenne: { sun: [-.3, .85, .45], sunC: [1, .96, .88], sunI: 3.6, sky: { zen: [.14, .32, .66], mid: [.4, .6, .86], hor: [.86, .86, .84] }, hemi: [[.7, .76, .86], [.46, .38, .26], 1.25], fog: [.86, .84, .8, .008],
    soil: [.58, .44, .28], soil2: [.5, .4, .26], grass: [[.32, .28, .12], [.78, .68, .38]], gH: [.14, .4], gD: 38, flowers: .02, person: 'aurennais', trees: [.62, .62, .4] },
}[ISL] || {};
const SUN = new THREE.Vector3(...ISLE.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(ISLE.fog[0], ISLE.fog[1], ISLE.fog[2]), ISLE.fog[3] * (VIEW === 'atlas' ? 1.6 : .4));
const sun = new THREE.DirectionalLight(new THREE.Color(...ISLE.sunC), ISLE.sunI); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...ISLE.hemi[0]), new THREE.Color(...ISLE.hemi[1]), ISLE.hemi[2]));
skyDome(scene, SUN, ISLE.sky); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 300 });
function sunBox(cx, cz, half) { sun.position.copy(SUN).multiplyScalar(40).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix(); }

// the ground: a gently rolling plane, its colour the island's soil broken by noise (snow lying in the Mark's hollows)
const gh = (x, z) => VIEW === 'field' ? fbm(x * .05 + 3, z * .05 + 7, 4) * .9 - .45 : 0;
{ const S = VIEW === 'field' ? 140 : 400, N = VIEW === 'field' ? 280 : 100, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, gh(x, z)); const n = fbm(x * .4, z * .4, 4), t = Math.min(1, Math.max(0, n + .5)); let c = ISLE.soil.map((v, j) => v + (ISLE.soil2[j] - v) * t);
    if (ISLE.snow && VIEW === 'field' && fbm(x * .12 + 9, z * .12, 3) > .3) c = [.86, .88, .92]; col.set(c, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 })); m.receiveShadow = true; scene.add(m); }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
// a name card: canvas text on a sprite, sized in metres
function label(text, sub, x, y, z, w = .9) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const k = c.getContext('2d');
  k.fillStyle = 'rgba(20,16,12,.88)'; k.beginPath(); k.roundRect(4, 4, 504, 120, 18); k.fill(); k.fillStyle = '#f3ead6'; k.font = '600 52px Georgia, serif'; k.textAlign = 'center'; k.fillText(text, 256, 62);
  k.fillStyle = '#c8b898'; k.font = 'italic 30px Georgia, serif'; k.fillText(sub, 256, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, fog: false, toneMapped: false })); s.scale.set(w, w / 4, 1); s.position.set(x, y, z); s.renderOrder = 9; scene.add(s); }
// a boulder for the herbs that grow on stone; returns the height of its top
function boulder(x, z, r = .35) { const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = fbm(v.x * 1.7 + x, v.z * 1.7 + z, 3); v.multiplyScalar(1 + n * .35); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); worldUV(g, 1.4); const m = new THREE.Mesh(g, mat('rock', { ns: 1.2, color: ISL === 'aurenne' ? 0xf4ecd8 : ISL === 'mark' ? 0xa8a8b0 : 0xc8c8b8 })); m.scale.set(r * 1.3, r * .7, r); m.position.set(x, gh(x, z) - r * .15, z); m.castShadow = m.receiveShadow = true; scene.add(m);
  return gh(x, z) - r * .15 + r * .7 * .92; }
const ITEMS = STATS.herbs = [], people = [], herbsAt = [];
function put(key, x, z, ry = 0, mode = MODE, onStone) { const o = herb(key, mode); let y = gh(x, z); if (onStone ?? HERBS[key].on === 'stone') y = boulder(x, z, .32);
  o.group.position.set(x, y, z); o.group.rotation.y = ry; scene.add(o.group); herbsAt.push([x, z, o]); ITEMS.push({ key, name: o.name, island: o.island, game: o.game, tris: o.tris, draws: o.draws, top: o.top, spread: o.spread }); return o; }

if (VIEW === 'atlas') {
  const keys = byIsland(ISL), per = Math.ceil(keys.length / 3), DX = 1.55, DZ = 1.9;
  keys.forEach((k, i) => { const row = Math.floor(i / per), col = i % per, n = Math.min(per, keys.length - row * per), x = (col - (n - 1) / 2) * DX, z = -row * DZ;
    if (HERBS[k].sea) { const w = new THREE.Mesh(new THREE.CircleGeometry(.5, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a5a60, roughness: .15, transparent: true, opacity: .55 })); w.position.set(x, .012, z); scene.add(w); }
    if (HERBS[k].wet) { const w = new THREE.Mesh(new THREE.CircleGeometry(.45, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3428, roughness: .25 })); w.position.set(x, .006, z); w.receiveShadow = true; scene.add(w); }
    const o = put(k, x, z, i * .7); label(o.name, (HERBS[k].game ? '' : 'new · ') + HERBS[k].where, x, .1, z + .62, .78); });
  const half = (per - 1) / 2 * DX; post.position.set(-half - 1.1, 0, .2); people.push([half + 1.1, -1.2, -.5, ISLE.person, 'atlas:' + ISL]);
  cam.fov = 44; cam.position.set(.3, 3.0, 6.6); cam.lookAt(.3, .2, -1.7); sunBox(0, -1.5, 10);
} else if (VIEW === 'field') {
  const keys = { gatelands: ['goldenrod', 'firemoss', 'silverleaf', 'thornberry', 'veilwort', 'caorthann', 'heartroot', 'graywort', 'mistfern', 'duilleogghorm', 'briarweed', 'shadowcap'],
    mark: ['wolfsbane', 'coldmoss', 'stonecress', 'icebloom', 'frostcap', 'stormthistle', 'rimeberry', 'snowthyme', 'pineresin', 'lichenbloom', 'glacierlily', 'ferrousweed'],
    aurenne: ['sunpetal', 'amberbloom', 'jadealoe', 'sandlotus', 'sagepalm', 'drakesage', 'spicethorn', 'saltthorn', 'cyprusblossom', 'deserttruffle', 'sunfungus', 'stonecress'] }[ISL];
  if (ISL === 'aurenne') keys[11] = 'sandlotus';
  // the same twelve places on every island: a fan from 2 to 14 m ahead of the eye, left and right
  const SP = [[-1.3, 2.4], [1.5, 3.1], [-.2, 4.2], [-3.2, 5.2], [2.9, 5.9], [.6, 6.8], [-2, 8.1], [4.4, 8.8], [-5.2, 9.6], [1.5, 10.6], [-1, 12.2], [3.4, 13.6]];
  keys.forEach((k, i) => put(k, SP[i][0], -SP[i][1], i * 1.3));
  if (ISL === 'aurenne') { boulder(-6.5, -6, .6); boulder(5.5, -16, .8); } else boulder(-6.2, -4, .5);
  // grass as the new look grows it: four-segment blades, dark at the root to light at the tip, and the five wildflowers
  const area = 26, N = Math.round(area * area * ISLE.gD), seg = 4, bw = .035, pos = [], col = [], idx = [];
  for (let k = 0; k <= seg; k++) { const t = k / seg, w = bw * Math.pow(1 - t, .9); pos.push(-w, t, 0, w, t, 0); const c = ISLE.grass[0].map((v, i) => v + (ISLE.grass[1][i] - v) * Math.pow(t, 1.3)); col.push(...c, ...c); }
  for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); bg.setIndex(idx);
  const gm = new THREE.InstancedMesh(bg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), N), FL = [[.62, .38, .78], [.78, .44, .70], [.96, .95, .90], [.98, .82, .20], [.85, .20, .18]];
  const fg = new THREE.IcosahedronGeometry(.035, 0).scale(1, .55, 1), F = Math.round(N * ISLE.flowers), fm = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial(), F);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color(); reseed(77); let n = 0, f = 0, cleared = 0;
  for (let i = 0; i < N; i++) { const x = (rnd() - .5) * area, z = 1 - rnd() * area, patch = fbm(x * .3 + 5, z * .3, 3); if (patch < -.28) { rnd(); rnd(); continue; }
    let h = ISLE.gH[0] + (ISLE.gH[1] - ISLE.gH[0]) * rnd(); h *= .7 + .6 * Math.min(1, Math.max(0, patch + .5));
    let near = 9; for (const [hx, hz, o] of herbsAt) near = Math.min(near, Math.hypot(x - hx, z - hz) - o.spread * .5);
    if (near < 0) { cleared++; continue; } if (MODE === 'lifted' && near < .35) { h *= .25 + near; cleared++; }
    q.setFromAxisAngle(up, rnd() * 6.283); sc.set(1, h, 1); p.set(x, gh(x, z), z); M.compose(p, q, sc); gm.setMatrixAt(n, M); c.setScalar(.8 + .35 * rnd()); if (ISLE.heath && fbm(x * .5 + 2, z * .5 - 3, 3) > -.05) c.setRGB(.95 + .3 * rnd(), .55 + .2 * rnd(), .9 + .3 * rnd()); gm.setColorAt(n, c); n++;
    if (f < F && rnd() < ISLE.flowers) { p.y += h * (.75 + .3 * rnd()); M.compose(p, q, sc.set(1, 1, 1)); fm.setMatrixAt(f, M); fm.setColorAt(f, c.setRGB(...FL[Math.floor(rnd() * 5)])); f++; } }
  gm.count = n; fm.count = f; gm.receiveShadow = true; scene.add(gm, fm); STATS.grass = { blades: n, flowers: f, cleared, perM2: Math.round(n / area / area) };
  // a glint shows only within 6 m of the eye (in the game: each frame, by the distance to the player)
  const eye = new THREE.Vector3(0, gh(0, 1.2) + 1.65, 1.2); STATS.glints = 0;
  for (const [hx, hz, o] of herbsAt) if (o.group.userData.glint) { const on = Math.hypot(hx - eye.x, hz - eye.z) < 6; o.group.userData.glint.visible = on; STATS.glints += on; }
  // the island's trees behind, at 25–60 m
  const T = treeKit(SUN), L = []; reseed(31); for (let i = 0; i < 34; i++) { const a = (rnd() - .5) * 2.8, d = 30 + rnd() * 60, x = Math.sin(a) * d, z = -Math.cos(a) * d; L.push([x, gh(x, z), z, ISL === 'mark' ? .7 + rnd() * .4 : .55 + rnd() * .5, rnd() * 6, new THREE.Color(...ISLE.trees).multiplyScalar(.85 + rnd() * .3)]); } T.plant(scene, L);
  post.position.set(-1.6, gh(-1.6, -5.6), -5.6); people.push([2.1, -4.4, -2.4, ISLE.person, 'field:' + ISL]);
  cam.fov = 55; cam.position.copy(eye); cam.lookAt(0, gh(0, -7) + .1, -7.5); sunBox(0, -8, 16);
} else if (VIEW === 'scale') {
  const keys = ['caorthann', 'goldenrod', 'wolfsbane', 'glacierlily', 'stormthistle', 'sunpetal', 'sagepalm', 'amberbloom', 'thornberry', 'heartroot', 'firemoss', 'graywort', 'sandlotus', 'deserttruffle'];
  const xs = [0, .4], zs = [-.7, .7]; for (const k of keys) { const o = herb(k, MODE), r = o.top > .45 ? 0 : 1; xs[r] += Math.max(.3, o.spread * .55); o.group.position.set(xs[r], 0, zs[r]); scene.add(o.group); ITEMS.push({ key: k, name: o.name, top: o.top, spread: o.spread, tris: o.tris });
    label(o.name, o.top.toFixed(2) + ' m', xs[r], o.top + (r ? .12 : .2), zs[r] + .2, .62); xs[r] += Math.max(.3, o.spread * .55); }
  const x = Math.max(...xs); post.position.set(-.5, 0, .2); people.push([x + .5, .1, -.3, 'gatelander', 'scale:g'], [x + 1.2, .1, -.3, 'markman', 'scale:m'], [x + 1.9, .1, -.3, 'aurennais', 'scale:a']);
  const mid = (-.8 + x + 2.3) / 2, half = (x + 2.3 + .8) / 2; cam.fov = 34; const hf = Math.atan(Math.tan(cam.fov * Math.PI / 360) * W / H); cam.position.set(mid, 1.15, half / Math.tan(hf) + 1.2); cam.lookAt(mid, .95, 0); sunBox(mid, 0, half + 2); STATS.line = +x.toFixed(2);
} else {
  const k = Q.get('herb') || 'heartroot', o = put(k, 0, 0, .4); const d = Math.max(.7, o.top * 1.9 + o.spread);
  cam.fov = 40; cam.position.set(.2 * d, Math.max(.45, o.top * 1.1 + .25), d); cam.lookAt(0, o.top * .45, 0); sunBox(0, 0, 3);
  post.position.set(-.55 * d, 0, -.5); label(o.name, HERBS[k].where, -.3 * d, o.top + .3, -.4, .55); people.push([.65, -.9, -.4, ISLE.person, 'close:' + k]);
}
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.view = VIEW; STATS.island = ISL; STATS.mode = MODE; STATS.herbTris = ITEMS.reduce((a, o) => a + (o.tris || 0), 0); STATS.herbK = HERB_K;
const comp = makeComposer(R, scene, cam, { bloom: MODE === 'glow' ? .45 : .24, bloomT: .86, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
(Q.has('nopeople') || !people.length ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, kind, seed] of people) { const G = rollGenome(seed, { people: kind, g: /:a|aurenne/.test(seed) ? 1 : 0 }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + gh(x, z), z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push({ kind, height: +statureOf(G).toFixed(3) }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls;
  if (STILL && VIEW === 'field') measure(); });
// &still on the field: how much of each herb the eye sees through the grass. Every herb drawn flat in its own colour, everything else
// black (the glow's halos and glints left out), at 960x540; a herb counts as seen at 60 pixels or more (about 240 at 1920x1080).
function measure() { const keep = new Map(), ids = new Map(), hide = [];
  herbsAt.forEach(([, , o], i) => o.group.traverse(m => { if (m.isMesh) ids.set(m, i + 1); }));
  const black = new THREE.MeshBasicMaterial({ color: 0 }), bg = scene.background, fog = scene.fog;
  scene.traverse(m => { if (m.isSprite || m.isLight) { if (m.visible) hide.push(m); } else if (m.isMesh) { keep.set(m, m.material); const i = ids.get(m); m.material = i ? new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB((i & 3) / 3, ((i >> 2) & 3) / 3, ((i >> 4) & 3) / 3 + (i ? .001 : 0)), side: THREE.DoubleSide }) : black; } });
  hide.forEach(m => m.visible = false); scene.fog = null; scene.background = new THREE.Color(0);
  const w = 960, h = 540, rt = new THREE.WebGLRenderTarget(w, h), tm = R.toneMapping; R.toneMapping = THREE.NoToneMapping; R.setRenderTarget(rt); R.render(scene, cam); R.setRenderTarget(null); R.toneMapping = tm;
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, px); const n = new Array(herbsAt.length + 1).fill(0);
  for (let k = 0; k < px.length; k += 4) { const r = Math.round(px[k] / 85), g = Math.round(px[k + 1] / 85), b = Math.round(px[k + 2] / 85), i = r | (g << 2) | (b << 4); if (i) n[i]++; }
  STATS.seen = herbsAt.map(([x, z, o], i) => ({ key: o.key, d: +Math.hypot(x, z - 1.2).toFixed(1), px: n[i + 1] })); STATS.seenCount = STATS.seen.filter(e => e.px >= 60).length;
  keep.forEach((mt, m) => m.material = mt); hide.forEach(m => m.visible = true); scene.fog = fog; scene.background = bg; }
