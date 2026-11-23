// The strange and the legendary, II (the concept artist, 23 Nov 2026; backlog L2, OG-071): strange2.js's four on one Markish riverbank in
// the evening: Tomcán on the step at a gate's mouth at the left, his hat upturned at his feet; Nell on the bank by the dam with Stump (by
// level); Ord at the water's edge with his pole, the punt beside him and Stilts in the shallows; Elias at a warehouse door at the right.
// Two piers of a fallen bridge stand in the river behind the punt. ?level=a|b|c (b is the default), &cam=wide (default) | close | face |
// scale | stump | high or x,y,z,tx,ty,tz, &who=tomcan|nell|elias|ord (close, face, scale), &turn=1 from behind, &only=<who>.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed, sstep } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { genome as beastGenome, build as buildBeast, pose as poseBeast } from './creatures.js';
import { shrineTextures } from './shrines.js';
import { WANDER, ORDER, wGenome, wProps, dammerPlan, gateMouth, upturnedHat, punt, heron, wareWall, dam, ripples } from './strange2.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', TURN = Q.has('turn');
const WHO = WANDER[Q.get('who')] ? Q.get('who') : 'tomcan', ONLY = WANDER[Q.get('only')] ? Q.get('only') : null;
const R = makeRenderer(.86), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .76, .72), .007);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(23);
const SUN = new THREE.Vector3(-.32, .3, .9).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .78, .56), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.58, .66, .86), new THREE.Color(.34, .3, .24), 1.15));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: .5, far: 140 }); sun.shadow.camera.updateProjectionMatrix();
// the land: the bank at 0 to z 0.5, down to the river's bed (-0.9) by z 1.7; the far bank rises from z 15
const WATER_Y = -.32, bankY = z => z < .5 ? 0 : z < 1.7 ? -.9 * sstep(.5, 1.7, z) : z < 15 ? -.9 : -.9 + 1.4 * sstep(15, 18, z);
{ const g = new THREE.PlaneGeometry(240, 120, 240, 240); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, bankY(p.getZ(i) + 20)); g.translate(0, 0, 20); g.computeVertexNormals(); worldUV(g, .5);
  const land = new THREE.Mesh(g, mat('grass', { ns: 1, rough: 1 })); land.receiveShadow = true; scene.add(land);
  const mud = new THREE.PlaneGeometry(240, 1.6, 240, 8); mud.rotateX(-Math.PI / 2); const mp = mud.attributes.position; for (let i = 0; i < mp.count; i++) { const z = mp.getZ(i) + 1.05; mp.setZ(i, z); mp.setY(i, bankY(z) + .006); } mud.computeVertexNormals(); worldUV(mud, .6);
  const m2 = new THREE.Mesh(mud, mat('cobble', { ns: .8, color: 0x6a5a48, rough: 1 })); m2.receiveShadow = true; scene.add(m2);
  const wg = new THREE.PlaneGeometry(240, 16); wg.rotateX(-Math.PI / 2); const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: new THREE.Color(.3, .38, .4), roughness: .14, metalness: .15, transparent: true, opacity: .92 }));
  water.position.set(0, WATER_Y, 8.6); water.receiveShadow = true; scene.add(water); }
const XS = { tomcan: -6.2, nell: -1.6, ord: 2.6, elias: 5.9 };
const flags = new THREE.PlaneGeometry(3.2, 2.2); flags.rotateX(-Math.PI / 2); worldUV(flags, .7); { const f = new THREE.Mesh(flags, mat('flag', { ns: .8, color: 0xf0e4d0, rough: .9 })); f.position.set(XS.tomcan, .003, -.6); f.receiveShadow = true; scene.add(f); }
const quay = new THREE.PlaneGeometry(4.6, 3.2); quay.rotateX(-Math.PI / 2); worldUV(quay, .7); { const f = new THREE.Mesh(quay, mat('slab', { ns: .8, rough: .9 })); f.position.set(XS.elias + .3, .003, -1.1); f.receiveShadow = true; scene.add(f); }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
post.position.set(CAM === 'scale' ? XS[WHO] + .65 : -3.9, 0, CAM === 'scale' ? .25 : .1);
// the wood behind: alders and birches along the bank, and the moor beyond
const trees = []; for (let i = 0; i < 16; i++) { const x = -46 + i * 6.2 + Math.sin(i * 7.1) * 2, z = -14 - (i % 3) * 7; trees.push([x, 0, z, .7 + (i % 4) * .07, i, new THREE.Color(.92, 1, .72)]); }
treeKit(SUN).plant(scene, trees);
const stoneM = mat('ashlar', { ns: .8, color: 0xc8c0b4, rough: .95 }), woodM = mat('wood', { ns: .8, color: 0xb09078, rough: .9 });
const wall = wareWall(woodM); wall.position.set(XS.elias + .7, 0, -3.5); scene.add(wall);
const dm = dam(); dm.position.set(-3.6, 0, -1.9); dm.rotation.y = .25; scene.add(dm);
// the fallen bridge's near abutment behind Ord: a stone footing and the stubs of its deck's beams, broken off over the water
{ const ab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 2.0), stoneM); ab.position.set(XS.ord - 1.7, -.2, -1.2); ab.castShadow = ab.receiveShadow = true; scene.add(ab);
  for (const [dx, L] of [[-.6, 1.5], [0, 2.1], [.6, 1.1]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .22, L), woodM); b.position.set(XS.ord - 1.7 + dx, .62, -.4 + L / 2); b.rotation.x = .04 + dx * .05; b.castShadow = b.receiveShadow = true; scene.add(b); } }
const pu = punt(); pu.position.set(XS.ord - .5, WATER_Y - .12, 1.75); pu.rotation.y = .06; scene.add(pu);
const hr = heron(); hr.position.set(XS.ord - 3.2, bankY(1.05), 1.05); hr.rotation.y = .7; scene.add(hr);
const hat = upturnedHat(); hat.position.set(XS.tomcan + .45, 0, .2); scene.add(hat);
if (LEVEL === 'a') { const rp = ripples(); rp.position.set(XS.nell - .3, WATER_Y + .004, 3.2); scene.add(rp); }
STATS.set = { gate: 0, punt: 0, heron: 0, wall: 0, dam: 0 };
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const comp = makeComposer(R, scene, cam, { bloom: .24, bloomT: .88, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS }, HEAD = {};
function aim() { const x = XS[WHO], hy = HEAD[WHO] ? HEAD[WHO].y : 1.6, s = TURN ? -1 : 1;
  if (CAM === 'close') { cam.fov = 30; lookAt([x + .3, hy * .72, s * 3.9], [x, hy * .58, 0]); }
  else if (CAM === 'face') { const h = HEAD[WHO] || new THREE.Vector3(x, 1.6, 0); cam.fov = 22; lookAt([h.x + .35, h.y + .03, h.z + s * 1.55], [h.x, h.y - .03, h.z]); }
  else if (CAM === 'scale') { cam.fov = 32; lookAt([x + .35, 1.0, 4.8], [x + .35, .95, 0]); }
  else if (CAM === 'stump') { cam.fov = 34; lookAt([XS.nell - .6, 1.7, 8.2], [XS.nell - 1.0, .3, .3]); }
  else if (CAM === 'high') { cam.fov = 40; lookAt([0, 9, 15], [0, .3, -.5]); }
  else { cam.fov = 40; lookAt([.1, 3.3, TURN ? -11 : 10.6], [.1, .55, -1]); }
  if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); } cam.updateProjectionMatrix(); }
aim();
const tri = o => { let n = 0; o.traverse(m => { if (m.isMesh && m.visible !== false) { const g = m.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(n); };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.who = [];
  for (const k of ORDER.filter(k => !ONLY || k === ONLY)) { STATS.at = k; const t0 = performance.now(), G = wGenome(k, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = XS[k]; M.root.position.z = k === 'tomcan' ? -1.5 : k === 'elias' ? -.2 : k === 'ord' ? .45 : -.2;
    if (k === 'nell') M.root.rotation.y = -.25; if (k === 'ord') M.root.rotation.y = .35; if (k === 'elias') M.root.rotation.y = -.3;
    M.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; if (o.isPointLight) o.intensity *= .25; });
    let raven = null; if (WANDER[k].own.raven) { raven = buildBeast(beastGenome('raven', 'strange:dean')); raven.gait = 'stand'; poseBeast(raven, 0); }
    const pr = wProps(M, G, { raven });
    if (k === 'tomcan' && pr.seatY != null) { const gm = gateMouth(pr.seatY, stoneM); gm.position.set(pr.seatX, 0, pr.seatZ - .9); scene.add(gm); STATS.set.gate = tri(gm); }
    M.root.updateMatrixWorld(true); HEAD[k] = M.byName.head.getWorldPosition(new THREE.Vector3());
    STATS.who.push({ k, pr, height: +statureOf(G).toFixed(3), tris: tri(M.root), raven: raven ? tri(raven.root) : 0, ms: Math.round(performance.now() - t0) }); }
  // Stump: none at a (the rings), half out at the bank at b, whole on the bank at c
  if (LEVEL !== 'a' && (!ONLY || ONLY === 'nell')) { dammerPlan(); const C = buildBeast(beastGenome('dammer', 'strange:stump', { island: 'mark' })); C.gait = 'stand'; poseBeast(C, 0);
    C.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    if (LEVEL === 'b') { C.root.rotation.order = 'YXZ'; C.root.position.set(XS.nell - 2.6, -.9, 2.1); C.root.rotation.y = 1.95; C.root.rotation.x = -.3; }
    else { C.root.position.set(XS.nell - 2.5, 0, -1.0); C.root.rotation.y = 1.45; }
    scene.add(C.root); C.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(C.root), sz = bb.getSize(new THREE.Vector3());
    STATS.stump = { tris: tri(C.root), size: sz.toArray().map(v => +v.toFixed(2)), top: +bb.max.y.toFixed(2), legs: C.B?.legs?.length ?? null }; }
  STATS.set.punt = tri(pu); STATS.set.heron = tri(hr); STATS.set.wall = tri(wall); STATS.set.dam = tri(dm); STATS.set.hat = tri(hat);
  aim();
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
