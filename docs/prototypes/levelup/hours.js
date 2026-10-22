// The hours, island by island (the concept artist, 22 Oct 2026; backlog L12 "The hours, island by island", OG-137; card F3's sky
// and `SKY`, the clock in 50-travel.js). OG-137 draws seven grades a day: a misty sunrise, clear midday, the golden hour, a violet
// twilight with the first lit windows, a blue moonlit night with every window amber, and deep night under the stars. As corruption.js
// and seasons.js do, an hour is a row of numbers read by what is already drawn, so the day costs no new art but four small things:
//   the light    the sun's bearing and height (it rises in the north-east of a Gatelands summer, stands in the south at noon and sets
//                in the north-west), its colour and strength, the hemisphere, the fog's colour and density, the grade (saturation,
//                contrast, a cast, the vignette) and the exposure (the eye opening at night, as a game's adaptation does);
//   the sky      corruption.js's dome: zenith, middle, horizon and the glow about the sun, or about the moon at night;
//   the moon     (hourMoon): a disc drawn with its phase, its light the night's key light (the sun's shadow-casting light, turned);
//   the stars    (hourStars): 2,600 points on the upper sky, faded by the hour and washed out by a bright moon;
//   the mist     (hourMist): low banks of the clouds' own puff lying in the hollows at dawn and sunrise, thinner at night;
//   the windows  every glass pane of the Gatelands kit (pieces.js glMats: 'lit', the one window in seven already lit, and 'glass'),
//                warm by the row: the first lit at twilight, every window amber by night, most dark again in the small hours;
//   the lamps    (hourLamps): a warm pool before each door and a lantern on a bracket, as point lights.
// How dark the night is, is the question (NIGHT, Michael's to choose): OG-137 says "the moon's phase sets how dark the night is".
//   A 'readable': the moon's light is the same every night, a blue night you can walk without a torch (Oblivion's, Skyrim's);
//   B 'phase':    the light is the moon's lit share; under a new moon the land is near black and only windows, lamps and a torch show it;
//   C 'floor':    B, with starlight as a floor: under a new moon the skyline and the roofs read against the sky, the lane shows at a
//                few metres, and a lit window carries across the field; a full moon is B's.
// HOURS is the Gatelands' day; the Mark's hard light and aurora, Aurenne's fierce sun and its moon path on the sea are owed (rows of
// their own on the same keys). lerpHour(t) blends: t 0 dawn … 6 deep night, 7 dawn again. A metre a unit.
import * as THREE from 'three';
import { puffTex } from './common.js';

const r3 = (a, b, c) => [a, b, c];
// clock: the hour shown; az/elev: the sun's bearing (degrees from north, clockwise; north is -z, east +x) and height (degrees);
// sun/sunK: its colour and strength; hemi/gnd/hemiK; fog/fogD; mist: the low banks 0 to 1; zen/mid/hor/glow: the sky; cloud: × the puffs;
// sat/con/cast/vig: the grade; exp: × the exposure; lit: the one window in seven; win: every other window; lamp: the door pools and the
// lantern; stars: 0 to 1; moonUp: the moon's light 0 to 1 (0 down); moonAz/moonEl: where it stands; night: how much of the row the moon's
// phase governs (0 by day, 1 at night).
const ROW = o => ({ mist: 0, lit: 0, win: 0, lamp: 0, stars: 0, moonUp: 0, moonAz: 40, moonEl: 26, night: 0, exp: 1, ...o });
export const HOURS = [
  ROW({ name: 'dawn', clock: 4.75, az: 48, elev: -5, sun: r3(1, .6, .4), sunK: 0, hemi: r3(.46, .52, .68), gnd: r3(.20, .21, .24), hemiK: .78,
    fog: r3(.50, .55, .66), fogD: .0042, mist: .85, zen: r3(.08, .13, .30), mid: r3(.26, .32, .50), hor: r3(.72, .60, .60), glow: r3(.9, .5, .34),
    cloud: r3(.42, .42, .54), sat: .86, con: 1.0, cast: r3(.95, .97, 1.05), vig: .32, exp: 1.25, lit: .7, win: .1, lamp: .35, stars: .3, night: .45, moonUp: .25, moonAz: 250, moonEl: 8 }),
  ROW({ name: 'sunrise', clock: 5.75, az: 60, elev: 3.5, sun: r3(1, .60, .36), sunK: 2.2, hemi: r3(.66, .64, .72), gnd: r3(.34, .30, .27), hemiK: 1.0,
    fog: r3(.90, .78, .68), fogD: .0042, mist: 1, zen: r3(.16, .30, .58), mid: r3(.50, .58, .76), hor: r3(1, .80, .62), glow: r3(1, .60, .30),
    cloud: r3(1.1, .86, .74), sat: 1.0, con: 1.0, cast: r3(1.04, .99, .94), vig: .30, exp: 1.14, lit: .25 }),
  ROW({ name: 'midday', clock: 13, az: 185, elev: 57, sun: r3(1, .95, .86), sunK: 3.4, hemi: r3(.64, .72, .88), gnd: r3(.38, .34, .24), hemiK: 1.15,
    fog: r3(.78, .83, .90), fogD: .0013, zen: r3(.08, .24, .62), mid: r3(.30, .52, .86), hor: r3(.74, .83, .93), glow: r3(1, .82, .55),
    cloud: r3(1, 1, 1), sat: 1.08, con: 1.0, cast: r3(1, 1, 1), vig: .28 }),
  ROW({ name: 'golden hour', clock: 20, az: 292, elev: 9, sun: r3(1, .64, .34), sunK: 3.0, hemi: r3(.70, .64, .66), gnd: r3(.44, .32, .22), hemiK: 1.05,
    fog: r3(.94, .76, .58), fogD: .0021, mist: .08, zen: r3(.13, .25, .55), mid: r3(.46, .54, .72), hor: r3(1, .76, .50), glow: r3(1, .58, .26),
    cloud: r3(1.18, .88, .66), sat: 1.15, con: 1.03, cast: r3(1.06, 1, .9), vig: .30, exp: 1.08, lit: .2 }),
  ROW({ name: 'twilight', clock: 21.5, az: 314, elev: -4.5, sun: r3(1, .5, .4), sunK: 0, hemi: r3(.46, .42, .66), gnd: r3(.18, .16, .22), hemiK: .55,
    fog: r3(.40, .36, .54), fogD: .0026, mist: .3, zen: r3(.05, .07, .22), mid: r3(.24, .20, .44), hor: r3(.80, .46, .46), glow: r3(.95, .42, .32),
    cloud: r3(.46, .36, .52), sat: .98, con: 1.03, cast: r3(.98, .94, 1.06), vig: .34, exp: 1.25, lit: 1, win: .35, lamp: .7, stars: .15, night: .35, moonUp: .25, moonAz: 105, moonEl: 6 }),
  ROW({ name: 'moonlit night', clock: 23.5, az: 350, elev: -18, sun: r3(1, .5, .4), sunK: 0, hemi: r3(.38, .46, .70), gnd: r3(.10, .11, .15), hemiK: .34,
    fog: r3(.16, .20, .31), fogD: .0024, mist: .4, zen: r3(.014, .024, .07), mid: r3(.035, .055, .13), hor: r3(.09, .12, .21), glow: r3(.10, .11, .14),
    cloud: r3(.10, .115, .17), sat: .72, con: 1.05, cast: r3(.88, .95, 1.12), vig: .40, exp: 1.4, lit: 1, win: 1, lamp: 1, stars: .85, night: 1, moonUp: 1, moonAz: 4, moonEl: 23 }),
  ROW({ name: 'deep night', clock: 2.5, az: 25, elev: -16, sun: r3(1, .5, .4), sunK: 0, hemi: r3(.34, .42, .66), gnd: r3(.08, .09, .12), hemiK: .27,
    fog: r3(.12, .15, .24), fogD: .0026, mist: .55, zen: r3(.008, .014, .045), mid: r3(.02, .035, .09), hor: r3(.06, .08, .15), glow: r3(.07, .08, .1),
    cloud: r3(.07, .08, .12), sat: .66, con: 1.06, cast: r3(.86, .94, 1.14), vig: .44, exp: 1.45, lit: .45, win: .12, lamp: .45, stars: 1, night: 1, moonUp: .7, moonAz: 300, moonEl: 12 }),
];
export const HOUR_NAMES = HOURS.map(h => h.name);
const lerpAng = (a, b, f) => { let d = ((b - a + 540) % 360) - 180; return a + d * f; };
export function lerpHour(t) {
  const n = HOURS.length; t = ((t % n) + n) % n; const i = Math.floor(t), a = HOURS[i], b = HOURS[(i + 1) % n], f = t - i, o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => v + (b[k][j] - v) * f) : k === 'az' || k === 'moonAz' ? lerpAng(a[k], b[k], f)
    : k === 'clock' ? (a.clock + (((b.clock - a.clock) % 24 + 24) % 24) * f) % 24 : typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * f : (f < .5 ? a[k] : b[k]);
  o.t = t; o.name = HOURS[Math.round(t) % n].name; return o;
}
export const clockText = h => { const m = Math.round(h * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
// a bearing and a height in degrees to a unit vector (north -z, east +x)
export function dirOf(az, el, v = new THREE.Vector3()) { const a = az * Math.PI / 180, e = el * Math.PI / 180; return v.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); }

// ── the night's darkness, by the moon's phase (0 new, .5 a half, 1 full: its lit share) and the option ──
// moon: how much of a full moon's light falls; floor: what is left of the night's sky and hemisphere under a new moon; k: the night's
// share of a full-moon night's light (1 at full); stars: × the row's stars (a bright moon washes them out)
export const NIGHT = {
  readable: { label: 'A · readable', moon: () => .85, floor: .7, exp: 1.12 },
  phase: { label: 'B · by phase', moon: p => p, floor: .03, exp: 1 },
  floor: { label: 'C · by phase, a starlit floor', moon: p => p, floor: .2, exp: 1.06 },
};
export function nightRow(L, phase, mode) {
  const N = NIGHT[mode] || NIGHT.floor, m = N.moon(phase), dark = N.floor + (1 - N.floor) * m, k = 1 - L.night * (1 - dark), o = { ...L };
  for (const key of ['zen', 'mid', 'hor', 'cloud', 'fog', 'hemi']) o[key] = L[key].map(v => v * k);
  o.moonK = L.moonUp * .9 * m; o.stars = L.stars * (1 - .5 * m * L.night); o.exp = L.exp * (1 + (N.exp - 1) * L.night); o.dark = dark; o.moonLit = m; return o;
}

// ── the moon: a disc with its phase drawn, far off, facing the eye ──
function moonTex(phase) {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
  const blot = (u, v) => .5 + .5 * Math.sin(u * 9.1 + Math.sin(v * 7.3) * 1.7) * Math.sin(v * 8.7 + Math.cos(u * 5.9) * 2.1);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + .5) / N * 2 - 1, v = (j + .5) / N * 2 - 1, r = Math.hypot(u, v), o = (j * N + i) * 4; if (r > 1) { d[o + 3] = 0; continue; }
    const w = Math.sqrt(1 - v * v), lit = u > w * (1 - 2 * phase) ? 1 : 0, mare = blot(u, v) > .62 ? .82 : 1, edge = Math.min(1, (1 - r) * 40);
    const b = lit ? mare * (.86 + .14 * Math.sqrt(1 - r * r)) : .06; d[o] = 255 * b; d[o + 1] = 250 * b; d[o + 2] = 236 * b; d[o + 3] = 255 * edge * (lit ? 1 : .55);
  }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function hourMoon(scene, R = 20000, deg = 1.9) {
  const size = 2 * R * Math.tan(deg * Math.PI / 360), m = new THREE.MeshBasicMaterial({ map: moonTex(1), transparent: true, fog: false, depthWrite: false, color: new THREE.Color(1.3, 1.3, 1.3) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); mesh.renderOrder = 0; mesh.userData.noSnow = true; scene.add(mesh); let ph = 1;
  return { mesh, set(dir, cam, phase, up) { if (phase !== ph) { m.map.dispose(); m.map = moonTex(phase); ph = phase; }
    mesh.position.copy(cam.position).addScaledVector(dir, R); mesh.lookAt(cam.position); const v = Math.min(1, up * 1.5) * Math.min(1, phase / .12); mesh.visible = v > .02 && dir.y > -.02; m.opacity = v; } };
}
// ── the stars: points on the upper sky, each its own brightness and a touch of colour ──
export function hourStars(scene, n = 2600, R = 21000) {
  let s = 91; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const z = .02 + .98 * Math.pow(r(), .8), a = r() * Math.PI * 2, q = Math.sqrt(1 - z * z), b = Math.pow(r(), 3) * .9 + .1, t = r();
    pos.set([Math.cos(a) * q * R, z * R, Math.sin(a) * q * R], i * 3); col.set(t < .15 ? [b * .8, b * .88, b] : t > .9 ? [b, b * .9, b * .76] : [b, b, b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const p = new THREE.Points(g, m); p.renderOrder = 0; p.frustumCulled = false; scene.add(p);
  return { points: p, set(cam, k) { p.position.copy(cam.position); m.opacity = k; p.visible = k > .01; } };
}
// ── the mist: banks of the clouds' puff lying low over the field; spots: [[x, z, radius]], ground(x, z) -> y ──
export function hourMist(scene, spots, ground, n = 70) {
  let s = 33; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, out = [];
  for (let i = 0; i < n; i++) { const sp = spots[i % spots.length], a = r() * 6.28, d = sp[2] * Math.sqrt(r()), x = sp[0] + Math.cos(a) * d, z = sp[1] + Math.sin(a) * d;
    const m = new THREE.SpriteMaterial({ map: puffTex(), transparent: true, depthWrite: false, opacity: 0, color: 0xffffff }), sp2 = new THREE.Sprite(m), w = 26 + r() * 34;
    sp2.scale.set(w, w * (.16 + r() * .08), 1); sp2.position.set(x, ground(x, z) + .8 + r() * 1.6, z); sp2.userData.k = .55 + r() * .45; scene.add(sp2); out.push(sp2); }
  return { sprites: out, set(k, color) { for (const p of out) { p.material.opacity = k * p.userData.k * .55; p.material.color.copy(color); p.visible = k > .01; } } };
}
// ── the lamps: a warm pool before a door (a point light), and a lantern on a bracket (a frame, a lit pane, a light) ──
export function hourLamps(scene, doors, lantern) {
  const lights = [], warm = new THREE.Color(1, .6, .3);
  for (const [x, y, z] of doors) { const l = new THREE.PointLight(warm, 0, 16, 2); l.position.set(x, y, z); scene.add(l); lights.push(l); }
  let pane = null;
  if (lantern) { const [x, y, z, ry] = lantern, g = new THREE.Group(), iron = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .5, metalness: .6 });
    pane = new THREE.MeshStandardMaterial({ color: 0x1a140c, emissive: warm, emissiveIntensity: 0, roughness: .3 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .03, .42).translate(0, .3, .21), iron));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.11, .09, .26, 6), pane).translateZ(.42));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(.14, .12, 6).translate(0, .19, 0), iron).translateZ(.42));
    g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    const l = new THREE.PointLight(warm, 0, 20, 2); l.position.set(0, 0, .42); g.add(l); lights.push(l); l.userData.lantern = true; }
  return { lights, set(k) { for (const l of lights) { l.intensity = k * (l.userData.lantern ? 3.2 : 5); l.visible = k > .01; } if (pane) pane.emissiveIntensity = k * 1.4; } };
}
// ── the windows: the Gatelands kit's two pane materials (glMats().lit and .glass), warm by the row ──
export function setWindows(M, lit, win) {
  const amber = new THREE.Color(1, .52, .2);
  M.lit.emissive.copy(amber); M.lit.emissiveIntensity = .12 + lit * .75;
  M.glass.emissive.copy(amber); M.glass.emissiveIntensity = win * .6;
}
