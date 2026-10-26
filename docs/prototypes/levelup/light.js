// Light indoors (backlog L12, "Light indoors"; OG-141; cards F2 and F3, `buildInteriorFor`). Concept, 26 Oct 2026.
// One rule lights every room from what the room already records (rooms.js returns its fires, lamps, candles, braziers, windows and
// louver), so no room carries hand-set numbers. A room's light is three things: the day through its openings, its fires and lamps,
// and how far the eye opens. The hour is one row (LIGHT_HOURS) and the question is one row (LIGHT_MODES).
//   sourcesOf(C, kind) -> { fires: [{ p, k, r }], lamps: [{ p, k, r }], openings: [{ c, n, w, h, sun }], louver } in the room's frame
//   lightRoom(scene, C, kind, hour, mode, o) -> { lights, shafts, tris, tick(t), eye(base, m0) -> { goal, lo, hi } }: adds the lights, the sun and
//     moon through the openings (the one shadow-casting light), a soft sky spot inside each opening, the dust in the beams, and the fill
//   lumaStats(canvas) -> { median, p90, mean } of the frame on 0..255, the measure the critic uses
//   handLight(cam) -> a cool point light and its glow 0.5 m ahead of the right hand (magic light from a hand)
import * as THREE from 'three';
import { puffTex } from './common.js';

// the hours: the sun or moon's direction in the room's frame (front +z, south), its colour and strength, the sky's colour and strength
// through an opening, whether the lamps are lit, and the dust's strength in a beam
export const LIGHT_HOURS = {
  morning: { dir: [.5, .3, .82], c: [1, .82, .62], i: 3.2, sky: [.66, .74, .9], skyK: .5, lamps: 0, dust: 1, fog: [.78, .8, .84] },
  noon: { dir: [.15, .78, .6], c: [1, .96, .9], i: 3.6, sky: [.7, .78, .92], skyK: .7, lamps: 0, dust: .45, fog: [.74, .8, .88] },
  golden: { dir: [-.55, .2, .8], c: [1, .62, .34], i: 2.8, sky: [.9, .72, .6], skyK: .4, lamps: .6, dust: 1.2, fog: [.85, .7, .55] },
  night: { dir: [.3, .45, .84], c: [.55, .66, 1], i: .35, sky: [.3, .38, .6], skyK: .05, lamps: 1, dust: 0, fog: [.06, .08, .14] }
};
// the question: how bright a room is by night against the day.
//   even (A): the eye opens all the way: every room reads at a median of 80 at every hour, warmer by night (today's game, near enough);
//   sources (B): the openings, the fires and the lamps and nothing else, at the day's exposure: by night pools of fire and black corners;
//   eye (C): B's sources over a dim fill, and the eye opens in the dark (up to x2.2) toward a median of 48, never closing below the day's
export const LIGHT_MODES = {
  even: { fill: .6, fillNight: .6, warm: .6, adapt: 1, open: 4, close: .6, target: 80 },
  sources: { fill: .03, fillNight: .015, warm: 0, adapt: 0, open: 1 },
  eye: { fill: .14, fillNight: .12, warm: .4, adapt: .6, open: 2.2, target: 48 }
};
const WARM = new THREE.Color(1, .72, .46), FIRE = new THREE.Color(1, .55, .24), LAMP = new THREE.Color(1, .72, .42), CANDLE = new THREE.Color(1, .7, .4), EMBER = new THREE.Color(1, .5, .2);

// what lights a room, from its own record. kind: 'cottage' | 'longhouse' | 'home' (rooms.js's gatelandsCottage, markLonghouse,
// aurenneHome); another room adds its line here.
export function sourcesOf(C, kind, o = {}) {
  const fires = [], lamps = [], openings = [], fl = o.floor ?? 0;
  const face = (f, x, z) => f === 'front' ? [0, 0, 1] : f === 'back' ? [0, 0, -1] : f === 'east' || f === 'right' || x > 0 ? [1, 0, 0] : [-1, 0, 0];
  if (kind === 'cottage') {
    fires.push({ p: [C.fire[0] + .35, C.fire[1] + .2, C.fire[2]], k: 8, r: 9, open: true });
    lamps.push({ p: [C.lantern[0], C.lantern[1] - .1, C.lantern[2]], k: 4, r: 7 });
    for (const w of C.windows) { const n = face(w.face, w.x, w.z), fb = w.face === 'front' || w.face === 'back'; openings.push({ c: [fb ? w.x : n[0] * C.w / 2, (o.sill ?? 0) + w.y + w.h / 2, fb ? w.z : w.z], n, w: w.w, h: w.h, wall: .6 }); }
  } else if (kind === 'longhouse') {
    fires.push({ p: [C.fire[0], C.fire[1] + .45, C.fire[2]], k: 34, r: 18, open: true });
    lamps.push({ p: [C.lamp[0], C.lamp[1] + .1, C.lamp[2]], k: 4, r: 7 });
    if (C.lamp2) lamps.push({ p: [C.lamp2[0], C.lamp2[1] + .08, C.lamp2[2] + .05], k: 3, r: 6, always: true });
    // the gable's one shuttered light over the door, 0.6 by 0.45 m
    openings.push({ c: [0, C.tieBeam + .72, C.d / 2], n: [0, 0, 1], w: .6, h: .45, wall: .2 });
  } else if (kind === 'home') {
    const F = C.floors[fl];
    for (const b of C.braziers) if ((b[1] > C.floors[1] - .2) === (fl >= 1)) fires.push({ p: [b[0] - .2, b[1] + .25, b[2]], k: 2.5, r: 4, ember: true });
    lamps.push({ p: [C.lamp[0], C.lamp[1] - .1, C.lamp[2]], k: 5, r: 8 }); if (fl === 0) lamps.push({ p: [C.lamp0[0], C.lamp0[1] + .15, C.lamp0[2]], k: 2.5, r: 6 });
    for (const w of C.windows) if (w.y > F - .2 && w.y < F + 2.6) openings.push({ c: [w.x, w.y + w.h / 2, w.z], n: face(w.face, w.x, w.z), w: w.w, h: w.h, wall: .45 });
  }
  return { fires, lamps, openings, louver: kind === 'longhouse' && C.louver != null ? { x: 0, y: C.under(0) - .2, z: C.louver, floor: C.floor } : null };
}

// the beam: the prism the sun cuts through the opening, each corner run down to the floor (or 7 m). Its back faces are drawn once each
// and each pixel integrates the beam along its own ray (a slab test in the prism's frame): thick in the middle, soft at the edges,
// strongest at the opening, cut at the floor. Additive, no depth write. The motes are 500 specks scattered through it.
function beam(o, sun, floorY, col, k) {
  const d = sun.clone().negate(), n = new THREE.Vector3(...o.n), t = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Vector3(...o.c), corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => c.clone().addScaledVector(t, a * o.w / 2).addScaledVector(up, b * o.h / 2));
  const Lmax = Math.min(7.5, (c.y + o.h / 2 - floorY) / Math.max(.05, -d.y)), far = corners.map(p => p.clone().addScaledVector(d, Math.min(Lmax, (p.y - floorY) / Math.max(.05, -d.y))));
  const P = [...corners, ...far], idx = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7, 4, 5, 6, 4, 6, 7, 0, 2, 1, 0, 3, 2];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P.flatMap(p => [p.x, p.y, p.z]), 3)); g.setIndex(idx);
  // the prism's frame: u across the opening, v up it, s along the sun (0 at the opening, 1 at Lmax)
  const M = new THREE.Matrix4().makeBasis(t.clone().multiplyScalar(o.w / 2), up.clone().multiplyScalar(o.h / 2), d.clone().multiplyScalar(Lmax)).setPosition(c), inv = M.clone().invert();
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uC: { value: col.clone().multiplyScalar(k) }, uInv: { value: inv }, uFloor: { value: floorY }, uT: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uC; uniform mat4 uInv; uniform float uFloor, uT; varying vec3 vW;
      void main(){ vec3 R = vW - cameraPosition; vec3 ro = (uInv * vec4(cameraPosition, 1.)).xyz, rd = (uInv * vec4(R, 0.)).xyz;
        vec3 lo = vec3(-1., -1., 0.), hi = vec3(1., 1., 1.), ia = 1. / rd, t0 = (lo - ro) * ia, t1 = (hi - ro) * ia;
        float a = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), max(min(t0.z, t1.z), 0.)), b = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));
        if (R.y < 0.) b = min(b, (uFloor - cameraPosition.y) / R.y);
        if (b <= a) discard; float len = (b - a) * length(R); vec3 m = ro + rd * (a + b) * .5;
        float prof = pow(max(0., 1. - m.x * m.x), 1.5) * pow(max(0., 1. - m.y * m.y), 1.2), fade = pow(max(0., 1. - m.z), 1.3) * .8 + .2;
        float streak = .8 + .2 * sin(m.x * 7. + m.z * 13. + uT * .25);
        gl_FragColor = vec4(uC * len * prof * fade * streak * .2, 1.); }` });
  m.side = THREE.BackSide;
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 5; mesh.frustumCulled = false;
  const N = 500, pos = new Float32Array(N * 3), r = mulberry(o.c[0] * 31 + o.c[2] * 17 + 5);
  for (let i = 0; i < N; i++) { const u = r(), v = r(), s = r(), a = corners[0].clone().lerp(corners[1], u), b = corners[3].clone().lerp(corners[2], u), q = a.lerp(b, v), f = far[0].clone().lerp(far[1], u).lerp(far[3].clone().lerp(far[2], u), v); q.lerp(f, Math.pow(s, 1.4) * .95); pos.set([q.x, q.y, q.z], i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: col.clone().multiplyScalar(k * .7), size: .0045, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.userData.base = pos.slice();
  return { mesh, pts, tris: 12 + N };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function lightRoom(scene, C, kind, hour, mode, o = {}) {
  const Hr = LIGHT_HOURS[hour] || LIGHT_HOURS.noon, M = LIGHT_MODES[mode] || LIGHT_MODES.eye, S = sourcesOf(C, kind, o), night = hour === 'night';
  const lights = [], shafts = [], floorY = o.floorY ?? 0; let tris = 0;
  const SUN = new THREE.Vector3(...Hr.dir).normalize(), sunCol = new THREE.Color(...Hr.c), skyCol = new THREE.Color(...Hr.sky);
  // the sun (or the moon): the one light that throws shadows, so its patches fall through the openings and nowhere else
  const sun = new THREE.DirectionalLight(sunCol, Hr.i); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
  const R = o.shadowR ?? 10; sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 100 }); scene.add(sun, sun.target); lights.push(sun);
  // the sky through each opening: a soft spot just inside it, aimed in and down, by the opening's area
  for (const q of S.openings) { const n = new THREE.Vector3(...q.n), p = new THREE.Vector3(...q.c).addScaledVector(n, -(q.wall + .15));
    const s = new THREE.SpotLight(skyCol, 45 * Hr.skyK * q.w * q.h, 8, 1.15, 1, 1.3); s.position.copy(p); s.target.position.copy(p).addScaledVector(n, -3).add(new THREE.Vector3(0, -1.6, 0)); scene.add(s, s.target); lights.push(s);
    // the beam, where the sun comes in through this opening
    const into = SUN.dot(n); if (Hr.dust > 0 && into > .12 && SUN.y > .05) { const b = beam(q, SUN, floorY, sunCol, Hr.dust * Math.min(1, into * 1.4)); scene.add(b.mesh, b.pts); shafts.push(b); tris += b.tris; } }
  // the longhouse's louver: a grey shaft of day straight down onto the hearth's smoke
  if (S.louver && !night) { const l = new THREE.SpotLight(skyCol, 260 * Hr.skyK, 14, .5, .9, 1.2); l.position.set(S.louver.x, S.louver.y, S.louver.z); l.target.position.set(S.louver.x, S.louver.floor, S.louver.z); scene.add(l, l.target); lights.push(l);
  }
  // the fires burn at every hour; the lamps and candles by the hour's share (lit at dusk, all by night)
  const flick = [];
  for (const f of S.fires) { const L = new THREE.PointLight(f.ember ? EMBER : FIRE, f.k, f.r, 1.4); L.position.set(...f.p); if (f.open) { L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -.002; } scene.add(L); lights.push(L); flick.push([L, f.k, f.p[0] * 3.1]); }
  for (const f of S.lamps) { const k = f.always ? f.k : f.k * Hr.lamps; if (k <= 0) continue; const L = new THREE.PointLight(LAMP, k, f.r, 1.6); L.position.set(...f.p); scene.add(L); lights.push(L); flick.push([L, k, f.p[2] * 2.3]); }
  // the fill: what a room's walls throw back. A holds it at every hour; B has almost none; C a dim floor, warmer by night
  const fk = night ? M.fillNight : M.fill * (.45 + Hr.skyK * .8), fillSky = skyCol.clone().lerp(WARM, night ? M.warm : M.warm * .25);
  const fill = new THREE.HemisphereLight(fillSky, new THREE.Color(.36, .3, .24).lerp(WARM, M.warm * .4), fk); scene.add(fill); lights.push(fill);
  const tick = t => { const s = t * .001; for (const [L, k, ph] of flick) L.intensity = k * (1 + .07 * Math.sin(s * 11 + ph) + .05 * Math.sin(s * 23.7 + ph * 2)); for (const b of shafts) { b.mesh.material.uniforms.uT.value = s; const P = b.pts.geometry.attributes.position, B = b.pts.userData.base; for (let i = 0; i < P.count; i++) { P.array[i * 3 + 1] = B[i * 3 + 1] + Math.sin(s * .4 + i) * .03; P.array[i * 3] = B[i * 3] + Math.sin(s * .3 + i * 1.7) * .03; } P.needsUpdate = true; } };
  // the eye: from the frame's median at the day's exposure m0, the median it opens toward (in log terms the share M.adapt of the way to
  // M.target, never darker than m0 unless M.close), and the exposure's bounds; the page (or the game's post) steps the exposure to it
  const eye = (base, m0) => { if (!M.adapt) return { goal: m0, lo: base, hi: base };
    const goal = Math.exp(Math.log(Math.max(2, m0)) * (1 - M.adapt) + Math.log(M.target) * M.adapt); return { goal: M.close ? goal : Math.max(m0, goal), lo: base * (M.close ?? 1), hi: base * M.open }; };
  return { lights, shafts, tris, tick, eye, sources: S, sun, fill };
}

export function lumaStats(canvas, w = 192, h = 108) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(canvas, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, L = new Float32Array(w * h); let sum = 0;
  for (let i = 0; i < L.length; i++) { L[i] = .2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2]; sum += L[i]; }
  const s = Array.from(L).sort((a, b) => a - b); return { median: Math.round(s[s.length >> 1]), p90: Math.round(s[Math.floor(s.length * .9)]), mean: Math.round(sum / L.length) };
}

// magic light from a hand: a cool light 0.5 m ahead of the right hand and its glow, carried with the camera
export function handLight(cam) {
  const g = new THREE.Group(), L = new THREE.PointLight(new THREE.Color(.72, .86, 1), 7, 9, 1.4), orb = new THREE.Mesh(new THREE.SphereGeometry(.018, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.9, 2.4) }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(.5, .7, 1), transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(.14, .14, 1); L.position.set(0, .05, 0);
  g.add(L, orb, halo); g.position.set(.22, -.24, -.55); cam.add(g); return g;
}
