// Townsfolk with names (the concept artist, 20 Nov 2026; backlog L2, OG-082): townsfolk.js's five stood in a line on a flagged quay in
// the afternoon, the 1.8 m post among them; at c each with the set piece of their work (the inn's sign, the ringed stone, the hull on the
// stocks, the altar, a red deer). ?level=a|b|c (b, the sheet's faces and tools, is the default), &cam=wide (default) | close | face |
// scale | high or x,y,z,tx,ty,tz, &who=mairead|darragh|iliana|caelen|lyra (close, face and scale), &turn=1 shows their backs, &only=<key>.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { genome as beastGenome, build as buildBeast, pose as poseBeast } from './creatures.js';
import { shrineTextures } from './shrines.js';
import { TOWNSFOLK, ORDER, townGenome, townProps, townScene } from './townsfolk.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', WHO = TOWNSFOLK[Q.get('who')] ? Q.get('who') : 'mairead', TURN = Q.has('turn');
const R = makeRenderer(.84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .83, .86), .005);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(16);
const SUN = new THREE.Vector3(-.5, .42, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .86, .68), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.38, .34, .28), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005); ground(20, 9, mat('flag', { ns: .8, color: 0xfff4e0, rough: .85 }), 0, -1.6, .001, .7);
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const trees = []; for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -22 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
const SPACE = 1.95, X = k => (ORDER.indexOf(k) - 2) * SPACE;
post.position.set(CAM === 'scale' ? X(WHO) + .55 : X('darragh') + 1.0, 0, CAM === 'scale' ? .25 : .35);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const hOf = k => TOWNSFOLK[k].metres;
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .2, hOf(WHO) * .72, TURN ? -3.6 : 3.6], [X(WHO), hOf(WHO) * .6, 0]); }
else if (CAM === 'face') { const h = hOf(WHO); cam.fov = 24; lookAt([X(WHO) + .3, h * .92, TURN ? -1.7 : 1.7], [X(WHO), h * .85, 0]); }
else if (CAM === 'scale') { cam.fov = 32; lookAt([X(WHO) + .3, 1.0, 4.2], [X(WHO) + .3, .95, 0]); }
else if (CAM === 'scene') { cam.fov = 36; lookAt([X(WHO) + .4, 1.5, 6.2], [X(WHO) - .1, 1.2, -1]); }
else if (CAM === 'high') { cam.fov = 40; lookAt([0, 7, 10], [0, .8, -1.5]); }
else { cam.fov = 30; lookAt([0, 1.3, TURN ? -10.5 : 11], [0, 1.3, -1.4]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
// where each set piece stands, relative to its person (c only)
const AT = { mairead: [-.75, -1.0, 0], darragh: [.6, -1.2, -.2], iliana: [.3, -4.6, .42], caelen: [.55, -1.15, -.15] };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.town = [];
  for (const k of (Q.get('only') ? [Q.get('only')] : ORDER)) { STATS.at = k; const t0 = performance.now(), G = townGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); M.root.position.z = 0; let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    M.root.traverse(o => { if (o.isPointLight) o.intensity *= .25; });
    const pr = townProps(M, G); let sceneTris = 0;
    if (LEVEL === 'c' && AT[k]) { const s = townScene(k); s.position.set(X(k) + AT[k][0], 0, AT[k][1]); s.rotation.y = AT[k][2]; s.traverse(o => { if (o.isPointLight) o.intensity *= .3; }); scene.add(s); sceneTris = s.userData.tris; }
    if (LEVEL === 'c' && k === 'lyra') { const C = buildBeast(beastGenome('deer', 'town:lyra', { island: 'gatelands' })); C.gait = 'stand'; poseBeast(C, 0); C.root.position.set(X(k) + .95, 0, -1.7); C.root.rotation.y = -.55;
      C.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; sceneTris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); scene.add(C.root); }
    STATS.town.push({ k, pr, scene: Math.round(sceneTris), height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
