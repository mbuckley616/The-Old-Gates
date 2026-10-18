// The Gatelands' buildings as pieces (card F6, the concept run of 13 Oct 2026). The lane slice (street.js) built its
// cottages as one extruded outline; this is the kit the builder lifts into the game: every measure in metres from SCALE,
// a wall is a slab per face with its openings cut through it (so every window and door has a real reveal), and each
// opening, roof, chimney and trim is a piece placed on a face. A building merges by material, about a dozen draw calls.
// The vocabulary is OG-070's (whitewashed thatch, field walls, rounded arches, slate roofs in towns, harp signs) and
// OG-014's (the whitewashed thatch village): five plans from it, a cottage (gabled or hipped thatch), a farmhouse, a
// townhouse, a merchant's house with its shop, and a warehouse.
// ?view=street (&mix=a|b|c, &cam=eye|high|cottage|town): a small Gatelands town's street running out to its cottages.
// &mix=lot (Session 835): the same street's lots coloured by gatelandsLot (Michael's A on #280), &street=<seed>.
// ?view=line: the six plans in a row with a person at each door and a plaque of its sizes and triangles.
// ?view=kit: the pieces one by one on a flagged floor, each on a wall stub, beside a 1.8 m person.
// ?view=guild (Session 964): the guild hall beside the farmhouse, &cam=front|corner|back|door, &guild=mages.
// ?view=bays (Session 1063, #396 C): the cottage, the farmhouse, the townhouse and the merchant's house on every count of bays they take,
// a row each, a person at each door and a plaque with its bays and width; &cam=high (default) | cottage | farmhouse | townhouse | merchant (the row from the front).
// ?view=church (Session 1087): the town church in its yard, &tower=round (default) | square | bellcote | all (the three in a row),
// &cam=corner (default, from the south-west) | front (the south side) | west (the door) | far (from 90 m) | high.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadPack, makePerson, markGenome } from './people.js';
import { Q, W, H, STATS, rnd, fbm, sstep, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run } from './common.js';
// the kit itself is in pieces.js since Session 834; this file is its page
import { glMats as mats, glBucket as bucket, glFinish as finish, glBox as box, glFace as face, gatelandsBuilding as building, GL_PLANS as PLANS, GL_FIN as FIN, glWin as win, gatelandsLot, GL_BAYS, glBayPlan, gatelandsChurch } from './pieces.js';

const VIEW = Q.get('view') || 'street', MIX = Q.get('mix') || 'a', CAMQ = Q.get('cam') || (Q.get('view') === 'guild' ? 'front' : Q.get('view') === 'church' ? (Q.get('tower') === 'all' ? 'high' : 'corner') : 'eye'), STREET = Q.get('street') || 'gatelands-street';


// ═══════════════════════════════ the scenes ═══════════════════════════════
const R = makeRenderer(.82);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .80, .90), VIEW === 'street' ? .0024 : .0012);
const cam = new THREE.PerspectiveCamera(VIEW === 'line' ? 34 : 52, W / H, .1, 30000);
buildTextures(); const MM = mats();
const SUN = VIEW === 'street' ? new THREE.Vector3(.62, .48, .30).normalize() : new THREE.Vector3(-.45, .55, .70).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.5), focus = VIEW === 'street' ? new THREE.Vector3(0, 0, -22) : VIEW === 'bays' ? new THREE.Vector3(0, 0, -39) : new THREE.Vector3(0, 0, 0);
sun.position.copy(SUN).multiplyScalar(140).add(focus); sun.target.position.copy(focus); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 360 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.42, .36, .26), 1.2));
skyDome(scene, SUN); clouds(scene, SUN, { n: 20, d0: 1600, dw: 5000, y0: 260 });

const gy = VIEW === 'street' ? (x, z) => 26 * sstep(28, 160, Math.abs(x)) * (fbm(x / 140, z / 140, 3) + .5) + 40 * Math.exp(-((x - 40) ** 2 + (z + 330) ** 2) / (2 * 110 ** 2)) * sstep(130, 220, -z) : (x, z) => 30 * sstep(60, 260, Math.hypot(x, z)) * (fbm(x / 150, z / 150, 3) + .5);
// the ground: grass, worn to earth where it is walked
{ const g = new THREE.PlaneGeometry(1600, 1600, 320, 320); g.rotateX(-Math.PI / 2); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 200; P.setXYZ(i, x, gy(x, z) - .03, z); } g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ roughness: .95 });
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;\n' + `float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }
      float f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p = p * 2.03 + 17.1; m *= .5; } return a; }\n` + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
      float n1 = f1(vW.xz / 6.), n2 = f1(vW.xz * 1.7);
      vec3 grass = mix(vec3(.20,.36,.09), vec3(.40,.52,.15), n1) * (.85 + .3 * n2);
      vec3 earth = mix(vec3(.36,.30,.21), vec3(.46,.39,.28), n2);
      vec4 diffuseColor = vec4(mix(grass, earth, .25 * n1), opacity );`); };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh); }
const flat = (key, w, d, x, z, y = 0, s = .4) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * s, uv.getY(i) * d * s); const m = new THREE.Mesh(g, typeof key === 'string' ? mat(key, { ns: 1.4, rough: .85 }) : key); m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
const people = [], plaques = [];
const BUILT = {};
function put(g, x, z, ry, y = 0) { g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); g.updateMatrixWorld(true); const u = g.userData; BUILT[u.name] ||= { tris: u.tris, calls: u.calls, ...u.size }; return g; }
function personAt(g, dx = 0, dz = 0, ry) { if (!g.userData.door) return; const v = g.userData.door.clone().applyMatrix4(g.matrixWorld); people.push([v.x + dx, v.z + dz, ry ?? g.rotation.y + Math.PI * .85]); }
// the Gatelanders (OG-048): shorter and wiry, red hair common, moss green and madder red wool; the lane's genome, dressed for them
const GL_HAIR = [[.62, .30, .14], [.50, .26, .14], [.40, .28, .18], [.72, .44, .22], [.30, .22, .15]], GL_WOOL = [[.24, .34, .18], [.52, .16, .12], [.36, .30, .22], [.22, .26, .30], [.46, .40, .30]];
function gateGenome(r, g) { const G = markGenome(r, g, { mantle: false, hair: GL_HAIR[Math.floor(r() * GL_HAIR.length)] }); G.height = g > .5 ? .4 + r() * .22 : .3 + r() * .22; G.muscle = .45 + r() * .2; G.weight = .4 + r() * .2;
  G.dress.tunic = GL_WOOL[Math.floor(r() * GL_WOOL.length)]; if (G.dress.skirtColor) G.dress.skirtColor = GL_WOOL[Math.floor(r() * GL_WOOL.length)]; return G; }

if (VIEW === 'street') {
  // a street of a small town (9.6 m between the fronts: a 6.4 m cobbled way, flagged footpaths), running out past the last houses to cottages
  const mixA = MIX === 'a', mixB = MIX === 'b', mixC = MIX === 'c';
  const town = (c, i) => mixB ? FIN.whiteTown() : mixC ? (i % 3 === 1 ? FIN.ashlar() : FIN.stone()) : FIN.render(c);
  flat('cobble', 6.4, 120, 0, -48, .0, .6); for (const sx of [-1, 1]) flat('flag', 1.6, 120, sx * 4.0, -48, .06, .45);
  for (const sx of [-1, 1]) { const g = box(.18, .14, 120); g.translate(sx * 3.2, .02, -48); const m = new THREE.Mesh(g, MM.dress); m.receiveShadow = true; scene.add(m); }
  const L = [['townhouse', 'ochre', 'blue'], ['townhouse', 'rose', 'black'], ['merchant', 'cream', 'green'], ['townhouse', 'sage', 'red'], ['gap', 5], ['farmhouse'], ['gap', 4], ['cottage', 0, 'red'], ['gap', 3], ['cottage', 1, 'blue']];
  const Rr = [['warehouse'], ['townhouse', 'blue', 'red'], ['townhouse', 'oxblood', 'green'], ['townhouse', 'cream', 'black'], ['gap', 7], ['cottage', 0, 'green'], ['gap', 3], ['cottage', 1, 'red'], ['gap', 4], ['cottage', 0, 'yellow']];
  let gi = 0; for (const [side, list] of [[-1, L], [1, Rr]]) { let z = side < 0 ? 6 : 3, i = 0;
    for (const [k, a, b] of list) { if (k === 'gap') { z -= a; continue; } let P;
      if (MIX === 'lot') P = gatelandsLot(STREET, gi++, { kind: k }).plan; else if (k === 'townhouse') P = PLANS.townhouse({ color: a, paint: b, fin: town(a, i), doorX: i % 2 ? 1.95 : -1.95 }); else if (k === 'merchant') P = PLANS.merchant({ color: a, paint: b, fin: town(a, i) });
      else if (k === 'warehouse') P = PLANS.warehouse({ fin: mixB ? FIN.whiteTown() : FIN.stone() }); else if (k === 'farmhouse') P = PLANS.farmhouse({ fin: mixC ? FIN.stone() : FIN.whiteTown() }); else P = PLANS.cottage({ hip: !!a, paint: b });
      const g = building(P), set = k === 'farmhouse' ? 3.5 : k === 'cottage' ? 1.5 : 0, along = k === 'warehouse' ? P.d : P.w, across = k === 'warehouse' ? P.w : P.d;
      const ry = k === 'warehouse' ? (side < 0 ? 0 : Math.PI) : side < 0 ? Math.PI / 2 : -Math.PI / 2, x = side * (4.8 + set + across / 2), zc = z - along / 2;
      put(g, x, zc, ry, k === 'cottage' || k === 'farmhouse' ? gy(x, zc) : 0); z -= along + (k === 'cottage' ? 0 : .0); i++;
      if (k !== 'warehouse' && i % 2 === 1 && people.length < 7) personAt(g, 0, 0, side < 0 ? Math.PI / 2 + .4 : -Math.PI / 2 - .3); }
  }
  // field walls along the cottages' plots, a high cross on the green at the end, trees behind
  { const stones = []; for (const sx of [-1, 1]) for (let z = -70; z > -96; z -= .7) { const g = box(.75, .5 + rnd() * .35, .55 + rnd() * .2, .9); g.rotateY((rnd() - .5) * .3); g.translate(sx * (4.9 + rnd() * .1), .3, z); stones.push(g); }
    const m = new THREE.Mesh(mergeGeometries(stones), MM.rubble); m.castShadow = m.receiveShadow = true; scene.add(m); }
  { const parts = [], add = (g, y) => { worldUV(g, .6); g.translate(0, y, 0); parts.push(g.index ? g.toNonIndexed() : g); };
    add(new THREE.BoxGeometry(1.4, .9, 1.0), .45); add(new THREE.BoxGeometry(.5, 3.2, .3), 2.5); add(new THREE.BoxGeometry(1.7, .42, .3), 3.25);
    { const s = new THREE.Shape(); s.absarc(0, 0, .62, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, .44, 0, Math.PI * 2, true); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -.11); add(g, 3.25); }
    const m = new THREE.Mesh(mergeGeometries(parts.map(p => { for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'uv'].includes(k)) p.deleteAttribute(k); return p; })), mat('lichen', { ns: 1.2 })); m.position.set(1.0, gy(1, -104), -104); m.rotation.y = .3; m.castShadow = true; scene.add(m); }
  const trees = treeKit(SUN), tl = []; for (let i = 0; i < 240; i++) { const x = (rnd() - .5) * 400, z = 10 - rnd() * 420; if (Math.abs(x) < 26 && z > -95) continue; if (Math.abs(x) < 8) continue; tl.push([x, gy(x, z), z, .7 + rnd() * .6, rnd() * 6.3, new THREE.Color(.86 + .2 * rnd(), .95 + .1 * rnd(), .62 + .1 * rnd())]); }
  tl.push([15, gy(15, -84), -84, 1.1, 1.2], [-9, gy(-9, -112), -112, 1.3, 2]); trees.plant(scene, tl);
  people.push([.6, -3.5, Math.PI * .1], [-1.4, -11, -Math.PI * .7]);
  const C = { eye: [[.6, 1.65, 9], [0, 1.9, -30]], high: [[14, 17, -80], [-3, 2, -24]], cottage: [[-.6, 1.65, -40.2], [-6.6, 1.5, -46.8]], town: [[1.4, 1.65, 2.0], [-6.5, 2.6, -4.4]] }[CAMQ] || [[.6, 1.65, 9], [0, 1.9, -30]];
  cam.position.set(...C[0]); cam.lookAt(...C[1]); if (CAMQ === 'town' || CAMQ === 'cottage') cam.fov = 58; cam.updateProjectionMatrix();
}

if (VIEW === 'line') {
  // the plans in a row on a flagged yard, a person at each door, a plaque before each with its sizes and its triangles
  flat(mat('plaster', { ns: 1.2, color: 0xb9b1a2, rough: .95 }), 92, 34, -10, 2, .01, .6);
  const row = [PLANS.cottage({ paint: 'red' }), { ...PLANS.cottage({ hip: true, paint: 'blue' }), name: 'Cottage, hipped' }, PLANS.farmhouse({}), PLANS.townhouse({ color: 'ochre' }), PLANS.merchant({ color: 'cream' }), PLANS.warehouse({})];
  let x = -44;
  for (const P of row) { const wh = P.name === 'Warehouse', along = wh ? P.d : P.w, g = building(P); x += along / 2; put(g, x, wh ? -P.w / 2 + 4 : -P.d / 2 + 4, wh ? -Math.PI / 2 : 0);
    personAt(g, -.3, .4, Math.PI * .08 + (rnd() - .5) * .4); plaques.push([x, 7.4, g.userData]); x += along / 2 + 2.6; }
  cam.fov = 44; cam.updateProjectionMatrix(); cam.position.set(-10.25, 3.4, 54); cam.lookAt(-10.25, 6.6, 0);
}

if (VIEW === 'kit') {
  // each piece on a wall stub 3.2 m wide, in the finish it belongs to; and the three roofs and two stacks on small houses
  flat(mat('plaster', { ns: 1.2, color: 0xb9b1a2, rough: .95 }), 70, 40, 4, -2, .01, .6);
  const stubs = [
    ['Cottage window, 2 over 2', FIN.lime(), 'red', [win(0, .95, .78, 1.0, [2, 1])], .6, 2.7],
    ['The half-door', FIN.lime(), 'red', [{ kind: 'half', x: 0, y: 0, w: .95, h: 2.0 }], .6, 2.7],
    ['Farm door with a transom', FIN.whiteTown(), 'green', [{ kind: 'transom', x: 0, y: 0, w: 1.05, h: 2.5 }], .5, 3.1],
    ['Town door, round-headed, fanlight', FIN.render('ochre'), 'blue', [{ kind: 'fan', x: 0, y: 0, w: 1.1, h: 2.95, arch: true, dress: true }], .45, 3.6],
    ['Town sash, 6 over 6, quoins', FIN.render('sage'), 'blue', [win(0, .75, .95, 1.85, [3, 2])], .45, 3.3],
    ['Shop window and door', FIN.render('cream'), 'green', [{ kind: 'shopwin', x: -.55, y: .62, w: 2.2, h: 2.05, bars: [2, 2] }, { kind: 'shopdoor', x: 1.35, y: 0, w: 1.05, h: 2.65 }], .45, 3.6],
    ['Cart arch, voussoirs', FIN.stone(), 'black', [{ kind: 'cart', x: 0, y: 0, w: 3.0, h: 3.9, arch: true }], .7, 4.6],
    ['Loading door', FIN.stone(), 'black', [{ kind: 'load', x: 0, y: .3, w: 1.5, h: 2.2 }], .7, 3.0],
  ];
  stubs.forEach(([name, fin, paint, open, t, hh], i) => { const bk = bucket(), wd = name.startsWith('Cart') ? 4.6 : name.startsWith('Shop') ? 4.2 : 3.2;
    face(bk, new THREE.Matrix4(), { fin, paint: 'p:' + paint, t, outline: [[-wd / 2, 0], [wd / 2, 0], [wd / 2, hh], [-wd / 2, hh]], open, strings: [] });
    { const g = new THREE.BoxGeometry(wd - .04, hh, 1.2); g.translate(0, hh / 2, -t - .6); bk.add('dark', g); } if (fin.quoins) for (let k = 0, y = .1; y < hh - .2; k++, y += .34) { const a = k % 2 ? .3 : .55, g = box(a, .3, t + .06); g.translate(wd / 2 - a / 2 + .03, y + .15, -t / 2 + .03); bk.add('dress', g); }
    { const g = box(wd + .1, .12, t + .1); g.translate(0, hh + .06, -t / 2); bk.add(fin.key === 'rubble' ? 'dress' : fin.key, g); }
    const grp = finish(bk, name), col = i % 4, rowi = Math.floor(i / 4); put(grp, -10.5 + col * 6.5 + (rowi ? 1.6 : -1.6), rowi ? 6 : -4, 0); plaques.push([grp.position.x, grp.position.z + 2.3, { name, tris: grp.userData.tris, calls: grp.userData.calls, size: null }]);
    if (i === 1 || i === 3 || i === 6) people.push([grp.position.x + 1.1, grp.position.z + .9, -.3]); });
  // three roofs on small houses: gabled thatch with its scalloped ridge, hipped thatch, slate between parapets
  const small = [PLANS.cottage({ paint: 'green' }), PLANS.cottage({ hip: true, paint: 'yellow' }), { ...PLANS.farmhouse({}), name: 'Slate, parapets, kneelers' }];
  small[0].w = small[1].w = 6.6; small[0].name = 'Thatch, gabled: scalloped ridge'; small[1].name = 'Thatch, hipped'; for (const s of small.slice(0, 2)) { s.open.front = [{ kind: 'half', x: -.6, y: 0, w: .95, h: 2.0 }, win(1.6, .95, .78, 1.0, [2, 1])]; s.chim = s.roof.hip ? [{ x: 1.4 }] : [{ gable: 1 }]; }
  small[2].w = 7.5; small[2].open.front = [{ kind: 'transom', x: -1.6, y: 0, w: 1.05, h: 2.5 }, win(1.6, .85, .95, 1.5, [3, 2]), win(-1.6, 3.55, .9, 1.3, [3, 2]), win(1.6, 3.55, .9, 1.3, [3, 2])];
  small.forEach((P, i) => { const g = building(P), x = -10.5 + i * 10.5; put(g, x, -18, 0); plaques.push([x, -13.4, { name: P.name, tris: g.userData.tris, calls: g.userData.calls, size: g.userData.size }]); if (i === 0) personAt(g, .3, 0, Math.PI); });
  cam.position.set(0, 12.5, 23); cam.lookAt(0, 0.6, -5); cam.fov = 58; cam.updateProjectionMatrix();
}
if (VIEW === 'bays') {
  // a row a plan, back to front: the merchant's house, the townhouse, the farmhouse, the cottage; each on every count of bays it takes
  flat(mat('plaster', { ns: 1.2, color: 0xb9b1a2, rough: .95 }), 64, 100, 0, -38, .01, .6); sun.shadow.camera.left = sun.shadow.camera.bottom = -62; sun.shadow.camera.right = sun.shadow.camera.top = 62;
  const rows = [['merchant', { color: 'cream', paint: 'green' }, -78], ['townhouse', { color: 'ochre', paint: 'blue' }, -52], ['farmhouse', { paint: 'green' }, -26], ['cottage', { paint: 'red' }, 0]];
  for (const [kind, o, z] of rows) { const B = GL_BAYS[kind], ws = []; for (let n = B.min; n <= B.max; n++) ws.push(glBayPlan(kind, n, o).w); let x = -(ws.reduce((a, b) => a + b, 0) + 2.4 * (ws.length - 1)) / 2;
    for (let n = B.min; n <= B.max; n++) { const P = glBayPlan(kind, n, o); P.name = `${P.name.split(' ')[0]}, ${n} bays`; const g = building(P); x += P.w / 2; put(g, x, z - P.d / 2, 0);
      people.push([x + P.doorX + .3, z + .7, Math.PI * .08]); plaques.push([x, z + 2.4, g.userData]); x += P.w / 2 + 2.4; } }
  const rz = { cottage: 0, farmhouse: -26, townhouse: -52, merchant: -78 }[CAMQ], C = rz !== undefined ? [[0, 2.2, rz + 17], [0, CAMQ === 'cottage' ? 2.6 : 4.6, rz - 4]] : [[0, 52, 34], [0, 0, -42]];
  cam.fov = rz !== undefined ? 68 : 50; cam.updateProjectionMatrix(); cam.position.set(...C[0]); cam.lookAt(...C[1]);
}
if (VIEW === 'guild') {
  // the guild hall (Session 964, Michael's C on #352) on a flagged square, the farmhouse that drew the first guild beside it for its size;
  // &guild=mages for the Mages' Guild; &cam=front (default) | corner | back | door
  flat('flag', 40, 24, 3, 4, .01, 1.3); const P = PLANS.guildhall({ guild: Q.get('guild') || 'fighters' }), g = building(P); put(g, 0, 0, 0);
  const F = building(PLANS.farmhouse({})); put(F, 15.2, -1.4, 0); personAt(g, .2, .5, Math.PI * .9); personAt(F, 0, .3, Math.PI);
  plaques.push([-7.5, 7.0, g.userData], [15.2, 5.2, F.userData]);
  const C = { front: [[1.5, 1.65, 26], [1.5, 4.6, 0]], corner: [[-17, 3.2, 17], [0, 4.2, 0]], back: [[9, 2.4, -21], [-1, 4.4, 0]], door: [[-6.6, 1.65, 9.0], [-1.6, 3.7, 3.6]] }[CAMQ] || [[1.5, 1.65, 26], [1.5, 4.6, 0]];
  cam.position.set(...C[0]); cam.lookAt(...C[1]);
}
if (VIEW === 'church') {
  // the church in a yard of grass, a gravel path to its west door, a high cross and a few headstones; the farmhouse beside it for its size
  const TW = Q.get('tower') || 'round', all = TW === 'all', kinds = all ? ['round', 'square', 'bellcote'] : [TW], dx = 46;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -70; sun.shadow.camera.right = sun.shadow.camera.top = 70;
  kinds.forEach((tw, i) => { const x = all ? (i - 1) * dx : 0, g = gatelandsChurch({ tower: tw, ajar: true }); put(g, x, 0, 0); personAt(g, .4, .6, -Math.PI * .4);
    flat(mat('plaster', { ns: 1.4, color: 0x9a9082, rough: 1 }), 14, 2.2, x - 8 - 7 - (tw === 'square' ? 5 : 0), 0, .02, .8);
    plaques.push([x + 2, 9.5, g.userData]);
    // the high cross: a shaft on a stepped base, the ring about the head
    const hc = bucket(), cx = x - 13, cz = 10; { const b = box(1.3, .7, 1.0); b.translate(cx, .35, cz); hc.add('rubble', b); } { const b = box(.42, 3.0, .3); b.translate(cx, 2.2, cz); hc.add('ashlar', b); }
    { const b = box(1.5, .34, .3); b.translate(cx, 3.2, cz); hc.add('ashlar', b); } { const b = new THREE.TorusGeometry(.48, .07, 6, 20); b.translate(cx, 3.2, cz); hc.add('ashlar', b); }
    { const b = box(.3, .3, .3); b.translate(cx, 3.85, cz); hc.add('ashlar', b); } scene.add(finish(hc, 'High cross'));
    const hs = bucket(), rr = (() => { let s2 = 7 + i; return () => ((s2 = (s2 * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let k = 0; k < 9; k++) { const sx = x - 4 + (k % 5) * 2.6 + rr() * .6, sz = 8.2 + Math.floor(k / 5) * 2.4 + rr() * .4, b = box(.6 + rr() * .25, .8 + rr() * .5, .16); b.rotateZ((rr() - .5) * .16); b.rotateY((rr() - .5) * .2); b.translate(sx, .35, sz); hs.add('rubble', b); }
    scene.add(finish(hs, 'Headstones')); });
  if (!all) { const F = building(PLANS.farmhouse({})); put(F, 24, 4, 0); plaques.push([24, 9.8, F.userData]); }
  const C = all ? (CAMQ === 'eye' ? [[-60, 2, 30], [0, 8, 0]] : [[-6, 34, 96], [-6, 9, 0]]) : { corner: [[-31, 1.8, 21], [-5, 8, 0]], front: [[2, 1.8, 30], [2, 6, 0]], west: [[-26, 1.7, 6], [-9, 4.0, 0]], far: [[-70, 6, 60], [0, 9, 0]], high: [[-30, 34, 40], [0, 4, 0]] }[CAMQ] || [[-36, 2.2, 26], [-4, 7.5, 0]];
  cam.fov = all ? 50 : 56; cam.updateProjectionMatrix(); cam.position.set(...C[0]); cam.lookAt(...C[1]);
}
STATS.plans = BUILT; STATS.view = VIEW; STATS.mix = MIX;

// the plaques: a slate on a little easel, with the name, the sizes and the triangles
function plaque(x, z, u, ry = 0) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const k = c.getContext('2d'); k.fillStyle = '#26282b'; k.fillRect(0, 0, 1024, 300); k.strokeStyle = '#d9c896'; k.lineWidth = 6; k.strokeRect(12, 12, 1000, 276);
  k.fillStyle = '#f0e6cc'; k.font = '600 66px Georgia, serif'; k.textAlign = 'center'; k.fillText(u.name, 512, 100); k.font = '44px Georgia, serif'; k.fillStyle = '#d9cfb4';
  const s = u.size; if (s) k.fillText(`${s.w} × ${s.d} m · eaves ${s.eave} m · ridge ${s.ridge} m`, 512, 175); k.fillText(`${u.tris.toLocaleString('en-GB')} triangles · ${u.calls} draw calls`, 512, s ? 245 : 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.0), new THREE.MeshStandardMaterial({ map: t, roughness: .8 }));
  m.position.set(x, .72, z); m.rotation.set(-.45, ry, 0, 'YXZ'); scene.add(m); const leg = new THREE.Mesh(new THREE.BoxGeometry(.06, .6, .06), MM.iron); leg.position.set(x, .3, z - .1); scene.add(leg);
}
for (const [x, z, u] of plaques) plaque(x, z, u, 0);

const comp = makeComposer(R, scene, cam, { bloom: .16, sat: 1.06 });
loadPack('mh/').then(() => { let k = 0;
  for (const [x, z, ry] of people) { const pr = (() => { let s = 1013 + k * 7919; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })(), p = makePerson(gateGenome(pr, k % 2 ? 0 : 1)); k++;
    p.root.position.x = x; p.root.position.z = z; p.root.position.y += gy(x, z) + (VIEW === 'street' && Math.abs(x) > 3.2 && Math.abs(x) < 4.8 ? .06 : 0); p.root.rotation.y = ry; scene.add(p.root);
    p.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(p.root); (STATS.heights ||= []).push(+(bb.max.y - bb.min.y).toFixed(2)); }
  STATS.people = people.length; run(comp, cam); }).catch(e => { window.__err = String(e); console.error(e); run(comp, cam); });
