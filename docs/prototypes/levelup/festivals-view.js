// The Gatelands' three festivals on one village green (the concept artist, 13 Nov 2026; backlog L9, OG-107; the quest writer's
// *Festivals on the Calendar, I*, unapproved): three limewashed cottages round a green, the river on its west side, and festivals.js's
// props laid on it at three levels of dress.
// ?fest=greening|riverfair|lanterns, &level=a|b|c (A the custom alone: the pole, the blessing at the water, the lanterns let go; B the
// green dressed too: bunting round the green, the trestles and booths, the lambs' pen, a crowd; C the town dressed too: every door
// garlanded and every sill lit), &cam=wide|close|scale|high or x,y,z,tx,ty,tz, &nopeople.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed, rnd } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { GL_PLANS, gatelandsBuilding } from './pieces.js';
import { shrineTextures } from './shrines.js';
import { genome, build as buildBeast, pose as poseBeast } from './creatures.js';
import { PROPS, build, pose, tris, sag } from './festivals.js';

const FEST = ['greening', 'riverfair', 'lanterns'].includes(Q.get('fest')) ? Q.get('fest') : 'greening', LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide';
const NIGHT = FEST === 'lanterns', LV = { a: 0, b: 1, c: 2 }[LEVEL];
const R = makeRenderer(NIGHT ? 1.05 : .84), scene = new THREE.Scene(); buildTextures(); shrineTextures(); reseed(13);
// the hour: the Greening a spring morning, Riverfair a summer noon, the Lanterns the blue of dusk with the sun just down
const SKY = {
  greening: { sun: [-.5, .5, .7], col: [1, .93, .82], k: 2.8, hemi: [[.62, .7, .88], [.34, .32, .24], 1.15], sky: {}, fog: [.8, .84, .88, .006] },
  riverfair: { sun: [-.35, .8, .5], col: [1, .92, .78], k: 3.2, hemi: [[.64, .72, .9], [.36, .32, .24], 1.1], sky: {}, fog: [.8, .82, .86, .005] },
  lanterns: { sun: [-.55, .015, -.83], col: [.7, .5, .5], k: .25, hemi: [[.16, .2, .36], [.05, .04, .04], .5], sky: { zen: [.02, .04, .13], mid: [.1, .12, .26], hor: [.62, .36, .3], glow: [.9, .45, .25], glowK: .5, k: .9 }, fog: [.16, .16, .24, .008] } }[FEST];
const SUN = new THREE.Vector3(...SKY.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...SKY.fog.slice(0, 3)), SKY.fog[3]);
const cam = new THREE.PerspectiveCamera(46, W / H, .02, 30000);
const sun = new THREE.DirectionalLight(new THREE.Color(...SKY.col), SKY.k); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...SKY.hemi[0]), new THREE.Color(...SKY.hemi[1]), SKY.hemi[2]));
skyDome(scene, SUN, SKY.sky); if (!NIGHT) clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
{ const c = new THREE.Vector3(0, 0, -3); sun.position.copy(SUN).multiplyScalar(60).add(c); sun.target.position.copy(c); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: .5, far: 160 }); sun.shadow.camera.updateProjectionMatrix(); }

// ——— the ground: the green east of the river, the far bank, the banks sloping to the water 0.8 m down
const grassM = mat('grass', { ns: 1, rough: 1 }), earthM = mat('grass', { ns: .8, color: 0xc8a888, rough: 1 }), rockM = mat('rock', { ns: .8, color: 0x9a9a90, rough: .95 });
const plane = (w, d, m, x, z, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const RIV = [-19, -13], WATER_Y = -.8;
plane(200, 300, grassM, -13 + 100, 0); plane(200, 300, grassM, -19 - 100, 0);
{ const prof = [[RIV[1] + .02, .01], [RIV[1] - 1.2, -.92], [RIV[0] + 1.2, -.92], [RIV[0] - .02, .01]], pos = [], idx = [];
  prof.forEach(([x, y]) => pos.push(x, y, -150, x, y, 150)); for (let i = 0; i < 3; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .5);
  const em = earthM.clone(); em.side = THREE.DoubleSide; const o = new THREE.Mesh(g, em); o.receiveShadow = true; scene.add(o); }
{ const g = new THREE.PlaneGeometry(RIV[1] - RIV[0] + 1, 300); g.rotateX(-Math.PI / 2); const w = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: NIGHT ? new THREE.Color(.05, .07, .1) : new THREE.Color(.1, .17, .18), roughness: .3, metalness: 0 })); w.position.set((RIV[0] + RIV[1]) / 2, WATER_Y, 0); w.receiveShadow = true; scene.add(w); }
for (let i = 0; i < 70; i++) { const z = -40 + i * 1.1 + rnd() * .5, s = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + rnd() * .14, 0), rockM); s.scale.y = .55; s.position.set(RIV[1] - .3 - rnd() * .6, -.25 - rnd() * .3, z); s.rotation.y = rnd() * 6; s.castShadow = s.receiveShadow = true; if (Math.abs(z - 1) > 1.4) scene.add(s); }
// a trodden path across the green to the water
{ const g = new THREE.PlaneGeometry(1.6, 13); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2 - .1); worldUV(g, .5); const o = new THREE.Mesh(g, earthM); o.position.set(-6.5, .004, .2); o.receiveShadow = true; scene.add(o); }

// ——— the houses: three limewashed cottages under thatch round the green (pieces.js's GL_PLANS.cottage; front to +z in its own frame)
const HOUSES = [[-8.5, -12.5, .22, 'red'], [3.5, -14, -.06, 'blue'], [13.5, -4.5, -1.32, 'green']]; STATS.houses = [];
const houseM = [];
for (const [x, z, ry, paint] of HOUSES) { const g = gatelandsBuilding(GL_PLANS.cottage({ paint })); g.position.set(x, 0, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); g.updateMatrixWorld(true); houseM.push(g.matrixWorld.clone()); STATS.houses.push(g.userData.tris); }
const atHouse = (i, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(houseM[i]);
// trees behind
const trees = []; for (let i = 0; i < 22; i++) { const a = -2.2 + i * .2, d = 30 + (i % 4) * 6; trees.push([Math.sin(a) * d + 2, 0, -Math.cos(a) * d - 4, .75 + (i % 3) * .1, i, new THREE.Color(.95, 1, .7)]); }
for (let i = 0; i < 8; i++) trees.push([-24 - (i % 2) * 4, 0, -20 + i * 6, .7, i, new THREE.Color(.9, 1, .7)]);
treeKit(SUN).plant(scene, trees);

// ——— what the festival stands on the green
const PROP = []; const put = (key, at, ry = 0, ...a) => { const t = build(key, ...a); t.g.position.copy(at); t.g.rotation.y = ry; t.g.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } }); scene.add(t.g); PROP.push({ key, tris: t.tris, ...(t.g.userData || {}) }); return t.g; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const POLE = V(0, 0, -4);
const lights = [];
const lamp = (at, k = 3, d = 7, col = [1, .62, .3]) => { if (lights.length >= 12) return; const l = new THREE.PointLight(new THREE.Color(...col), k, d, 2); l.position.copy(at); scene.add(l); lights.push(l); };
// bunting round the green on six posts (B and C)
const BPOSTS = [[-10, -6.5], [-2, -8.5], [8, -7.5], [10.5, 1.5], [7.5, 6.5], [-9, 4]];
if (LV >= 1) { BPOSTS.forEach(([x, z]) => put('bpost', V(x, 0, z)));
  BPOSTS.forEach(([x, z], i) => { const [x2, z2] = BPOSTS[(i + 1) % BPOSTS.length]; if (i === 4 && FEST !== 'greening') return; put('bunting', V(0, 0, 0), 0, V(x, 3.3, z), V(x2, 3.3, z2), .55, { seed: i, dyes: FEST === 'lanterns' ? [5, 0, 7, 4] : FEST === 'riverfair' ? [1, 4, 0, 4] : [0, 1, 2, 4, 3] }); }); }
// C: every house dressed: a garland over the door (may blossom in spring, green with a ribbon in summer, rowan in autumn), boughs over
// the front windows; and in the Lanterns a lantern on every front sill and the doorstep
if (LV >= 2) for (let i = 0; i < HOUSES.length; i++) { const ry = HOUSES[i][2], o = { berries: FEST === 'lanterns', ribbon: FEST === 'riverfair' ? [.16, .28, .56] : FEST === 'greening' ? [.66, .14, .1] : null, seed: i };
  put('garland', atHouse(i, -.6, 2.05, 2.78), ry, 1.15, o); for (const x of [-3.2, 1.5, 3.4]) put('garland', atHouse(i, x, 2.0, 2.78), ry, .9, { ...o, ribbon: null, seed: i * 7 + x });
  if (FEST === 'lanterns') { for (const x of [-3.2, 1.5, 3.4]) { put('sillLantern', atHouse(i, x, .97, 2.82), ry); } put('sillLantern', atHouse(i, .25, 0, 3.05), ry); lamp(atHouse(i, -.6, 1.2, 3.6), 2.5, 6); } }

const PEOPLE = []; // [x, z, face (radians), pose, opts]
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const crowd = (n, cx, cz, r0, r1, seed, kinds = ['stand'], tx = cx, tz = cz) => { let s = seed; const rr = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < n; i++) { const a = rr() * 6.28, d = r0 + rr() * (r1 - r0), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; PEOPLE.push([x, z, face(x, z, tx, tz) + (rr() - .5) * .5, kinds[i % kinds.length], {}]); } };
const BEASTS = []; // [plan, key, x, z, ry, sliders]

if (FEST === 'greening') {
  put('pole', POLE, 0, { mode: LV ? 'ring' : 'hang', knots: 14, n: 14 });
  PEOPLE.push([POLE.x + .05, POLE.z + .34, Math.PI, 'tie', {}]);
  PEOPLE.push([2.6, -1.0, face(2.6, -1, POLE.x, POLE.z), 'stand', {}], [-2.4, -1.4, face(-2.4, -1.4, POLE.x, POLE.z), 'stand', {}], [1.2, 1.4, face(1.2, 1.4, POLE.x, POLE.z), 'stand', {}], [-.9, 2.0, face(-.9, 2, POLE.x, POLE.z), 'stand', {}]);
  // the first lambs: B carries them in a hurdle pen by the path, a ewe with them; A has one ewe and her lamb by the pole
  if (LV >= 1) { const pc = V(-6, 0, 1.5); for (const [dx, dz, ry] of [[0, -.9, 0], [0, .9, 0], [-.9, 0, Math.PI / 2], [.9, 0, Math.PI / 2]]) put('hurdle', V(pc.x + dx, 0, pc.z + dz), ry);
    BEASTS.push(['sheep', 'greening:ewe', pc.x - .2, pc.z - .1, .6, {}], ['sheep', 'greening:lamb0', pc.x + .35, pc.z + .3, -1.2, { size: .5 }], ['sheep', 'greening:lamb1', pc.x - .4, pc.z + .45, 2.2, { size: .48 }]);
    put('trestle', V(6, 0, 0), -.4, { load: 'feast' }); crowd(6, 5.5, -.5, 2.2, 4.5, 41, ['stand'], POLE.x, POLE.z); }
  else BEASTS.push(['sheep', 'greening:ewe', 2.2, -3.2, -1.8, {}], ['sheep', 'greening:lamb0', 2.8, -2.7, -1.4, { size: .5 }]);
} else if (FEST === 'riverfair') {
  // the blessing at the water's edge, where the path meets the river; the cup held out over the water
  put('blessing', V(RIV[1] + .35, 0, 1), -Math.PI / 2);
  PEOPLE.push([RIV[1] + .85, 1.55, -Math.PI / 2, 'cup', {}], [RIV[1] + 2.4, 2.2, face(RIV[1] + 2.4, 2.2, RIV[1], 1), 'stand', {}], [RIV[1] + 2.6, -.4, face(RIV[1] + 2.6, -.4, RIV[1], 1), 'stand', {}]);
  put('rail', V(3.5, 0, -5), 0); BEASTS.push(['horse', 'riverfair:bay', 2.4, -4.0, Math.PI, {}], ['horse', 'riverfair:grey', 4.8, -4.1, Math.PI + .1, {}]);
  PEOPLE.push([4.2, -1.8, face(4.2, -1.8, 4.8, -4), 'stand', {}], [1.0, -1.6, face(1, -1.6, 2.4, -4), 'stand', {}]);
  if (LV >= 1) { put('booth', V(8, 0, -2.5), -1.25, { stripes: ['#b8392a', '#efe4cc'] }); put('booth', V(-2.5, 0, -7.5), .15, { stripes: ['#2a4a8a', '#efe4cc'] }); put('beam', V(-4.2, 0, -2.6));
    BEASTS.push(['horse', 'riverfair:chestnut', 7.5, 3.0, -.6, {}]); PEOPLE.push([6.6, 2.4, face(6.6, 2.4, 7.5, 3), 'lead', {}]);
    put('trestle', V(1, 0, 2.4), .1, { load: 'feast' }); crowd(5, 3, -.5, 1.6, 4.2, 77, ['stand'], 4, -3); }
} else {
  // the Night of the Lanterns: lanterns held, lanterns let go, the rest rising over the roofs on a light westerly
  PEOPLE.push([-.6, -2.4, 0, 'hold', { dye: [.96, .9, .74] }], [1.3, -3.1, .4, 'release', { dye: [.96, .82, .62] }], [-2.3, -3.6, -.3, 'look', {}], [2.7, -1.2, -.6, 'hold', { dye: [.98, .88, .7] }], [.3, -.4, Math.PI - .2, 'look', {}]);
  if (LV >= 1) { put('trestle', V(-4.5, 0, 1.2), .3, { load: 'lanterns' }); PEOPLE.push([-4.6, 1.9, Math.PI + .3, 'stand', {}], [-1.6, 1.0, -.3, 'release', { dye: [.95, .86, .66], lift: .4 }], [3.8, -4.4, .2, 'hold', {}], [-3.6, -1.6, .5, 'look', {}], [5, -1.5, -.2, 'look', {}]); }
}

// the lanterns in the air: A a dozen just away, B and C some eighty, drifting east and away as they rise
if (NIGHT) { const n = LV ? 80 : 12, Lt = build('skyLantern', { lit: true, k: 2.2 }), Ls = []; let s = 91; const rr = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < n; i++) { const t = Math.pow(rr(), LV ? 1.4 : 2.2), y = 4.5 + t * (LV ? 70 : 28), drift = t * (LV ? 40 : 14), x = -1 + (rr() - .5) * (5 + t * 30) + drift * .8, z = -1 + (rr() - .5) * (4 + t * 26) - drift * .9;
    const g = Lt.g.clone(); g.position.set(x, y, z); g.rotation.set((rr() - .5) * .2, rr() * 6, (rr() - .5) * .2); scene.add(g); Ls.push(g); if (i < 3) lamp(V(x, y, z), 2, 10); }
  STATS.rising = { n, tris: Lt.tris * n, top: +Math.max(...Ls.map(g => g.position.y)).toFixed(1) }; }

// ——— the cameras
const CAMS = {
  wide: { greening: [[4, 2.4, 14.5], [-1.5, 2.2, -4]], riverfair: [[.5, 4.0, 12.5], [-6.5, .6, -2.5]], lanterns: [[3.5, 1.6, 12.5], [-1, 6.5, -6]] },
  close: { greening: [[1.5, 1.8, -6.4], [0, 1.45, -3.7]], riverfair: [[RIV[1] + 1.2, 1.5, 4.4], [RIV[1] - .2, .8, 1.2]], lanterns: [[.9, 1.55, 1.2], [.2, 1.8, -3]] },
  scale: { greening: [[3.4, 1.2, 4.2], [0, 1.6, -4]], riverfair: [[7, 1.1, 2.5], [4, 1.3, -4.4]], lanterns: [[2.4, 1.0, 2.2], [-4.5, 1.1, 1.0]] },
  high: { greening: [[0, 24, 18], [0, 0, -3]], riverfair: [[0, 24, 18], [-2, 0, -3]], lanterns: [[0, 24, 18], [0, 4, -5]] } };
let c = (CAMS[CAM] || CAMS.wide)[FEST]; if (CAM.includes(',')) { const n = CAM.split(',').map(Number); c = [n.slice(0, 3), n.slice(3)]; }
cam.position.set(...c[0]); cam.lookAt(...c[1]); cam.fov = CAM === 'close' ? 38 : CAM === 'high' ? 40 : 46; cam.updateProjectionMatrix();
// the 1.8 m post in the scale view, beside the thing measured
if (CAM === 'scale') { const post = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true);
  post.position.copy({ greening: V(1.2, 0, -3.2), riverfair: V(5.9, 0, -4.4), lanterns: V(-3.3, 0, .9) }[FEST]); scene.add(post); }

const comp = makeComposer(R, scene, cam, NIGHT ? { bloom: .55, bloomR: .5, bloomT: .55, sat: 1.04, vig: .34, cool: [.9, .96, 1.1] } : { bloom: .18, bloomT: .9, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
STATS.fest = FEST; STATS.level = LEVEL; STATS.props = PROP;
// the beasts (creatures.js): sheep and horses standing
STATS.beasts = []; for (const [plan, key, x, z, ry, sl] of BEASTS) { const Cb = buildBeast(genome(plan, key, { island: 'gatelands', sliders: Object.keys(sl).length ? sl : undefined })); Cb.gait = 'stand'; poseBeast(Cb, 0);
  Cb.root.position.set(x, 0, z); Cb.root.rotation.y = ry; Cb.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(Cb.root); STATS.beasts.push(plan + (sl.size ? ' (lamb)' : '')); }
(!Q.has('nopeople') ? loadPack('mh/') : Promise.reject('nopeople')).then(() => { STATS.people = [];
  PEOPLE.forEach(([x, z, ry, kind, o], i) => { const G = rollGenome('fest:' + FEST + ':' + i, { people: i % 7 === 6 ? 'oldblood' : 'gatelander' }); if (kind !== 'stand') G.dress = { ...G.dress, basket: null, spear: null, shield: null, staff: null, crossbow: null }; const P = makePerson(G); scene.add(P.root);
    const r = pose(P, kind, o); P.root.position.x = x; P.root.position.z = z; P.root.rotation.y = ry; P.root.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
    if ((kind === 'hold' || kind === 'release') && NIGHT) { P.root.updateMatrixWorld(true); const l = new THREE.Vector3(); P.root.children.at(-1).getWorldPosition(l); lamp(l.add(V(0, .3, 0)), 3.2, 7); }
    STATS.people.push({ kind, height: +statureOf(G).toFixed(3), holds: r.holds, tris: r.tris, miss: r.miss }); });
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e && e.stack || e); console.error(e); } }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.lights = lights.length; });
