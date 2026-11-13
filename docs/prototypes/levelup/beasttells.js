// A beast's tell in the new look (the bodies builder, Session 2191; backlog L11, "Foes and bosses", "Owed: the beasts' tell is still
// the body"): where the warning before a beast's bite shows, on the creature kit's bodies at their true size. One unit is one metre.
//
// What is settled: the tell is the wind-up pose for the whole of it (the wolf's driver, wgAttack in js/34-creatures.js: the body sinks,
// the neck and head drop, the jaw opens 0.2 rad, the tail goes down), the colour comes only in its last 0.15 s (TELL_GLOW_S), gold for
// a light blow and red for a heavy one (#430 A). For a person, Michael's B on #1278 put the colour on the weapon's edge (hbTell, S2092).
// The kit's beasts on the wolf's driver (the wolves, the Dire Wolf, the bears, the boars, the corrupted three) hold no weapon: the game
// still lights the whole hide (hcTick copies the driver's emissive to every piece). Where should it live (BEAST_LEVELS)?
//   'body' (A) today: every piece of the hide and fur takes the emissive at the tell's height, (0.75, 0.52, 0.08) gold or (0.75, 0.08,
//              0.05) red, as telegraphPulse sets it.
//   'jaws' (B) #1278's rule carried to a beast: what bites is the weapon. The muzzle and the jaw (the skin weighted to the head ahead of
//              the eyes and to the jaw bone, fading in over the muzzle's first third) glow in the tell's colour, the fur over them too,
//              with a small glare in the open mouth; the rest of the body as it is. No light, as hbTell.
//   'eyes' (C) the eyes alone: each eye flares in the tell's colour with a glare round it, the body as it is.
//
// windUp(C, w) poses a kit creature (creatures.js build) standing at the origin facing +z in the driver's wind-up at w (0 to 1).
// tellFx(C, level, kind, k) dresses it at the tell's height k (1: the last frame before the bite) and returns a Group (glares) with
// userData { level, kind, k, mask: { verts, share }, eyes, sprites }.
import * as THREE from 'three';
import { pose } from './creatures.js';

export const BEAST_LEVELS = { body: 'A, the body: today’s whole-hide glow', jaws: 'B, the jaws: the muzzle and the jaw carry the colour', eyes: 'C, the eyes: the eyes flare' };
export const LEVEL_OF = { a: 'body', b: 'jaws', c: 'eyes' };
export const TELL_EMISSIVE = { light: [.75, .52, .08], heavy: [.75, .08, .05] };
export const TELL_HUE = { light: [1.0, .72, .22], heavy: [1.0, .16, .08] };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// the driver's wind-up (wgAttack at s = 0): the body down 7 cm a metre of shoulder, the neck pitched 0.3 down, the head back up 0.15 so
// the muzzle levels at you, the jaw open 0.2, the tail down 0.3. The kit's joints are copied from the driver's in the game (hcPose);
// here they are set straight on the kit's bones, after its standing pose
export function windUp(C, w = 1) {
  if (C.plan.gaits.includes('stand')) C.gait = 'stand'; pose(C, 0); const by = C.byName, add = (n, x) => { if (by[n]) by[n].rotation.x += x; };
  const neck = Object.keys(by).filter(n => /^neck/.test(n)), tail = Object.keys(by).filter(n => /^tail/.test(n));
  neck.forEach(n => add(n, .3 * w / neck.length));
  add('head', -.15 * w); add('jaw', .2 * w);
  tail.forEach((n, i) => add(n, (i ? -.1 : -.3) * w * (i < 2 ? 1 : 0)));
  C.rig.position.y = -.07 * w * C.legH; C.root.updateMatrixWorld(true);
}

// the mask: 1 on the muzzle and the jaw, 0 elsewhere, read from the bind pose (the head's frame, B.headFrame) and the skin's weights
function jawMask(C, geo) {
  const B = C.B, H = B.headFrame, hi = B.by.head?.i, ji = B.by.jaw?.i, P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight;
  const base = geo.attributes.aBase || P, out = new Float32Array(P.count); let n = 0, s = 0;
  const eyeF = .5; // the eyes stand at 0.4 of the head's length: the glow begins ahead of them and is whole by 0.75
  for (let v = 0; v < P.count; v++) { let wh = 0, wj = 0; for (let q = 0; q < 4; q++) { const i = SI.getComponent(v, q), w = SW.getComponent(v, q); if (i === hi) wh += w; if (i === ji) wj += w; }
    const rel = V(base.getX(v), base.getY(v), base.getZ(v)).sub(H.base), along = rel.dot(H.dir) / H.len, t = THREE.MathUtils.smoothstep(along, eyeF, .75);
    const m = Math.min(1, wj + wh * t); out[v] = m; if (m > .5) n++; s += m; }
  return { a: out, verts: n, share: +(s / P.count).toFixed(4) };
}
// the tell's own term on a hide or fur material: uTell × the mask (the material's existing onBeforeCompile kept)
function tellOn(mesh, mask, col) {
  const m = mesh.material, prev = m.onBeforeCompile, key = m.customProgramCacheKey; mesh.geometry.setAttribute('aTell', new THREE.BufferAttribute(mask, 1));
  const uTell = { value: col.clone() };
  m.onBeforeCompile = (s, r) => { prev.call(m, s, r); s.uniforms.uTell = uTell;
    s.vertexShader = 'attribute float aTell; varying float vTell;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vTell = aTell;');
    s.fragmentShader = 'uniform vec3 uTell; varying float vTell;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uTell * vTell;'); };
  m.customProgramCacheKey = () => key.call(m) + 'tell'; m.needsUpdate = true; return uTell;
}
let _glare = null;
function glareTex() { if (_glare) return _glare; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  _glare = new THREE.CanvasTexture(c); return _glare; }
const glare = (col, op, sc, over = false) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTex(), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: !over, toneMapped: false })); s.scale.setScalar(sc); s.userData.noHit = true; return s; };
// the eyes: the kit's eye() spheres on the head bone (a physical material with a clearcoat)
function eyesOf(C) { const out = []; C.byName.head?.traverse(o => { if (o.isMesh && o.material?.isMeshPhysicalMaterial && o.geometry?.type === 'SphereGeometry') out.push(o); }); return out; }

export function tellFx(C, level, kind = 'light', k = 1) {
  const g = new THREE.Group(), hue = new THREE.Color().setRGB(...TELL_HUE[kind]), em = TELL_EMISSIVE[kind], out = { level, kind, k, sprites: 0 };
  const skins = C.meshes.filter(m => m.name === 'hide' || /^fur/.test(m.name));
  if (level === 'body') {
    // today: the emissive on every material of the hide and the fur (each creature's own, so nothing shared is touched)
    for (const m of skins) m.material.emissive.setRGB(em[0] * k, em[1] * k, em[2] * k); out.tinted = skins.length;
  }
  if (level === 'jaws') {
    const M = jawMask(C, C.meshes[0].geometry); out.mask = { verts: M.verts, share: M.share };
    // the hide's term is bright enough to bloom (the edge's ×6 on a blade, less here: a muzzle is a surface, not a line)
    for (const m of skins) tellOn(m, M.a, hue.clone().multiplyScalar(.5 * k));
    // a small glare in the open mouth, between the jaw's tip and the muzzle's: on the head's frame at 0.8 of its length, a little low
    const H = C.B.headFrame, p = H.base.clone().addScaledVector(H.dir, H.len * .82).addScaledVector(H.up, -H.r * .35), s = glare(hue, .35 * k, H.r * 2.4);
    s.position.copy(p).sub(C.B.by.head.p); C.byName.head.add(s); out.sprites++;
  }
  if (level === 'eyes') {
    const E = eyesOf(C); out.eyes = E.length;
    for (const e of E) { e.material = e.material.clone(); e.material.emissive.copy(hue).multiplyScalar(6 * k); e.material.emissiveIntensity = 1;
      const r = e.geometry.parameters.radius, s = glare(hue, .7 * k, r * 9, true); s.renderOrder = 3; e.add(s); out.sprites++; } /* the glare over the fur that half buries the eye */
  }
  g.userData = out; return g;
}
