// The guild heads (the concept artist, 16 Nov 2026; backlog L2, OG-064): guildheads.js's eight, the Fighters' Guildmaster and the
// Mages' Archmage as each of the four peoples, stood in a line on a paved square in the afternoon (the four Guildmasters on the left,
// the four Archmages on the right), the 1.8 m post among them. ?level=a|b|c (b, the guild's livery over their people, is the default),
// &cam=wide (default) | close | face | scale | high | pair or x,y,z,tx,ty,tz, &who=f_gl|f_mk|f_au|f_ob|m_gl|m_mk|m_au|m_ob, &turn=1.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS} from './people.js';
import { shrineTextures } from './shrines.js';
import { GUILDS as POWERS, ORDER, guildGenome, guildProps } from './guildheads.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', WHO = POWERS[Q.get('who')] ? Q.get('who') : 'f_gl', TURN = Q.has('turn');
const R = makeRenderer(.84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .83, .86), .005);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(16);
const SUN = new THREE.Vector3(-.5, .42, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .86, .68), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.38, .34, .28), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005); ground(22, 8, mat('flag', { ns: .8, color: 0xfff4e0, rough: .85 }), 0, -.5, .001, .7);
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const trees = []; for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -22 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
const SPACE = 1.45, X = k => (ORDER.indexOf(k) - 3.5) * SPACE;
post.position.set(CAM === 'scale' ? X(WHO) + .55 : X('f_ob') + .72, 0, CAM === 'scale' ? .25 : .35);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .2, 1.3, TURN ? -3.6 : 3.6], [X(WHO), 1.08, 0]); }
else if (CAM === 'face') { const h = POWERS[WHO].metres; cam.fov = 24; lookAt([X(WHO) + .3, h * .92, TURN ? -1.7 : 1.7], [X(WHO), h * .85, 0]); }
else if (CAM === 'scale') { cam.fov = 32; lookAt([X(WHO) + .3, 1.0, 4.2], [X(WHO) + .3, .95, 0]); }
else if (CAM === 'pair') { const i = ORDER.indexOf(WHO) % 4, a = X(ORDER[i]), b = X(ORDER[i + 4]); cam.fov = 30; lookAt([(a + b) / 2, 1.3, 9.5], [(a + b) / 2, .95, 0]); }
else if (CAM === 'high') { cam.fov = 40; lookAt([0, 7, 9], [0, .8, 0]); }
else { cam.fov = 30; lookAt([0, 1.25, TURN ? -12.6 : 12.6], [0, 1.0, 0]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.heads = [];
  for (const k of (Q.get("only") ? [Q.get("only")] : ORDER)) { STATS.at = k; const t0 = performance.now(), G = guildGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); M.root.position.z = 0; const propTris = guildProps(M, G); let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    STATS.heads.push({ k, propTris, height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
