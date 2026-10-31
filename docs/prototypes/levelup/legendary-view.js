// Legendary weapons by island (the concept artist, 31 Oct 2026; backlog L7, OG-075): legendary.js's fifteen in a walled court at dusk,
// beside the 1.8 m post and people of the four peoples' kit.
// ?view=rack (default) &island=gatelands|mark|aurenne: the island's rack of four, a person of that island holding the fifth (its pole).
// ?view=all: the three racks side by side, the whole set of fifteen, each island's person beside its rack.
// ?view=close &piece=<key>: one piece laid on a dark cloth, close.
// ?view=atlas: all fifteen laid on one cloth at true size, pointing away, an island a group.
// ?view=scale: a Gatelander, a Markman and an Aurennais each with their island's pole in the fist, the island's sword or axe on a stand.
// &mode=still|always|rest: A the shapes alone; B the effects always at full; C (rest) a fifth of the light on the rack, full in the hand
//   (the piece a person holds is drawn: in C it is at full). &t=<seconds> sets the clock for the motes, arcs and silk.
// &hour=dusk|day. &nopeople. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, STILL, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { ISLANDS, NAMES, legendary } from './legendary.js';

const VIEW = Q.get('view') || 'rack', ISLE = Q.get('island') || 'gatelands', MODE = Q.get('mode') || 'rest', HOUR = Q.get('hour') || 'dusk', T0 = +(Q.get('t') || 1.7);
const HELD = MODE === 'still' ? 'still' : 'always';
const R = makeRenderer(HOUR === 'dusk' ? 1.08 : .82), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(42, W / H, .02, 30000);
const SUN = HOUR === 'dusk' ? new THREE.Vector3(-.62, .16, .76).normalize() : new THREE.Vector3(-.45, .62, .64).normalize();
scene.fog = new THREE.FogExp2(HOUR === 'dusk' ? new THREE.Color(.42, .38, .4) : new THREE.Color(.78, .8, .84), .006);
const sun = new THREE.DirectionalLight(HOUR === 'dusk' ? new THREE.Color(1, .66, .42) : new THREE.Color(1, .9, .76), HOUR === 'dusk' ? 2.6 : 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(HOUR === 'dusk' ? new THREE.Color(.36, .4, .58) : new THREE.Color(.64, .72, .88), new THREE.Color(.26, .22, .2), HOUR === 'dusk' ? .95 : 1.15));
if (HOUR === 'dusk') skyDome(scene, SUN, { zen: [.07, .1, .26], mid: [.26, .28, .46], hor: [.86, .56, .4], glow: [1, .6, .34], glowK: .6, k: .9 }); else skyDome(scene, SUN);
clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300, ...(HOUR === 'dusk' ? { lo: [.36, .3, .38], hi: [1.1, .72, .52] } : {}) });
{ const g = new THREE.PlaneGeometry(60, 30); g.rotateX(-Math.PI / 2); worldUV(g, .8); const m = new THREE.Mesh(g, mat('stone', { ns: .8, color: 0xe8dcc6, rough: .9 })); m.receiveShadow = true; scene.add(m); }
{ const g = new THREE.BoxGeometry(24, 3.2, .5); worldUV(g, .4); const m = new THREE.Mesh(g, mat('ashlar', { ns: 1, color: 0xf0e4d0, rough: .9 })); m.position.set(0, 1.6, -1.6); m.castShadow = m.receiveShadow = true; scene.add(m); }
// the metal wants something to reflect (helms-view.js's way): a sky over warm ground and the low sun, filtered once
{ const es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], P = g.attributes.position, dusk = HOUR === 'dusk';
  for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 50, c = y > 0 ? (dusk ? new THREE.Color(.86, .58, .44).lerp(new THREE.Color(.16, .2, .42), Math.sqrt(y)) : new THREE.Color(.62, .72, .88).lerp(new THREE.Color(.3, .45, .75), y)) : new THREE.Color(.42, .36, .28).lerp(new THREE.Color(.2, .17, .13), -y); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sb = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 3.4) })); sb.position.copy(SUN).multiplyScalar(40); es.add(sb);
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(es, .02).texture; scene.environmentIntensity = .75; }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const ITEMS = STATS.items = [], LIVE = [], people = [];
// a NaN in a piece's positions blacks the whole frame through the bloom: counted here so a broken piece is named
const nans = o => { let n = 0; o.group.traverse(c => { const a = c.geometry?.attributes?.position?.array; if (a) for (const v of a) if (!Number.isFinite(v)) n++; }); return n; };
const note = o => { ITEMS.push({ nan: nans(o), key: o.key, island: o.island, mode: o.mode, tris: o.tris, draws: o.draws, motes: o.motes, size: o.size, len: o.len }); LIVE.push(o); return o; };
function sunBox(cx, cz, half) { sun.position.copy(SUN).multiplyScalar(30).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 80 }); sun.shadow.camera.updateProjectionMatrix(); }
const POLES = { gatelands: 'wardspear', mark: 'harpoon', aurenne: 'tideglaive' }, WHO = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' };
// stand a piece upright on y0 at (x, z): a sword hilt up, everything else on its butt; the piece turned to show its face to +z
function stand(o, x, z, y0 = 0, lean = 0) { const outer = new THREE.Group(); outer.add(o.group); if (o.kind === 'sword') o.group.rotation.z = Math.PI;
  outer.rotation.z = lean; scene.add(outer); outer.updateMatrixWorld(true); const b = new THREE.Box3(); o.group.traverse(c => { if (c.isMesh) b.expandByObject(c); });
  outer.position.set(x - (b.min.x + b.max.x) / 2, y0 - b.min.y, z); return outer; }
// an oak rack 2.3 m long: a base with sockets, two posts, a rail at 1.05 m with pegs
function rack(x0, w = 2.3) { const wood = mat('wood', { ns: 1, color: 0x8a6a4a, rough: .85 }), parts = [[w, .08, .34, 0, .04, 0], [w, .07, .07, 0, 1.05, -.1], [w, .05, .05, 0, .55, -.12]];
  for (const s of [-1, 1]) parts.push([.08, 1.12, .08, s * (w / 2 - .04), .56, -.1]);
  for (const [a, b, c, x, y, z] of parts) { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), wood); worldUV(m.geometry.toNonIndexed ? m.geometry : m.geometry, 2); m.position.set(x0 + x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); }
  return .08; }

const DX = 2.9;
function islandRack(isl, x0, withPerson = true) { const ks = ISLANDS[isl].filter(k => !withPerson || k !== POLES[isl]), y0 = rack(x0);
  ks.forEach((k, i) => { const o = note(legendary(k, { mode: MODE, t: T0 })); stand(o, x0 + (i - (ks.length - 1) / 2) * .5, 0, y0); });
  if (withPerson) { const o = note(legendary(POLES[isl], { mode: HELD, t: T0 })); people.push({ x: x0 + 1.55, z: .45, ry: -.35, kind: WHO[isl], seed: 'leg:' + isl, held: o, g: isl === 'mark' ? 0 : 1 }); } }

if (VIEW === 'rack') { islandRack(ISLE, 0); post.position.set(-1.45, 0, .2); cam.fov = 36; cam.position.set(.3, 1.4, 4.5); cam.lookAt(.25, 1.14, -.1); sunBox(0, 0, 4); }
else if (VIEW === 'all') { ['gatelands', 'mark', 'aurenne'].forEach((isl, r) => islandRack(isl, (r - 1) * (DX + .6) - .55)); post.position.set(-5.4, 0, .2); cam.fov = 50; cam.position.set(0, 1.5, 7.8); cam.lookAt(0, 1.0, -.1); sunBox(0, 0, 8); }
else if (VIEW === 'close') {
  const key = Q.get('piece') || 'kingsword', o = note(legendary(key, { mode: MODE === 'rest' ? 'always' : MODE, t: T0 }));
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, .9), new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .07, .08), roughness: .95 })); cloth.position.set(0, .88, 0); cloth.castShadow = cloth.receiveShadow = true; scene.add(cloth);
  const g = new THREE.Group(); g.add(o.group); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0))).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), .12)); scene.add(g); g.updateMatrixWorld(true);
  const b = new THREE.Box3(); o.group.traverse(c => { if (c.isMesh) b.expandByObject(c); }); const c = b.getCenter(new THREE.Vector3());
  g.position.set(-c.x, .9 - b.min.y + .002, -c.z); g.updateMatrixWorld(true);
  // a pole is seen by its head: the top 0.75 m; anything else whole
  let fx = 0, span = Math.max(b.max.x - b.min.x, .5); if (o.kind === 'pole') { span = .8; fx = (b.max.x - b.min.x) / 2 - .38; }
  const d = span * .62 / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * W / H); cam.position.set(fx, .9 + d * .9, d * .44); cam.lookAt(fx, .9, 0); post.visible = false; sunBox(fx, 0, 2);
  const lamp = new THREE.DirectionalLight(new THREE.Color(1, .92, .82), 1.2); lamp.position.set(fx - 1, 4, 2); lamp.target.position.set(fx, .9, 0); scene.add(lamp, lamp.target);
} else if (VIEW === 'atlas') {
  // all fifteen laid on one cloth at their true size, butts and pommels on a line, pointing away; an island a group
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(4.8, .04, 2.9), new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .07, .08), roughness: .95 })); cloth.position.set(0, .88, -.3); cloth.castShadow = cloth.receiveShadow = true; scene.add(cloth);
  const flat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0)));
  const laid = []; ['gatelands', 'mark', 'aurenne'].forEach((isl, r) => ISLANDS[isl].forEach((k, n) => { const o = note(legendary(k, { mode: MODE === 'rest' ? 'always' : MODE, t: T0 })), g = new THREE.Group(); g.add(o.group); g.quaternion.copy(flat); scene.add(g); g.updateMatrixWorld(true);
    const b = new THREE.Box3(); o.group.traverse(c => { if (c.isMesh) b.expandByObject(c); }); laid.push({ g, b, gap: n ? .08 : r ? .3 : 0 }); }));
  let x = -laid.reduce((a, l) => a + l.b.max.x - l.b.min.x + l.gap, 0) / 2; for (const l of laid) { x += l.gap; l.g.position.set(x - l.b.min.x, .9 - l.b.min.y + .002, 1.0 - l.b.max.z); x += l.b.max.x - l.b.min.x; }
  STATS.atlasWidth = +(2 * -laid.reduce((a, l) => a, -x)).toFixed(2);
  post.visible = false; cam.fov = 40; cam.position.set(0, 4.5, 2.15); cam.lookAt(0, .9, -.2); sunBox(0, -.3, 3.5);
  const lamp = new THREE.DirectionalLight(new THREE.Color(1, .92, .82), 1.2); lamp.position.set(-1, 4, 2.5); lamp.target.position.set(0, .9, -.3); scene.add(lamp, lamp.target);
} else {
  ['gatelands', 'mark', 'aurenne'].forEach((isl, i) => { const x = (i - 1) * 1.5, o = note(legendary(POLES[isl], { mode: HELD, t: T0 })); people.push({ x, z: 0, ry: i === 1 ? 0 : -i + 1 ? .25 : -.25, kind: WHO[isl], seed: 'leg:' + isl, held: o, g: i === 1 ? 0 : 1 });
    const side = note(legendary(ISLANDS[isl][isl === 'mark' ? 1 : 0], { mode: MODE, t: T0 })); const pl = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .3), mat('ashlar', { ns: 1, color: 0xb8b0a0 })); pl.position.set(x + .55, .03, -.1); pl.castShadow = pl.receiveShadow = true; scene.add(pl); stand(side, x + .55, -.1, .06); });
  post.position.set(-2.55, 0, .1); cam.position.set(0, 1.35, 5.2); cam.lookAt(0, 1.05, 0); sunBox(0, 0, 4);
}
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.view = VIEW; STATS.mode = MODE; STATS.tris = ITEMS.reduce((a, o) => a + o.tris, 0); STATS.draws = ITEMS.reduce((a, o) => a + o.draws, 0);
window.__scene = scene; const comp = window.__comp = makeComposer(R, scene, cam, { bloom: .42, bloomT: .82, bloomR: .5, sat: 1.06, vig: .3 });
const tick = t => { const s = STILL ? T0 : t / 1000; for (const o of LIVE) o.tick(s); };
// the spear grip of people.js closes the right fist on a 2.6 cm shaft: the spear is taken out of it and the pole put in its place
(Q.has('nopeople') || !people.length ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const P of people) { const G = rollGenome(P.seed, { people: P.kind, g: P.g }); G.dress = { ...G.dress, shield: false, cloak: false, staff: null, crossbow: null, basket: null, spear: [.4, .3, .2] };
    const p = makePerson(G); p.root.position.set(P.x, p.root.position.y, P.z); p.root.rotation.y = P.ry; scene.add(p.root);
    const sp = p.root.getObjectByName('spear'); let butt = null; if (sp) { for (const c of [...sp.children]) sp.remove(c); sp.add(P.held.group); p.root.updateMatrixWorld(true); butt = sp.getWorldPosition(new THREE.Vector3()).y; P.held.group.position.y = -butt; }
    p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push({ kind: P.kind, height: +statureOf(G).toFixed(3), held: P.held.key, top: +new THREE.Box3().setFromObject(P.held.group).max.y.toFixed(3), butt: butt === null ? null : +butt.toFixed(3) }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => run(comp, cam, { tick }));
