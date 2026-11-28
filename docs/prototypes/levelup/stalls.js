// Market stalls by island (Session 2754, card F6; a prototype for a DECISION). pieces.js's markStall and aurenneStall beside the game's
// one stall of today (82's stallGeoHi, copied here in the kit's materials: four poles, a fly of eight strips in its cloth and cream, the
// scalloped edge, a trestle counter with three lots of goods), each with the 1.8 m post and, when the people's pack is there, a keeper.
// ?view=row (default): today | the Mark | Aurenne, from the square at 9 m. ?view=mark: the Mark's three (furs, stockfish, wool) on its
// cold stone under the northern sun, two halls behind. ?view=aurenne: Aurenne's three (spice, pots, cloth) on its limestone, two houses
// behind. &close: at eye height 3.5 m from the middle stall. __stats.stalls: each stall's tris, draws and top.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { markStall, aurenneStall, markHall, markLot, aurenneHouse, aurenneLot, stream, aurenneTextures, markTextures } from './pieces.js';
import { loadPack, makePerson, rollGenome } from './people.js';

const R = makeRenderer(.84), scene = new THREE.Scene(), VIEW = Q.get('view') || 'row', CLOSE = Q.has('close'), MARK = VIEW === 'mark';
scene.fog = new THREE.FogExp2(MARK ? new THREE.Color(.72, .78, .86) : new THREE.Color(.82, .85, .9), .004);
const cam = new THREE.PerspectiveCamera(50, W / H, .1, 30000); buildTextures(); aurenneTextures(); markTextures();
const SUN = MARK ? new THREE.Vector3(.7, .32, .45).normalize() : new THREE.Vector3(.5, .62, .5).normalize();
const sun = new THREE.DirectionalLight(MARK ? new THREE.Color(1, .88, .74) : new THREE.Color(1, .9, .76), MARK ? 3.4 : 3.9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.42, .37, .3), 1.25));
skyDome(scene, SUN, MARK ? { hor: [.76, .82, .9], mid: [.42, .56, .78], zen: [.16, .28, .55] } : { hor: [.8, .85, .92], mid: [.36, .58, .88] }); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 280 });
{ const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); worldUV(g, VIEW === 'aurenne' ? .55 : .4);
  const m = VIEW === 'aurenne' ? mat('limestone', { ns: 1.1, rough: .8 }) : MARK ? mat('stone', { ns: 1.2, color: 0xa8aaa2 }) : mat('stone', { ns: 1.2, color: 0x8c8880 });
  const gm = new THREE.Mesh(g, m); gm.receiveShadow = true; scene.add(gm); }

// the game's stall of today (82's stallGeoHi in plain shapes): poles, the striped fly and its scallops, the counter and three lots of goods
function todayStall(r) {
  const g = new THREE.Group(), std = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 }), cloth = [0x9a3a2a, 0x2a5a8a, 0x8a7a2a, 0x4a7a3a, 0x7a3a6a][Math.floor(r() * 5)], M = { pole: std(0x5a3d1e), cl: std(cloth), wh: std(0xe8e0c8), top: std(0x7a5a36), body: std(0x6a4a2a) };
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); };
  for (const [x, z] of [[-1.4, -.9], [1.4, -.9], [-1.4, .9], [1.4, .9]]) add(new THREE.BoxGeometry(.12, z < 0 ? 2.5 : 2.1, .12), M.pole, x, z < 0 ? 1.25 : 1.05, z);
  for (let k = 0; k < 8; k++) { add(new THREE.BoxGeometry(.42, .04, 2.5), k % 2 ? M.wh : M.cl, -1.47 + k * .42, 2.36, 0, -.16); add(new THREE.ConeGeometry(.21, .22, 3), k % 2 ? M.wh : M.cl, -1.47 + k * .42, 2.05, 1.23, Math.PI, Math.PI / 6); }
  add(new THREE.BoxGeometry(3.0, .08, 1.0), M.top, 0, .92, .5); add(new THREE.BoxGeometry(2.9, .84, .9), M.body, 0, .46, .5);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(.5, .2, .38), std([0xc8a040, 0x8a3a2a, 0x5a8a3a, 0xd8d0b0, 0x6a4a8a][Math.floor(r() * 5)]), -1 + i, 1.06, .5);
  let tris = 0; g.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return { group: g, tris: Math.round(tris), draws: 5 /* the game merges it to one mesh on VC_MAT: one draw */, top: 2.5, w: 3.2, d: 2.5, goods: 'mixed' };
}
const post = (x, z) => { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }), p = new THREE.Group(); p.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) p.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); p.position.set(x, 0, z); scene.add(p); };
const STAT = STATS.stalls = [], people = [];
const put = (S, label, x, z, ry, who) => { S.group.position.set(x, 0, z); S.group.rotation.y = ry; scene.add(S.group); STAT.push({ label, goods: S.goods, tris: S.tris, draws: S.draws, top: +S.top.toFixed(2) });
  people.push([x - Math.sin(ry) * .3, z - Math.cos(ry) * ((S.d || 2) / 2 - .45), ry, who.key, who.people]); };
let row;
if (VIEW === 'mark') row = ['furs', 'fish', 'wool'].map((g, i) => [markStall({ goods: g }, stream('stalls:mark:' + i)), 'the Mark, ' + g, { key: 'mstall:' + i, people: 'markman' }]);
else if (VIEW === 'aurenne') row = ['spice', 'pots', 'cloth'].map((g, i) => [aurenneStall({ goods: g }, stream('stalls:aur:' + i)), 'Aurenne, ' + g, { key: 'astall:' + i, people: 'aurennais' }]);
else row = [[todayStall(stream('stalls:today')), 'today, every island', { key: 'tstall', people: 'gatelander' }], [markStall({ goods: 'furs' }, stream('stalls:mark:0')), 'the Mark', { key: 'mstall:0', people: 'markman' }], [aurenneStall({ goods: 'spice' }, stream('stalls:aur:0')), 'Aurenne', { key: 'astall:0', people: 'aurennais' }]];
row.forEach(([S, label, who], i) => put(S, label, (i - 1) * 4.6, 0, 0, who));
post(-6.6, 2.2);
// the place behind: the island's own houses, set back across the square
if (MARK) [0, 1].forEach(i => { const L = markLot('stalls-mark', i), h = markHall(L.o, L.r); h.group.position.set(-6 + i * 13, 0, -14 - L.o.d / 2); scene.add(h.group); });
if (VIEW === 'aurenne') [0, 1, 2].forEach(i => { const L = aurenneLot('stalls-aur', i), h = aurenneHouse(L.o, L.r); h.group.position.set(-9 + i * 10, 0, -12 - L.o.d / 2); scene.add(h.group); });
if (CLOSE) { cam.position.set(1.2, 1.65, 4.2); cam.lookAt(0, 1.3, 0); } else { cam.fov = 40; cam.updateProjectionMatrix(); cam.position.set(1.5, 2.6, 10.5); cam.lookAt(0, 1.5, 0); }
sun.position.copy(SUN).multiplyScalar(80); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .1, sat: MARK ? .96 : 1.02, vig: .3, warm: [1.02, 1, .96], cool: [.94, .98, 1.06] });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  for (const [x, z, ry, s, pp] of people) { const p = makePerson(rollGenome(s, { people: pp })); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root); }
}).catch(() => {}).finally(() => run(comp, cam));
