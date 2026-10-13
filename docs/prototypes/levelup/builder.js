// The human builder (Session 804, backlog K, B1 of docs/design/character-builder.md): Session 770's people.js made into a
// tool page. Pick or roll a genome, move its sliders (lock any of them and roll the rest), dress it, choose its hair,
// and save it as JSON (or a link); load one back. The game will read the saved genome; it never needs this page.
// Query: ?g=<base64url genome>  ?seed=<s>&sex=m|f  ?view=full|face|back|side  ?still&w&h (one frame, for the checks).
import * as THREE from 'three';
import { Q, STILL, W, H, STATS, makeRenderer, makeComposer } from './common.js';
import { loadPack, makePerson, toSaved, fromSaved, rollGenome, HAIR_STYLES, BODY_SLIDERS, GARMENTS, PEOPLES } from './people.js';
const GLABEL = { skirtColor: 'skirt colour', cloakFur: 'fur collar' };

if (STILL) document.body.classList.add('still');
const R = makeRenderer(.95), scene = new THREE.Scene(); scene.background = new THREE.Color(.035, .04, .05);
const cam = new THREE.PerspectiveCamera(30, W / H, .05, 200);
const key = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 3.2); key.position.set(-3, 5, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.4, bottom: -.2, near: 1, far: 20 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
const rim = new THREE.DirectionalLight(new THREE.Color(.6, .72, 1), 2.6); rim.position.set(4, 4, -5);
scene.add(key, rim, new THREE.HemisphereLight(new THREE.Color(.5, .55, .65), new THREE.Color(.18, .14, .1), .8));
{ const f = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: new THREE.Color(.035, .033, .031), roughness: .95 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); }
// the 1.8 m scale figure: a thin post with a tick every 10 cm
{ const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a7b62, roughness: .8 }); g.add(new THREE.Mesh(new THREE.BoxGeometry(.012, 1.8, .012).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .03 : .06, .004, .012).translate(.015, i * .1, 0), m)); g.position.set(-.55, 0, -.1); scene.add(g); }
const comp = makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .4, warm: [1.05, 1, .94], cool: [.95, .98, 1.05] });

// ── state ──
const b64 = { enc: o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))) };
let G = Q.get('g') ? fromSaved(b64.dec(Q.get('g'))) : rollGenome(Q.get('seed') || 'builder', { g: Q.get('sex') === 'f' ? 0 : Q.get('sex') === 'm' ? 1 : undefined, people: Q.get('people') || undefined });
const locks = new Set();
let person = null, view = Q.get('view') || 'full', turn = Q.has('turn') ? +Q.get('turn') : 0, zoom = 1, dirty = true;
const B = window.__builder = { get genome() { return toSaved(G); }, get person() { return person; }, stats: STATS };

function rebuild() {
  if (person) { scene.remove(person.root); person.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const t0 = performance.now(); person = makePerson(G); scene.add(person.root);
  let tris = 0; person.root.traverse(o => { if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3; });
  Object.assign(STATS, { ms: Math.round(performance.now() - t0), tris, hair: person.hair, bytes: JSON.stringify(toSaved(G)).length }); frame(); dirty = true; syncText();
}
function frame() {
  person.root.rotation.y = turn + (view === 'back' ? Math.PI : view === 'side' ? Math.PI / 2 : 0); scene.updateMatrixWorld(true);
  const h = new THREE.Vector3(); person.byName['head'].getWorldPosition(h);
  if (view === 'face') { cam.fov = 18; cam.position.set(h.x + .22, h.y + .1, h.z + 1.25 / zoom); cam.lookAt(h.x, h.y + .05, h.z); }
  else if (view === 'head') { cam.fov = 22; cam.position.set(h.x + .5 / zoom, h.y + .2, h.z + .9 / zoom); cam.lookAt(h.x, h.y - .05, h.z); }
  else { cam.fov = 30; const top = h.y + .15; cam.position.set(.2, top * .55 + .1, (top * 1.9 + .6) / zoom); cam.lookAt(0, top * .5, 0); }
  cam.aspect = W / H; cam.updateProjectionMatrix();
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
function buildPanel() {
  panel.innerHTML = ''; panel.append(el('div', { innerHTML: '<b>The human builder</b> · Session 804 · B1' }));
  const seed = el('input', { type: 'text', value: G.seed, size: 12 }), sex = el('select', {}, el('option', { value: '', textContent: 'any' }), el('option', { value: 'f', textContent: 'woman' }), el('option', { value: 'm', textContent: 'man' }));
  const ppl = el('select', {}, ...Object.entries(PEOPLES).map(([k, v]) => el('option', { value: k, textContent: v.name }))); ppl.value = G.people || 'markman';
  const roll = el('button', { textContent: 'Roll', onclick: () => { const s = seed.value === G.seed ? Math.random().toString(36).slice(2, 8) : seed.value; seed.value = s; const N = rollGenome(s, { g: sex.value === 'f' ? 0 : sex.value === 'm' ? 1 : undefined, people: ppl.value });
    for (const k of locks) { if (k.startsWith('f:')) N.face[k.slice(2)] = G.face[k.slice(2)]; else N[k] = G[k]; } G = N; syncAll(); rebuild(); } });
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'seed ' }), seed, sex, roll));
  panel.append(el('div', { className: 'bar' }, el('label', { textContent: 'people ' }), ppl));
  h2('Body'); const BL = { g: 'woman · man', age: 'age (25 → 90)', muscle: 'muscle', weight: 'weight', height: 'height', prop: 'proportions' };
  for (const k of BODY_SLIDERS) slider(BL[k], () => G[k] ?? .5, v => G[k] = v, 0, 1, k);
  h2('Face'); for (const f of FACE) slider(f.replace(/-/g, ' '), () => (G.face || {})[f] ?? 0, v => (G.face = G.face || {})[f] = v, -1, 1, 'f:' + f);
  h2('Colour'); colour('skin', () => G.skin, v => G.skin = v); colour('hair', () => G.hairCol, v => G.hairCol = v); colour('eyes', () => G.eyes, v => G.eyes = v);
  h2('Hair'); { const st = el('select', {}, ...HAIR_STYLES.map(s => el('option', { value: s, textContent: s }))); st.value = G.hair?.style || 'short'; st.onchange = () => { G.hair = { ...(G.hair || {}), style: st.value }; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'style' }), st, el('span'))); inputs.style = () => st.value = G.hair?.style || 'short'; }
  slider('length', () => G.hair?.len ?? .3, v => G.hair = { ...(G.hair || {}), len: v }, 0, 1, 'hairLen'); slider('beard', () => G.beard || 0, v => G.beard = v, 0, 1, 'beard');
  h2('Dress'); const D = () => G.dress = G.dress || {};
  for (const k of GARMENTS) { const on = el('input', { type: 'checkbox', checked: !!D()[k], title: 'wear it' }); let last = D()[k] || [.3, .25, .2];
    on.onchange = () => { if (on.checked) D()[k] = last; else { last = D()[k] || last; D()[k] = null; } schedule(); }; on.sync = () => on.checked = !!D()[k];
    colour(GLABEL[k] || k, () => D()[k], v => { last = v; if (on.checked) D()[k] = v; }, on); }
  { const sk = el('select', {}, el('option', { value: '', textContent: 'none' }), el('option', { value: 'short', textContent: 'short' }), el('option', { value: 'long', textContent: 'long' })); sk.value = D().skirt || ''; sk.onchange = () => { D().skirt = sk.value || null; schedule(); };
    panel.append(el('div', { className: 'crow' }, el('label', { textContent: 'skirt' }), sk, el('span'))); inputs.skirt = () => sk.value = D().skirt || ''; }
  h2('Cloak and apron'); { const hd = el('select', {}, ...['none', 'down', 'up'].map(v => el('option', { value: v, textContent: 'hood ' + v }))); hd.value = D().hood || 'none'; hd.onchange = () => { D().hood = hd.value === 'none' ? null : hd.value; schedule(); };
    const bib = el('input', { type: 'checkbox', checked: !!D().bib, onchange: () => { D().bib = bib.checked; schedule(); } }), lea = el('input', { type: 'checkbox', checked: !!D().apronLeather, onchange: () => { D().apronLeather = lea.checked; schedule(); } });
    panel.append(el('div', { className: 'bar' }, hd, el('label', {}, bib, ' bib'), el('label', {}, lea, ' leather apron')));
    inputs.cloakFlags = () => { hd.value = D().hood || 'none'; bib.checked = !!D().bib; lea.checked = !!D().apronLeather; }; }
  slider('cloak length', () => D().cloakLen ?? .8, v => D().cloakLen = v, 0, 1, 'cloakLen');
  h2('View'); panel.append(el('div', { className: 'bar' }, ...['full', 'head', 'face', 'side', 'back'].map(v => el('button', { textContent: v, onclick: () => { view = v; turn = 0; zoom = 1; frame(); dirty = true; } }))));
  h2('Genome'); const ta = el('textarea', { spellcheck: false }); B.text = ta; panel.append(ta);
  const file = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: async () => { const f = file.files[0]; if (f) loadText(await f.text()); } });
  panel.append(el('div', { className: 'bar' },
    el('button', { textContent: 'Save .json', onclick: () => { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(toSaved(G), null, 1)], { type: 'application/json' })), download: `genome-${G.seed}.json` }); a.click(); } }),
    el('button', { textContent: 'Load .json', onclick: () => file.click() }), el('button', { textContent: 'Apply text', onclick: () => loadText(ta.value) }),
    el('button', { textContent: 'Copy link', onclick: () => { const u = location.href.split('?')[0] + '?g=' + b64.enc(toSaved(G)); navigator.clipboard?.writeText(u); history.replaceState(null, '', u); } }), file));
  B.stat = el('div', { style: 'color:#8f8676;margin-top:6px' }); panel.append(B.stat);
}
function loadText(t) { try { G = fromSaved(JSON.parse(t)); syncAll(); rebuild(); } catch (e) { B.stat.textContent = 'Not a genome: ' + e.message; } }
B.load = loadText;
function syncAll() { for (const f of Object.values(inputs)) f(); }
function syncText() { if (B.text) B.text.value = JSON.stringify(toSaved(G)); if (B.stat) B.stat.textContent = `${STATS.bytes} bytes · ${STATS.tris.toLocaleString()} triangles · built in ${STATS.ms} ms · hair: ${STATS.hair?.style}, ${STATS.hair?.strands} strands`; }
let timer = 0; function schedule() { clearTimeout(timer); timer = setTimeout(rebuild, 180); }

// ── input: drag to turn, wheel to zoom ──
let drag = null; R.domElement.addEventListener('pointerdown', e => drag = [e.clientX, turn]); addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!drag) return; turn = drag[1] + (e.clientX - drag[0]) * .01; frame(); dirty = true; });
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
  const keys = Object.keys(PEOPLES), out = [], n = keys.length * 3, gap = .62; let i = 0;
  for (const k of keys) for (let j = 0; j < 3; j++) { const G1 = rollGenome(`${Q.get('seed') || 'line'}:${k}:${j}`, { people: k, g: j === 0 ? 1 : j === 1 ? 0 : undefined }), p = makePerson(G1);
    p.root.position.x = (i++ - (n - 1) / 2) * gap + (keys.indexOf(k) - 1.5) * .35; p.root.rotation.y = (j - 1) * .12; scene.add(p.root); const bb = new THREE.Box3().expandByObject(p.meshes[0], true); out.push({ people: k, g: G1.g, h: +(bb.max.y - bb.min.y).toFixed(3) }); }
  cam.fov = 24; cam.aspect = W / H; cam.position.set(0, 1.2, ((n - 1) / 2 * gap + .75) / (Math.tan(12 * Math.PI / 180) * W / H)); cam.lookAt(0, .95, 0); cam.updateProjectionMatrix(); STATS.peoples = out;
}
loadPack().then(() => { if (Q.has('peoples')) { peoplesSheet(); comp.render(); window.__done = true; return; }
  if (Q.has('sheet')) { sheet(); comp.render(); window.__done = true; return; }
  if (Q.get('dress')) Object.assign(G.dress, JSON.parse(Q.get('dress')));
  if (Q.get('style')) G.hair = { ...(G.hair || {}), style: Q.get('style') }; if (Q.get('len')) G.hair = { ...(G.hair || {}), len: +Q.get('len') };
  if (!STILL) buildPanel(); rebuild(); comp.render(); window.__done = true;
  if (!STILL) R.setAnimationLoop(() => { if (dirty) { comp.render(); dirty = false; } }); })
  .catch(e => { window.__err = String(e); console.error(e); });
