// Families and feuds (the concept artist, 21 Nov 2026; backlog L2, OG-090): families.js's eleven stood by house in a line on a flagged
// square in the afternoon, the 1.8 m post among them; at c each house with its banner (the glen with its stone, the Redmarsh with its
// punt). ?level=a|b|c (b, the draft's faces and one sign of the house, is the default), &cam=wide (default) | kin | close | face | scale |
// high or x,y,z,tx,ty,tz, &house=velleii|ironmere|stannard|caelmont|glen|redmarsh (kin), &who=<member> (close, face, scale), &turn=1
// shows their backs, &only=<house>.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor, GARMENTS, DRESS_FLAGS } from './people.js';
import { shrineTextures } from './shrines.js';
import { HOUSES, FAMILIES, ORDER, famGenome, famProps, famScene } from './families.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', CAM = Q.get('cam') || 'wide', TURN = Q.has('turn');
const WHO = FAMILIES[Q.get('who')] ? Q.get('who') : 'marcia', HOUSE = HOUSES[Q.get('house')] ? Q.get('house') : FAMILIES[WHO].house;
const R = makeRenderer(.84), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .83, .86), .005);
const cam = new THREE.PerspectiveCamera(36, W / H, .02, 30000); buildTextures(); shrineTextures(); reseed(16);
const SUN = new THREE.Vector3(-.5, .42, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .86, .68), 2.8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.38, .34, .28), 1.2));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
ground(400, 400, mat('grass', { ns: 1, rough: 1 }), 0, 0, -.005); ground(26, 9, mat('flag', { ns: .8, color: 0xfff4e0, rough: .85 }), 0, -1.6, .001, .7);
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const trees = []; for (let i = 0; i < 16; i++) { const x = -48 + i * 6.5 + Math.sin(i * 7.1) * 2, z = -22 - (i % 3) * 7; trees.push([x, 0, z, .8 + (i % 4) * .08, i, new THREE.Color(.95, 1, .7)]); }
treeKit(SUN).plant(scene, trees);
// the line: 1.15 m between kin, 1.9 m between houses; the two feuding halls at the two ends of one gap
const XS = {}; { let x = 0, last = null; for (const k of ORDER) { const h = FAMILIES[k].house; if (last) x += h === last ? 1.15 : 1.9; XS[k] = x; last = h; } const mid = x / 2; for (const k of ORDER) XS[k] -= mid; }
const X = k => XS[k], hOf = k => FAMILIES[k].metres;
const hx = h => { const m = HOUSES[h].members; return (X(m[0]) + X(m[m.length - 1])) / 2; };
post.position.set(CAM === 'scale' ? X(WHO) + .55 : (X('kallias') + X('gifu')) / 2, 0, CAM === 'scale' ? .25 : .35);
const lookAt = (p, t) => { cam.position.set(...p); cam.lookAt(...t); };
if (CAM === 'close') { cam.fov = 30; lookAt([X(WHO) + .2, hOf(WHO) * .72, TURN ? -3.6 : 3.6], [X(WHO), hOf(WHO) * .6, 0]); }
else if (CAM === 'face') { const h = hOf(WHO); cam.fov = 22; lookAt([X(WHO) + .3, h * .92, TURN ? -1.6 : 1.6], [X(WHO), h * .86, 0]); }
else if (CAM === 'hands') { cam.fov = 22; lookAt([X(WHO) + .5, hOf(WHO) * .6, 1.5], [X(WHO), hOf(WHO) * .5, 0]); }
else if (CAM === 'scale') { cam.fov = 32; lookAt([X(WHO) + .3, 1.0, 4.2], [X(WHO) + .3, .95, 0]); }
else if (CAM === 'kin') { const c = hx(HOUSE), n = HOUSES[HOUSE].members.length; cam.fov = 30; lookAt([c + .5, 1.6, (TURN ? -1 : 1) * (n > 1 ? 6.6 : 5.6)], [c, 1.25, -.6]); }
else if (CAM === 'feud') { const c = (hx('ironmere') + hx('stannard')) / 2; cam.fov = 32; lookAt([c, 1.7, 9.4], [c, 1.4, -.8]); }
else if (CAM === 'high') { cam.fov = 40; lookAt([0, 8, 14], [0, .8, -1.5]); }
else { cam.fov = 36; lookAt([0, 1.75, TURN ? -16.4 : 16.8], [0, 1.3, -1.2]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); lookAt(c.slice(0, 3), c.slice(3)); }
cam.updateProjectionMatrix();
const comp = makeComposer(R, scene, cam, { bloom: .2, bloomT: .9, sat: 1.06, vig: .26 });
R.info.autoReset = !STILL;
const P = { rollGenome, heightFor, GARMENTS, DRESS_FLAGS };
// where each house's set piece stands at c: behind its people, x from the house's middle
const SET = { velleii: ['velleii', .0, -1.1], ironmere: ['ironmere', -.95, -1.0], stannard: ['stannard', .95, -1.0], caelmont: ['caelmont', 0, -1.1], glen: ['stone', .1, -1.05], redmarsh: ['punt', .2, -2.0] };
const only = HOUSES[Q.get('only')] ? Q.get('only') : (CAM === 'kin' ? HOUSE : CAM === 'feud' ? 'feud' : null);
const show = k => !only || (only === 'feud' ? ['ironmere', 'stannard'].includes(FAMILIES[k].house) : FAMILIES[k].house === only);
loadPack('mh/').then(() => { STATS.level = LEVEL; STATS.fam = []; STATS.sets = {};
  for (const k of ORDER.filter(show)) { STATS.at = k; const t0 = performance.now(), G = famGenome(k, LEVEL, P), M = makePerson(G); scene.add(M.root);
    M.root.position.x = X(k); M.root.position.z = FAMILIES[k].house === 'redmarsh' ? .1 : 0; if (TURN && CAM !== 'close' && CAM !== 'face') {} let tris = 0;
    M.root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    M.root.traverse(o => { if (o.isPointLight) o.intensity *= .25; });
    const pr = famProps(M, G);
    STATS.fam.push({ k, pr, height: +statureOf(G).toFixed(3), tris: Math.round(tris), ms: Math.round(performance.now() - t0) }); }
  if (LEVEL === 'c') for (const [h, [kind, dx, dz]] of Object.entries(SET)) { if (!HOUSES[h].members.some(show)) continue;
    const s = famScene(kind); s.position.set(hx(h) + dx, 0, dz); if (kind === 'punt') s.rotation.y = .25; s.traverse(o => { if (o.isPointLight) o.intensity *= .3; }); scene.add(s); STATS.sets[h] = s.userData.tris; }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => { R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; });
