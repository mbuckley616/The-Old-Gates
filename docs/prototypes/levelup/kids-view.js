// Children at play, by island (the concept artist, 11 Nov 2026; backlog L9, OG-116): kids.js's games on each island's ground in front of
// two of its own houses (pieces.js), on a summer afternoon, the 1.8 m post among them.
// ?island=gatelands|mark|aurenne, &cam=wide (default) | close | scale | high | boat (the Mark's pool), &view=play (default) | toys (the ten toys laid on boards),
// &cam=x,y,z,tx,ty,tz anywhere; &nopeople leaves the children out.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed, rnd } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { GL_PLANS, gatelandsBuilding, markHall, markLot, aurenneHouse, aurenneLot, aurenneTextures, markTextures } from './pieces.js';
import { shrineTextures } from './shrines.js';
import { TOYS, GAMES, build, measure, play } from './kids.js';

const ISL = ['gatelands', 'mark', 'aurenne'].includes(Q.get('island')) ? Q.get('island') : 'gatelands', VIEW = Q.get('view') || 'play', CAM = Q.get('cam') || 'wide';
const R = makeRenderer(.84), scene = new THREE.Scene();
const AIR = { gatelands: [.78, .82, .86, .006], mark: [.76, .8, .88, .005], aurenne: [.86, .84, .8, .004] }[ISL];
scene.fog = new THREE.FogExp2(new THREE.Color(AIR[0], AIR[1], AIR[2]), AIR[3]);
const cam = new THREE.PerspectiveCamera(40, W / H, .02, 30000); buildTextures(); markTextures(); aurenneTextures(); shrineTextures(); reseed(11);
const SUN = new THREE.Vector3(-.5, ISL === 'mark' ? .5 : .6, .62).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .91, .78), ISL === 'aurenne' ? 3.4 : 3.0); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.36, .32, .26), 1.15));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(40).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix(); };
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const grassM = mat('grass', { ns: 1, rough: 1 }), turfM = mat('grass', { ns: 1.2, color: 0xc8b898, rough: 1 }), flag = mat('flag', { ns: .8, color: 0xf0e2c8, rough: .85 }), earth = mat('grass', { ns: .8, color: 0xd8b890, rough: 1 }), boards = mat('wood', { ns: .6, color: 0xe8d0b0, rough: .8 });
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const trees = [], kids = [];
const tint = ISL === 'mark' ? new THREE.Color(.62, .76, .5) : ISL === 'aurenne' ? new THREE.Color(.85, .92, .66) : new THREE.Color(.95, 1, .7);

if (VIEW === 'toys') {
  ground(400, 400, ISL === 'aurenne' ? earth : grassM, 0, 0, -.005); ground(2.6, 1.7, boards, 0, 0, .001, .6); STATS.toys = [];
  const L = [['hoop', -.9, -.45], ['stick', -.95, .35], ['ball', -.35, -.4], ['doll', -.35, .1], ['sword', .1, -.45], ['shield', .1, .25], ['boat', .55, -.45], ['bones', .62, .02], ['horse', .62, .42], ['kite', 1.0, -.1]];
  for (const [k, x, z] of L) { const m = measure(k), g = build(k).g; STATS.toys.push(m);
    if (k === 'hoop') { g.rotation.x = -Math.PI / 2; g.position.set(x, .012, z); } else if (k === 'stick') { g.rotation.set(-Math.PI / 2, 0, -1.3); g.position.set(x - .3, .01, z); }
    else if (k === 'ball') g.position.set(x, .08, z); else if (k === 'doll') { g.rotation.set(-Math.PI / 2 + .1, 0, .3); g.position.set(x, .05, z); }
    else if (k === 'sword') { g.rotation.set(-Math.PI / 2, 0, -1.2); g.position.set(x, .015, z); } else if (k === 'shield') { g.rotation.x = -Math.PI / 2; g.position.set(x, .03, z); }
    else if (k === 'boat') { g.position.set(x, .045, z); g.rotation.y = .5; } else if (k === 'bones') g.position.set(x, 0, z); else if (k === 'horse') { g.position.set(x, 0, z); g.rotation.y = -.7; }
    else { g.rotation.set(-Math.PI / 2, 0, .4); g.position.set(x + .1, .02, z); g.scale.setScalar(.6); }
    g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); }
  post.position.set(1.55, 0, -.75); for (let i = 0; i < 10; i++) trees.push([-30 + i * 6.5, 0, -14 - (i % 3) * 5, .8, i, tint]);
  cam.fov = 38; if (CAM === 'close') lookAt([-.4, 1.0, 1.1], [-.3, .05, -.15]); else lookAt([0, 2.0, 2.1], [.1, .0, -.1]); sunBox(0, 0, 4);
} else {
  // the ground and the houses: the Gatelands' green before two limewashed cottages, the Mark's turf before two halls (a pool in it),
  // Aurenne's paved square before two white houses (the dry earth beyond)
  if (ISL === 'aurenne') { ground(400, 400, earth, 0, 0, -.005); ground(20, 13, flag, 0, -1.5, .001, .7); } else ground(400, 400, ISL === 'mark' ? turfM : grassM, 0, 0, -.005);
  const HOUSE = [[-7.5, -12.5], [7, -14]]; STATS.houses = [];
  HOUSE.forEach(([x, z], i) => { let g, tris;
    if (ISL === 'gatelands') { g = gatelandsBuilding(GL_PLANS.cottage({ paint: ['red', 'blue'][i] })); tris = g.userData.tris; }
    else if (ISL === 'mark') { const lot = markLot('kids:mark', i, { note: [1] }); const h = markHall(lot.o, lot.r); g = h.group; tris = h.tris; }
    else { const lot = aurenneLot('kids:aurenne', i); const h = aurenneHouse(lot.o, lot.r); g = h.group; tris = h.tris; }
    g.position.set(x, 0, z); g.rotation.y = ISL === 'mark' ? Math.PI / 2 + (i ? .2 : -.2) : (i ? -.15 : .15); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); STATS.houses.push(tris); });
  if (ISL === 'mark') { // the pool by the boat: dark water in a ring of stones
    const pc = V3(3.6, 0, 2.2), w = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .24, .26), roughness: .08, metalness: .1 }));
    w.position.copy(pc).setY(.006); w.receiveShadow = true; scene.add(w); const sm = mat('rock', { ns: .8, color: 0x9a9a90, rough: .95 });
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + rnd() * .1, s = new THREE.Mesh(new THREE.DodecahedronGeometry(.1 + rnd() * .07, 0), sm); s.scale.y = .5; s.position.set(pc.x + Math.cos(a) * 1.16, .02, pc.z + Math.sin(a) * 1.16); s.rotation.y = rnd() * 6; s.castShadow = s.receiveShadow = true; if (Math.abs(a - .9) > .3) scene.add(s); } }
  // where each child stands and which way it faces; a pair's two face each other
  const face = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
  const SPOT = {
    gatelands: { hoop: [-4.2, .6, 1.2], throw: [.4, -1.6, 0], catch: [3.8, -1.0, 0], doll: [-1.3, 2.2, .35] },
    mark: { spar: [-1.6, .2, 0], spar2: [-.1, .55, 0], boat: [3.6 + Math.cos(.9) * 1.42, 2.2 + Math.sin(.9) * 1.42, 0] },
    aurenne: { kite: [-3.8, -.6, Math.PI - .55], bones: [.6, -.3, 0], bones2: [1.25, .45, 0], horse: [3.9, 1.6, -1.15] } }[ISL];
  if (ISL === 'gatelands') { SPOT.throw[2] = face(SPOT.throw, SPOT.catch); SPOT.catch[2] = face(SPOT.catch, SPOT.throw); }
  if (ISL === 'mark') { SPOT.boat[2] = face(SPOT.boat, [3.6, 2.2]); SPOT.spar[2] = face(SPOT.spar, SPOT.spar2); SPOT.spar2[2] = face(SPOT.spar2, SPOT.spar); }
  if (ISL === 'aurenne') { SPOT.bones[2] = face(SPOT.bones, SPOT.bones2); SPOT.bones2[2] = face(SPOT.bones2, SPOT.bones); }
  for (const g of GAMES[ISL]) kids.push([g, ...SPOT[g]]);
  post.position.set(ISL === 'mark' ? 1.4 : -2.6, 0, ISL === 'mark' ? 2.4 : -2.4);
  for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -24 - (i % 3) * 7; if (Math.abs(x) > 3) trees.push([x, 0, z, ISL === 'mark' ? .95 : ISL === 'aurenne' ? .6 + (i % 3) * .08 : .8 + (i % 4) * .08, i, tint, ISL === 'mark' ? 1 : ISL === 'aurenne' ? 0 : undefined]); }
  const CAMS = {
    wide: { gatelands: [[0, 1.55, 9.4], [0, .8, 0]], mark: [[.6, 1.5, 8.6], [.9, .7, .8]], aurenne: [[.4, 1.9, 9.6], [0, 1.6, -.5]] },
    close: { gatelands: [[-2.2, 1.15, 4.6], [-3.8, .75, 1.2]], mark: [[-.6, 1.25, 3.6], [-.85, .85, .35]], aurenne: [[-.6, 1.05, 1.5], [.92, .35, .05]], boat: [[1.7, 1.25, 4.4], [4.15, .3, 2.95]] },
    scale: { gatelands: [[-1.2, 1.0, 4.2], [-1.9, .9, .5]], mark: [[1.9, 1.0, 5.6], [1.6, .9, 2.2]], aurenne: [[-1.6, 1.0, 3.6], [-2.6, .9, -.9]] },
    high: { gatelands: [[0, 9, 9], [0, 0, -1]], mark: [[.5, 9, 9], [.5, 0, .5]], aurenne: [[0, 9, 9], [0, 0, -.5]] } };
  if (CAM === 'scale') { const k = { gatelands: 'doll', mark: 'boat', aurenne: 'kite' }[ISL], s = SPOT[k]; post.position.set(s[0] + (ISL === 'mark' ? -.9 : .75), 0, s[1] + (ISL === 'mark' ? .9 : .2)); }
  const c = CAM === 'boat' ? CAMS.close.boat : (CAMS[CAM] || CAMS.wide)[ISL]; cam.fov = CAM === 'close' || CAM === 'boat' ? 34 : 40; lookAt(...c); sunBox(0, 0, 12);
}
function V3(x, y, z) { return new THREE.Vector3(x, y, z); }
treeKit(SUN).plant(scene, trees.map(t => [t[0], t[1], t[2], t[3], t[4], t[5], t[6]]));
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
const PEOPLE = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' }[ISL];
// a child's dress: whatever its people's roll hangs from the arms or carries is left off
const dressFor = G => ({ ...G.dress, cloak: null, hood: null, cape: false, basket: null, spear: null, shield: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null, apron: null });
const GIRL = { doll: 1, catch: 1, kite: 0, bones: 1, bones2: 0, horse: 1, spar2: 1, hoop: 0, throw: 0, spar: 0, boat: 1 };
(VIEW !== 'toys' && !Q.has('nopeople') ? loadPack('mh/') : Promise.reject('nopeople')).then(() => { STATS.kids = [];
  for (const [game, x, z, ry] of kids) { const G = rollGenome('kids:' + ISL + ':' + game, { people: PEOPLE, child: true, g: GIRL[game] ? 0 : 1 }); G.dress = dressFor(G);
    const P = makePerson(G); scene.add(P.root); const r = play(P, game, { island: ISL }); P.root.position.x = x; P.root.position.z = z; P.root.rotation.y = ry; P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.kids.push({ game, girl: !!GIRL[game], age: +(11 + (G.age - .1875) / .3125 * 14).toFixed(1), height: +statureOf(G).toFixed(3), toys: r.toys, toyTris: r.tris, miss: r.miss, line: r.line, reach: r.reach }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e && e.stack || e); console.error(e); } }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
