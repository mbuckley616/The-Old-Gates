// A foe's tell in the new look (the concept artist, 7 Nov 2026; backlog L11, "Foes and bosses"; OG-130's six telegraphs): where the
// warning before a foe's blow shows, on the people kit's bodies at their true size. One unit is one metre.
//
// The rules are settled and stay as they are: a foe's tell is its wind-up pose for the whole tell (e._wind, Session 130), the colour
// comes only in its last 0.15 s (TELL_GLOW_S, Session 282), gold for a light blow and red for a heavy one (Michael's A on #430), and
// the master's slam is a 0.9 s tell with a ring of 3 m that no block takes (Michael's A on #95). What the old look did with that colour
// was tint the whole body (telegraphPulse sets the torso's emissive), and lay a flat orange band on the floor for the slam (slamRing).
// On the builder's bodies (F4) the whole person, skin, mail and cloth, would light up. The question is where the colour lives
// (TELL_LEVELS):
//   'body' (A) today's rule carried over: every material of the foe's body takes the emissive (gold or red) at the tell's height, and
//              the slam's ring is today's band (2.78 to 3 m, 0xff5a30 at 0.7).
//   'edge' (B) the body stays as it is and the pose carries the tell; the colour runs along the weapon instead: both edges of a blade,
//              or a hammer's head, lit gold or red with a small light of the same colour on the hand and the face above it (0.8 m
//              about). The slam's ring is a thin hard line at 3 m with a faint wash inside it rising toward the line, so you read where
//              it ends, not a floor painted red.
//   'loud' (C) OG-130 as drawn: B's weapon flaring, a star at its tip, and a glowing hull round the whole body in the tell's colour;
//              the slam's ground a filled red disc with two rings and twelve ticks.
//
// tellPose(P, kind) poses a person of people.js standing at the origin facing +z (the player ahead): 'light' (a forehand cut cocked over
// the sword shoulder, the body turned away from the swing; the round shield forward), 'heavy' (the sword raised over the head and
// laid back, the body coiled and leaning back; the shield out low), 'slam' (a Markish war hammer in both hands, raised high behind the
// head, the back arched). It hangs the weapon on the root and returns { weapon, miss, tip, head }.
// tellFx(P, pose, kind, level, o) dresses the posed person for the level at its tell's height (o.k, 0 to 1, the glow's share: 1 is the
// last frame before the blow) and returns a Group for the scene (rings, lights, the star) with userData { tris, lights, hull }.
import * as THREE from 'three';
import { sword, fist, grip, stance, wp } from './bind.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const TELL_LEVELS = { body: 'A, the body: today’s whole-body glow and band', edge: 'B, the edge: the weapon carries the colour, the ring a line', loud: 'C, loud: OG-130 as drawn, a hull of light and a red floor' };
export const LEVEL_OF = { a: 'body', b: 'edge', c: 'loud' };
export const TELL_KINDS = { light: 'a light blow (gold)', heavy: 'a heavy blow (red)', slam: 'the slam: a ring no block takes (red)' };
// the game's colours (telegraphPulse: emissive at k = 1): gold for a light, red for a heavy; the slam ring's 0xff5a30
export const TELL_EMISSIVE = { light: [.75, .52, .08], heavy: [.75, .08, .05], slam: [.75, .08, .05] };
export const TELL_HUE = { light: [1.0, .72, .22], heavy: [1.0, .16, .08], slam: [1.0, .16, .08] };
export const SLAM_R = 3;
function count(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return t; }

// ——— the Mark's war hammer: a shaft of ash 0.98 m, an iron head of 15 cm with a square face and a back spike, a top spike, two langets
// riveted down the shaft, a leather grip at the butt. Its frame as the sword's: the upper hand's grip at the origin, the head up +y,
// the face toward +z.
export function hammer() {
  const g = new THREE.Group(), iron = new THREE.MeshStandardMaterial({ color: C(.36, .36, .38), metalness: .75, roughness: .38 }),
    ash = new THREE.MeshStandardMaterial({ color: C(.52, .38, .22), roughness: .7 }), leather = new THREE.MeshStandardMaterial({ color: C(.2, .12, .07), roughness: .85 });
  const add = (geo, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  add(new THREE.CylinderGeometry(.015, .017, .98, 10), ash, 0, .1, 0);                       /* the shaft, from y −0.39 to 0.59 */
  add(new THREE.CylinderGeometry(.019, .019, .2, 10), leather, 0, -.27, 0);                   /* the grip at the butt */
  const head = new THREE.Group(); head.position.set(0, .54, 0); g.add(head); head.name = 'hammerHead';
  head.add(new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .1), iron));                         /* the eye's block, through the shaft */
  const face = new THREE.Mesh(new THREE.CylinderGeometry(.034, .03, .06, 8), iron); face.rotation.x = Math.PI / 2; face.position.z = .08; head.add(face);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(.026, .13, 6), iron); spike.rotation.x = -Math.PI / 2; spike.position.z = -.11; head.add(spike);
  const top = new THREE.Mesh(new THREE.ConeGeometry(.016, .08, 6), iron); top.position.y = .07; head.add(top);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(.004, .22, .012), iron, s * .017, .36, 0);
  g.userData = { tris: count(g), head, length: .98, kind: 'hammer' }; return g;
}

// the weapon in a fist: its grip on the palm, its long axis along the hand's own line (pinky to index), as bind.js hangs the sword
function hang(P, s, w) { const Bn = P.byName, wr = wp(Bn['wrist.' + s]), f = wp(Bn['finger3-1.' + s]).sub(wr).normalize(), k = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize();
  const n = (s === 'L' ? f.clone().cross(k) : k.clone().cross(f)).normalize(), len = wp(Bn['finger3-1.' + s]).distanceTo(wr), o = wr.clone().addScaledVector(f, len * .62).addScaledVector(n, .022);
  const Y = k.clone().normalize(), Z = n.clone().addScaledVector(Y, -n.dot(Y)).normalize(), M = new THREE.Matrix4().makeBasis(Y.clone().cross(Z), Y, Z).setPosition(o);
  P.root.updateMatrixWorld(true); w.matrixAutoUpdate = false; w.matrix.copy(P.root.matrixWorld.clone().invert().multiply(M)); P.root.add(w); P.root.updateMatrixWorld(true);
  return { o, Y }; }

// the wind-ups, each at the top of its tell (e._wind 1): the pose the blow leaves from
export function tellPose(P, kind) {
  const root = P.root, Bn = P.byName; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  const S = { light: { lean: .02, front: .26, frontKnee: .34, back: .3, backKnee: .22, twist: .42 },
    heavy: { lean: -.1, front: .3, frontKnee: .3, back: .36, backKnee: .26, twist: .24, chin: .12 },
    slam: { lean: -.16, front: .34, frontKnee: .26, back: .34, backKnee: .3, twist: .06, chin: .2 } }[kind];
  stance(P, S);
  const shR = wp(Bn['upperarm01.R']), shL = wp(Bn['upperarm01.L']), rs = Math.sign(shR.x) || -1, hipY = wp(Bn['spine05']).y, headY = wp(Bn['head']).y, miss = [];
  let w, G, D;
  if (kind === 'light') {
    // the sword cocked over the sword shoulder, the point back and up, the edge toward the foe; the shield before the chest
    G = V(rs * .34, shR.y + .1, -.06); D = V(-rs * .25, .6, -.75);
    miss.push(fist(P, 'R', G, D, V(rs * .2, .2, 1), V(rs, -1, -.2)));
    miss.push(grip(P, 'L', V(-rs * .06, shL.y - .22, .42), V(rs * .9, .35, 0), V(0, 0, -1), V(-rs, -.6, -.3), .85));
    w = sword();
  } else if (kind === 'heavy') {
    // the sword raised over the head and laid back behind it, the point low behind the shoulders; the shield thrown out low
    G = V(rs * .2, headY + .3, -.04); D = V(-rs * .18, .62, -.76);
    miss.push(fist(P, 'R', G, D, V(0, 1, .1), V(rs, -.1, .4)));
    miss.push(grip(P, 'L', V(-rs * .42, hipY + .12, .26), V(-rs * .2, -.6, .7), V(rs * .6, 0, .7), V(-rs, -.5, -.5), .85));
    w = sword();
  } else {
    // the hammer in both hands raised high behind the head, the head laid back, the hands a forearm apart on the shaft
    D = V(rs * .05, .38, -1).normalize(); G = V(rs * .06, headY + .3, .02);
    miss.push(fist(P, 'R', G, D, V(0, 1, .3), V(rs, -.2, .5)));
    miss.push(fist(P, 'L', G.clone().addScaledVector(D, -.26), D, V(0, 1, .3), V(-rs, -.2, .5)));
    w = hammer();
  }
  const h = hang(P, 'R', w); const tipLen = w.userData.tip ?? .6;
  root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert(), L = p => p.applyMatrix4(inv);
  // in the root's own frame, so they follow the person when it is placed
  return { weapon: w, miss, tip: L(h.o.clone().addScaledVector(h.Y, tipLen)), mid: L(h.o.clone().addScaledVector(h.Y, kind === 'slam' ? .54 : .45)), hand: L(h.o.clone()), kind };
}

// ——— the looks
// a soft glare sprite (the star's core and the hand's bloom)
let _glare = null;
function glareTex() { if (_glare) return _glare; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  _glare = new THREE.CanvasTexture(c); return _glare; }
let _star = null;
function starTex() { if (_star) return _star; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.translate(128, 128); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 4); const gr = x.createLinearGradient(-128, 0, 128, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${i % 2 ? .45 : 1})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(-128, 0); x.lineTo(0, i % 2 ? -3 : -6); x.lineTo(128, 0); x.lineTo(0, i % 2 ? 3 : 6); x.fill(); x.restore(); }
  _star = new THREE.CanvasTexture(c); return _star; }
// the ring's wash for B: clear inside, rising toward the edge, a hard bright line at the radius, nothing beyond
function ringTex(kind) { const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), gr = x.createRadialGradient(512, 512, 0, 512, 512, 512);
  if (kind === 'line') { gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,.015)'); gr.addColorStop(.93, 'rgba(255,255,255,.13)'); gr.addColorStop(.975, 'rgba(255,255,255,.22)');
    gr.addColorStop(.979, 'rgba(255,255,255,1)'); gr.addColorStop(.996, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.85, 'rgba(255,255,255,.62)'); gr.addColorStop(.95, 'rgba(255,255,255,.9)'); gr.addColorStop(.96, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,.2)'); }
  x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
  if (kind === 'disc') { x.strokeStyle = 'rgba(255,255,255,1)'; x.lineWidth = 9; x.beginPath(); x.arc(512, 512, 256, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.beginPath(); x.moveTo(512 + Math.cos(a) * 400, 512 + Math.sin(a) * 400); x.lineTo(512 + Math.cos(a) * 470, 512 + Math.sin(a) * 470); x.lineWidth = 14; x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; }

// the hull: a copy of each skinned piece of the body on the same skeleton, pushed out along its normals and drawn from the back, so only
// a rim of light round the silhouette shows
function hullOf(P, col, op) { const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.BackSide, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n transformed += normalize( objectNormal ) * 0.022;\n#endif'); };
  const list = []; P.root.traverse(o => { if (o.isSkinnedMesh && o.visible && !o.userData.tellHull) list.push(o); });
  for (const o of list) { const h = new THREE.SkinnedMesh(o.geometry, m); h.userData.tellHull = true; h.userData.noHit = true; h.frustumCulled = false; h.position.copy(o.position); h.quaternion.copy(o.quaternion); h.scale.copy(o.scale);
    h.bindMode = o.bindMode; h.bind(o.skeleton, o.bindMatrix); o.parent.add(h); }
  return list.length; }

// the weapon's edges lit: a sword's two edges as thin bright strips from the guard to the point, a hammer's head in a skin of light
function edgeOf(w, col, k) { const m = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(6 * k), toneMapped: false }), g = new THREE.Group(); g.name = 'tellEdge';
  if (w.userData.kind === 'hammer') { const h = w.userData.head, sk = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.6 * k), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    h.traverse(o => { if (o.isMesh && o.parent === h) { const s = new THREE.Mesh(o.geometry, sk); s.position.copy(o.position); s.rotation.copy(o.rotation); s.scale.setScalar(1.12); h.add(s); } }); return 1; }
  const L = w.userData.blade, y0 = .075 + .02;
  for (const s of [-1, 1]) { const geo = new THREE.BufferGeometry(), P = [], n = 16;
    for (let i = 0; i <= n; i++) { const u = i / n, y = y0 + u * (L - .02), half = u < .82 ? (.046 + (.03 - .046) * u / .82) / 2 : .015 * Math.max(0, (1 - u) / .18) ** .8; P.push(s * (half + .0008), y, -.0012, s * (half + .0008), y, .0012, s * (half - .007), y, 0); }
    const I = []; for (let i = 0; i < n; i++) { const a = i * 3; I.push(a, a + 3, a + 2, a + 2, a + 3, a + 5, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4, a, a + 1, a + 3, a + 1, a + 4, a + 3); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); const e = new THREE.Mesh(geo, m); e.userData.noHit = true; g.add(e); }
  w.add(g); return 2; }

export function tellFx(P, pose, kind, level, o = {}) {
  const k = o.k ?? 1, g = new THREE.Group(), hue = new THREE.Color().setRGB(...TELL_HUE[kind]), em = TELL_EMISSIVE[kind], out = { level, kind, k, lights: 0, hull: 0, tris: 0 };
  const at = (v) => v.clone().applyMatrix4(P.root.matrixWorld);
  if (level === 'body') {
    // today: every material of the body takes the emissive (each person's materials cloned first, so the player is untouched)
    let n = 0; P.root.traverse(m => { if (!m.isMesh || m.userData.tellHull) return; for (let q = m; q && q !== P.root; q = q.parent) if (q === pose.weapon || q.name === 'shield') return; /* what it holds keeps its own (hbGlow) */
      const mats = Array.isArray(m.material) ? m.material : [m.material], nm = mats.map(x => { if (!x || !x.emissive) return x; const c = x.clone(); c.emissive = new THREE.Color(em[0] * k, em[1] * k, em[2] * k); c.emissiveIntensity = 1; if (c.emissiveMap) c.emissiveMap = null; n++; return c; });
      m.material = Array.isArray(m.material) ? nm : nm[0]; });
    out.tinted = n;
  }
  if (level === 'edge' || level === 'loud') {
    out.edges = edgeOf(pose.weapon, hue, k * (level === 'loud' ? 1.6 : 1));
    // a small light of the tell's colour, on the weapon's middle: it lights the hand, the face and the shoulder under it
    const l = new THREE.PointLight(hue, (level === 'loud' ? 9 : 6) * k, level === 'loud' ? 4 : 2.6, 2); l.position.copy(at(pose.mid)); g.add(l); out.lights++;
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTex(), color: hue, transparent: true, opacity: (level === 'loud' ? .8 : .6) * k, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    gl.position.copy(at(pose.mid)); gl.scale.setScalar(level === 'loud' ? .9 : .55); g.add(gl);
  }
  if (level === 'loud') {
    out.hull = hullOf(P, hue.clone().multiplyScalar(1.3 * k), .55);
    const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(), color: new THREE.Color(1, .95, .85).lerp(hue, .35), transparent: true, opacity: k, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    st.position.copy(at(pose.tip)); st.scale.setScalar(.75); g.add(st);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTex(), color: 0xffffff, transparent: true, opacity: .9 * k, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    core.position.copy(at(pose.tip)); core.scale.setScalar(.22); g.add(core);
  }
  if (kind === 'slam') {
    const base = V(P.root.position.x, (o.floor ?? 0) + .03, P.root.position.z);
    let ring;
    if (level === 'body') ring = new THREE.Mesh(new THREE.RingGeometry(SLAM_R - .22, SLAM_R, 48), new THREE.MeshBasicMaterial({ color: 0xff5a30, transparent: true, opacity: .15 + .55 * k, depthWrite: false, side: THREE.DoubleSide }));
    else ring = new THREE.Mesh(new THREE.CircleGeometry(SLAM_R, 96), new THREE.MeshBasicMaterial({ map: ringTex(level === 'edge' ? 'line' : 'disc'), color: hue.clone().multiplyScalar(level === 'edge' ? 1.4 : 1), transparent: true, opacity: (level === 'edge' ? 1 : .75) * k, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.copy(base); ring.renderOrder = 2; ring.userData.noHit = true; g.add(ring); out.ring = { r: SLAM_R, look: level };
  }
  out.tris = count(g) + (pose.weapon ? count(pose.weapon) : 0);
  g.userData = out; return g;
}
