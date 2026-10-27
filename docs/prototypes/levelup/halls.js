// Lighting the halls (backlog L12, "Light indoors", what Session 1478's light.js left owed; OG-141's "torches on corridor walls, a ring
// chandelier for halls" and "a tavern warm and crowded in the evening"). Concept, 27 Oct 2026. Michael's answer on #765 (C, the lights
// with the eye half open) lights every hall here: light.js's one rule, with the fixtures below as more lamps.
// The question is which fixtures a hall carries, in HALL_MODES:
//   own (A): what rooms.js already hangs: the hearth, the guild's wheel of candles, the Mark's iron lamps, Aurenne's two pendants;
//   torches (B): A and a pitch torch in an iron bracket every 3.5 to 4 m along the walls, the same torch in every hall on every island;
//   island (C): A and each island's own: Gatelands candle sconces of two candles, the Mark's torches, Aurenne's bronze lamp stands and
//     oil lamps on wall brackets.
// One unit is a metre. A bracket's ring is at 1.95 m over the floor, a torch's flame at 2.25 m, a sconce's candles at 1.75 m, a lamp
// stand's lamp at 1.45 m: over the head of a 1.9 m man, under a 2.4 m ceiling.
//   fixture(type) -> { group, flames: [Mesh], light: { at: [x, y, z] (local), k, r, col } } in the wall's frame (the wall at z = 0, the
//     room toward +z, the floor at y = 0)
//   dressHall(scene, C, kind, mode) -> { fixtures (light.js's o.fixtures), group, tris, draws, count, tick(t) }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, puffTex } from './common.js';

let FM = null;
function fmats() {
  if (FM) return FM;
  FM = { iron: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .55, metalness: .6 }), brand: mat('wood', { ns: .8, color: 0x5a3e26, rough: .8 }),
    pitch: new THREE.MeshStandardMaterial({ color: 0x120c08, emissive: new THREE.Color(.6, .18, .04), emissiveIntensity: .6, roughness: 1 }),
    wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .45, emissive: new THREE.Color(.5, .3, .12), emissiveIntensity: .25 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x9a6a32, roughness: .35, metalness: .85 }), clay: mat('plaster', { ns: .4, color: 0xb0643a, rough: .7 }),
    soot: new THREE.MeshBasicMaterial({ map: puffTex(), color: 0x000000, transparent: true, opacity: .55, depthWrite: false }),
    flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.35, .45), transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }),
    core: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.2), transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }) };
  FM.soot.polygonOffset = true; FM.soot.polygonOffsetFactor = -2; return FM;
}
// a teardrop of flame, h tall and r wide at its belly, its foot at the origin
function flameGeo(r, h) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(t, .7)) * (1 - t * .35), t * h)); } return new THREE.LatheGeometry(pts, 8); }
const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r1, r0, h, n);
const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)));

// the fixtures, each in its wall's frame. Parts are [geometry, material key]; flames are kept apart to flicker
function parts(type) {
  const P = [], F = [];
  if (type === 'torch') {
    // an iron plate on the wall, an arm out 0.15 m to a ring, the brand through the ring leaning 20 degrees out, its head wound in pitch
    P.push([at(new THREE.BoxGeometry(.07, .24, .015), 0, 1.95, .008), 'iron'], [at(new THREE.BoxGeometry(.018, .018, .15), 0, 1.92, .08), 'iron'], [at(new THREE.TorusGeometry(.03, .006, 4, 10), 0, 1.92, .155, Math.PI / 2), 'iron']);
    const lean = .35, d = new THREE.Vector3(0, Math.cos(lean), Math.sin(lean)), ring = new THREE.Vector3(0, 1.92, .155), foot = ring.clone().addScaledVector(d, -.3), tip = ring.clone().addScaledVector(d, .26);
    const mid = foot.clone().lerp(tip, .5); P.push([at(cyl(.016, .022, .56), mid.x, mid.y, mid.z, lean), 'brand']);
    const head = tip.clone().addScaledVector(d, -.05); P.push([at(cyl(.032, .028, .12, 8), head.x, head.y, head.z, lean), 'pitch']);
    F.push({ g: flameGeo(.06, .34), p: tip.clone().addScaledVector(d, .005), core: .45 });
    // the soot the torch has laid on the wall over it
    P.push([at(new THREE.PlaneGeometry(.55, 1.0), 0, 2.55, .004), 'soot']);
    return { P, F, light: { at: [0, tip.y + .14, tip.z + .1], k: 5, r: 8, col: [1, .55, .24] } };
  }
  if (type === 'sconce') {
    // the Gatelands' candle sconce: an iron back-plate with a scrolled top, an arm to a drip pan, two candles of 0.14 m
    P.push([at(new THREE.BoxGeometry(.11, .3, .012), 0, 1.6, .007), 'iron'], [at(new THREE.TorusGeometry(.04, .006, 4, 10, Math.PI), 0, 1.76, .01), 'iron'],
      [at(new THREE.BoxGeometry(.014, .014, .12), 0, 1.56, .07), 'iron'], [at(cyl(.06, .065, .012, 12), 0, 1.6, .12), 'iron']);
    for (const x of [-.035, .035]) { P.push([at(cyl(.011, .011, .14, 8), x, 1.676, .12), 'wax']); F.push({ g: flameGeo(.008, .04), p: new THREE.Vector3(x, 1.752, .12), core: .5 }); }
    P.push([at(new THREE.PlaneGeometry(.22, .4), 0, 1.95, .004), 'soot']);
    return { P, F, light: { at: [0, 1.82, .2], k: 1.8, r: 5.5, col: [1, .68, .38] } };
  }
  if (type === 'stand') {
    // Aurenne's lamp stand: a bronze tripod, a shaft of 1.3 m, a disc, and on it a clay oil lamp, its flame at the nozzle
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + .5, foot = new THREE.Vector3(Math.cos(a) * .17, 0, Math.sin(a) * .17), top = new THREE.Vector3(0, .22, 0), d = top.clone().sub(foot), g = cyl(.012, .008, d.length(), 5);
      g.applyMatrix4(new THREE.Matrix4().compose(foot.clone().lerp(top, .5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))); P.push([g, 'bronze']); }
    P.push([at(cyl(.014, .011, 1.3, 8), 0, .82, 0), 'bronze'], [at(new THREE.SphereGeometry(.03, 8, 6), 0, .2, 0), 'bronze'], [at(cyl(.1, .09, .014, 16), 0, 1.47, 0), 'bronze']);
    P.push([at(new THREE.SphereGeometry(1, 12, 6).scale(.07, .028, .045), 0, 1.5, 0), 'clay'], [at(cyl(.012, .012, .07, 6), .07, 1.51, 0, 0, 0, Math.PI / 2), 'clay']);
    F.push({ g: flameGeo(.012, .06), p: new THREE.Vector3(.105, 1.515, 0), core: .5 });
    return { P, F, light: { at: [.1, 1.62, 0], k: 2.6, r: 6.5, col: [1, .74, .44] } };
  }
  if (type === 'walllamp') {
    // Aurenne's lamp on a wall bracket: a bronze shelf on a curved arm, the clay lamp, its nozzle turned out into the room
    P.push([at(new THREE.BoxGeometry(.06, .16, .012), 0, 1.5, .007), 'bronze'], [at(new THREE.TorusGeometry(.07, .007, 4, 8, Math.PI / 2), 0, 1.5, .013, 0, Math.PI / 2, Math.PI), 'bronze'],
      [at(cyl(.06, .065, .01, 12), 0, 1.57, .08), 'bronze'], [at(new THREE.SphereGeometry(1, 12, 6).scale(.045, .028, .07), 0, 1.6, .08), 'clay'], [at(cyl(.012, .012, .07, 6), 0, 1.61, .15, Math.PI / 2), 'clay']);
    F.push({ g: flameGeo(.012, .06), p: new THREE.Vector3(0, 1.615, .185), core: .5 });
    P.push([at(new THREE.PlaneGeometry(.2, .35), 0, 1.9, .004), 'soot']);
    return { P, F, light: { at: [0, 1.72, .28], k: 1.9, r: 5.5, col: [1, .74, .44] } };
  }
  if (type === 'tablecandle') {
    // a candle in a turned stick on a table (the y given is the table's top)
    P.push([at(cyl(.035, .03, .015, 10), 0, .008, 0), 'iron'], [at(cyl(.008, .01, .07, 8), 0, .05, 0), 'iron'], [at(cyl(.011, .011, .12, 8), 0, .145, 0), 'wax']);
    F.push({ g: flameGeo(.008, .04), p: new THREE.Vector3(0, .207, 0), core: .5 });
    return { P, F, light: { at: [0, .3, 0], k: .9, r: 3.5, col: [1, .68, .38] } };
  }
  throw new Error('fixture ' + type);
}

// where each hall's fixtures go: [type, x, z, face] with the face the wall's inward normal ('n' +z, 's' -z, 'e' +x, 'w' -x) or none for
// a free-standing stand or a table candle (y the table's top). Measured off each room's record (dumped from rooms.js, 27 Oct 2026).
const ON = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] };
export const HALL_FIX = {
  // the guild hall: 13 by 7.6 m, its hearth on the west gable, the door and two tall lights in the front wall, the gallery along the back
  guild: { walls: [[-3.75, 3.8, 's'], [-.35, 3.8, 's'], [2.35, 3.8, 's'], [-5.2, -3.8, 'n'], [-2.6, -3.8, 'n'], [.2, -3.8, 'n']],
    island: 'sconce', table: [[-4.3, .6], [-3.4, .6]], tableY: .81 },
  // the Mark's alehall: 9.5 by 17.5 m, the long hearth on the axis, a torch on each side wall every 4 m over the raised benches
  alehall: { walls: [[-4.75, -5, 'e'], [-4.75, -1, 'e'], [-4.75, 3, 'e'], [-4.75, 7, 'e'], [4.75, -5, 'w'], [4.75, -1, 'w'], [4.75, 3, 'w'], [4.75, 7, 'w']], island: 'torch' },
  // Aurenne's tavern: 9 by 7.4 m inside, the arcade to the loggia in front, the counter across the back, the braziers on the east wall
  tavern: { walls: [[-4.48, -2.2, 'e'], [-4.48, 2.2, 'e'], [4.48, 2.2, 'w'], [-3.6, -3.68, 'n'], [3.2, -3.68, 'n']], island: 'walllamp', stands: [[-2.2, .95], [2.2, .95]] },
  // the Gatelands inn's taproom: 9.5 by 5.2 m under a ceiling of 2.43 m, for the crowded evening
  inn: { walls: [[-1.6, 2.6, 's'], [1.7, 2.6, 's'], [2.9, -2.6, 'n'], [-3.2, -2.6, 'n']], island: 'sconce', table: [[2.1, .45], [-1.2, 1.4]], tableY: .81 }
};
export const HALL_MODES = { own: 'A, the room’s own', torches: 'B, torches on every wall', island: 'C, each island’s own' };

export function dressHall(scene, C, kind, mode) {
  const M = fmats(), D = HALL_FIX[kind], F0 = C.floor ?? C.floors?.[0] ?? 0, buckets = new Map(), flames = [], fixtures = [], list = [];
  if (mode === 'torches') for (const [x, z, f] of D.walls) list.push(['torch', x, z, f]);
  if (mode === 'island') { for (const [x, z, f] of D.walls) list.push([D.island, x, z, f]); for (const [x, z] of D.stands || []) list.push(['stand', x, z, null]); for (const [x, z] of D.table || []) list.push(['tablecandle', x, z, null, D.tableY]); }
  for (const [type, x, z, f, ty] of list) {
    const { P, F, light } = parts(type), n = f ? ON[f] : [0, 1], ry = Math.atan2(n[0], n[1]), y0 = ty ?? F0;
    const T = new THREE.Matrix4().compose(new THREE.Vector3(x, y0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    for (const [g, k] of P) { const q = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a); if (!q.attributes.uv) q.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.applyMatrix4(T); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(q); }
    for (const fl of F) { const p = fl.p.clone().applyMatrix4(T), m = new THREE.Mesh(fl.g, M.flame), c = new THREE.Mesh(fl.g, M.core); c.scale.setScalar(fl.core); m.add(c); m.position.copy(p); m.renderOrder = 6;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(1, .55, .22), transparent: true, opacity: type === 'torch' ? .35 : .22, depthWrite: false, blending: THREE.AdditiveBlending }));
      const hs = type === 'torch' ? .7 : .16; halo.scale.set(hs, hs, 1); halo.position.y = fl.g.parameters.points.at(-1).y * .45; m.add(halo); scene.add(m); flames.push([m, flames.length * 1.7]); }
    const L = new THREE.Vector3(...light.at).applyMatrix4(T); fixtures.push({ p: L.toArray(), k: light.k, r: light.r, col: light.col, type });
  }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of buckets) { const g = mergeGeometries(gs, false), m = new THREE.Mesh(g, M[k]); m.castShadow = k !== 'soot'; m.receiveShadow = k !== 'soot'; if (k === 'soot') m.renderOrder = 4; group.add(m); tris += g.attributes.position.count / 3; }
  for (const [m] of flames) tris += m.geometry.index ? m.geometry.index.count / 3 * 2 : m.geometry.attributes.position.count / 3 * 2;
  scene.add(group);
  const tick = t => { const s = t * .001; for (const [m, ph] of flames) { const a = 1 + .08 * Math.sin(s * 13 + ph) + .05 * Math.sin(s * 29 + ph * 2.3); m.scale.set(1 / Math.sqrt(a), a, 1 / Math.sqrt(a)); m.rotation.z = .05 * Math.sin(s * 7 + ph); } };
  return { fixtures, group, tris: Math.round(tris), draws: group.children.length + flames.length * 3, count: list.length, flames: flames.length, tick };
}
