// The schools' magical implements (the concept artist, 16 Oct 2026; backlog L7, OG-094): implements.js's kit laid out in a walled
// court under an afternoon sun, beside the 1.8 m post and people of the four peoples' kit.
// ?view=schools (default): the high tier, six tables in a row, Tine to Gaoth, each with its school's runner and mark; on each the hand
//   piece (a wand, the maul or the dagger), the focus and the tome, and the staff standing in a stone socket behind. &cam=wide (default)
//   or &cam=<school> for one table close.
// ?view=heads: the six school staffs side by side, their heads at eye height.
// ?view=islands: the common tier, a rack an island (the Gatelands, the Mark, Aurenne), each holding the six schools' staffs in that
//   island's make, a person of that island beside it holding one.
// ?view=hand&tier=island|school: a Gatelander, a Markman and an Aurennais each holding a staff in the fist (people.js's spear grip,
//   the spear swapped for the staff): the island make, or the school staff of the great gate on their island (Uisce, Cloch, Solas).
// &nopeople leaves the people out. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { SCHOOLS, implement, islandStaff, M } from './implements.js';

const R = makeRenderer(.82), scene = new THREE.Scene(), VIEW = Q.get('view') || 'schools', CAM = Q.get('cam') || 'wide', TIER = Q.get('tier') || 'island';
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .8, .84), .006);
const cam = new THREE.PerspectiveCamera(50, W / H, .02, 30000); buildTextures();
const SUN = new THREE.Vector3(-.45, .62, .64).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.36, .32, .26), 1.15));
skyDome(scene, SUN); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 300 });
{ const g = new THREE.PlaneGeometry(60, 30); g.rotateX(-Math.PI / 2); worldUV(g, .8); const m = new THREE.Mesh(g, mat('stone', { ns: .8, color: 0xf4e8d2, rough: .9 })); m.receiveShadow = true; scene.add(m); }
{ const g = new THREE.BoxGeometry(24, 2.8, .5); worldUV(g, .4); const m = new THREE.Mesh(g, mat('ashlar', { ns: 1, color: 0xfff4e0, rough: .9 })); m.position.set(0, 1.4, -2.2); m.castShadow = m.receiveShadow = true; scene.add(m);
  const c = new THREE.BoxGeometry(24.2, .16, .62); worldUV(c, .4); const cm = new THREE.Mesh(c, m.material); cm.position.set(0, 2.88, -2.2); cm.castShadow = true; scene.add(cm); }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const ORDER = ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth'], ITEMS = STATS.items = [], people = [];
const note = (o, extra) => ITEMS.push({ ...extra, school: o.school, kind: o.kind, island: o.island, tris: o.tris, draws: o.draws, size: o.size });
// put a built piece so its footprint's middle is at (x, z) and its foot on y; rot = [rx, ry, rz] about its own frame
function place(o, x, y, z, rot = [0, 0, 0], spin = 0) { const inner = new THREE.Group(), outer = new THREE.Group(); inner.add(o.group); inner.rotation.y = spin; outer.add(inner); outer.rotation.set(...rot, 'YXZ'); scene.add(outer); outer.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(outer), c = b.getCenter(new THREE.Vector3()); outer.position.set(x - c.x, y - b.min.y, z - c.z); return outer; }
// a trestle table, 1.2 × 0.6 m, its top at 0.76 m, and the school's runner over it with the mark on the hanging end
const TOP = .76;
function table(x0, s) { const wood = mat('wood', { ns: 1, color: 0xb08a66, rough: .8 }), g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, .05, .6), wood); top.position.y = TOP - .025; g.add(top);
  for (const sx of [-.48, .48]) { for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, TOP - .05, .05), wood); l.position.set(sx, (TOP - .05) / 2, sz * .2); l.rotation.x = sz * .12; g.add(l); }
    const f = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .55), wood); f.position.set(sx, .025, 0); g.add(f); }
  const st = new THREE.Mesh(new THREE.BoxGeometry(.96, .05, .04), wood); st.position.set(0, .2, 0); g.add(st);
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.geometry = worldUV(o.geometry.toNonIndexed(), 2); } });
  const run = new THREE.Mesh(new THREE.PlaneGeometry(.34, .64).rotateX(-Math.PI / 2), M('cloth:' + s)); run.position.set(0, TOP + .0015, -.02); run.receiveShadow = true; g.add(run);
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(.34, .22), M('cloth:' + s)); flap.position.set(0, TOP - .11, .301); g.add(flap);
  const mk = new THREE.Mesh(new THREE.PlaneGeometry(.17, .17), M('mark:' + s)); mk.position.set(0, TOP - .1, .303); g.add(mk);
  g.position.x = x0; scene.add(g); }
function socket(x, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(.18, .12, .18), mat('ashlar', { ns: 1, color: 0xb8b0a0 })); worldUV(m.geometry, 3); m.position.set(x, .06, z); m.castShadow = m.receiveShadow = true; scene.add(m); return .1; }
function staffAt(o, x, z, y = 0) { o.group.position.set(x, y, z); scene.add(o.group); }
function sunBox(cx, cz, half) { sun.position.copy(SUN).multiplyScalar(30).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 80 }); sun.shadow.camera.updateProjectionMatrix(); }

const DX = 1.6, X = i => (i - 2.5) * DX;
if (VIEW === 'schools') {
  ORDER.forEach((s, i) => { const x0 = X(i); table(x0, s);
    const h = implement(s, 'hand'), f = implement(s, 'focus'), t = implement(s, 'tome'), st = implement(s, 'staff');
    place(h, x0 - .2, TOP, .13, [0, 0, Math.PI / 2], s === 'cloch' ? Math.PI / 2 : 0); place(f, x0 + .14, TOP, -.15, [0, s === 'scath' ? .5 : s === 'gaoth' ? -.6 : s === 'solas' ? .9 : 0, 0]); place(t, x0 + .36, TOP, .12, [0, -.25, 0]);
    const sy = socket(x0 + .3, -.5); staffAt(st, x0 + .3, -.5, sy); [h, f, t, st].forEach(o => note(o)); });
  post.position.set(X(0) - .78, 0, .1);
  const k = ORDER.indexOf(CAM); if (k >= 0) { cam.position.set(X(k) + .16, 1.42, 1.5); cam.lookAt(X(k) + .1, 1.14, -.2); } else { cam.fov = 42; cam.position.set(0, 1.5, 6.9); cam.lookAt(0, 1.08, -.3); }
  sunBox(0, 0, 7);
} else if (VIEW === 'heads') {
  const set = Q.get('set') === 'island' ? ['tine', 'uisce'].flatMap(s => ['gatelands', 'mark', 'aurenne'].map(i => islandStaff(i, s))) : ORDER.map(s => implement(s, 'staff'));
  set.forEach((st, i) => { staffAt(st, (i - 2.5) * .3, -.1); note(st); }); post.position.set(-1.1, 0, -.1);
  cam.fov = 38; cam.position.set(.05, 1.72, 1.55); cam.lookAt(0, 1.6, -.1); sunBox(0, 0, 3);
} else if (VIEW === 'islands') {
  const who = { gatelands: ['gatelander', 'uisce'], mark: ['markman', 'cloch'], aurenne: ['aurennais', 'solas'] };
  ['gatelands', 'mark', 'aurenne'].forEach((isl, r) => { const x0 = (r - 1) * 2.85, wood = mat('wood', { ns: 1, color: 0x9a7a5a, rough: .85 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, .06, .3), wood), rail = new THREE.Mesh(new THREE.BoxGeometry(2.1, .06, .05), wood); base.position.set(x0, .03, -.1); rail.position.set(x0, 1.22, -.14); scene.add(base, rail);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.25, .06), wood); p.position.set(x0 + s * 1.02, .625, -.14); scene.add(p); }
    [base, rail, ...scene.children.slice(-2)].forEach(o => { o.castShadow = o.receiveShadow = true; worldUV(o.geometry, 2); });
    ORDER.forEach((s, k) => { const st = islandStaff(isl, s); staffAt(st, x0 + (k - 2.5) * .32, -.1, .06); note(st); });
    people.push([x0 + 1.3, .35, .25, who[isl][0], 'rack:' + isl, islandStaff(isl, who[isl][1]), r === 1 ? 0 : 1]); });
  post.position.set(-4.0, 0, .1); cam.fov = 46; cam.position.set(.15, 1.42, 6.1); cam.lookAt(.15, 1.12, -.1); sunBox(0, 0, 6);
} else {
  const set = TIER === 'school' ? [['gatelander', implement('uisce', 'staff')], ['markman', implement('cloch', 'staff')], ['aurennais', implement('solas', 'staff')]] : [['gatelander', islandStaff('gatelands', 'uisce')], ['markman', islandStaff('mark', 'cloch')], ['aurennais', islandStaff('aurenne', 'solas')]];
  set.forEach(([p, st], i) => { people.push([(i - 1) * 1.15, 0, 0, p, 'hand:' + p, st, i ? 1 : 0]); note(st, { held: p }); });
  post.position.set(-1.85, 0, .2); cam.fov = 38; cam.position.set(0, 1.45, 4.6); cam.lookAt(0, 1.12, 0); sunBox(0, 0, 3.5);
}
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.view = VIEW; STATS.tris = ITEMS.reduce((a, o) => a + o.tris, 0);
const comp = makeComposer(R, scene, cam, { bloom: .28, bloomT: .88, sat: 1.04, vig: .28 });
// people: the spear grip of people.js closes the right fist on a 2.6 cm shaft; the spear is taken out of it and the staff put in its
// place, in the spear's own frame (its butt on the ground, up the shaft)
(Q.has('nopeople') || !people.length ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, kind, seed, st, g = 0] of people) { const G = rollGenome(seed, { people: kind, g }); G.dress = { ...G.dress, shield: false, cloak: false }; if (st) G.dress.spear = [.4, .3, .2];
    const p = makePerson(G); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root);
    let butt = null; if (st) { const sp = p.root.getObjectByName('spear'); if (sp) { for (const c of [...sp.children]) sp.remove(c); sp.add(st.group); p.root.updateMatrixWorld(true); butt = sp.getWorldPosition(new THREE.Vector3()).y; st.group.position.y = -butt; } }
    p.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    STATS.people.push({ kind, height: +statureOf(G).toFixed(3), held: st ? st.school + (st.island ? '/' + st.island : '') : null, staffTop: st ? +new THREE.Box3().setFromObject(st.group).max.y.toFixed(3) : null, butt: butt === null ? null : +butt.toFixed(3), grip: p.spear ? { fist: p.spear.fist, gap: p.spear.gap } : null }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => run(comp, cam));
