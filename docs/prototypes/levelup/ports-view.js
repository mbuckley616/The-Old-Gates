// Ports and their trades (the concept artist, 24 Nov 2026; backlog L6, OG-093): ports.js's five on one flagged Gatelands quay in the
// afternoon, the harbour behind them and a black sail off the head, the nailed penny at her masthead (every level); the 1.8 m post among
// them. At c each with their trade's place (the desk, the chandlery, the broker's awning, the salvage and the skiff, the hall's door).
// ?level=a|b|c (b, the trade in hand, is the default), &cam=wide (default) | close | face | scale | high | scene | penny or
// x,y,z,tx,ty,tz, &who=harbour|chandler|broker|salvager|hall (close, face, scale, scene), &turn=1 shows their backs, &only=<key>.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { markCutter, blackSail } from './ships.js';
import { stream } from './pieces.js';
import { PORTS, ORDER, portGenome, portProps, portScene, pennyFlag, skiff } from './ports.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', WHO = PORTS[Q.get('who')] ? Q.get('who') : 'harbour', TURN = Q.has('turn');
const R = makeRenderer(.84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .86), .0026);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); reseed(24);
const SUN = new THREE.Vector3(-.55, .45, .62).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .87, .7), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.38, .36, .32), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
// the quay: flags from its edge (z -2.6) landward, its face of ashlar down to the harbour's bed, the water 0.9 m under the flags at the flood
const EDGE = -2.6, WATER_Y = -.9;
const plane = (w, d, m, x, z, y, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
plane(60, 30, mat('flag', { ns: .5, color: 0xffffff, rough: .85 }), 0, EDGE + 15, 0, .4);
{ const f = new THREE.Mesh(new THREE.BoxGeometry(60, 3, .6), mat('ashlar', { ns: 1, color: 0xd8d0c0, rough: .9 })); f.position.set(0, -1.5, EDGE + .3); f.receiveShadow = true; scene.add(f);
  const cope = new THREE.Mesh(new THREE.BoxGeometry(60, .16, .5), mat('slab', { ns: .7, color: 0xe0d8c8, rough: .85 })); cope.position.set(0, .02, EDGE + .25); cope.receiveShadow = cope.castShadow = true; scene.add(cope);
  const weed = new THREE.Mesh(new THREE.BoxGeometry(60, .35, .02), new THREE.MeshStandardMaterial({ color: new THREE.Color(.08, .12, .06), roughness: .9 })); weed.position.set(0, WATER_Y + .1, EDGE - .005); scene.add(weed);
  const wg = new THREE.PlaneGeometry(900, 600); wg.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: new THREE.Color(.22, .32, .36), roughness: .12, metalness: .2, transparent: true, opacity: .94 }));
  water.position.set(0, WATER_Y, EDGE - 300); water.receiveShadow = true; scene.add(water);
  // the head across the harbour: a long low land with trees, a light on its point
  const hg = new THREE.PlaneGeometry(900, 120, 90, 12); hg.rotateX(-Math.PI / 2); const hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), z = hp.getZ(i), t = (z + 60) / 120; hp.setY(i, Math.max(-3, 26 * (1 - t) * (1 - t) * (.6 + .4 * Math.sin(x * .012) + .2 * Math.sin(x * .05)) - 2)); }
  hg.computeVertexNormals(); const head = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: new THREE.Color(.2, .28, .14), roughness: 1 })); head.position.set(-120, WATER_Y, -230); scene.add(head); }
// bollards and a mooring ring along the coping
for (const x of [-7.8, -1.3, 7.6]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .55, 14), new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: .5, metalness: .5 })); b.position.set(x, .3, EDGE + .35); b.castShadow = true; scene.add(b);
  const c = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), b.material); c.position.set(x, .57, EDGE + .35); scene.add(c); }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
// the black sail off the head: a Markish cutter (the Mark sponsors the free captains, §1.2) in the black dress, the nailed penny aloft
const BS = markCutter({}, stream('cutter:freecaptain')); blackSail(BS, {}); pennyFlag(BS, { yaw: .7 });
BS.group.position.set(CAM === 'penny' ? 0 : 14, WATER_Y, -72); BS.group.rotation.y = -Math.PI / 2 + .25; BS.group.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(BS.group);
const SPACE = 2.35, X = k => (ORDER.indexOf(k) - 2) * SPACE;
post.position.set(CAM === 'scale' ? X(WHO) + .55 : X('broker') - 1.1, 0, CAM === 'scale' ? .25 : .4);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const hOf = k => PORTS[k].metres;
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .2, hOf(WHO) * .72, TURN ? -2.2 : 3.6], [X(WHO), hOf(WHO) * .6, 0]); }
else if (CAM === 'face') { const h = hOf(WHO); cam.fov = 24; lookAt([X(WHO) + .3, h * .92, 1.7], [X(WHO), h * .85, 0]); }
else if (CAM === 'scale') { cam.fov = 32; lookAt([X(WHO) + .3, 1.0, 4.2], [X(WHO) + .3, .95, 0]); }
else if (CAM === 'scene') { cam.fov = 40; lookAt([X(WHO) + .5, WHO === 'salvager' ? 5 : 1.6, 5.6], [X(WHO), WHO === 'salvager' ? .2 : 1.1, WHO === 'salvager' ? -2.4 : -1.2]); }
else if (CAM === 'high') { cam.fov = 48; lookAt([1.5, 5.2, 10], [1.5, .2, -6]); }
else if (CAM === 'penny') { cam.fov = 4.2; lookAt([0, 1.6, EDGE + .2], [BS.group.position.x - .6, WATER_Y + (BS.banner.head || 10) - .9, -72]); }
else { cam.fov = 34; lookAt([0, 1.55, TURN ? -11 : 11.5], [0, 1.15, -1.6]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
// where each set piece stands, relative to its person (c only): [dx, dz, turn]
const AT = { harbour: [-.95, -.75, .35], chandler: [-.4, -1.45, 0], broker: [.25, -1.35, 0], salvager: [.75, -1.05, -.25], hall: [.1, -1.9, 0] };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.port = []; STATS.penny = BS.banner && { hoist: BS.banner.hoist, fly: BS.banner.fly, head: BS.banner.head, at: BS.banner.at };
  for (const k of (Q.get('only') ? [Q.get('only')] : ORDER)) { STATS.at = k; const t0 = performance.now(), G = portGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); M.root.position.z = 0; let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    M.root.traverse(o => { if (o.isPointLight) o.intensity *= .25; });
    const pr = portProps(M, G); let sceneTris = 0;
    if (LEVEL === 'c' && AT[k]) { const s = portScene(k); s.position.set(X(k) + AT[k][0], 0, AT[k][1]); s.rotation.y = AT[k][2]; scene.add(s); sceneTris = s.userData.tris;
      if (k === 'salvager') { const b = skiff(); b.position.set(X(k) + .4, WATER_Y, EDGE - 2.1); b.rotation.y = .06; b.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; sceneTris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); scene.add(b);
        const lad = new THREE.Group(), iron = new THREE.MeshStandardMaterial({ color: 0x22201e, roughness: .5, metalness: .5 }); for (const dx of [-.22, .22]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.6, .03), iron); r.position.set(dx, -.7, 0); lad.add(r); }
        for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .44, 6), iron); r.rotation.z = Math.PI / 2; r.position.set(0, -.05 - i * .3, 0); lad.add(r); } lad.position.set(X(k) + 1.6, 0, EDGE - .03); scene.add(lad); } }
    STATS.port.push({ k, pr, scene: Math.round(sceneTris), height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
