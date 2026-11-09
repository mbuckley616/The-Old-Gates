// The character sheet's portrait (the concept artist, 9 Nov 2026; backlog L, "The character sheet on parchment"; OG-134, with OG-136's
// item cards): your own body, built by people.js at its true size and dressed in what you wear, standing between the worn slots of the
// approved Inventory page (docs/prototypes/ui, the parchment of 27 Sep). One unit is one metre.
//
// OG-134 draws the sheet as a portrait with the equipment slots either side. The approved page (DECISION of 27 Sep) has the slots as an
// inked paper-doll and no figure, because the old look had no body worth showing; card F10 gave the player the builder's body (Session
// 1246), dressed from EQ (tpHBDress), so the sheet can now show it. The question is how the body sits on the paper (PORTRAIT_MODES):
//   'none' (A) the slots as approved, no figure: the page as it is.
//   'ink'  (B) the body drawn into the paper: an ink line round every shape (from the depth and the normals), the colours laid as a flat
//              wash in three tones over the parchment (multiplied, so the paper's grain shows through), the darkest tone hatched.
//              It reads as a plate in a book, in the same ink as the slots and the ledger.
//   'lit'  (C) OG-134 as drawn: the body as the game draws it (the slices' lights, ACES), in a dark arched window framed in bronze, a
//              warm key from the left and a cool rim behind.
// Both B and C turn with a drag, and both draw what you wear now, so the sheet answers "what do I look like in this?" without leaving it.
//
// portrait(canvas, { kit, mode, px }) builds the body, poses it standing (the weight on the left leg, the sword hanging point down in the
// right hand, the off hand loose), and draws it into the canvas. It returns { tris, calls, height, draw(yaw) }.
import * as THREE from 'three';
import { makePerson, rollGenome, statureOf, heightFor } from './people.js';
import { sword, fist, grip, palm, wp } from './bind.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PORTRAIT_MODES = { none: 'A, the slots alone, as approved', ink: 'B, the body inked into the paper', lit: 'C, the body lit, in a bronze window' };
export const MODE_OF = { a: 'none', b: 'ink', c: 'lit' };

// what is worn, as tpHBDress (54-thirdperson.js) turns EQ into the builder's dress: three kits, the first hours to the late game
const strip = D => ({ ...D, cloak: null, hood: null, cape: false, basket: null, spear: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null, lantern: null, tankard: null, hammer: null, pipe: null, apron: null, shield: null, scarf: false, turban: false, coat: null });
export const SHEET_KITS = {
  traveller: { name: 'a traveller', h: 1.76, yaw: -.32, dress: D => ({ ...strip(D), tunic: [.3, .36, .22], trousers: [.38, .32, .24], boots: [.24, .16, .1], belt: [.3, .2, .12], cloak: [.46, .14, .1], cloakLen: .85, brooch: [.62, .47, .22], hood: 'down' }),
    worn: { chest: ['Wool Tunic', 'i-tunic'], legs: ['Breeches', 'i-legs'], feet: ['Riding Boots', 'i-boot'], weapon: ['Iron Sword', 'i-sword'], amulet: null, head: null, offhand: null, hands: null, ring: null, ammo: null },
    sel: ['Iron Sword', 'Weapon · attack 7–9 · slash · one hand', 'All worn: attack 7–9 · armour 4 · weight 9.5'] },
  mail: { name: 'in Iron mail', h: 1.76, yaw: .38, dress: D => ({ ...strip(D), tunic: [.42, .34, .24], trousers: [.3, .26, .2], boots: [.22, .15, .1], belt: [.3, .2, .12], mail: [.42, .43, .45], helm: [.42, .43, .45], tier: 3, vambrace: [.42, .43, .45], vambraceKind: 'mail', gloves: [.42, .43, .45], glovesKind: 'mail', greaves: [.42, .43, .45], greavesKind: 'mail', cuisses: true, shield: [.46, .14, .1], shieldShape: 'kite', shieldPaint: [.86, .76, .4] }),
    worn: { head: ['Iron Kettle Helm', 'i-helm'], chest: ['Iron Hauberk', 'i-tunic'], hands: ['Iron Mail Mitts', 'i-glove'], legs: ['Iron Chausses', 'i-legs'], feet: ['Riding Boots', 'i-boot'], weapon: ['Iron Sword', 'i-sword'], offhand: ['Harp Kite Shield', 'i-shield'], amulet: ['Brigid’s Cross', 'i-amulet'], ring: null, ammo: null },
    sel: ['Iron Hauberk', 'Chest · armour 14 · mail · heavy', 'All worn: attack 7–9 · armour 31 · weight 41.0'] },
  plate: { name: 'in Mithril plate', h: 1.76, yaw: -.32, dress: D => ({ ...strip(D), tunic: [.16, .22, .44], trousers: [.14, .16, .24], boots: [.12, .1, .1], belt: [.2, .14, .1], mail: [.4, .54, .84], plate: 'plate', helm: [.4, .54, .84], tier: 5, plateSig: 'fluted', plateGlow: [.45, .62, 1], vambrace: [.4, .54, .84], vambraceKind: 'sheet', gloves: [.4, .54, .84], glovesKind: 'sheet', greaves: [.4, .54, .84], greavesKind: 'sheet', cuisses: true }),
    worn: { head: ['Mithril Helm', 'i-helm'], chest: ['Mithril Cuirass', 'i-tunic'], hands: ['Mithril Gauntlets', 'i-glove'], legs: ['Mithril Greaves', 'i-legs'], feet: ['Mithril Sabatons', 'i-boot'], weapon: ['Mithril Sword', 'i-sword'], amulet: ['Amulet of the Tide', 'i-amulet'], ring: ['Ring of Warding', 'i-ring'], offhand: null, ammo: ['Steel Arrows ×40', 'i-arrows'] },
    sel: ['Mithril Cuirass', 'Chest · armour 38 · plate · fluted · heavy', 'All worn: attack 15–19 · armour 92 · weight 58.0'] } };

// ——— the pose: standing at ease, facing +z. The weight on the left leg (the right knee a little bent and out), the hips and the shoulders
// counter-turned a little; the sword hanging point down by the right thigh in a loose fist; the off hand open at the side.
function turn(b, axis, ang) { const q = b.getWorldQuaternion(new THREE.Quaternion()), pq = b.parent.getWorldQuaternion(new THREE.Quaternion());
  b.quaternion.copy(pq.invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), ang).multiply(q))); b.updateMatrixWorld(true); }
export function standPose(P, o = {}) {
  const root = P.root, Bn = P.byName, X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1); root.updateMatrixWorld(true);
  const foot0 = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y), rs = Math.sign(wp(Bn['upperarm01.R']).x) || -1;
  turn(Bn['upperleg01.R'], X, -.1); turn(Bn['upperleg01.R'], Z, rs * .06); turn(Bn['lowerleg01.R'], X, .18); turn(Bn['foot.R'], X, -.07);
  turn(Bn['upperleg01.L'], Z, -rs * .02);
  turn(Bn['spine05'], Z, rs * .035); turn(Bn['spine03'], Z, -rs * .05); turn(Bn['spine05'], Y, .06); turn(Bn['spine03'], Y, -.08);
  turn(Bn['neck01'] || Bn['neck'], Y, .1); turn(Bn['neck01'] || Bn['neck'], X, .04); root.updateMatrixWorld(true);
  const sh = wp(Bn['upperarm01.R']), shL = wp(Bn['upperarm01.L']), hipY = wp(Bn['spine05']).y, out = { miss: [] };
  // the sword hand: below the shoulder, a hand's width out and a little forward of the thigh; the blade down and a little forward and out
  const G = V(sh.x + rs * .07, hipY - .1, .12), D = V(rs * .12, -1, .2);
  out.miss.push(fist(P, 'R', G, D, V(0, .2, 1), V(rs * .3, 0, -1)));
  const pm = palm(P, 'R'), sw = sword(o.sword), M = new THREE.Matrix4(); { const Yv = pm.k.clone().normalize(), Zv = pm.n.clone().addScaledVector(Yv, -pm.n.dot(Yv)).normalize(), Xv = Yv.clone().cross(Zv); M.makeBasis(Xv, Yv, Zv).setPosition(pm.o); }
  sw.matrixAutoUpdate = false; sw.matrix.copy(root.matrixWorld.clone().invert().multiply(M)); root.add(sw); out.swordTris = sw.userData.tris; out.sword = sw;
  // the off hand: at the side, the fingers half curled; with a shield on the arm, the forearm a little forward so the shield hangs clear
  const shield = !!o.shield, H = shield ? V(shL.x - rs * .2, hipY + .02, .24) : V(shL.x - rs * .1, hipY - .2, .03);
  out.miss.push(grip(P, 'L', H, shield ? V(rs * .3, -.2, 1) : V(0, -1, .15), shield ? V(rs, 0, .1) : V(rs, 0, .1), V(-rs * .3, 0, -1), shield ? .85 : .35, .1));
  root.updateMatrixWorld(true); const foot = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y); root.position.y += foot0 - foot; root.updateMatrixWorld(true);
  return out;
}

// ——— the ink: three passes of one scene into targets (lit, flat for the colours, normals), then one quad that draws the line and the wash
const INK_FRAG = `
uniform sampler2D tFlat, tNor, tDep; uniform vec2 px; uniform float near, far, lineW; uniform vec3 L; uniform float dbg;
varying vec2 vUv;
float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.)), vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float hsh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 flt = texture2D(tFlat, vUv); float a = flt.a;
  // the line: where the normals turn sharply, where the depth steps, and the outline where the body meets the paper
  vec4 nt = texture2D(tNor, vUv); vec3 n0 = nt.rgb; float d0 = lin(texture2D(tDep, vUv).r), en = 0., ed = 0., ea = 0.;
  for (int i = 0; i < 8; i++) { float t = float(i) * .7853982; vec2 o = vec2(cos(t), sin(t)) * px * lineW;
    vec4 nn = texture2D(tNor, vUv + o); float dd = lin(texture2D(tDep, vUv + o).r), aa = texture2D(tFlat, vUv + o).a;
    en += length(nn.rgb - n0) * nn.a * a; ed += abs(dd - d0) / d0 * nn.a * a; ea += abs(aa - a); }
  float line = max(max(smoothstep(1.5, 2.8, en), smoothstep(.04, .1, ed)), smoothstep(.8, 2.4, ea));
  // the wash: the flat colour, a little desaturated and warmed toward the ink, in three tones by the key light on the normal
  vec3 n = normalize(n0 * 2. - 1.); float sh = dot(n, L) * .5 + .5, tone = sh < .36 ? .6 : sh < .6 ? .82 : 1.;
  vec3 col = srgb(flt.rgb); float cl = dot(col, vec3(.3333)); col = mix(vec3(cl), col, .8) * vec3(1.02, .97, .9);
  vec3 wash = mix(vec3(1.), col, .86) * tone;
  // the darkest tone hatched at 45 degrees, the strokes a little broken
  vec2 fc = gl_FragCoord.xy; float hl = fract((fc.x + fc.y) / (5. * lineW)), hb = hsh(vec2(floor((fc.x - fc.y) / (11. * lineW)), floor(fc.y / (37. * lineW))));
  float hatch = tone < .7 ? smoothstep(.5, .66, hl) * step(.15, hb) * .3 : 0.;
  vec3 ink = vec3(.18, .11, .05);
  vec3 c = mix(wash * (1. - hatch), ink, line * .9);
  // multiplied over the paper by the page (mix-blend-mode), so white is no ink at all
  c = mix(vec3(1.), c, max(a, line));
  if (dbg > .5) c = dbg > 1.5 ? vec3(a) : vec3(1. - line);
  gl_FragColor = vec4(c, 1.);
}`;

export function portrait(canvas, o = {}) {
  const kit = SHEET_KITS[o.kit] || SHEET_KITS.traveller, mode = o.mode || 'ink', W = canvas.width, H = canvas.height;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = mode === 'lit' ? 1.0 : 1.0;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(mode === 'ink' ? 0xffffff : 0x000000, mode === 'ink' ? 1 : 0);
  const scene = new THREE.Scene(), G = rollGenome(o.seed || 'sheet:player', { people: o.people || 'gatelander', g: o.g ?? 1 });
  G.dress = kit.dress(G.dress); G.height = heightFor(G, kit.h);
  const P = makePerson(G); scene.add(P.root); const st = standPose(P, { shield: !!G.dress.shield });
  P.root.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; } });
  const stature = statureOf(G);
  // the lights: a warm key high on the left (the page's own light), a soft fill, a cool rim behind on the right
  const hemi = new THREE.HemisphereLight(0xf4ead8, 0x4a3a28, mode === 'lit' ? .55 : .9); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe2b8, mode === 'lit' ? 3.2 : 2.6); key.position.set(-2.2, 3.4, 3.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 2.2, bottom: -.2, near: .5, far: 9 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02; scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c4ff, mode === 'lit' ? 2.4 : 0), rim2 = new THREE.DirectionalLight(0xffd8a0, mode === 'lit' ? .8 : 0); rim.position.set(2.4, 2.6, -2.8); rim2.position.set(-2.6, 1.2, -2.4); scene.add(rim, rim2);
  // a floor that only takes the shadow (C), so the figure stands on something
  if (mode === 'lit') { const fl = new THREE.Mesh(new THREE.CircleGeometry(.75, 48).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: .55 })); fl.receiveShadow = true; scene.add(fl); }
  // a measuring post of 1.8 m ticked every 10 cm beside the figure (the scale picture only)
  if (o.post) { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: .7 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
    for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .012, i % 5 ? .08 : .16).translate(0, i * .1, .04), m)); post.position.set(.5, 0, 0); post.traverse(x => { if (x.isMesh) x.castShadow = true; }); scene.add(post); }
  // the eye: framing the whole figure, a little below the eyes, a long lens so it reads as a drawing, not a photograph
  const cam = new THREE.PerspectiveCamera(18, W / H, .5, 30), fitH = stature + .5, dist = fitH / 2 / Math.tan(THREE.MathUtils.degToRad(9));
  const aim = V(0, stature * .5 - .07, 0), pitch = .05;
  const place = yaw => { cam.position.set(Math.sin(yaw) * dist, aim.y + Math.sin(pitch) * dist, Math.cos(yaw) * dist); cam.lookAt(aim); cam.updateProjectionMatrix(); };
  let draw;
  if (mode === 'ink') {
    // the flat pass: every material swapped for an unlit one of its own colour and map (the metals keep their colour, as an engraver's
    // tint would), with the depth; the normals pass; then the quad
    const tFlat = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }), tNor = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }), norM = new THREE.MeshNormalMaterial();
    tFlat.depthTexture = new THREE.DepthTexture(W, H);
    const flats = new Map(), swap = on => scene.traverse(m => { if (!m.isMesh || m.material.isShadowMaterial) return;
      if (on) { const k = m.material, f = Array.isArray(k) ? k.map(x => basic(x)) : basic(k); m.userData.mat = k; m.material = f; } else if (m.userData.mat) { m.material = m.userData.mat; delete m.userData.mat; } });
    const basic = x => { if (!flats.has(x)) flats.set(x, new THREE.MeshBasicMaterial({ color: x.color ? x.color.clone().lerp(x.emissive || new THREE.Color(0), 0).multiplyScalar(x.metalness > .3 ? 1.15 : 1) : 0xcccccc, map: x.map || null, vertexColors: !!x.vertexColors, transparent: x.transparent, opacity: x.opacity, alphaTest: x.alphaTest, side: x.side, alphaMap: x.alphaMap || null })); return flats.get(x); };
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { tFlat: { value: tFlat.texture }, tNor: { value: tNor.texture }, tDep: { value: tFlat.depthTexture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, near: { value: cam.near }, far: { value: cam.far }, lineW: { value: Math.max(1.4, W / 300) }, L: { value: new THREE.Vector3() }, dbg: { value: +(o.dbg || 0) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: INK_FRAG, depthTest: false, depthWrite: false }));
    const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qs.add(q);
    draw = yaw => { place(yaw); R.toneMapping = THREE.NoToneMapping; q.material.uniforms.L.value.copy(key.position).normalize().transformDirection(cam.matrixWorldInverse);
      R.setClearColor(0x000000, 0); swap(true); R.setRenderTarget(tFlat); R.clear(); R.render(scene, cam); swap(false);
      scene.overrideMaterial = norM; R.setRenderTarget(tNor); R.clear(); R.render(scene, cam); scene.overrideMaterial = null;
      R.setRenderTarget(null); R.setClearColor(0xffffff, 1); R.clear(); R.render(qs, qc); };
  } else draw = yaw => { place(yaw); R.render(scene, cam); };
  R.info.autoReset = false; R.info.reset(); draw(o.yaw ?? kit.yaw);
  let bodyTris = 0, bodyMeshes = 0; P.root.traverse(m => { if (m.isMesh) { const g = m.geometry; bodyTris += (g.index ? g.index.count : g.attributes.position.count) / 3; bodyMeshes++; } });
  return { bodyTris, bodyMeshes, passes: mode === 'ink' ? 3 : 1, tris: R.info.render.triangles, calls: R.info.render.calls, height: +stature.toFixed(3), miss: st.miss, swordTris: st.swordTris, draw, R };
}
