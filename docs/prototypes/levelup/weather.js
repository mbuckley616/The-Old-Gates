// Weather that matters (the concept artist, 24 Oct 2026; backlog L12 "Weather that matters", OG-138; card F3's shaders, `WX` and
// tickWeather in the game). OG-138 draws nine conditions (clear, partly cloudy, overcast, rain, heavy rain, thunderstorm, snow,
// blizzard, fog), a storm clearing to a rainbow, and a gate storm: a blue spiral of cloud over a gate where the world thins. The game
// has six kinds in `WX.type` (clear, overcast, rain, storm, snow, fog); OG-138 adds the blizzard, the rainbow and the gate storm.
// As corruption.js, seasons.js and hours.js do, a condition is a row of numbers read by what is already drawn, laid over a season's
// row, so the weather costs no new art but six small things:
//   the deck     (wxDeck): a cloud layer 900 m up, one quad and a noise, from a few heaps to a closed grey lid by the row's cover;
//   the rain     (wxRain): streaks in a 60 m box that follows the eye, slanted by the wind, up to 16,000 (one draw); the blizzard's
//                driven snow is the same streaks, short and white;
//   the snow     (wxSnow): flakes as points in a 44 m box, up to 22,000 (one draw); what lies is seasons.js's cover (WX.cover);
//   the wet      (hookWet, on every standard material but the people's): the up-facing darkened and glossed, the walls streaked, and
//                puddles on the flat (the lane, the sills, the doorsteps) that mirror the sky's colour; no new texture, no env map;
//   the storm    (wxBolt): a forked bolt as lines that the bloom lights, and the flash that lifts the hemisphere and the deck;
//   the bow      (wxBow): a rainbow on the sky at 40–42° from the point opposite the sun, only where the sun is low behind you;
//   the wind     (wxFlag): a pennant on a pole that hangs at calm and streams in a gale; the rain's slant and the flakes' drift;
//   the gate     (wxGateStorm): a slow blue spiral of cloud over a gate, three arms of the clouds' own puff, and a faint column.
// What the question is (SIGHT, Michael's to choose): OG-138 says "fog and snow cut sight". How far you can see is also how far a foe
// can see you, and how far the scatter and the far terrain must draw.
//   A 'veil':  the weather is seen, not felt: the land never closes under 450 m (Skyrim's, Oblivion's fog);
//   B 'drawn': OG-138 as drawn: fog closes to 30 m, a blizzard to 35 m, heavy rain to 140 m (Red Dead's whiteout, The Long Dark's);
//   C 'kind':  by kind: fog and the blizzard close in to 60–70 m, where OG-138 says sight is cut; rain and snow leave 220 m and more,
//              so a rainy day is still a day you travel in.
// A row: season (the seasons.js row it lies on: 0 spring … 3 winter), cover (the deck 0 to 1), grey (the sky turned to its overcast
// grey), sunK (× the sun's light), hemiK (× the sky's light), cast (× the frame), fog (its colour), sight [A, B, C] (metres to 95% fog),
// rain/snow (0 to 1), drive (0 to 1: the blizzard's driven streaks), wind (0 calm to 1 gale), wet, puddle, lie (snow lying, 0 to 1),
// flash (the bolt), bow (the rainbow), gate (the gate storm), sat/con (the grade), elev (the sun's height in radians, when the row
// sets it; the bow wants a low sun). A metre a unit.
import * as THREE from 'three';
import { GLSL_NOISE, puffTex } from './common.js';

const r3 = (a, b, c) => [a, b, c];
const ROW = o => ({ cover: .1, grey: 0, sunK: 1, hemiK: 1, cast: r3(1, 1, 1), rain: 0, snow: 0, drive: 0, wind: .15, wet: 0, puddle: 0, lie: 0, flash: 0, bow: 0, gate: 0, sat: 1, con: 1, ...o });
export const WEATHERS = {
  clear:    ROW({ label: 'Clear', season: 1, cover: .05, fog: r3(.78, .83, .90), sight: [2400, 2400, 2400] }),
  partly:   ROW({ label: 'Partly cloudy', season: 1, cover: .42, wind: .3, sunK: .95, fog: r3(.78, .83, .90), sight: [2000, 2000, 2000] }),
  overcast: ROW({ label: 'Overcast', season: 2, cover: .96, grey: .85, sunK: .1, hemiK: 1.35, fog: r3(.66, .68, .70), sight: [1400, 900, 1100], sat: .86, wind: .35, cast: r3(.98, 1, 1.02) }),
  rain:     ROW({ label: 'Rain', season: 2, cover: 1, grey: .92, sunK: .04, hemiK: 1.2, fog: r3(.56, .59, .62), sight: [900, 300, 500], rain: .45, wind: .4, wet: .8, puddle: .5, sat: .82, cast: r3(.96, 1, 1.04) }),
  heavy:    ROW({ label: 'Heavy rain', season: 2, cover: 1, grey: 1, sunK: 0, hemiK: 1.0, fog: r3(.46, .49, .53), sight: [700, 140, 280], rain: 1, wind: .6, wet: 1, puddle: .9, sat: .74, con: 1.03, cast: r3(.94, .99, 1.06) }),
  storm:    ROW({ label: 'Thunderstorm', season: 1, cover: 1, grey: 1, sunK: 0, hemiK: .75, fog: r3(.30, .32, .38), sight: [600, 110, 220], rain: .9, wind: .85, wet: 1, puddle: .9, flash: 1, sat: .7, con: 1.08, cast: r3(.92, .96, 1.1) }),
  snow:     ROW({ label: 'Snow', season: 3, cover: 1, grey: .9, sunK: .08, hemiK: 1.3, fog: r3(.80, .82, .86), sight: [800, 250, 400], snow: .55, wind: .25, lie: .75, sat: .8, cast: r3(.97, 1, 1.04) }),
  blizzard: ROW({ label: 'Blizzard', season: 3, cover: 1, grey: 1, sunK: 0, hemiK: 1.25, fog: r3(.84, .86, .90), sight: [500, 35, 70], snow: 1, drive: 1, wind: 1, lie: 1, sat: .6, con: .95, cast: r3(.96, 1, 1.06) }),
  fog:      ROW({ label: 'Fog', season: 2, cover: .9, grey: .7, sunK: .18, hemiK: 1.25, fog: r3(.80, .81, .80), sight: [450, 30, 60], wind: 0, wet: .25, puddle: .1, sat: .78, con: .96 }),
  rainbow:  ROW({ label: 'Clearing, a rainbow', season: 1, cover: .55, grey: .2, sunK: 1.05, hemiK: 1.05, fog: r3(.74, .80, .88), sight: [1800, 1800, 1800], wet: .7, puddle: .6, wind: .3, bow: 1, sat: 1.1, elev: .3 }),
  gate:     ROW({ label: 'Gate storm', season: 1, cover: .92, grey: .8, sunK: .35, hemiK: 1.0, fog: r3(.50, .56, .70), sight: [1200, 700, 900], wind: .7, gate: 1, sat: .88, cast: r3(.94, .98, 1.08) }),
};
export const WX_NAMES = Object.keys(WEATHERS);
export const SIGHT = { veil: { i: 0, label: 'A · a veil, never under 450 m' }, drawn: { i: 1, label: 'B · as drawn: fog 30 m, blizzard 35 m' }, kind: { i: 2, label: 'C · by kind: fog and blizzard 60–70 m' } };
// FogExp2 reaches 95% at d when density = sqrt(3) / d
export const fogFor = (row, mode) => Math.sqrt(3) / row.sight[SIGHT[mode].i];

// ── the deck: one quad 900 m up, a noise opened to its cover, lit from the sun's side, dark beneath when it closes ──
export function wxDeck(scene) {
  const U = { uCover: { value: .1 }, uLit: { value: new THREE.Color(1, 1, 1) }, uDark: { value: new THREE.Color(.5, .52, .56) }, uFlash: { value: 0 }, uOff: { value: new THREE.Vector2() } };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(36000, 36000).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.); }',
    fragmentShader: `uniform float uCover, uFlash; uniform vec3 uLit, uDark; uniform vec2 uOff; varying vec3 vP;\n${GLSL_NOISE}
      void main(){ vec2 p = vP.xz / 2600. + uOff; float n = fb(p) * .75 + fb(p * 3.7 + 9.) * .25;
        float a = smoothstep(1. - uCover - .08, 1. - uCover + .22, n) ; a = max(a, smoothstep(.85, 1., uCover));
        float thick = smoothstep(.4, 1., n + uCover * .5); vec3 c = mix(uLit, uDark, thick * (.4 + .6 * uCover));
        c += vec3(.75, .8, 1.) * uFlash * .3 * smoothstep(.35, .8, fb(p * 2. + 3.));
        float far = length(vP.xz - cameraPosition.xz); a *= 1. - smoothstep(9000., 17000., far) * (1. - smoothstep(.85, 1., uCover));
        gl_FragColor = vec4(c, a); }` }));
  m.position.y = 900; m.renderOrder = -.5; m.frustumCulled = false; scene.add(m);
  return { mesh: m, U, set(cam, row, lit, dark, flash) { m.position.x = cam.position.x; m.position.z = cam.position.z; U.uCover.value = row.cover; U.uLit.value.setRGB(...lit); U.uDark.value.setRGB(...dark); U.uFlash.value = flash; m.visible = row.cover > .01; } };
}

// ── the rain: streaks in a box about the eye; set() lays them for the row's amount, length and the wind's slant ──
export function wxRain(scene, n = 16000, box = [60, 26, 60]) {
  let s = 51; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, base = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) base.set([(r() - .5) * box[0], r() * box[1] - 2, (r() - .5) * box[2]], i * 3);
  const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0xc8d2dc, transparent: true, opacity: .4, depthWrite: false, fog: true }), L = new THREE.LineSegments(g, m);
  L.frustumCulled = false; scene.add(L); const len = new Float32Array(n).map(() => .55 + r() * .5);
  // k: 0 to 1 of n; dir: the wind's heading (x, z); slant: metres across per metre down; long: × the streak's length; color
  return { lines: L, set(cam, k, dir, slant, long, color, op) { const c = Math.round(n * k); L.visible = c > 0; if (!c) return;
    L.position.set(Math.round(cam.position.x), Math.round(cam.position.y), Math.round(cam.position.z));
    for (let i = 0; i < c; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], l = len[i] * long, h = l / Math.hypot(1, slant);
      pos.set([x, y, z, x - dir.x * slant * h, y - h, z - dir.y * slant * h], i * 6); }
    g.attributes.position.needsUpdate = true; g.setDrawRange(0, c * 2); m.color.setRGB(...color); m.opacity = op; } };
}

// ── the snow: flakes as soft points in a box about the eye, drifting with the wind ──
let _flake = null;
function flakeTex() { if (_flake) return _flake; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 1, 16, 16, 15);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); _flake = new THREE.CanvasTexture(c); return _flake; }
export function wxSnow(scene, n = 22000, box = [44, 22, 44]) {
  let s = 77; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([(r() - .5) * box[0], r() * box[1] - 2, (r() - .5) * box[2]], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: flakeTex(), size: .06, sizeAttenuation: true, transparent: true, depthWrite: false, color: 0xffffff, opacity: .9 }), P = new THREE.Points(g, m);
  P.frustumCulled = false; scene.add(P);
  return { points: P, set(cam, k, color) { const c = Math.round(n * k); P.visible = c > 0; g.setDrawRange(0, c); P.position.set(Math.round(cam.position.x), Math.round(cam.position.y), Math.round(cam.position.z)); m.color.setRGB(...color); } };
}

// ── the wet: up-facing surfaces darkened and glossed, walls streaked, puddles on the flat mirroring the sky's colour ──
export const WU = { uWet: { value: 0 }, uPud: { value: 0 }, uSkyRef: { value: new THREE.Color(.6, .65, .7) } };
const WET_V = `
  { mat4 wm = modelMatrix;
  #ifdef USE_INSTANCING
    wm = modelMatrix * instanceMatrix;
  #endif
    vWeP = (wm * vec4(transformed, 1.)).xyz; vWeN = normalize(mat3(wm) * objectNormal); }`;
const WET_F = `
  float wWet = 0., wPud = 0.; { float up = normalize(vWeN).y, n = fb(vWeP.xz * .35), n2 = fb(vWeP.xz * 1.7 + 4.);
    wWet = uWet * (.45 + .55 * smoothstep(-.3, .8, up)) * (.75 + .25 * n2);
    float streak = (1. - abs(up)) * smoothstep(.35, .75, fb(vec2(vWeP.x * 3. + vWeP.z * 3., vWeP.y * .25))) * uWet;
    wPud = uPud * smoothstep(.97, .995, up) * smoothstep(.65 - .1 * uPud, .7 - .1 * uPud, n * .8 + n2 * .2);
    diffuseColor.rgb *= 1. - .34 * wWet - .12 * streak - .5 * wPud;
    roughnessFactor = mix(roughnessFactor, .32, wWet * smoothstep(.2, .9, up)); roughnessFactor = mix(roughnessFactor, .04, wPud); }`;
// pud: whether puddles stand on this material's flat (the lane, the steps, the paving; not the grass, the thatch or a sill's paint)
export function hookWet(m, pud = false) {
  if (m.userData.wet || !m.isMeshStandardMaterial) return; m.userData.wet = true; const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = (s, r) => { prev && prev.call(m, s, r); Object.assign(s.uniforms, WU);
    s.vertexShader = 'varying vec3 vWeP; varying vec3 vWeN;\n' + s.vertexShader.replace('#include <project_vertex>', WET_V + '\n#include <project_vertex>');
    s.fragmentShader = 'uniform float uWet, uPud; uniform vec3 uSkyRef; varying vec3 vWeP; varying vec3 vWeN;\n' + (s.fragmentShader.includes('float fb(') ? '' : GLSL_NOISE)
      + s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + WET_F.replace('wPud = uPud', pud ? 'wPud = uPud' : 'wPud = 0. * uPud'))
        .replace('#include <opaque_fragment>', `{ vec3 vd = normalize(cameraPosition - vWeP); float fr = pow(1. - max(dot(vd, vec3(0., 1., 0.)), 0.), 3.);
          outgoingLight = mix(outgoingLight, uSkyRef * (.22 + .42 * fr) * (.9 + .2 * fb(vWeP.xz * 6.)), wPud * (.3 + .35 * fr)) + uSkyRef * wWet * fr * .12; }\n#include <opaque_fragment>`); };
  const k0 = key ? key.call(m) : ''; m.customProgramCacheKey = () => k0 + (pud ? '-wetp' : '-wet'); m.needsUpdate = true;
}
export function wetAll(scene, pud = new Set()) { const seen = new Set(); scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.userData.noWet) return; for (const m of [].concat(o.material)) if (!seen.has(m)) { seen.add(m); hookWet(m, pud.has(m)); } }); return seen.size; }

// ── the bolt: a forked line from the deck to the ground, bright enough for the bloom ──
export function wxBolt(scene, at, ground, seed = 5) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pts = [];
  const fork = (x, y, z, depth, len) => { let px = x, py = y, pz = z; while (py > ground && len-- > 0) { const nx = px + (r() - .5) * 26, ny = py - 18 - r() * 22, nz = pz + (r() - .5) * 14; pts.push(px, py, pz, nx, Math.max(ny, ground), nz);
    if (depth < 2 && r() < .16) fork(nx, ny, nz, depth + 1, 4 + Math.floor(r() * 5)); px = nx; py = ny; pz = nz; } };
  fork(at[0], 880, at[1], 0, 80);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color(6, 6.5, 8), fog: false, transparent: true }), L = new THREE.LineSegments(g, m); L.frustumCulled = false; scene.add(L);
  return { lines: L, set(k) { L.visible = k > .01; m.opacity = k; } };
}

// ── the bow: on the sky 40–42° from the point opposite the sun, red outside, violet in, a pale band inside it ──
export function wxBow(scene) {
  const U = { uAnti: { value: new THREE.Vector3(0, -1, 0) }, uK: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(19000, 64, 32), new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 uAnti; uniform float uK; varying vec3 vD;
      vec3 band(float t){ return clamp(vec3(abs(t * 6. - 3.) - 1., 2. - abs(t * 6. - 2.), 2. - abs(t * 6. - 4.)), 0., 1.); }
      void main(){ vec3 d = normalize(vD); float a = degrees(acos(clamp(dot(d, normalize(uAnti)), -1., 1.)));
        float t = (a - 40.) / 2.2; vec3 c = band(clamp(1. - t, 0., 1.) * .8) * smoothstep(0., .18, t) * smoothstep(1., .82, t);
        c += vec3(.9, .9, .95) * .12 * smoothstep(40., 33., a) * smoothstep(20., 33., a);
        float h = smoothstep(-.01, .06, d.y) * (1. - smoothstep(.55, .8, d.y));
        gl_FragColor = vec4(c * uK * .4 * h, 1.); }` }));
  m.renderOrder = 0; m.frustumCulled = false; scene.add(m);
  return { mesh: m, set(cam, sun, k) { m.position.copy(cam.position); U.uAnti.value.copy(sun).negate(); U.uK.value = k; m.visible = k > .01; } };
}

// ── the wind's pennant: a 1.6 × 0.5 m swallow-tail on a 5 m pole, hanging at calm and streaming in a gale ──
export function wxFlag(scene, x, y, z, color = 0x8a2a20) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: .9 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 5, 6).translate(0, 2.5, 0), wood));
  const cloth = new THREE.PlaneGeometry(1.6, .5, 16, 4); cloth.translate(.8, 0, 0); const P = cloth.attributes.position, rest = Float32Array.from(P.array);
  for (let i = 0; i < P.count; i++) { const u = rest[i * 3] / 1.6, v = rest[i * 3 + 1]; if (u > .7) rest[i * 3] -= (u - .7) * 1.6 * (1 - Math.abs(v) / .25) * .9; }
  const fm = new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.DoubleSide }), f = new THREE.Mesh(cloth, fm); f.position.y = 4.65; g.add(f);
  g.position.set(x, y, z); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g);
  // wind 0 to 1, heading in radians (the way it blows, 0 = -z), t: the phase
  return { group: g, set(wind, heading, t = 0) { f.rotation.y = Math.PI / 2 - heading;
    const lift = Math.min(1, wind * 1.25), amp = .04 + .16 * wind;
    for (let i = 0; i < P.count; i++) { const x0 = rest[i * 3], y0 = rest[i * 3 + 1], u = Math.max(0, x0) / 1.6, ang = (1 - lift) * 1.35;
      const wave = Math.sin(u * (5 + 6 * wind) - t * 6) * amp * u * 1.6;
      P.setXYZ(i, x0 * Math.sin(Math.PI / 2 - ang) , y0 - x0 * Math.sin(ang) * .95, wave + (1 - lift) * .04 * Math.sin(u * 9)); }
    P.needsUpdate = true; cloth.computeVertexNormals(); } };
}

// ── the gate storm: a slow whorl of cloud wound about the gate, 280 m across, three arms tightening to a blue-lit eye over it: two
// layers 45 and 58 m up, each one quad and a noise (2 draws), and a cold light on the stones below ──
export function wxGateStorm(scene, at, ground) {
  const g = new THREE.Group(), layers = [];
  for (const [y, R, twist, seed] of [[45, 140, 2.3, 0], [58, 170, 1.8, 7]]) {
    const U = { uK: { value: 0 }, uR: { value: R }, uTw: { value: twist }, uSeed: { value: seed }, uEdge: { value: new THREE.Color(.3, .32, .4) }, uCore: { value: new THREE.Color(.45, .8, 2.2) } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform float uK, uR, uTw, uSeed; uniform vec3 uEdge, uCore; varying vec2 vQ;\n${GLSL_NOISE}
        void main(){ float r = length(vQ) / uR, th = atan(vQ.y, vQ.x); float n = fb(vQ / 22. + uSeed), n2 = fb(vQ / 7. + uSeed * 3.);
          float arm = sin(3. * (th + uTw * log(r + .04)) + (n - .5) * 2.4) * .5 + .5;
          float a = smoothstep(.35, .8, arm + (n2 - .5) * .35) * smoothstep(1., .45, r) * (.55 + .45 * n);
          a = max(a, smoothstep(.22, .08, r) * smoothstep(.02, .07, r) * .9) * (1. - smoothstep(.05, .015, r));
          float rim = smoothstep(.5, .78, arm) * (1. - smoothstep(.78, .95, arm));
          vec3 c = mix(uCore, uEdge, smoothstep(.05, .5, r)) * (.75 + .35 * n2) + uCore * rim * .35 * (1. - r);
          gl_FragColor = vec4(c, a * uK); }` }));
    m.position.y = y; m.renderOrder = -.4; m.frustumCulled = false; g.add(m); layers.push(U); }
  const light = new THREE.PointLight(new THREE.Color(.45, .65, 1), 0, 110, 1.6); light.position.y = 16; g.add(light);
  g.position.set(at[0], ground, at[1]); scene.add(g);
  return { group: g, set(k, base) { g.visible = k > .01; for (const U of layers) { U.uK.value = k; U.uEdge.value.setRGB(...base).multiplyScalar(.55).add(new THREE.Color(.03, .05, .14)); } light.intensity = 7 * k; } };
}
