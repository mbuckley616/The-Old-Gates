// The campfire and the stump (the concept artist, 10 Nov 2026): camp.js's fire in a clearing on its island, or the three stumps.
// ?island=gatelands|mark|aurenne, &mode=plain|ring|island (A, B, C), &stage=lit|burning|embers|out, &hour=dusk|night|day,
// &cam=close|wide|scale|high, &what=fire|stumps, &nopeople, &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, reseed, rnd, texPair, makeRenderer, makeComposer, buildTextures, skyDome, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { campfire, stump, tf, CAMP_MODES, CAMP_STAGES, ISLANDS } from './camp.js';

const ISLAND = ISLANDS.includes(Q.get('island')) ? Q.get('island') : 'gatelands', MODE = CAMP_MODES[Q.get('mode')] ? Q.get('mode') : 'island';
const STAGE = Q.get('stage') in CAMP_STAGES ? Q.get('stage') : 'lit', HOUR = Q.get('hour') || 'dusk', WHAT = Q.get('what') || 'fire', CAM = Q.get('cam') || (WHAT === 'stumps' ? 'stumps' : 'close');
const R = makeRenderer(HOUR === 'day' ? .85 : HOUR === 'night' ? 1.15 : .95), scene = new THREE.Scene(); buildTextures();
const cam = new THREE.PerspectiveCamera(CAM === 'close' ? 38 : CAM === 'high' ? 42 : 45, W / H, .05, 30000);

// ── the hour: dusk (the sun 4° up, gold), night (a half moon, blue), day (high, soft) ──
const SKYS = {
  dusk: { sun: [-.55, .07, -.83], col: [1, .62, .36], k: 1.6, hemi: [[.42, .46, .62], [.18, .14, .1], .55], sky: { zen: [.1, .16, .38], mid: [.42, .42, .58], hor: [1, .66, .42], glow: [1, .55, .25], glowK: .8 }, fog: [.62, .52, .48, .006] },
  night: { sun: [.3, .55, -.78], col: [.55, .66, 1], k: .32, hemi: [[.12, .16, .3], [.03, .03, .04], .3], sky: { zen: [.01, .02, .06], mid: [.03, .05, .12], hor: [.07, .09, .16], glow: [.4, .5, .7], glowK: .1, k: .8 }, fog: [.05, .06, .1, .01] },
  day: { sun: [-.5, .62, -.6], col: [1, .93, .82], k: 2.8, hemi: [[.6, .7, .86], [.3, .3, .2], 1.1], sky: { zen: [.12, .27, .6], mid: [.36, .54, .82], hor: [.8, .85, .9] }, fog: [.8, .84, .88, .004] } };
const S = SKYS[HOUR] || SKYS.dusk, SUN = new THREE.Vector3(...S.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(S.fog[0], S.fog[1], S.fog[2]), S.fog[3]);
const sun = new THREE.DirectionalLight(new THREE.Color(...S.col), S.k); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .02;
sun.position.copy(SUN).multiplyScalar(60); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 160 }); sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...S.hemi[0]), new THREE.Color(...S.hemi[1]), S.hemi[2]));
skyDome(scene, SUN, S.sky); reseed(5); if (HOUR !== 'night') clouds(scene, SUN, { n: 10, d0: 1400, dw: 4000, y0: 420, lo: HOUR === 'dusk' ? [.5, .38, .42] : undefined, hi: HOUR === 'dusk' ? [1.4, .9, .6] : undefined });

// ── the ground: the island's turf (the Gatelands green, the Mark's heather and old snow, Aurenne's dry earth and thin grass) ──
const GROUND = {
  gatelands: (x, y, n, m) => { const v = .3 + .12 * n; return [n, v * .6, v * 1.05, v * .36]; },
  mark: (x, y, n, m) => { const snow = m > .62 ? 1 : 0, heather = m < .38 ? 1 : 0, v = .26 + .1 * n; return snow ? [.8 + .2 * n, .86, .88, .92] : heather ? [n, v * .9, v * .62, v * .7] : [n, v * .7, v * .9, v * .5]; },
  aurenne: (x, y, n, m) => { const g = m < .4 ? 1 : 0, v = .5 + .14 * n; return g ? [n, v * .6, v * .7, v * .36] : [n, v * 1.05, v * .86, v * .62]; } };
const gt = texPair(512, (x, y) => GROUND[ISLAND](x, y, tf(x, y, 32, 4, 3) * .7 + tf(x, y, 128, 2, 5) * .3, tf(x, y, 4, 4, 9)), 1.6);
gt.map.repeat.set(30, 30); gt.normalMap.repeat.set(30, 30);
const groundH = (x, z) => { const d = Math.hypot(x, z); return d < 8 ? 0 : (Math.sin(x * .07) * Math.cos(z * .05) * 1.4 + Math.sin(x * .021 + 1) * 3) * Math.min(1, (d - 8) / 25); };
{ const g = new THREE.PlaneGeometry(240, 240, 120, 120); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, groundH(P.getX(i), P.getZ(i))); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: gt.map, normalMap: gt.normalMap, roughness: .95 })); m.receiveShadow = true; scene.add(m); }
// trees round the clearing: the Gatelands' oaks and ash, the Mark's pines (darker), Aurenne's few olives (grey-green, low)
{ const T = treeKit(SUN), list = []; reseed(23); const n = ISLAND === 'aurenne' ? 14 : 34;
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = 13 + rnd() * 40, x = Math.cos(a) * d, z = Math.sin(a) * d; if (z > 4 && Math.abs(x) < 12) continue;
    const tint = ISLAND === 'mark' ? new THREE.Color(.55, .75, .5) : ISLAND === 'aurenne' ? new THREE.Color(.85, .95, .75) : new THREE.Color(.95, 1, .7);
    list.push([x, groundH(x, z), z, ISLAND === 'aurenne' ? .55 + rnd() * .2 : .8 + rnd() * .5, rnd() * 6, tint, ISLAND === 'mark' ? 1 : ISLAND === 'aurenne' ? 0 : undefined]); }
  T.plant(scene, list); }

// ── what stands in the clearing ──
const ticks = [];
if (WHAT === 'stumps') {
  const st = [['oak', -1.7], ['pine', 0], ['birch', 1.4]].map(([k, x], i) => { const s = stump({ kind: k, seed: 3 + i }); s.group.position.set(x, 0, 0); s.group.rotation.y = -.5 + i * .3; scene.add(s.group); return { kind: k, tris: s.tris, draws: s.draws, h: +s.h.toFixed(2), d: +(s.r * 2).toFixed(2) }; });
  STATS.stumps = st;
} else {
  const f = campfire({ island: ISLAND, mode: MODE, stage: STAGE }); scene.add(f.group); ticks.push(f.tick);
  Object.assign(STATS, { fireTris: f.tris, fireDraws: f.draws, parts: f.parts });
}
const V = { close: [2.5, 1.55, 2.3, -.1, .35, 0], wide: [5.2, 2.3, 5.8, 0, .7, 0], scale: [-.3, .95, 4.6, -.4, .75, 0], high: [2.4, 4.2, 2.6, 0, 0, 0], stumps: [.6, 2.1, 2.6, -.1, .25, 0] }[CAM] || [2.1, 1.25, 1.9, 0, .2, 0];
cam.position.set(V[0], V[1], V[2]); cam.lookAt(V[3], V[4], V[5]);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
Object.assign(STATS, { island: ISLAND, mode: MODE, stage: STAGE, hour: HOUR, cam: CAM });
const comp = makeComposer(R, scene, cam, { bloom: HOUR === 'day' ? .18 : .32, bloomT: HOUR === 'day' ? .92 : .82, bloomR: .5, sat: 1.08, vig: .34, warm: [1.07, 1.0, .9] });
R.info.autoReset = !STILL;
// the people: two of the island's people by the fire, at the edge of its reach (the game's FIRE_REACH, 2.5 m); one beside the stumps
const PEOPLE = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' }[ISLAND];
const spots = WHAT === 'stumps' ? [[2.7, -.2, -1.1]] : CAM === 'scale' ? [[-1.1, .1, 1.57]] : [[-1.25, -.55, 1.15], [.35, -1.35, .25]];
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  spots.forEach((s, i) => { const G = rollGenome('camp:' + ISLAND + ':' + i, { people: PEOPLE, g: i % 2 }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(s[0], p.root.position.y, s[1]); p.root.rotation.y = s[2]; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); });
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => {
  ticks.forEach(t => t(1.7)); R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => ticks.forEach(f => f(t * .001)) }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
