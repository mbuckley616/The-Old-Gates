// The six schools' great halls, inside (the concept artist, 8 Nov 2026; backlog L10, "The six schools' great halls"; OG-119; card F5's
// look half, which gate-interiors.md's B leaves owed: "Dressing the six types by school is F5's look work"). One space of the six,
// the nave (gate-interiors.md's catalogue: 26 m between the piers, bays of 14 m, the vault to 33 m), dressed six ways. The nave is
// gatecond.js's steady hall (gatekit.js's pieces, the school's stone and script, the lanterns, the lift, the door and the ring
// chamber), so a builder reads the dressing as what is added to a space the generator already lays. A metre a unit, the floor's
// top at y 0, the nave running down -z from its threshold; the pier faces at x ±13.45, the aisles behind the arcades from x ±17.45
// to the aisle walls at ±24.45, the vault's springing at 21.3 m.
//
// The question is how far the school goes (NAVE_LEVELS):
//   'colour'  (A) the kit as built: the school's stone and the script's light, nothing else. One nave for six schools.
//   'dressed' (B) the school dresses the walls, the aisles, the air and the light; the nave's floor is the same in every school, so the
//                 space plays the same and the generator lays it unchanged:
//                 Tine    lava in both aisles behind the arcades, embers rising, a low red light under the arches, smoke under the vault;
//                 Uisce   the aisles flooded, water falling down the aisle walls, the nave's slabs wet, a green-blue light off the water;
//                 Cloch   tiers of cyclopean blocks up the aisle walls, rubble at the piers' feet, dust hanging in the lantern light;
//                 Scáth   a violet mist to the knee, the lanterns burning low and violet, broken galleries on the piers at 9 m;
//                 Solas   an oculus in every vault with a shaft of light to the floor and its pool, dust turning in the shafts;
//                 Gaoth   one bay's vault open to the sky, long pennants streaming from the arcades, leaves and grit on the wind.
//   'drawn'   (C) OG-119 as drawn: B, and the school changes the floor and stands its set piece in the nave:
//                 Tine    a lava channel 6 m wide down the nave's middle, lava falling through two arcades, a slab bridge hung on
//                         chains, a great iron wheel turning over the door;
//                 Uisce   the nave flooded 0.9 m (wading, F2b; swimming past 1.4), islands of slabs, a colossus 22 m tall standing in
//                         the water, a lantern-lit boat;
//                 Cloch   a forest of drum pillars in the aisles and down the nave's sides, fallen blocks of 2 to 4 m to climb, a stair
//                         run up the end wall to a gallery at 8.4 m, a round stone mechanism turning over the door;
//                 Scáth   the lanterns out, the mist to the chest, a gap in the floor to the dark, a gallery across the nave at 12 m
//                         and the stair to it only half there (the hidden stair);
//                 Solas   B's shafts, a ring window 14 m across over the door throwing its light down the nave, two hooded statues of
//                         16 m flanking the door, a line of light inlaid down the floor;
//                 Gaoth   the floor gone in the middle two bays to a shaft, plank bridges slung across it, the vault open over three
//                         bays, a wind wheel of 18 m turning over the door.
// naveOf({ school, level, t }) -> gatecond's gateHall object, its group dressed, with { dress: { tris, draws, lights, pieces }, view }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, puffTex, fbm } from './common.js';
import { gatePiece, stream, GK_SCHOOLS } from './gatekit.js';
import { gateHall } from './gatecond.js';

export const NAVE_LEVELS = { colour: 'A, the kit as built: stone and script by school', dressed: 'B, dressed: walls, aisles, air and light; the floor the same', drawn: 'C, OG-119 as drawn: the floor changed and a set piece' };
export const NAVE_SCHOOLS = Object.keys(GK_SCHOOLS);
const PF = 13.45, AI0 = 17.45, AI1 = 24.0, BAYS = 4, PITCH = 14, END = -56;

// ── textures, drawn once ──
const T = {};
function canvasTex(key, w, h, draw, rep = true) { if (T[key]) return T[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (T[key] = t); }
// lava: bright cracks between dark crusts (a cell noise of two octaves of the slices' fbm)
const lavaTex = () => canvasTex('lava', 256, 256, (x, w, h) => { const d = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = i / w, v = j / h, n = fbm(Math.cos(u * 6.283) * 1.6 + 9, Math.sin(u * 6.283) * 1.6 + Math.cos(v * 6.283) * 2.2 + Math.sin(v * 6.283) * .3, 4);
    const crack = Math.pow(1 - Math.min(1, Math.abs(n) * 5.5), 2.2), k = (i + j * w) * 4, hot = .25 + crack * .75; d.data[k] = 255 * Math.min(1, hot * 1.2); d.data[k + 1] = 255 * hot * hot * .6; d.data[k + 2] = 255 * hot * hot * hot * .2; d.data[k + 3] = 255; }
  x.putImageData(d, 0, 0); });
// a falling sheet: streaks down, alpha in the streaks, a soft edge each side
const streakTex = () => canvasTex('streak', 128, 512, (x, w, h) => { const r = stream('naves:streak'); x.clearRect(0, 0, w, h);
  for (let k = 0; k < 90; k++) { const sx = 6 + r() * (w - 12), sw = 1 + r() * 4, a = .25 + r() * .6, y0 = r() * h, L = 60 + r() * 300; const g = x.createLinearGradient(0, y0, 0, y0 + L);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.3, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(sx, y0, sw, L); x.fillRect(sx, y0 - h, sw, L); }
  const e = x.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(0,0,0,1)'); e.addColorStop(.12, 'rgba(0,0,0,0)'); e.addColorStop(.88, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = e; x.fillRect(0, 0, w, h); });
// a pennant's cloth: the school's colour with a dark border and a ring sigil
const pennantTex = () => canvasTex('pennant', 64, 512, (x, w, h) => { x.fillStyle = '#c8d6e0'; x.fillRect(0, 0, w, h); x.fillStyle = '#4f6a80'; x.fillRect(0, 0, 6, h); x.fillRect(w - 6, 0, 6, h);
  x.strokeStyle = '#4f6a80'; x.lineWidth = 4; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(32, 80 + k * 150, 18, 0, 7); x.stroke(); x.beginPath(); x.moveTo(32, 54 + k * 150); x.lineTo(32, 106 + k * 150); x.stroke(); } }, false);

// ── the bits every school takes ──
const TM = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
const glow = (rgb, k = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0] * k, rgb[1] * k, rgb[2] * k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: o.fog ?? true, opacity: o.op ?? 1, map: o.map || null });

export function naveOf(o = {}) {
  const school = GK_SCHOOLS[o.school] ? o.school : 'cloch', level = NAVE_LEVELS[o.level] ? o.level : 'dressed', t0 = o.t ?? 4;
  const v = gateHall({ cond: 'steady', mode: 'school', school, t: t0 }), S = GK_SCHOOLS[school], stone = new THREE.Color(...S.stone);
  const D = new THREE.Group(), lights = [], ticks = [], r = stream(`naves:${school}:${level}`), pieces = [];
  v.group.add(D);
  const add = (m, cast = false) => { m.castShadow = cast; m.receiveShadow = true; D.add(m); return m; };
  const light = (rgb, k, dist, x, y, z, decay = 1.4) => { const l = new THREE.PointLight(new THREE.Color(...rgb), k, dist, decay); l.position.set(x, y, z); D.add(l); lights.push(l); return l; };
  const stoneM = (k = .8, rough = .85, tex = 'ashlar') => mat(tex, { ns: 1, color: stone.clone().multiplyScalar(k), rough });
  const piece = (kind, x, y, z, ry = 0, extra = {}) => { const p = gatePiece(kind, { cond: 'whole', school, key: `naves:${kind}:${pieces.length}`, ...extra }); p.position.set(x, y, z); p.rotation.y = ry; D.add(p); pieces.push(kind); return p; };
  // what the hall laid that a school takes away: its slabs, its vaults, the dark ground under the floor, the aisles' floors, its light
  const hall = v.group.children.filter(c => c !== D);
  const take = f => { for (const c of hall.filter(f)) v.group.remove(c); };
  const slabAt = (c, bays, xs) => c.userData.kind === 'slab' && bays.includes(Math.floor(-c.position.z / PITCH)) && (!xs || xs(c.position.x));
  const lamps = v.lights.filter(l => l.isPointLight && Math.abs(l.position.y - 7) < .01);
  // motes: one Points of soft sprites, drifting by a velocity field from the tick (a still is the same twice: positions from t)
  const motes = (n, box, rgb, size, op, vel, add_ = true) => { const P = new Float32Array(n * 3), B = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { B[i * 3] = box[0] + r() * (box[3] - box[0]); B[i * 3 + 1] = box[1] + r() * (box[4] - box[1]); B[i * 3 + 2] = box[2] + r() * (box[5] - box[2]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ map: puffTex(), color: new THREE.Color(...rgb), size, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, blending: add_ ? THREE.AdditiveBlending : THREE.NormalBlending }));
    const lay = t => { for (let i = 0; i < n; i++) { const w = vel(i, t); for (let a = 0; a < 3; a++) { const lo = box[a], span = box[a + 3] - lo; P[i * 3 + a] = lo + ((((B[i * 3 + a] - lo + w[a]) % span) + span) % span); } } g.attributes.position.needsUpdate = true; };
    ticks.push(lay); m.frustumCulled = false; D.add(m); return m; };
  // a falling sheet from y0 to y1, w wide, facing +z before ry; scrolls down
  const fall = (x, z, ry, w, y0, y1, rgb, k, additive) => { const tx = streakTex().clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, w / 3), (y0 - y1) / 8);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, y0 - y1), additive ? glow(rgb, k, { map: tx }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb).multiplyScalar(k), map: tx, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: .8 }));
    m.position.set(x, (y0 + y1) / 2, z); m.rotation.y = ry; ticks.push(t => { tx.offset.y = t * (y0 - y1) / 8 * .9; }); D.add(m); return m; };
  // a pool or channel's surface, its top at y
  const lavaM = () => { const tx = lavaTex().clone(); tx.needsUpdate = true; const m = new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: .7, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 2.4, map: tx });
    ticks.push(t => { tx.offset.set(t * .006, t * .015); }); return { m, tx }; };
  const surface = (x0, x1, z0, z1, y, M, rep = 1) => { const g = new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z0 - z1)); g.rotateX(-Math.PI / 2); worldUV(g, rep); const m = new THREE.Mesh(g, M); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); return add(m); };
  const waterM = (rgb, op = .86) => { const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(...rgb), roughness: .16, metalness: 0, specularIntensity: .3, transparent: true, opacity: op }); return m; };
  // a channel's curb: a low stone kerb along z at x, from z0 to z1
  const curb = (x, z0, z1, h = .5, w = .6) => { const g = new THREE.BoxGeometry(w, h, z0 - z1); worldUV(g, .4); return add(new THREE.Mesh(g, stoneM(.65, .8, 'slab')), true).position.set(x, h / 2 - .35, (z0 + z1) / 2); };
  // a lathe from [r, y] pairs
  const lathe = (pts, M, n = 18) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n), M);
  // a hooded figure, h tall, standing at the origin facing +z (the colossus and Solas' statues): robe, hood, the face's dark, the arms
  const hooded = (h, M, hands) => { const G = new THREE.Group(), s = h / 16;
    const robe = lathe([[0, 0], [3.0, 0], [2.9, 1], [2.4, 5], [2.1, 8], [2.3, 10.5], [2.5, 11.6], [1.7, 12.4], [.9, 12.8], [0, 12.9]].map(([a, b]) => [a * s, b * s]), M, 20); robe.scale.z = .78; G.add(robe);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(1.55 * s, 18, 12, 0, Math.PI * 2, 0, Math.PI * .62), M); hood.position.set(0, 13.4 * s, -.15 * s); hood.scale.set(1, 1.35, 1.05); G.add(hood);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.95 * s, 16), new THREE.MeshBasicMaterial({ color: 0x050403 })); face.position.set(0, 13.3 * s, 1.36 * s); face.scale.y = 1.25; G.add(face);
    for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(.55 * s, .75 * s, 5.5 * s, 10), M); arm.position.set(sx * 1.25 * s, 9.2 * s, 1.0 * s); arm.rotation.set(-.55, 0, sx * .35); G.add(arm); }
    const hm = new THREE.Mesh(new THREE.SphereGeometry(.85 * s, 12, 8), M); hm.position.set(0, 7.3 * s, 2.15 * s); hm.scale.set(1.3, .8, .8); G.add(hm);
    if (hands) hands(G, s); G.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); return G; };
  const B = level !== 'colour', C = level === 'drawn', G = S.glow;

  if (school === 'tine' && B) {
    // the aisles' floors give way to lava a metre down, behind a kerb; red light under the arches
    take(c => c.isMesh && Math.abs(c.position.y + .01) < .005 && Math.abs(c.position.x) > 15);
    const L = lavaM();
    for (const sx of [-1, 1]) { surface(sx * 15.5, sx * 24, 2, END - 2, -.3, L.m, .12);
      for (let i = 0; i < 3; i++) light([1, .32, .06], 70, 26, sx * 20.5, .8, -(i * 19 + 9), 1.3); }
    motes(320, [-24, -.5, END, 24, 26, 2], [1, .45, .1], .16, .95, (i, t) => [Math.sin(t * .7 + i) * .4, t * (1.2 + (i % 7) * .25), 0]);
    motes(60, [-22, 18, END, 22, 32, 0], [.06, .05, .05], 9, .5, (i, t) => [t * .25, Math.sin(t * .2 + i) * .3, 0], false);
    if (C) { // the channel down the middle: the four centre slabs of bays 1 to 3 out, lava in their place, kerbs; the falls through the arcades
      take(c => slabAt(c, [1, 2, 3], x => Math.abs(x) < 4));
      const L2 = lavaM(); surface(-3.75, 3.75, -14, END, -.75, L2.m, .12); for (const sx of [-1, 1]) curb(sx * 3.9, -14, END, .95, .5);
      { const g = new THREE.BoxGeometry(7.5, 2, .5); worldUV(g, .4); add(new THREE.Mesh(g, stoneM(.6))).position.set(0, -1, -14); }
      for (const sx of [-1, 1]) for (const z of [-21, -35]) { fall(sx * 15.45, z, Math.PI / 2, 4.5, 17.5, -.9, [1, .42, .08], 3.2, true); light([1, .4, .08], 60, 30, sx * 13, 4, z, 1.3); }
      light([1, .35, .06], 140, 40, 0, .5, -35, 1.2);
      // the bridge over the channel at bay 2, a slab deck 3.4 m wide hung on four chains from the vault
      const iron = new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: .45, metalness: .85 });
      { const g = new THREE.BoxGeometry(9.6, .45, 3.4); worldUV(g, .4); add(new THREE.Mesh(g, stoneM(.55, .7, 'slab')), true).position.set(0, .05, -28); }
      for (const [cx, cz] of [[-4.6, -26.4], [4.6, -26.4], [-4.6, -29.6], [4.6, -29.6]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 21, 6), iron); c.position.set(cx * 1.1, 10.7, cz); c.rotation.z = cx < 0 ? .05 : -.05; add(c, true); }
      // the great wheel on the end wall over the door: an iron ring 14 m across, 12 spokes, 36 teeth, turning
      const W = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.TorusGeometry(7, .45, 8, 48), iron); W.add(ring); const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 16).rotateX(Math.PI / 2), iron); W.add(hub);
        for (let k = 0; k < 12; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.3, 6.6, .3), iron); s.position.set(Math.cos(k / 12 * 6.283) * 3.6, Math.sin(k / 12 * 6.283) * 3.6, 0); s.rotation.z = k / 12 * 6.283 - Math.PI / 2; W.add(s); }
        for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283, s = new THREE.Mesh(new THREE.BoxGeometry(.6, .9, .7), iron); s.position.set(Math.cos(a) * 7.7, Math.sin(a) * 7.7, 0); s.rotation.z = a - Math.PI / 2; W.add(s); } }
      W.position.set(0, 25.5, END - .6); W.traverse(m => { if (m.isMesh) m.castShadow = true; }); D.add(W); ticks.push(t => { W.rotation.z = t * .05; }); light([1, .5, .15], 50, 22, 0, 25, END + 3, 1.3);
    }
  }

  if (school === 'uisce' && B) {
    take(c => c.isMesh && Math.abs(c.position.y + .01) < .005 && Math.abs(c.position.x) > 15);
    const wm = waterM([.05, .12, .14]);
    for (const sx of [-1, 1]) { surface(sx * 15.5, sx * 24, 2, END - 2, -.25, wm, .3); surface(sx * 15.5, sx * 24, 2, END - 2, -2.2, new THREE.MeshStandardMaterial({ color: 0x1b2a2a, roughness: 1 }), .3);
      for (let i = 0; i < BAYS; i++) fall(sx * 22.9, -(i + .5) * PITCH, -sx * Math.PI / 2, 9, 12, -.25, [.75, .9, 1], 1.0, false);
      for (let i = 0; i < 2; i++) light([.3, .75, .85], 40, 24, sx * 20, .2, -(i * 28 + 12), 1.4); }
    // the nave's slabs wet: the floor's own material, glossier
    for (const c of hall) if (c.userData.kind === 'slab') c.traverse(m => { if (m.isMesh && m.material.roughness !== undefined) { m.material = m.material.clone(); m.material.roughness = .45; m.material.metalness = 0; } });
    motes(140, [-24, -.4, END, 24, 1.6, 2], [.7, .85, .9], 2.2, .045, (i, t) => [t * .12 * (i % 2 ? 1 : -1), 0, Math.sin(t * .1 + i) * .5], false);
    motes(240, [-24, 0, END, 24, 12, 2], [.7, .9, 1], .06, .7, (i, t) => [0, -t * 6.5, 0]);
    if (C) { // the nave flooded to 0.9 m, the threshold dry, islands of slabs, the colossus and the boat
      const wm2 = waterM([.004, .016, .02], .93); surface(-13.45, 13.45, -1.5, END, .9, wm2, .3);
      { const g = new THREE.BoxGeometry(27, .9, .4); worldUV(g, .4); add(new THREE.Mesh(g, stoneM(.6, .7, 'slab'))).position.set(0, .45, -1.5); }
      const isl = [[-6, -12, 5, 4], [5, -18, 4, 6], [-2, -26, 6, 3.5], [7, -33, 4.5, 4.5], [-7, -38, 4, 5], [0, -50, 9, 4]];
      for (const [x, z, w, d] of isl) { const g = new THREE.BoxGeometry(w, 1.5, d); worldUV(g, .4); add(new THREE.Mesh(g, stoneM(.7, .6, 'slab')), true).position.set(x, .45, z); }
      const cm = stoneM(.85, .8), col = hooded(22, cm, (Gr, s) => { const lan = new THREE.Mesh(new THREE.OctahedronGeometry(.9 * s * 1.4, 0), glow(G, 3.2)); lan.position.set(0, 6.0 * s, 3.6 * s); Gr.add(lan);
        const ch = new THREE.Mesh(new THREE.CylinderGeometry(.04 * s * 3, .04 * s * 3, 1.4 * s, 4), new THREE.MeshStandardMaterial({ color: 0x223 })); ch.position.set(0, 6.9 * s, 3.2 * s); Gr.add(ch); });
      col.position.set(-6.5, -2.2, -44); col.rotation.y = .35; D.add(col); light(G, 120, 30, -5, 8, -40, 1.3);
      const boat = new THREE.Group(), wood = mat('wood', { ns: .8, color: 0x4a3524, rough: .8 }); { const hull = lathe([[0, -.5], [.9, -.35], [1.1, 0], [1.15, .35]], wood, 14); hull.scale.set(1, 1, 3.4); boat.add(hull);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.4, 6), wood); pole.position.set(0, 1.4, 3); boat.add(pole); const lt = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), glow([1, .7, .35], 4)); lt.position.set(0, 2.5, 3); boat.add(lt); }
      boat.position.set(6.5, .95, -24); boat.rotation.y = -.3; boat.traverse(m => { if (m.isMesh) m.castShadow = true; }); D.add(boat); light([1, .7, .35], 30, 16, 6.9, 3.3, -21.2, 1.4);
      for (const sx of [-1, 1]) fall(sx * 8.5, END - 2.1, 0, 5, 30, .9, [.75, .9, 1], 1.2, false);
    }
  }

  if (school === 'cloch' && B) {
    // the aisle walls faced in tiers of cyclopean blocks: rows of 2.5 to 4.2 m stones stepping back as they rise, rubble at the piers
    const bm = stoneM(.92, .9, 'ashlar'), geos = [];
    for (const sx of [-1, 1]) { let y = 0; for (let tier = 0; tier < 4; tier++) { const th = 2.4 + r() * 1.1, inset = tier * .55; let z = 1;
      while (z > END - 1) { const L = 2.4 + r() * 2, g = new THREE.BoxGeometry(1.6, th - .06, L - .08); g.applyMatrix4(TM(sx * (23.2 - inset - (r() - .5) * .25), y + th / 2, z - L / 2, (r() - .5) * .03, 0, (r() - .5) * .02)); geos.push(g); z -= L; } y += th; } }
    for (let i = 0; i <= BAYS; i++) for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const s = .4 + r() * .8, g = new THREE.DodecahedronGeometry(s, 0); g.applyMatrix4(TM(sx * (13.2 - r() * 1.6), s * .5, -i * PITCH + (r() - .5) * 4, r() * 6, r() * 6, r() * 6)); geos.push(g); }
    for (const g of geos) { worldUV(g, .3); for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); }
    add(new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), bm), true);
    motes(500, [-13, 1, END, 13, 20, 0], [1, .82, .55], .07, .55, (i, t) => [Math.sin(t * .13 + i) * .6, Math.sin(t * .09 + i * 3) * .4, Math.cos(t * .11 + i) * .6]);
    if (C) { // the pillar forest: drums 2.2 m across, 20 m high, in the aisles and in two rows down the nave's sides
      const dm = stoneM(.9, .85, 'ashlar');
      const dg = [], drum = (x, z) => { let y = 0; while (y < 21.3) { const h = 1.1 + r() * .5, g = new THREE.CylinderGeometry(1.1, 1.12, h - .04, 16); g.applyMatrix4(TM(x, y + h / 2, z, r() * 6)); dg.push(g); y += h; }
        const cap = new THREE.BoxGeometry(3, .9, 3); cap.applyMatrix4(TM(x, 21.3, z)); dg.push(cap); };
      for (let i = 0; i < BAYS; i++) { const z = -(i + .5) * PITCH; for (const sx of [-1, 1]) { drum(sx * 9.5, z); drum(sx * 20.5, z + 3.5); drum(sx * 20.5, z - 3.5); } }
      for (const g of dg) worldUV(g, .3); add(new THREE.Mesh(mergeGeometries(dg.map(g => g.toNonIndexed())), dm), true);
      // fallen blocks across the floor, 2 to 4 m: a climb of 1.2 to 2.5 m at a time (the double jump's ground)
      for (const [x, z, s, h] of [[-3, -16, 3.4, 2.2], [2.5, -19, 2.4, 1.3], [-1.5, -31, 4, 2.6], [4, -40, 3, 1.8], [-5, -44, 2.2, 1.2]]) { const g = new THREE.BoxGeometry(s, h, s * 1.3); worldUV(g, .3); const m = new THREE.Mesh(g, bm); m.position.set(x, h / 2 - .05, z); m.rotation.set((r() - .5) * .08, r() * 1.2, (r() - .5) * .1); add(m, true); }
      // a stair run up the end wall to a gallery at 8.4 m, right of the door
      piece('stair', 14.5, 0, END + 7.6, Math.PI / 2); piece('stair', 18.7, 4.2, END + 3.2, Math.PI);
      { const g = new THREE.BoxGeometry(13, .7, 3.2); worldUV(g, .3); add(new THREE.Mesh(g, bm), true).position.set(17, 8.05, END - .6); }
      // the round stone mechanism over the door: three concentric rings of stone turning against each other, script in their faces
      const Mg = new THREE.Group(); [[8.5, 6.6, .05], [6.4, 4.2, -.08], [4, 1.6, .12]].forEach(([ro, ri, w], k) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(h);
        const g = new THREE.ExtrudeGeometry(s, { depth: 1.2 - k * .25, bevelEnabled: false, curveSegments: 40 }); worldUV(g, .3); const m = new THREE.Mesh(g, stoneM(.8 - k * .08, .8)); m.castShadow = true; const R = new THREE.Group(); R.add(m);
        for (let j = 0; j < 8; j++) { const a = j / 8 * 6.283, gl = new THREE.Mesh(new THREE.PlaneGeometry(.35, (ro - ri) * .7), glow(G, 1.3)); gl.position.set(Math.cos(a) * (ro + ri) / 2, Math.sin(a) * (ro + ri) / 2, 1.25 - k * .25); gl.rotation.z = a - Math.PI / 2; R.add(gl); }
        ticks.push(t => { R.rotation.z = t * w; }); Mg.add(R); });
      Mg.position.set(0, 26, END - .9); D.add(Mg); light(G, 40, 20, 0, 26, END + 3, 1.3);
    }
  }

  if (school === 'scath' && B) {
    // the lanterns burn low and violet; a violet mist to the knee; galleries broken on the piers at 9 m
    for (const l of lamps) { l.color.setRGB(...G); l.intensity *= C ? 0 : .45; }
    if (C) for (const c of hall) c.traverse(m => { if (m.isMesh && m.geometry.type === 'BoxGeometry' && m.material.emissiveIntensity > 3) m.material.emissiveIntensity = 0; });
    const mistH = C ? 1.9 : 1.1;
    motes(C ? 2400 : 1600, [-24, .5, END, 24, mistH, 2], [.45, .3, .62], C ? 4 : 3.2, C ? .035 : .03, (i, t) => [t * .2 * (i % 2 ? 1 : -1), 0, Math.sin(t * .1 + i) * .8], false);
    motes(200, [-14, 0, END, 14, 22, 2], [.02, .01, .03], .5, .7, (i, t) => [Math.sin(t * .3 + i) * .5, t * .15, 0], false);
    const gal = [[-1, 0], [-1, 2], [1, 1], [1, 3]];
    for (const [sx, i] of gal) { const p = piece('balcony', sx * (PF - .2), 3, -(i + .5) * PITCH, sx < 0 ? Math.PI / 2 : -Math.PI / 2); p.scale.set(1.5, 1, 1); light(G, 24, 16, sx * 11.5, 9.8, -(i + .5) * PITCH, 1.5); }
    if (C) { // a gap in the floor to the dark (bay 2's middle), a gallery across the nave at 12 m, the hidden stair half there
      take(c => slabAt(c, [2], x => Math.abs(x) < 8)); take(c => c.isMesh && Math.abs(c.position.y + .63) < .01);
      surface(-15, 15, 0, -21, -.63, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 })); surface(-15, 15, -35, END, -.63, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 }));
      for (const sx of [-1, 1]) surface(sx * 7.5, sx * 15, -21, -35, -.63, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 }));
      light(G, 40, 30, 0, -12, -28, 1.2);
      { const g = new THREE.PlaneGeometry(15, 14); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, glow(G, .25)); m.position.set(0, -30, -28); D.add(m); }
      const br = piece('bridge', 0, 6, -40, Math.PI / 2); br.scale.set(1.68, 1, 1);
      // the hidden stair: two flights, the lower stone, the upper drawn in light only (there when you know the word)
      piece('stair', -7.5, 0, -44.5, -Math.PI / 2);
      const ghost = gatePiece('stair', { cond: 'whole', school, key: 'naves:ghost' }); ghost.traverse(m => { if (m.isMesh) { m.material = glow(G, .2, { op: .5 }); m.castShadow = false; } }); ghost.position.set(-3.3, 4.2, -40); ghost.rotation.y = -Math.PI / 2; ghost.scale.set(1, 1.86, 1); D.add(ghost);
    }
  }

  if (school === 'solas' && B) {
    // an oculus at every vault's crown, a shaft to the floor and its pool, dust turning in the light
    const shaftM = () => { const g = new THREE.CylinderGeometry(1.4, 3.6, 33, 24, 1, true); const c = new Float32Array(g.attributes.position.count * 3), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const k = .1 + .9 * (P.getY(i) + 16.5) / 33; c[i * 3] = k; c[i * 3 + 1] = k * .92; c[i * 3 + 2] = k * .72; } g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.16, .15, .12), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); };
    for (let i = 0; i < BAYS; i++) { const z = -(i + .5) * PITCH, sh = shaftM(); sh.position.set(.8, 16.5, z + .6); sh.rotation.set(-.03, 0, -.05); D.add(sh);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.7, 3) })); disc.position.set(0, 33.1, z); disc.rotation.x = Math.PI / 2; D.add(disc);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), glow([1, .92, .72], .06)); pool.rotation.x = -Math.PI / 2; pool.position.set(1.6, .03, z + 1.2); pool.scale.set(1, 1.15, 1); D.add(pool);
      const s = new THREE.SpotLight(new THREE.Color(1, .93, .78), 900, 50, .14, .5, 1.2); s.position.set(0, 33, z); s.target.position.set(1.6, 0, z + 1.2); D.add(s, s.target); lights.push(s); }
    motes(600, [-6, 0, END, 6, 32, 0], [1, .9, .7], .06, .8, (i, t) => [Math.sin(t * .11 + i) * .7, Math.sin(t * .07 + i * 2) * 1.2, Math.cos(t * .09 + i) * .7]);
    for (const l of lamps) l.intensity *= .6;
    if (C) { // the ring window over the door, its light down the nave; two hooded statues flanking the door; a line of light in the floor
      const ring = new THREE.Group(); { const s = new THREE.Shape(); s.absarc(0, 0, 7, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, 5.4, 0, Math.PI * 2, true); s.holes.push(h);
        ring.add(new THREE.Mesh(new THREE.ShapeGeometry(s, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.6, 3.8) })));
        const inner = new THREE.Mesh(new THREE.CircleGeometry(5.4, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.3, 1.05) })); inner.position.z = -.05; ring.add(inner);
        for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, 10.8, .5), stoneM(.7)); b.rotation.z = k / 8 * Math.PI; ring.add(b); } }
      ring.position.set(0, 25.5, END - .4); D.add(ring);
      { const g = new THREE.CylinderGeometry(5.5, 9, 54, 32, 1, true); g.rotateX(Math.PI / 2); const c = new Float32Array(g.attributes.position.count * 3), P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { const k = .05 + .95 * (P.getZ(i) + 27) / 54; c[i * 3] = k; c[i * 3 + 1] = k * .93; c[i * 3 + 2] = k * .78; } g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.045, .042, .035), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        m.position.set(0, 14, END + 24); m.rotation.x = .4; m.scale.z = -1; D.add(m); }
      const s = new THREE.SpotLight(new THREE.Color(1, .92, .75), 700, 90, .3, .6, 1.1); s.position.set(0, 25.5, END + .5); s.target.position.set(0, 0, -12); D.add(s, s.target); lights.push(s);
      const sm = stoneM(1.0, .7, 'ashlar');
      for (const sx of [-1, 1]) { const st = hooded(16, sm); st.position.set(sx * 9.6, 0, END + 2.2); st.rotation.y = -sx * .25; D.add(st);
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.2, 5.5), sm); plinth.position.set(sx * 9.6, -.55, END + 2.2); add(plinth, true); st.position.y = .05; }
      { const g = new THREE.PlaneGeometry(.35, -END + 2); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, glow([1, .9, .65], .5)); m.position.set(0, .03, END / 2 - 1); D.add(m); }
    }
  }

  if (school === 'gaoth' && B) {
    // one bay's vault open to the sky (C: three), long pennants streaming off the arcades, leaves and grit on the wind
    const open = C ? [1, 2, 3] : [2];
    take(c => c.userData.kind === 'vault' && open.includes(Math.floor(-c.position.z / PITCH)));
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .7, .92), fog: false })); sky.rotation.x = Math.PI / 2; sky.position.set(0, 120, -28); D.add(sky);
    for (const z of open.map(i => -(i + .5) * PITCH)) { const s = new THREE.SpotLight(new THREE.Color(.82, .9, 1), 1400, 80, .5, .7, 1.1); s.position.set(-6, 60, z + 8); s.target.position.set(0, 0, z); s.castShadow = true; s.shadow.mapSize.set(1024, 1024); D.add(s, s.target); lights.push(s); }
    const cloth = new THREE.MeshStandardMaterial({ map: pennantTex(), color: new THREE.Color(...G).lerp(new THREE.Color(.5, .5, .5), .5).multiplyScalar(.55), roughness: .95, side: THREE.DoubleSide });
    for (let i = 0; i < BAYS; i++) for (const sx of [-1, 1]) { const n = 14, g = new THREE.PlaneGeometry(1.1, 11, 1, n); g.translate(0, -5.5, 0); const P = g.attributes.position, base = P.array.slice(), ph = r() * 6;
      const m = new THREE.Mesh(g, cloth); m.position.set(sx * 14.5, 17.6, -(i + .5) * PITCH); m.rotation.y = Math.PI / 2; m.castShadow = true; D.add(m);
      ticks.push(t => { for (let k = 0; k < P.count; k++) { const y = -base[k * 3 + 1], u = y / 11; P.setX(k, base[k * 3] + Math.sin(t * 3 + y * .7 + ph) * .25 * u); P.setZ(k, -u * u * 4.2 + Math.sin(t * 2.1 + y * .5 + ph) * .5 * u); P.setY(k, base[k * 3 + 1] + u * u * 2.2); } P.needsUpdate = true; g.computeVertexNormals(); }); }
    motes(260, [-24, 0, END, 24, 24, 2], [.55, .5, .38], .12, .9, (i, t) => [0, Math.sin(t * 2 + i) * .6 - t * .3 * (i % 3), -t * (5 + (i % 5))], false);
    motes(120, [-24, 1, END, 24, 20, 2], [.85, .9, 1], .9, .14, (i, t) => [0, 0, -t * 9]);
    if (C) { // the floor gone in bays 1 and 2 to a shaft; two plank bridges slung across it; the wind wheel over the door
      take(c => slabAt(c, [1, 2])); take(c => c.isMesh && Math.abs(c.position.y + .63) < .01);
      surface(-15, 15, 0, -14, -.63, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 })); surface(-15, 15, -42, END, -.63, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 }));
      const wm = stoneM(.55, .9);
      for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(1, 60, 28); worldUV(g, .3); add(new THREE.Mesh(g, wm)).position.set(sx * 13.9, -30.2, -28); }
      { const g = new THREE.BoxGeometry(28, 60, 1); worldUV(g, .3); for (const z of [-13.6, -42.4]) add(new THREE.Mesh(g, wm)).position.set(0, -30.2, z); }
      { const g = new THREE.PlaneGeometry(28, 28); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(.1, .13, .17) })); m.position.set(0, -60, -28); D.add(m); }
      const wood = mat('wood', { ns: .8, color: 0x6a5238, rough: .85 }), rope = new THREE.MeshStandardMaterial({ color: 0x8a7556, roughness: 1 });
      const plankBridge = (x0, z0, x1, z1, sag) => { const n = 40, L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0), Gb = new THREE.Group(), y = u => -sag * 4 * u * (1 - u);
        const pg = []; for (let k = 0; k < n; k++) { const u = (k + .5) / n, g = new THREE.BoxGeometry(1.6, .07, L / n - .06); g.applyMatrix4(TM(0, y(u) + (r() - .5) * .03, u * L, 0, Math.atan((y(u + .01) - y(u - .01)) / (.02 * L)), (r() - .5) * .06)); pg.push(g.toNonIndexed()); }
        Gb.add(new THREE.Mesh(mergeGeometries(pg), wood));
        for (const sx of [-.85, .85]) for (const h of [0, 1.0]) { const pts = []; for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push(new THREE.Vector3(sx, y(u) + h + (h ? sag * .1 * 4 * u * (1 - u) : 0), u * L)); }
          Gb.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .035, 5), rope)); }
        Gb.position.set(x0, 0, z0); Gb.rotation.y = ang; Gb.traverse(m => { if (m.isMesh) m.castShadow = true; }); D.add(Gb); };
      plankBridge(-3, -14, 4, -42, 1.6); plankBridge(-12, -21, -5.5, -42, 1.1);
      const Wh = new THREE.Group(); { const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 16).rotateX(Math.PI / 2), wood); Wh.add(hub);
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, arm = new THREE.Group(); arm.rotation.z = a; const sp = new THREE.Mesh(new THREE.BoxGeometry(.4, 9, .4), wood); sp.position.y = 4.5; arm.add(sp);
          const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 7), cloth); sail.position.set(1.4, 5.2, .1); sail.rotation.y = .35; arm.add(sail); Wh.add(arm); } }
      Wh.position.set(0, 25, END - .2); Wh.traverse(m => { if (m.isMesh) m.castShadow = true; }); D.add(Wh); ticks.push(t => { Wh.rotation.z = -t * .4; });
    }
  }

  let tris = 0, draws = 0; D.traverse(m => { if (m.isMesh || m.isPoints) { draws++; tris += m.isPoints ? 0 : (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; } });
  const tick0 = v.tick, tick = t => { tick0(t); for (const f of ticks) f(t); }; tick(t0);
  return Object.assign(v, { tick, school, level, dress: { tris: Math.round(tris), draws, lights: lights.length, pieces: pieces.length }, lights: v.lights.concat(lights),
    view: { ...v.view, wide: [7, 7.5, 5, -3, 4, -44], eye: [3.4, 1.7, 6, -.6, 7.5, -50], high: [9, 19, 4, -3, 4, -46], aisle: [-6, 5.5, -4, -21, .5, -26], up: [2, 1.6, -8, -1, 30, -30] } });
}
