// The strange and the legendary, I (the concept artist, 22 Nov 2026; backlog L2, OG-054 and OG-071's Branwen): strange.js's three on a
// green in the low evening sun: Fiontán on the road at the left, walking the way you went; Bláthnat sat on a root of the great elm by a
// Gatelands wayside shrine (An Chloch's) in the middle; the Veiled Merchant behind his stall on the flags at the right; at c the Painted
// Woman's portrait on its easel beside the stall. ?level=a|b|c (b, the draft's faces, is the default), &cam=wide (default) | close | face |
// scale | high or x,y,z,tx,ty,tz, &who=fiontan|blathnat|veiled (close, face, scale), &turn=1 from behind, &only=<who>.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { shrineTextures, niche } from './shrines.js';
import { STRANGE, ORDER, strGenome, strProps, veiledStall, rootSeat, fungus, portrait } from './strange.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', TURN = Q.has('turn');
const WHO = STRANGE[Q.get('who')] ? Q.get('who') : 'fiontan', ONLY = STRANGE[Q.get('only')] ? Q.get('only') : null;
const R = makeRenderer(.86), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.86, .78, .7), .006);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(22);
const SUN = new THREE.Vector3(-.62, .24, .74).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .76, .52), 2.9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.6, .66, .86), new THREE.Color(.36, .3, .24), 1.15));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const XS = { fiontan: -3.5, blathnat: 0, veiled: 3.4 };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005);
ground(2.4, 60, mat('stone', { ns: .6, color: 0xb09878, rough: 1 }), XS.fiontan, 0, .001, .6);
ground(4.4, 4.2, mat('flag', { ns: .8, color: 0xfff0dc, rough: .85 }), XS.veiled + .6, -.3, .002, .7);
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
post.position.set(CAM === 'scale' ? XS[WHO] + .6 : -2.3, 0, CAM === 'scale' ? .2 : .2);
// the great elm behind her, and the wood beyond
const trees = [[0, 0, -2.7, 1.35, 3, new THREE.Color(.9, 1, .7)]]; for (let i = 0; i < 14; i++) { const x = -44 + i * 6.8 + Math.sin(i * 7.1) * 2, z = -16 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
const shrine = niche('cloch', 'gatelands'); shrine.group.position.set(-1.9, 0, -2.0); shrine.group.rotation.y = .45; shrine.group.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; if (o.isPointLight) o.intensity *= .3; }); scene.add(shrine.group);
const stall = veiledStall(LEVEL); stall.position.set(XS.veiled, 0, 0); stall.traverse(o => { if (o.isPointLight) o.intensity *= .5; }); scene.add(stall);
if (LEVEL === 'c') { const p = portrait(); p.position.set(XS.veiled - 1.45, 0, .7); p.rotation.y = .3; scene.add(p); STATS.portrait = p.userData.tris; }
STATS.stall = stall.userData.tris;
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const comp = makeComposer(R, scene, cam, { bloom: .24, bloomT: .88, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS }, HEAD = {};
function aim() { const x = XS[WHO], hy = HEAD[WHO] ? HEAD[WHO].y : 1.6, s = TURN ? -1 : 1;
  if (CAM === 'close') { cam.fov = 30; WHO === 'veiled' ? lookAt([x + .6, 1.6, s * 4.4], [x + .1, 1.25, 0]) : lookAt([x + .25, hy * .72, s * (WHO === 'blathnat' ? 3.2 : 3.8)], [x, hy * .58, WHO === 'blathnat' ? -.6 : 0]); }
  else if (CAM === 'face') { const h = HEAD[WHO] || new THREE.Vector3(x, 1.6, 0); cam.fov = 22; lookAt([h.x + .3, h.y + .02, h.z + s * 1.5], [h.x, h.y - .02, h.z]); }
  else if (CAM === 'scale') { cam.fov = 32; lookAt([x + .35, 1.0, 4.6], [x + .35, .95, 0]); }
  else if (CAM === 'high') { cam.fov = 40; lookAt([0, 8, 13], [0, .8, -1]); }
  else { cam.fov = 40; lookAt([.1, 1.35, TURN ? -7.6 : 7.4], [.1, 1.2, -.7]); }
  if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); } cam.updateProjectionMatrix(); }
aim();
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.who = [];
  for (const k of ORDER.filter(k => !ONLY || k === ONLY)) { const t0 = performance.now(), G = strGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = XS[k]; M.root.position.z = k === 'veiled' ? -.62 : k === 'blathnat' ? -1.0 : 0; if (k === 'fiontan') M.root.rotation.y = .35;
    M.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; if (o.isPointLight) o.intensity *= .25; });
    const pr = strProps(M, G, LEVEL); let tris = 0; M.root.traverse(o => { if (o.isMesh && o.visible !== false) { const g = o.geometry; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (vis) tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    if (k === 'blathnat' && pr.seatY != null) { const rs = rootSeat(pr.seatY, 1.9); rs.position.set(pr.seatX, 0, pr.seatZ); rs.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(rs);
      if (LEVEL === 'c') { const f = fungus(); f.position.set(XS[k] + .1, 0, M.root.position.z - .5); scene.add(f); } }
    M.root.updateMatrixWorld(true); HEAD[k] = M.byName.head.getWorldPosition(new THREE.Vector3());
    STATS.who.push({ k, pr, height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
  aim();
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
