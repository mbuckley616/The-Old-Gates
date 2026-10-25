// The human builder (Session 804, backlog K, B1 of docs/design/character-builder.md): Session 770's people.js made into a
// tool page. Pick or roll a genome, move its sliders (lock any of them and roll the rest), dress it, choose its hair,
// and save it as JSON (or a link); load one back. The game will read the saved genome; it never needs this page.
// Session 807 (B5): one tool for people and creatures. The kind at the top of the panel is a person or any body plan in
// creatures.js; the genome text, Save, Load, Apply and the link take either (kit.js reads both). The people's pack is
// fetched only when a person is shown, so the creatures need no pack.
// Query: ?g=<base64url genome>  ?seed=<s>&sex=m|f  ?plan=<body plan>&gait=<g>  ?view=full|face|back|side (a creature: side|front|back|top)
// ?still&w&h (one frame, for the checks).
import * as THREE from 'three';
import { Q, STILL, W, H, STATS, makeRenderer, makeComposer } from './common.js';
import { makePerson, toSaved, rollGenome, HAIR_STYLES, BODY_SLIDERS, GARMENTS, PEOPLES } from './people.js';
import { PLANS, SLIDERS as CSLIDERS, genome as cGenome, build as cBuild, pose as cPose, step as cStep, speedOf } from './creatures.js';
import { readGenome, saveGenome, needPack } from './kit.js';
const GLABEL = { plateGlow: 'plate glow', cowl: 'hood (no cloak)', chair: 'wheeled chair', eyepatch: 'eyepatch', staff: 'walking staff', sash: 'shoulder sash', sashBorder: 'sash border', wrap: 'head-wrap', wrapBorder: 'head-wrap edge', earrings: 'hoop earrings', necklace: 'coin necklace', beltCoins: 'belt coins', sashBelt: 'sash belt', skirtColor: 'skirt colour', cord: 'robe cord', lace: 'bodice lacing', cuffBand: 'woven cuff band', mail: 'mail hauberk', helm: 'helm (kettle, or by tier)', shield: 'round shield', shieldPaint: 'shield quarters', shieldRim: 'shield rim', spear: 'spear shaft', crossbow: 'crossbow tiller', cloakFur: 'fur collar', cloakHem: 'embroidered hem', tabardTrim: 'tabard trim', scarfPrint: 'headscarf print', basket: 'willow basket', basketCloth: 'cloth over the basket', amulet: 'stone amulet', charms: 'belt charms', dots: 'dot embroidery', shoulderWrap: 'shoulder wrap', tartan: 'tartan (dark stripe)', tartanLine: 'tartan overcheck', coat: 'winter coat', coatFur: 'coat fur trim', bands: 'woven bands (ground)', bandsMotif: 'woven bands (lozenges)', robeStripe: 'robe stripe', robeStripeLine: 'robe stripe (fine line)', circlet: 'circlet', circletStone: 'circlet stone', gownBorder: 'gown embroidery', burnousStripe: 'burnous stripe', veil: 'face veil' };

if (STILL) document.body.classList.add('still');
const R = makeRenderer(.95), scene = new THREE.Scene(); scene.background = new THREE.Color(.035, .04, .05);
const cam = new THREE.PerspectiveCamera(30, W / H, .05, 200);
const key = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 3.2); key.position.set(-3, 5, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.4, bottom: -.2, near: 1, far: 20 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
const rim = new THREE.DirectionalLight(new THREE.Color(.6, .72, 1), 2.6); rim.position.set(4, 4, -5);
scene.add(key, rim, new THREE.HemisphereLight(new THREE.Color(.5, .55, .65), new THREE.Color(.18, .14, .1), .8));
{ const f = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshStandardMaterial({ color: new THREE.Color(.035, .033, .031), roughness: .95 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); }
// the 1.8 m scale figure: a thin post with a tick every 10 cm
{ const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a7b62, roughness: .8 }); g.add(new THREE.Mesh(new THREE.BoxGeometry(.012, 1.8, .012).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .03 : .06, .004, .012).translate(.015, i * .1, 0), m)); g.position.set(-.55, 0, -.1); scene.add(g); var post = g; }
// a swimmer's water (as on the bestiary page): a still surface over it
const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x3d6f86, transparent: true, opacity: .28, roughness: .1, side: THREE.DoubleSide, depthWrite: false })); water.rotation.x = -Math.PI / 2; water.visible = false; scene.add(water);
const comp = makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .4, warm: [1.05, 1, .94], cool: [.95, .98, 1.05] });

// ── state ──
const b64 = { enc: o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))) };
// SP is the species shown: 'human' (G, the person) or 'creature' (CG, the creature's genome, built as C)
const rollPerson = s => rollGenome(s, { g: Q.get('sex') === 'f' ? 0 : Q.get('sex') === 'm' ? 1 : undefined, people: Q.get('people') || undefined, child: Q.has('child'), old: Q.has('old') });
let SP = 'human', G = null, CG = null, C = null;
if (Q.get('g')) ({ species: SP, G } = readGenome(b64.dec(Q.get('g'))));
else if (PLANS[Q.get('plan')]) { SP = 'creature'; G = cGenome(Q.get('plan'), Q.get('seed') || Q.get('plan') + ':builder'); }
else if (!Q.get('people')) G = rollPerson(Q.get('seed') || 'builder');
if (SP === 'creature') { CG = G; G = null; }
const locks = new Set();
let person = null, pal = null, palAt = null, view = Q.get('view') || (SP === 'creature' ? 'side' : 'full'), turn = Q.has('turn') ? +Q.get('turn') : 0, zoom = Q.has('zoom') ? +Q.get('zoom') : 1, dirty = true, gait = null;
const saved = () => SP === 'human' ? toSaved(G) : saveGenome('creature', CG);
const B = window.__builder = { get genome() { return saved(); }, get species() { return SP; }, get person() { return person; }, get creature() { return C; }, stats: STATS };

function clear() {
  for (const x of [person, C, pal]) if (x) { scene.remove(x.root); x.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  person = C = pal = null;
}
function rebuild() {
  clear(); if (SP === 'creature') return rebuildCreature();
  water.visible = false; post.position.set(-.55, 0, -.1); setShadow(2.4);
  const t0 = performance.now(); person = makePerson(G); scene.add(person.root);
  let tris = 0; person.root.traverse(o => { if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3; });
  for (const k of ['bones', 'plan', 'gait', 'speed']) delete STATS[k];
  Object.assign(STATS, { species: 'human', ms: Math.round(performance.now() - t0), tris, hair: person.hair, bytes: JSON.stringify(toSaved(G)).length }); if (PLANS[Q.get('with')]) withCreature(); frame(); dirty = true; syncText();
}
// a creature beside the person (Session 1123, Garrick's hound by his chair): with=PLAN, withGait=GAIT (else it stands), withSide=L or R
// (the person's left or right, R by default), withGap=metres between them (.08), withFwd=metres its front is ahead of theirs (0). It is built
// and posed once, lies in the person's frame facing their way, and turns with them (on the ground: a seated person's root is at the hips); its numbers are STATS.with
function withCreature() {
  pal = cBuild(cGenome(Q.get('with'), Q.get('withSeed') || Q.get('with') + ':builder')); pal.gait = pal.plan.gaits.includes(Q.get('withGait')) ? Q.get('withGait') : 'stand'; cPose(pal, .2);
  pal.base = -(pal.plan.heading || 0) * Math.PI / 180; pal.root.rotation.y = pal.base; scene.add(pal.root); person.root.rotation.y = 0; scene.updateMatrixWorld(true);
  // its box from the posed vertices (a skinned mesh's own box is its bind pose's)
  const pb = new THREE.Box3().setFromObject(person.root.getObjectByName('chair') || person.root), cb = new THREE.Box3(), v = new THREE.Vector3(), right = Q.get('withSide') !== 'L', gap = +(Q.get('withGap') ?? .08);
  pal.root.traverse(o => { if (o.isMesh) for (let i = 0; i < o.geometry.attributes.position.count; i++) cb.expandByPoint(o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld)); });
  palAt = new THREE.Vector3(right ? pb.min.x - gap - cb.max.x : pb.max.x + gap - cb.min.x, 0, pb.max.z + +(Q.get('withFwd') || 0) - cb.max.z);
  STATS.with = { plan: Q.get('with'), gait: pal.gait, tris: pal.stats.tris, gap: +gap.toFixed(3), side: right ? 'R' : 'L', base: +pal.base.toFixed(4), low: +cb.min.y.toFixed(4), chairX: [+pb.min.x.toFixed(3), +pb.max.x.toFixed(3)], box: [+(cb.max.x - cb.min.x).toFixed(3), +(cb.max.y - cb.min.y).toFixed(3), +(cb.max.z - cb.min.z).toFixed(3)] };
}
function setShadow(r) { Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r * .2, near: 1, far: 20 + r * 6 }); key.position.set(-3, 5, 6).multiplyScalar(Math.max(1, r / 2.4)); key.shadow.camera.updateProjectionMatrix(); }
// a creature: built from its genome, shown in place in its gait (it walks on the spot), with the post beside it
function rebuildCreature() {
  C = cBuild(CG); if (!gait || !C.plan.gaits.includes(gait)) gait = Q.get('gait') && C.plan.gaits.includes(Q.get('gait')) ? Q.get('gait') : C.plan.gaits[0];
  C.gait = gait; C.root.rotation.y = -(C.plan.heading || 0) * Math.PI / 180; scene.add(C.root); cPose(C, +(Q.get('phase') || .2));
  water.visible = !!C.plan.water; water.position.y = (C.plan.water || 0) * C.S;
  Object.assign(STATS, { species: 'creature', plan: CG.plan, gait, bones: C.stats.bones, tris: C.stats.tris, ms: C.stats.ms, speed: +speedOf(C).toFixed(2), bytes: JSON.stringify(saved()).length }); delete STATS.hair;
  frame(); dirty = true; syncText();
}
// the middle of a skinned band's front (Session 1010): its geometry holds every vertex of the body, so its box is the whole person; the drawn ones are read posed
const bandMid = m => { const v = new THREE.Vector3(), o = new THREE.Vector3(), used = [...new Set(m.geometry.index.array)]; let n = 0, zMax = -9; const pts = used.map(i => m.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(m.matrixWorld)); for (const p of pts) zMax = Math.max(zMax, p.z);
  for (const p of pts) if (p.z > zMax - .06) { o.add(p); n++; } return o.divideScalar(n || 1); };
const cbox = () => { C.root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(C.root); };
function frame() {
  if (SP === 'creature') return frameCreature();
  person.root.rotation.y = turn + (view === 'back' ? Math.PI : view === 'side' ? Math.PI / 2 : 0);
  if (pal) { pal.root.position.copy(palAt).applyAxisAngle(new THREE.Vector3(0, 1, 0), person.root.rotation.y); pal.root.position.x += person.root.position.x; pal.root.position.z += person.root.position.z; pal.root.rotation.y = pal.base + person.root.rotation.y; }
  scene.updateMatrixWorld(true);
  const h = new THREE.Vector3(); person.byName['head'].getWorldPosition(h);
  cam.clearViewOffset(); if (view === 'face') { cam.fov = 18; cam.position.set(h.x + .22, h.y + .1, h.z + 1.25 / zoom); cam.lookAt(h.x, h.y + .05, h.z); }
  else if (view === 'head') { cam.fov = 22; cam.position.set(h.x + .5 / zoom, h.y + .2, h.z + .9 / zoom); cam.lookAt(h.x, h.y - .05 + (person.wrap?.turban ? .04 : 0), h.z); }
  // the throat and the upper chest (Session 1003): what is worn at the neck's base, a necklace
  else if (view === 'neck') { cam.fov = 22; cam.position.set(h.x + .3 / zoom, h.y - .1, h.z + .95 / zoom); cam.lookAt(h.x, h.y - .2, h.z); }
  // the left hand and wrist (Session 1052): the Old Blood's marks, seen from outside the arm and a little in front
  else if (view === 'hand') { const w = new THREE.Vector3(); person.byName['wrist.L'].getWorldPosition(w); const o = new THREE.Vector3(1, 0, 0).applyQuaternion(person.root.quaternion); cam.fov = 20; cam.position.set(w.x + o.x * .55 / zoom + .12 * Math.cos(turn), w.y + .12, w.z + o.z * .55 / zoom + .35 / zoom); cam.lookAt(w.x, w.y + .02, w.z); }
  // the waist (Session 1004): the belt's front, and what hangs from it (or the sash belt's, Session 1010)
  else if (view === 'waist') { const b = person.root.getObjectByName('beltCoins') || person.root.getObjectByName('beltCharms'), sb = !b && (person.root.getObjectByName('sashBelt') || person.root.getObjectByName('belt')), t = b ? new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3()) : sb ? bandMid(sb) : h.clone().setY(h.y - .7); cam.fov = 22; cam.position.set(t.x + .3 / zoom, t.y + .12, t.z + 1.05 / zoom); cam.lookAt(t); }
  // the feet (Session 1015): what is worn on them, sandals
  // the shins (Session 1021): what is worn from the ankle to the knee, leg wraps
  else if (view === 'shins') { const t = new THREE.Vector3(h.x, .3, h.z + .05); cam.fov = 24; cam.position.set(t.x + .4 / zoom, t.y + .12 / zoom, t.z + 1.3 / zoom); cam.lookAt(t); }
  else if (view === 'feet') { const t = new THREE.Vector3(h.x, .07, h.z + .05); cam.fov = 24; cam.position.set(t.x + .35 / zoom, t.y + .38 / zoom, t.z + .95 / zoom); cam.lookAt(t); }
  // over the head (Session 918): what is carried above it, a spear's head
  else if (view === 'over') { const sp = person.root.getObjectByName('spear'), b = sp && new THREE.Box3().setFromObject(sp), t = b ? new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y - .24, (b.min.z + b.max.z) / 2) : h.clone().setY(h.y + .45);
    cam.fov = 22; cam.position.set(t.x + .05, t.y + .06, t.z + 1.5 / zoom); cam.lookAt(t); }
  else { cam.fov = 30; const top = h.y + .15; cam.position.set(.2, top * .55 + .1, (top * 1.9 + .6) / zoom); cam.lookAt(0, top * .5, 0); }
  cam.aspect = W / H; cam.updateProjectionMatrix();
}
function frameCreature() {
  // fitted to what the view sees: from the side its length and height, from the front or back its span and height
  const b = cbox(), size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), top = view === 'top';
  post.position.set(b.max.x + .3, 0, b.min.z - .5); setShadow(Math.max(2.4, Math.max(size.x, size.z) * .7)); key.position.x += c.x; key.position.z += c.z;
  const a = turn + ({ side: Math.PI / 2, front: 0, back: Math.PI, top: .3 })[view], along = view === 'front' || view === 'back' || top;
  const hw = (along ? size.x : size.z) / 2 + .1, hh = (top ? size.z : size.y) / 2 + .1, depth = (along ? size.z : size.x) / 2, t = Math.tan(15 * Math.PI / 180);
  // with the panel open, the view's centre moves into the open part of the screen and the width is fitted to it
  const pw = STILL ? 0 : Math.min(300, W * .45), d = (Math.max(hh / t, hw / (t * (W - pw) / H)) * 1.2 + depth) / zoom;
  if (pw) cam.setViewOffset(W, H, -pw / 2, 0, W, H); else cam.clearViewOffset();
  cam.fov = 30; if (top) cam.position.set(c.x + Math.sin(a) * d * .25, b.min.y + d, c.z + Math.cos(a) * d * .25); else cam.position.set(c.x + Math.sin(a) * d, c.y + hh * .25, c.z + Math.cos(a) * d);
  cam.lookAt(c.x, c.y, c.z); cam.aspect = W / H; cam.updateProjectionMatrix();
}
// ── the panel ──
const panel = document.getElementById('panel'), el = (t, a = {}, ...c) => { const e = document.createElement(t); Object.assign(e, a); for (const x of c) e.append(x); return e; };
const h2 = t => panel.append(el('h2', { textContent: t })), inputs = {};
const hex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''), unhex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
function slider(label, get, set, min, max, lockKey) {
  const r = el('input', { type: 'range', min, max, step: .01, value: get() }), v = el('span', { textContent: (+get()).toFixed(2) }), lk = el('input', { type: 'checkbox', title: 'lock: keep this when rolling' });
  r.oninput = () => { set(+r.value); v.textContent = (+r.value).toFixed(2); schedule(); }; lk.onchange = () => lk.checked ? locks.add(lockKey) : locks.delete(lockKey);
  panel.append(el('div', { className: 'row' }, el('label', { textContent: label }), r, v, lk)); inputs[lockKey] = () => { r.value = get(); v.textContent = (+get()).toFixed(2); };
}
function colour(label, get, set, extra) {
  const c = el('input', { type: 'color', value: hex(get() || [0, 0, 0]) }); c.oninput = () => { set(unhex(c.value)); schedule(); };
  panel.append(el('div', { className: 'crow' }, el('label', { textContent: label }), c, extra || el('span'))); inputs['c:' + label] = () => { if (get()) c.value = hex(get()); if (extra && extra.sync) extra.sync(); };
}
const FACE = ['head-square', 'head-oval', 'head-round', 'forehead-trans', 'chin-width', 'chin-prominent', 'chin-height', 'nose-scale-vert', 'nose-scale-horiz', 'nose-point-width', 'nose-curve', 'l-cheek-bones', 'r-cheek-bones', 'mouth-scale-horiz', 'torso-vshape', 'neck-scale-horiz', 'hip-scale-horiz'];
// the kind: a person, or one of the body plans. Changing it starts the new kind from its own seed.
function kindBar() {
  const k = el('select', {}, el('option', { value: 'human', textContent: 'a person' }), el('optgroup', { label: 'creatures' }, ...Object.entries(PLANS).map(([p, v]) => el('option', { value: p, textContent: v.name }))));
  k.value = SP === 'human' ? 'human' : CG.plan; k.onchange = async () => {
    if (k.value === 'human') { if (!G) G = rollPerson('builder'); SP = 'human'; view = 'full'; await needPack(); }
    else { SP = 'creature'; CG = cGenome(k.value, k.value + ':builder'); gait = null; if (!['side', 'front', 'back', 'top'].includes(view)) view = 'side'; }
    turn = 0; zoom = 1; buildPanel(); rebuild(); };
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'kind ' }), k)); B.kind = k;
}
function buildPanel() {
  panel.innerHTML = ''; locks.clear(); for (const k in inputs) delete inputs[k];
  panel.append(el('div', { innerHTML: '<b>The builder</b> · people Session 804 · creatures Session 807' })); kindBar();
  if (SP === 'creature') { creaturePanel(); return genomePanel(['side', 'front', 'back', 'top']); }
  const seed = el('input', { type: 'text', value: G.seed, size: 12 }), sex = el('select', {}, el('option', { value: '', textContent: 'any' }), el('option', { value: 'f', textContent: 'woman' }), el('option', { value: 'm', textContent: 'man' }));
  const ppl = el('select', {}, ...Object.entries(PEOPLES).map(([k, v]) => el('option', { value: k, textContent: v.name }))); ppl.value = G.people || 'markman';
  const roll = el('button', { textContent: 'Roll', onclick: () => { const s = seed.value === G.seed ? Math.random().toString(36).slice(2, 8) : seed.value; seed.value = s; const N = rollGenome(s, { g: sex.value === 'f' ? 0 : sex.value === 'm' ? 1 : undefined, people: ppl.value });
    for (const k of locks) { if (k.startsWith('f:')) N.face[k.slice(2)] = G.face[k.slice(2)]; else N[k] = G[k]; } G = N; syncAll(); rebuild(); } });
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'seed ' }), seed, sex, roll));
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'people ' }), ppl));
  h2('Body'); const BL = { g: 'woman · man', age: 'age (11 → 25 → 90)', muscle: 'muscle', weight: 'weight', height: 'height', prop: 'proportions' };
  for (const k of BODY_SLIDERS) slider(BL[k], () => G[k] ?? .5, v => G[k] = v, 0, 1, k);
  h2('Face'); for (const f of FACE) slider(f.replace(/-/g, ' '), () => (G.face || {})[f] ?? 0, v => (G.face = G.face || {})[f] = v, -1, 1, 'f:' + f);
  h2('Colour'); colour('skin', () => G.skin, v => G.skin = v); colour('hair', () => G.hairCol, v => G.hairCol = v); colour('eyes', () => G.eyes, v => G.eyes = v);
  h2('Hair'); { const st = el('select', {}, ...HAIR_STYLES.map(s => el('option', { value: s, textContent: s }))); st.value = G.hair?.style || 'short'; st.onchange = () => { G.hair = { ...(G.hair || {}), style: st.value }; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'style' }), st, el('span'))); inputs.style = () => st.value = G.hair?.style || 'short'; }
  slider('length', () => G.hair?.len ?? .3, v => G.hair = { ...(G.hair || {}), len: v }, 0, 1, 'hairLen'); slider('beard', () => G.beard || 0, v => G.beard = v, 0, 1, 'beard');
  slider('brows', () => G.brow?.thick ?? ((G.g ?? .5) > .5 ? .62 : .42), v => G.brow = { arch: (G.g ?? .5) > .5 ? .35 : .6, ...(G.brow || {}), thick: v }, 0, 1, 'browThick'); slider('brow arch', () => G.brow?.arch ?? ((G.g ?? .5) > .5 ? .35 : .6), v => G.brow = { thick: (G.g ?? .5) > .5 ? .62 : .42, ...(G.brow || {}), arch: v }, 0, 1, 'browArch');
  h2('Dress'); const D = () => G.dress = G.dress || {};
  for (const k of GARMENTS) { const on = el('input', { type: 'checkbox', checked: !!D()[k], title: 'wear it' }); let last = D()[k] || [.3, .25, .2];
    on.onchange = () => { if (on.checked) D()[k] = last; else { last = D()[k] || last; D()[k] = null; } schedule(); }; on.sync = () => on.checked = !!D()[k];
    colour(GLABEL[k] || k, () => D()[k], v => { last = v; if (on.checked) D()[k] = v; }, on); }
  { const sk = el('select', {}, el('option', { value: '', textContent: 'none' }), el('option', { value: 'short', textContent: 'short' }), el('option', { value: 'knee', textContent: 'to the knee' }), el('option', { value: 'long', textContent: 'long' })); sk.value = D().skirt || ''; sk.onchange = () => { D().skirt = sk.value || null; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'skirt' }), sk, el('span'))); inputs.skirt = () => sk.value = D().skirt || ''; }
  // the mail made as a scale cuirass (Session 1058, OG-044's Compact guards): bronze scales, short sleeves, to the top of the thigh
  { const sc = el('input', { type: 'checkbox', checked: !!D().scales, onchange: () => { D().scales = sc.checked; schedule(); } });
    panel.append(el('div', { className: 'bar' }, el('label', {}, sc, ' the mail made of scales (a cuirass)'))); inputs.scales = () => sc.checked = !!D().scales; }
  // the mail made as sheet metal (Session 1260, card F10): plate, or Bronze's muscle cuirass with its leather strips
  { const pl = el('select', {}, ...[['', 'rings or scales'], ['plate', 'plate'], ['muscle', 'a muscle cuirass']].map(([v, t]) => el('option', { value: v, textContent: t }))); pl.value = D().plate || ''; pl.onchange = () => { D().plate = pl.value || null; schedule(); };
    panel.append(el('div', { className: 'bar' }, pl)); inputs.plate = () => pl.value = D().plate || ''; }
  // what the gauntlets and greaves are made of (Session 1263, card F10), and the cuisses up the thigh with the greaves
  for (const [k, opts] of [['vambraceKind', ['sheet', 'mail', 'scales', 'leather']], ['glovesKind', ['leather', 'mail', 'sheet']], ['greavesKind', ['sheet', 'mail', 'scales', 'leather']]]) {
    const se = el('select', {}, ...opts.map(v => el('option', { value: v, textContent: v }))); se.value = D()[k] || opts[0]; se.onchange = () => { D()[k] = se.value; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: k.replace('Kind', '') }), se, el('span'))); inputs[k] = () => se.value = D()[k] || opts[0]; }
  // the tier's signature on plate (Session 1265), its glow the 'plate glow' colour above
  { const sg = el('select', {}, ...['', 'fluted', 'heavy', 'faceted', 'scaled', 'spiked', 'inlaid'].map(v => el('option', { value: v, textContent: v || 'plain plate' }))); sg.value = D().plateSig || ''; sg.onchange = () => { D().plateSig = sg.value || null; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'plate' }), sg, el('span'))); inputs.plateSig = () => sg.value = D().plateSig || ''; }
  { const cu = el('input', { type: 'checkbox', checked: !!D().cuisses, onchange: () => { D().cuisses = cu.checked; schedule(); } });
    panel.append(el('div', { className: 'bar' }, el('label', {}, cu, ' cuisses with the greaves'))); inputs.cuisses = () => cu.checked = !!D().cuisses; }
  // the hurt (Session 1079, OG-001's extras): an old scar across one eye, and the eyepatch's side
  { const sc = el('select', {}, ...[['', 'no scar'], ['L', 'scar over the left eye'], ['R', 'scar over the right eye']].map(([v, t]) => el('option', { value: v, textContent: t }))); sc.value = G.scar || ''; sc.onchange = () => { G.scar = sc.value || null; schedule(); };
    const ps = el('select', {}, ...[['L', 'patch on the left'], ['R', 'patch on the right']].map(([v, t]) => el('option', { value: v, textContent: t }))); ps.value = D().eyepatchSide || 'L'; ps.onchange = () => { D().eyepatchSide = ps.value; schedule(); };
    panel.append(el('div', { className: 'bar' }, sc, ps)); inputs.scar = () => { sc.value = G.scar || ''; ps.value = D().eyepatchSide || 'L'; }; }
  // the risen dead (Session 1403): the skin's rot, 0 the living to 1 long in the grave
  { const rt = el('input', { type: 'range', min: 0, max: 1, step: .05, value: G.rot || 0, oninput: () => { G.rot = +rt.value || null; schedule(); } });
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'rot' }), rt, el('span'))); inputs.rot = () => rt.value = G.rot || 0; }
  // the old's walking staff (Session 1085, OG-001, OG-042, OG-065): its make, or the people's own
  { const sm = el('select', {}, ...[['', 'staff by people'], ['hazel', 'hazel, a root knob'], ['ash', 'ash, iron-shod'], ['olive', 'olive, a bronze knob'], ['carved', 'carved knotwork, tall']].map(([v, t]) => el('option', { value: v, textContent: t }))); sm.value = D().staffMake || ''; sm.onchange = () => { D().staffMake = sm.value || null; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'staff' }), sm, el('span'))); inputs.staffMake = () => sm.value = D().staffMake || ''; }
  // the head-wrap tied as a Gatelander's headscarf (Session 1029): its point and knot down the back
  { const sf = el('input', { type: 'checkbox', checked: !!D().scarf, onchange: () => { D().scarf = sf.checked; schedule(); } });
    panel.append(el('div', { className: 'bar' }, el('label', {}, sf, ' head-wrap tied as a headscarf'))); inputs.scarf = () => sf.checked = !!D().scarf; }
  { const tb = el('input', { type: 'checkbox', checked: !!D().turban, onchange: () => { D().turban = tb.checked; schedule(); } }); const tl = el('select', {}, ...[['', 'no tail'], ['L', 'tail on the left'], ['R', 'tail on the right']].map(([v, t]) => el('option', { value: v, textContent: t }))); tl.value = D().wrapTail || ''; tl.onchange = () => { D().wrapTail = tl.value || null; schedule(); };
    panel.append(el('div', { className: 'bar' }, el('label', {}, tb, ' head-wrap wound up as a turban'), tl)); inputs.turban = () => { tb.checked = !!D().turban; tl.value = D().wrapTail || ''; }; }
  h2('Cloak and apron'); { const hd = el('select', {}, ...['none', 'down', 'up'].map(v => el('option', { value: v, textContent: 'hood ' + v }))); hd.value = D().hood || 'none'; hd.onchange = () => { D().hood = hd.value === 'none' ? null : hd.value; schedule(); };
    const bib = el('input', { type: 'checkbox', checked: !!D().bib, onchange: () => { D().bib = bib.checked; schedule(); } }), lea = el('input', { type: 'checkbox', checked: !!D().apronLeather, onchange: () => { D().apronLeather = lea.checked; schedule(); } }), cp = el('input', { type: 'checkbox', checked: !!D().cape, onchange: () => { D().cape = cp.checked; schedule(); } });
    // the burnous (Session 1236, OG-109's Aurenne winter): the cloak shut at the chest, its hood pointed and tasselled, striped in the burnous stripe's colour
    const bu = el('input', { type: 'checkbox', checked: !!D().burnous, onchange: () => { D().burnous = bu.checked; schedule(); } });
    panel.append(el('div', { className: 'bar' }, hd, el('label', {}, bib, ' bib'), el('label', {}, lea, ' leather apron'), el('label', {}, cp, ' cape'), el('label', {}, bu, ' burnous')));
    inputs.cloakFlags = () => { hd.value = D().hood || 'none'; bib.checked = !!D().bib; lea.checked = !!D().apronLeather; cp.checked = !!D().cape; bu.checked = !!D().burnous; }; }
  slider('cloak length', () => D().cloakLen ?? .8, v => D().cloakLen = v, 0, 1, 'cloakLen');
  slider('coat length', () => D().coatLen ?? .75, v => D().coatLen = v, 0, 1, 'coatLen');
  // the coat's hood (Session 1152, OG-109's Mark): up over the head, fur round the face when the coat has fur; down on the back (Session 1153)
  { const ch = el('select', {}, ...['none', 'down', 'up'].map(v => el('option', { value: v, textContent: 'coat hood ' + v }))); ch.value = D().coatHood || 'none'; ch.onchange = () => { D().coatHood = ch.value === 'none' ? null : ch.value; schedule(); };
    panel.append(el('div', { className: 'bar' }, ch)); inputs.coatHood = () => ch.value = D().coatHood || 'none'; }
  // the armour's tier (Session 1197; helms.js, OG-052): with a helm, the tier's helm in place of the kettle helm (Iron is the kettle), shut from Steel up; on a robe's raised hood, the tier's dressing
  { const TN = ['none', 'Wooden', 'Bronze', 'Iron', 'Steel', 'Mithril', 'Adamant', 'Obsidian', 'Draconic', 'Demonic', 'Cosmic'], ts = el('select', {}, ...TN.map((t, i) => el('option', { value: i, textContent: 'armour tier ' + t.toLowerCase() }))); ts.value = D().tier || 0; ts.onchange = () => { D().tier = +ts.value || null; schedule(); };
    panel.append(el('div', { className: 'bar' }, ts)); inputs.tier = () => ts.value = D().tier || 0; }
  genomePanel(['full', 'head', 'face', 'side', 'back']);
}
// a creature's panel: its seed and Roll (the locked sliders kept), its gaits, the kit's six sliders, and its colour shift
function creaturePanel() {
  const P = PLANS[CG.plan], seed = el('input', { type: 'text', value: CG.seed, size: 12 });
  panel.append(el('div', { style: 'color:#8f8676', textContent: P.src }));
  const roll = el('button', { textContent: 'Roll', onclick: () => { const s = String(CG.seed) === seed.value ? (Math.random() * 1e9) >>> 0 : (/^\d+$/.test(seed.value) ? +seed.value : seed.value); const N = cGenome(CG.plan, s);
    for (const k of locks) { if (k.startsWith('c:')) N.sliders[k.slice(2)] = CG.sliders[k.slice(2)]; else N[k] = CG[k]; } CG = N; seed.value = CG.seed; syncAll(); rebuild(); } });
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'seed ' }), seed, roll)); inputs.cseed = () => seed.value = CG.seed;
  h2('Gait'); panel.append(el('div', { className: 'bar' }, ...P.gaits.map(g => el('button', { textContent: g, onclick: () => { gait = g; if (C) { C.gait = g; cPose(C, C.phase); frame(); } STATS.gait = g; dirty = true; } }))));
  h2('Body'); for (const [k, [lo, hi]] of Object.entries(CSLIDERS)) slider(k, () => CG.sliders[k], v => CG.sliders[k] = v, lo, hi, 'c:' + k);
  h2('Colour'); slider('hue shift', () => CG.tint, v => CG.tint = v, -.5, .5, 'tint'); slider('lightness', () => CG.light, v => CG.light = v, -.5, .5, 'light');
}
function genomePanel(views) {
  h2('View'); panel.append(el('div', { className: 'bar' }, ...views.map(v => el('button', { textContent: v, onclick: () => { view = v; turn = 0; zoom = 1; frame(); dirty = true; } }))));
  h2('Genome'); const ta = el('textarea', { spellcheck: false }); B.text = ta; panel.append(ta);
  const file = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: async () => { const f = file.files[0]; if (f) loadText(await f.text()); } });
  panel.append(el('div', { className: 'bar' },
    el('button', { textContent: 'Save .json', onclick: () => { const J = saved(), a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(J, null, 1)], { type: 'application/json' })), download: `genome-${J.plan ? J.plan + '-' : ''}${J.seed}.json` }); a.click(); } }),
    el('button', { textContent: 'Load .json', onclick: () => file.click() }), el('button', { textContent: 'Apply text', onclick: () => loadText(ta.value) }),
    el('button', { textContent: 'Copy link', onclick: () => { const u = location.href.split('?')[0] + '?g=' + b64.enc(saved()); navigator.clipboard?.writeText(u); history.replaceState(null, '', u); } }), file));
  B.stat = el('div', { style: 'color:#8f8676;margin-top:6px' }); panel.append(B.stat);
}
// a genome of either kind; loading the other kind switches the page to it
async function loadText(t) { let r; try { r = readGenome(t); } catch (e) { B.stat.textContent = 'Not loaded: ' + e.message; return false; }
  const was = SP; SP = r.species; if (SP === 'human') { G = r.G; await needPack(); } else { if (CG?.plan !== r.G.plan) gait = null; CG = r.G; }
  if (was !== SP || SP === 'creature') { if (SP === 'human') view = 'full'; else if (!['side', 'front', 'back', 'top'].includes(view)) view = 'side'; buildPanel(); } else syncAll(); rebuild(); return true; }
B.load = loadText;
function syncAll() { for (const f of Object.values(inputs)) f(); }
function syncText() { if (B.text) B.text.value = JSON.stringify(saved()); if (B.stat) B.stat.textContent = `${STATS.bytes} bytes · ${STATS.tris.toLocaleString()} triangles · built in ${STATS.ms} ms · ` + (SP === 'human' ? `hair: ${STATS.hair?.style}, ${STATS.hair?.strands} strands` : `${STATS.bones} bones · ${STATS.speed} m/s at the ${STATS.gait}`); }
let timer = 0; function schedule() { clearTimeout(timer); timer = setTimeout(rebuild, 180); }

// ── input: drag to turn, wheel to zoom ──
let drag = null; R.domElement.addEventListener('pointerdown', e => drag = [e.clientX, turn]); addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!drag) return; turn = drag[1] + (e.clientX - drag[0]) * .01 * (SP === 'creature' ? -1 : 1); frame(); dirty = true; });
R.domElement.addEventListener('wheel', e => { zoom = Math.max(.5, Math.min(4, zoom * (e.deltaY < 0 ? 1.1 : .9))); frame(); dirty = true; }, { passive: true });

// ?sheet: every hair style on the one genome, side by side, seen from ?ang (radians round from the front; 2.4 is from behind)
function sheet() {
  const styles = (Q.get('styles') || HAIR_STYLES.join(',')).split(','), ang = +(Q.get('ang') ?? 2.4), gap = .62, out = [];
  const dress = { ...G.dress, ...(Q.has('nomantle') ? { mantle: null } : {}), ...(Q.get('dress') ? JSON.parse(Q.get('dress')) : {}) };
  styles.forEach((st, i) => { const p = makePerson({ ...G, dress, hair: { style: st, len: Math.max(.6, G.hair?.len ?? .7) } }); p.root.position.x = (i - (styles.length - 1) / 2) * gap; p.root.rotation.y = -ang; scene.add(p.root); out.push({ style: st, ...p.hair }); });
  scene.updateMatrixWorld(true); const h = new THREE.Vector3(); scene.children.at(-1).getObjectByName('head')?.getWorldPosition(h);
  const y = h.y + +(Q.get('y') || 0); cam.fov = 22; cam.aspect = W / H; cam.position.set(0, y + .12, styles.length * gap * +(Q.get('dist') || 1.55)); cam.lookAt(0, y - .03, 0); cam.updateProjectionMatrix(); STATS.sheet = out;
}
window.__render = () => comp.render();
// ?peoples: three of each people side by side (a man, a woman, and one of either), each rolled from a seed of place and index
function peoplesSheet() {
  // with ?child (Session 1081) each people is a man, a woman, a boy and a girl
  // with ?old (Session 1082) an old man and an old woman in place of the children
  const old = Q.has('old'), kids = Q.has('child') || old, per = kids ? 4 : 3, keys = Object.keys(PEOPLES), out = [], n = keys.length * per, gap = .62; let i = 0;
  for (const k of keys) for (let j = 0; j < per; j++) { const G1 = rollGenome(`${Q.get('seed') || 'line'}:${k}:${j}`, { people: k, g: kids ? j % 2 ? 0 : 1 : j === 0 ? 1 : j === 1 ? 0 : undefined, child: kids && !old && j > 1, old: old && j > 1 }), p = makePerson(G1);
    p.root.position.x = (i++ - (n - 1) / 2) * gap + (keys.indexOf(k) - 1.5) * .35; p.root.rotation.y = (j - 1) * .12; scene.add(p.root); const bb = new THREE.Box3().expandByObject(p.meshes[0], true); out.push({ people: k, g: G1.g, child: G1.age < .3, h: +(bb.max.y - bb.min.y).toFixed(3) }); }
  cam.fov = 24; cam.aspect = W / H; cam.position.set(0, 1.2, ((n - 1) / 2 * gap + .75) / (Math.tan(12 * Math.PI / 180) * W / H)); cam.lookAt(0, .95, 0); cam.updateProjectionMatrix(); STATS.peoples = out;
}
// a people's genome measures the morphed body for its height, so with ?people= it is rolled once the pack is in (Session 826)
(SP === 'human' ? needPack() : Promise.resolve()).then(() => { if (SP === 'human' && !G) G = rollPerson(Q.get('seed') || 'builder'); if (Q.has('peoples')) { peoplesSheet(); comp.render(); window.__done = true; return; }
  if (Q.has('sheet')) { sheet(); comp.render(); window.__done = true; return; }
  if (SP === 'human') { if (Q.get('dress')) Object.assign(G.dress, JSON.parse(Q.get('dress')));
    if (Q.get('style')) G.hair = { ...(G.hair || {}), style: Q.get('style') }; if (Q.get('len')) G.hair = { ...(G.hair || {}), len: +Q.get('len') }; if (Q.has('marks')) G.marks = Q.get('marks') === 'none' ? null : +Q.get('marks'); if (Q.has('scar')) G.scar = Q.get('scar') === 'none' ? null : Q.get('scar'); if (Q.has('rot')) G.rot = +Q.get('rot') || null; if (Q.has('stoop')) G.pose = { ...(G.pose || {}), stoop: +Q.get('stoop') };
    // the beard and the age (Session 1106, for Garrick's pictures)
    if (Q.has('beard')) G.beard = +Q.get('beard'); if (Q.has('age')) G.age = +Q.get('age');
    // the risen dead's pictures (Session 1403): the skin's colour as r,g b in 0..1, and the build's weight
    if (Q.has('skin')) G.skin = Q.get('skin').split(',').map(Number); if (Q.has('weight')) G.weight = +Q.get('weight'); if (Q.has('hairc')) G.hairCol = Q.get('hairc').split(',').map(Number); }
  if (!STILL) buildPanel(); rebuild(); comp.render(); window.__done = true;
  // a creature walks on the spot in its gait (the bestiary's step, with the body kept where it stands); a person is still
  let t0 = performance.now();
  if (!STILL) R.setAnimationLoop(() => { const t = performance.now(), dt = Math.min(.05, (t - t0) / 1000); t0 = t;
    if (C) { cStep(C, dt); dirty = true; } if (dirty) { comp.render(); dirty = false; } }); })
  .catch(e => { window.__err = String(e); console.error(e); });
