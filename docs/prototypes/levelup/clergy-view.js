// The clergy's dress (the bodies builder, Session 2570; backlog L1): clergy.js's six in three pairs, the Gatelands', the Mark's and
// Aurenne's, on flagstones in daylight, the 1.8 m post among them. ?level=a|b|c (b, by island, is the default), &cam=wide (default) |
// close | high or x,y,z,tx,ty,tz, &who=<key> (close), &turn=1 shows their backs, &only=<key> builds one. faith-view.js's stage.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { shrineTextures } from './shrines.js';
import { CLERGY, ORDER, clergyGenome } from './clergy.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', WHO = CLERGY[Q.get('who')] ? Q.get('who') : 'glMan', TURN = Q.has('turn');
const R = makeRenderer(.84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .83, .86), .005);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(15);
const SUN = new THREE.Vector3(-.5, .42, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .86, .68), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.38, .34, .28), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005); ground(15, 4.2, mat('flag', { ns: .8, color: 0xfff4e0, rough: .85 }), 0, .6, .001, .7);
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(0, i * .1, 0), m)); }
scene.add(post);
const trees = []; for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -22 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
// the pairs 1.0 m apart, the islands 2.4 m apart
const X = k => { const i = ORDER.indexOf(k), pair = Math.floor(i / 2); return (pair - 1) * 3.4 + (i % 2 ? .5 : -.5); };
post.position.set(X('mkWoman') + 1.2, 0, .35);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const hOf = k => CLERGY[k].metres;
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .25, hOf(WHO) * .72, TURN ? -3.4 : 3.4], [X(WHO), hOf(WHO) * .6, 0]); }
else if (CAM === 'high') { cam.fov = 40; lookAt([0, 7, 9], [0, .8, -1]); }
else { cam.fov = 30; lookAt([0, 1.05, TURN ? -9.6 : 9.6], [0, 1.0, -.4]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.clergy = [];
  for (const k of (Q.get('only') ? [Q.get('only')] : ORDER)) { STATS.at = k; const t0 = performance.now(), G = clergyGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } if (o.isPointLight) o.intensity *= .25; });
    const names = []; M.root.traverse(o => { if (o.isMesh && o.name) names.push(o.name); });
    STATS.clergy.push({ k, height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0), book: M.book && { lift: M.book.lift, inside: M.book.inside, clear: M.book.clear }, parts: [...new Set(names)].filter(n => /robe|tabard|cord|hood|cowl|book|lantern|cloak|sash|wrap|sign|shuttle|band|brooch/i.test(n)) }); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
