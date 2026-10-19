// Music and players by island (the concept artist, 19 Oct 2026; backlog L9, OG-112): musicians.js's players under an afternoon sun, with
// the 1.8 m post.
// ?view=band&island=gatelands|mark|aurenne (default): the island's five in a half-ring on its ground, two listeners. &cam=wide (default) |
//   close (the hands) | far (from 25 m) | scale (beside the post).
// ?view=solo&inst=fiddle|whistle|…: one player. &cam=front | side | close | top.
// ?view=kit: the fifteen instruments laid out on the grass by island, the post among them. &cam=wide | close.
// &cam=x,y,z,tx,ty,tz anywhere; &nopeople leaves the people out.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { shrineTextures } from './shrines.js';
import { INSTR, BANDS, build, measure, play } from './musicians.js';

const VIEW = Q.get('view') || 'band', ISL = Q.get('island') || 'gatelands', CAM = Q.get('cam') || (VIEW === 'solo' ? 'front' : 'wide'), INST = Q.get('inst') || 'fiddle';
const R = makeRenderer(.82), scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(new THREE.Color(.78, .8, .84), .007);
const cam = new THREE.PerspectiveCamera(42, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(5);
const SUN = new THREE.Vector3(-.45, .6, .66).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .008;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.36, .32, .26), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const grassM = mat('grass', { ns: 1, rough: 1 }), turfM = mat('grass', { ns: 1.2, color: 0xc8b090, rough: 1 }), flag = mat('flag', { ns: .8, color: 0xf0e2c8, rough: .85 }), boards = mat('wood', { ns: .6, color: 0xb89a78, rough: .8 });
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(30).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 90 }); sun.shadow.camera.updateProjectionMatrix(); };
const TK = treeKit(SUN), trees = [], players = [], listeners = [];
const PEOPLE = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' };
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };

if (VIEW === 'kit') {
  ground(400, 400, grassM, 0, 0, -.005); ground(3.6, 2.3, boards, 0, 0, .001, .6); STATS.kit = [];
  ['gatelands', 'mark', 'aurenne'].forEach((isl, r) => BANDS[isl].forEach((k, i) => { const m = measure(k), g = build(k).group, z = -.68 + r * .68, x = -1.36 + i * .68; STATS.kit.push({ ...m, island: isl });
    // laid flat on its back, its length across the boards (the drums on their rims, the harp and the qanun as they stand)
    if (/qanun|santur/.test(k)) { g.scale.setScalar(.7); g.position.set(x, 0, z + .12); }
    else if (k === 'harp') { g.position.set(x - .2, 0, z - .1); g.scale.setScalar(.75); }
    else if (/bodhran|framedrum|riq/.test(k)) { g.rotation.x = -Math.PI / 2 + .25; g.position.set(x, k === 'riq' ? .1 : .2, z); }
    else { g.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 + .35); g.position.set(x - .25, .03, z + .1); if (k === 'warhorn') g.rotation.set(-Math.PI / 2, 0, -1.2); }
    g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); }));
  post.position.set(1.95, 0, -.9); for (let i = 0; i < 10; i++) trees.push([-30 + i * 6.5, 0, -14 - (i % 3) * 5, .8, i, null]);
  cam.fov = 40; if (CAM === 'close') lookAt([-.7, 1.1, 1.3], [-.7, .05, -.2]); else lookAt([0, 2.3, 2.2], [0, .0, -.12]); sunBox(0, 0, 4);
} else if (VIEW === 'solo') {
  const isl = INSTR[INST].island; ground(400, 400, isl === 'mark' ? turfM : grassM, 0, 0, -.005); ground(4, 4, isl === 'aurenne' ? flag : boards, 0, 0, .001, .6);
  players.push([INST, 0, 0, 0, isl, 'solo:' + INST]); post.position.set(-1.1, 0, -.2);
  const C = { front: [[0, 1.3, 2.8], [0, 1.05, 0]], side: [[2.6, 1.3, .6], [0, 1.05, .1]], close: [[.2, 1.45, 1.2], [0, 1.2, .1]], top: [[.3, 3.2, 1.2], [0, .9, .1]], left: [[-2.4, 1.3, 1.0], [0, 1.05, .1]], tq: [[1.5, 1.35, 2.1], [0, 1.0, .1]] }[CAM] || [[0, 1.3, 2.8], [0, 1.05, 0]];
  lookAt(...C); sunBox(0, 0, 3);
} else {
  const band = BANDS[ISL], ring = 2.3; ground(400, 400, ISL === 'mark' ? turfM : grassM, 0, 0, -.005);
  if (ISL === 'aurenne') ground(9, 7, flag, 0, -.6, .001, .7); else if (ISL === 'mark') ground(8, 6, boards, 0, -.6, .001, .5);
  band.forEach((k, i) => { const a = (i - 2) * .52, x = Math.sin(a) * ring, z = -Math.cos(a) * ring + ring - 1.2; players.push([k, x, z, -a * .85, ISL, ISL + ':' + k]); });
  listeners.push([-3.1, .5, Math.atan2(3.1, -1.3), PEOPLE[ISL], 'listen1', 1], [3.4, -2.3, Math.atan2(-3.4, 1.6), PEOPLE[ISL], 'listen2', 0], [-3.6, -.6, Math.atan2(3.6, -.2), PEOPLE[ISL], 'listen3', 0]);
  post.position.set(2.75, 0, -1.1); if (CAM === 'scale') { listeners.length = 0; post.position.set(-2.6, 0, -.45); }
  for (let i = 0; i < 14; i++) { const x = -42 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -19 - (i % 3) * 7; trees.push([x, 0, z, ISL === 'mark' ? .9 : .75 + (i % 4) * .08, i, ISL === 'mark' ? new THREE.Color(.7, .78, .5) : ISL === 'aurenne' ? new THREE.Color(.8, .85, .55) : null, ISL === 'mark' ? 1 : undefined]); }
  if (CAM === 'close') { cam.fov = 34; lookAt([-.4, 1.4, 2.7], [-.55, 1.0, -.4]); } else if (CAM === 'far') { cam.fov = 36; lookAt([-5, 2.2, 24], [0, 1, -.5]); }
  else if (CAM === 'scale') { cam.fov = 40; lookAt([-3.0, 1.2, 2.7], [-2.0, .92, -.3]); } else { cam.fov = 40; lookAt([0, 1.6, 5.3], [0, .95, -.5]); }
  sunBox(0, 0, 7);
}
TK.plant(scene, trees.map(t => [t[0], t[1], t[2], t[3], t[4], t[5] || new THREE.Color(.95, 1, .7), t[6]]));
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .22, bloomT: .9, sat: 1.06, vig: .28 });
// a player's dress: what hangs from the arms or is carried is left off (the cloak is built round the arms where they hang); a seated
// player's long skirt gives way to trousers, as the people kit does in its chair
function dressFor(G, sitting) { const D = { ...G.dress, cloak: null, hood: null, cape: false, basket: null, spear: null, shield: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null };
  if (sitting && (D.skirt === 'long' || D.robe)) Object.assign(D, { skirt: null, robe: null, trousers: D.trousers || D.skirtColor || [.3, .26, .2] }); if (sitting && D.apron) D.apron = null; return D; }
const hasPeople = !Q.has('nopeople') && (players.length || listeners.length);
(hasPeople ? loadPack('mh/') : Promise.reject('nopeople')).then(() => { STATS.players = []; STATS.listeners = [];
  for (const [k, x, z, ry, isl, seed] of players) { const I = INSTR[k], G = rollGenome(seed, { people: PEOPLE[isl], g: ['harp', 'riq', 'whistle', 'lyre'].includes(k) ? 1 : 0 }); G.dress = dressFor(G, I.sit);
    const P = makePerson(G); scene.add(P.root); const r = play(P, k, { island: isl }); P.root.position.x = x; P.root.position.z = z; P.root.rotation.y = ry; P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.players.push({ inst: k, height: +statureOf(G).toFixed(3), sit: I.sit, seat: r.seat, tris: r.tris, instrument: r.instrument, missL: r.missL, missR: r.missR, pieces: r.pieces }); }
  for (const [x, z, ry, kind, seed, g] of listeners) { const G = rollGenome(seed, { people: kind, g }); G.dress = { ...G.dress, shield: false, spear: false }; const P = makePerson(G); P.root.position.set(x, P.root.position.y, z); P.root.rotation.y = ry; scene.add(P.root); P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); STATS.listeners.push(+statureOf(G).toFixed(3)); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e && e.stack || e); console.error(e); } }).finally(() => run(comp, cam));
