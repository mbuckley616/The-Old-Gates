// Faith (the concept artist, 19 Nov 2026; backlog L2, OG-091): faith.js's five stood in a line before the Gatelands' row of the six gods'
// niches and the Guest's empty one (shrines.js), the 1.8 m post among them. ?level=a|b|c (b, the draft's faces, is the default),
// &cam=wide (default) | close | face | scale | high or x,y,z,tx,ty,tz, &who=amani|alain|saewynn|calix|child (close, face and scale),
// &turn=1 shows their backs, &time=dusk puts the sun down and lights the lanterns, &only=<key> builds one.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { row, shrineTextures } from './shrines.js';
import { FAITH, ORDER, faithGenome, faithProps } from './faith.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', WHO = FAITH[Q.get('who')] ? Q.get('who') : 'amani', TURN = Q.has('turn'), DUSK = Q.get('time') === 'dusk';
const R = makeRenderer(DUSK ? 1.0 : .84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.36, .32, .38) : new THREE.Color(.8, .83, .86), DUSK ? .01 : .005);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(15);
const SUN = DUSK ? new THREE.Vector3(-.75, .07, .66).normalize() : new THREE.Vector3(-.5, .42, .7).normalize();
const sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .58, .36) : new THREE.Color(1, .86, .68), DUSK ? 1.0 : 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(DUSK ? new THREE.Color(.34, .36, .5) : new THREE.Color(.64, .72, .88), DUSK ? new THREE.Color(.16, .13, .12) : new THREE.Color(.38, .34, .28), DUSK ? .5 : 1.2));
skyDome(scene, SUN, DUSK ? { zen: [.05, .07, .2], mid: [.22, .2, .38], hor: [.86, .52, .36], glow: [1, .5, .25], glowK: .6, k: .9 } : {});
clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300, ...(DUSK ? { lo: [.3, .26, .34], hi: [1.1, .62, .44] } : {}) });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005); ground(18, 4.2, mat('flag', { ns: .8, color: 0xfff4e0, rough: .85 }), 0, .6, .001, .7);
// the row of the six and the Guest's, 5.2 m behind the line
const shrines = row('gatelands'); shrines.group.position.set(0, 0, -5.2); scene.add(shrines.group); STATS.shrineTris = shrines.tris;
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const trees = []; for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -22 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
const SPACE = 1.95, X = k => (ORDER.indexOf(k) - 2) * SPACE;
post.position.set(CAM === 'scale' ? X(WHO) + .55 : X('alain') + 1.0, 0, CAM === 'scale' ? .25 : .35);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
const hOf = k => FAITH[k].metres;
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .2, hOf(WHO) * .72, TURN ? -3.6 : 3.6], [X(WHO), hOf(WHO) * .6, 0]); }
else if (CAM === 'face') { const h = hOf(WHO); cam.fov = 24; lookAt([X(WHO) + .3, h * .92, TURN ? -1.7 : 1.7], [X(WHO), h * .85, 0]); }
else if (CAM === 'scale') { cam.fov = 32; lookAt([X(WHO) + .3, 1.0, 4.2], [X(WHO) + .3, .95, 0]); }
else if (CAM === 'high') { cam.fov = 40; lookAt([0, 7, 9], [0, .8, -1]); }
else { cam.fov = 30; lookAt([0, 1.05, TURN ? -9.2 : 9.2], [0, 1.08, -1.2]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: DUSK ? .45 : .2, bloomT: DUSK ? .7 : .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.faith = [];
  for (const k of (Q.get('only') ? [Q.get('only')] : ORDER)) { STATS.at = k; const t0 = performance.now(), G = faithGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); M.root.position.z = 0; let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    const pr = faithProps(M, G);
    // a lantern lit by the kit (Sæwynn's at a) is lit as the cage is at dusk: a small light at the horn
    if (DUSK && G.dress.lantern) { const l = M.root.getObjectByName('lantern'); if (l) { const pl = new THREE.PointLight(0xffb060, 1.4, 4, 2); l.add(pl); } }
    if (!DUSK) M.root.traverse(o => { if (o.isPointLight) o.intensity *= .25; });
    STATS.faith.push({ k, pr, height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
