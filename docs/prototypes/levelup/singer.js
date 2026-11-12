// The singing ship (the concept artist, 12 Nov 2026; backlog L6 "Sea legends", OG-049; the quest writer's *Sea Legends, I*, unapproved,
// §2: "a cog of the merchantman's lines with grey canvas and no lamp lit … her sails are full on the wrong side of the wind. Nobody is
// on her deck." She stands 150–200 m off the bow in fog, and fog at sea closes to 60 m (Michael's C on #679: fog 60 m to 95%).
// That is the question this kit asks: how is she seen at all?
//   A 'close': the fog rule holds for her as for anything: she stands 45–55 m off, a grey shape in the grey (the draft's 150–200 m,
//              its 100 m for the words and its 60 m for her going, all brought inside 60 m: 50, 35 and 20 m).
//   B 'lane':  the fog opens a lane toward her: a corridor 22 m wide from your bow to her where the fog is a quarter as thick, so she
//              stands at 160 m as drafted, clear and grey for as long as she is there, and the fog stands as walls either side.
//              The wrongness is in the weather, as it is in her wind.
//   C 'lit':   OG-049 as drawn: the fog does not take her (her own fog a fifth as thick), a pale green light in her canvas and her
//              timbers, a little of the sea seen through her. At 160 m.
// The ship is one look for all three (singerDress): any kit hull (ships.js) long at sea. The draft's "Safe Return" is a Compact
// merchant, so the page dresses ships.js's Aurenne cog (17 m, one lateen). Her canvas is sun-greyed linen, patched, seams standing
// dark, with holes torn through where the light shows; her blue strake faded to a ghost of blue; her bright hull silvered grey;
// her gilt dulled to pewter; her tallowed bottom gone green-black with a band of weed and barnacle at the waterline; her lanterns
// dark glass. Nothing aboard is broken: she is overdue, not wrecked. The song is the quest's; nothing here sounds.
// singerDress(S, o) -> S, with S.singer { swapped, seen, weed: { tris } }; o.lit (C's glow and see-through).
// singerFog(mode, eye, at): patches three's fog chunks before any material compiles; 'lane' thins the fog in a capsule from eye to at
//   (22 m across, the fog depth × 0.25 inside it); materials with defines.SINGER_LIT take their fog depth × 0.2 in every mode.
// A metre a unit; y = 0 the sea.
import * as THREE from 'three';
import { stream } from './pieces.js';

export const SINGER_MODES = { close: { d: 50, label: 'A · the fog holds: she stands 50 m off' }, lane: { d: 160, label: 'B · the fog opens a lane to her, 160 m' }, lit: { d: 160, label: 'C · OG-049 as drawn: lit, the fog does not take her, 160 m' } };
export const FOG_SIGHT = 60; // Michael's C on #679: fog 60 m to 95%
export const fogDensity = (m = FOG_SIGHT) => Math.sqrt(3) / m;

// ── the canvas: undyed linen greyed by years of sun and salt, the cloths' seams dark, patches, salt tide-lines, and holes ──
const CAN = new Map();
function canvasTex(kind) { if (CAN.has(kind)) return CAN.get(kind);
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), R = stream('singer:canvas:' + kind);
  for (let i = 0; i < 8; i++) { const v = 150 + (R() * 22 | 0); x.fillStyle = `rgb(${v},${v + 2},${v + 1})`; x.fillRect(i * 64, 0, 64, 512); }
  // the salt's tide-lines and the sun's bleach: soft pale clouds, darker toward the foot where the spray dries
  for (let k = 0; k < 60; k++) { const px = R() * 512, py = R() * 512, r = 20 + R() * 70, g = x.createRadialGradient(px, py, 2, px, py, r), a = .05 + R() * .08;
    g.addColorStop(0, R() < .5 ? `rgba(225,226,220,${a})` : `rgba(70,74,72,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); }
  const foot = x.createLinearGradient(0, 380, 0, 512); foot.addColorStop(0, 'rgba(60,64,60,0)'); foot.addColorStop(1, 'rgba(60,64,60,.35)'); x.fillStyle = foot; x.fillRect(0, 380, 512, 132);
  // the seams, standing dark where the stitching has held the dirt
  x.fillStyle = 'rgba(40,40,38,.45)'; for (let i = 64; i < 512; i += 64) x.fillRect(i - 1, 0, 3, 512);
  x.fillStyle = 'rgba(40,40,38,.25)'; for (let j = 128; j < 512; j += 128) x.fillRect(0, j, 512, 2);
  // patches of newer canvas, stitched round
  for (let p = 0; p < 5; p++) { const w = 30 + R() * 46, h = 28 + R() * 50, px = 20 + R() * 460, py = 30 + R() * 430; x.fillStyle = p % 2 ? '#a9a99f' : '#8e8f88'; x.fillRect(px, py, w, h);
    x.strokeStyle = 'rgba(30,30,28,.55)'; x.lineWidth = 2; x.setLineDash([3, 4]); x.strokeRect(px + 2, py + 2, w - 4, h - 4); x.setLineDash([]); }
  // holes: torn through, ragged, the light through them (alpha 0; the material cuts at 0.5)
  x.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 7; k++) { const cx = 40 + R() * 430, cy = 40 + R() * 400, r = 5 + R() * 14; x.beginPath();
    for (let a = 0; a <= 12; a++) { const t = a / 12 * Math.PI * 2, rr = r * (.55 + R() * .8); x.lineTo(cx + Math.cos(t) * rr * 1.4, cy + Math.sin(t) * rr); } x.fill(); }
  // a split along one seam, a hand long
  x.fillRect(255, 300, 4, 46);
  x.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; CAN.set(kind, t); return t; }

// ── the weed and barnacle at her waterline: a ribbon round the hull from 0.1 m below the sea to 0.32 above, set 1.5 cm proud ──
function weedTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'), R = stream('singer:weed');
  const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(70,84,52,0)'); g.addColorStop(.35, 'rgba(58,72,40,.9)'); g.addColorStop(1, 'rgba(30,36,24,1)'); x.fillStyle = g; x.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 260; i++) { const px = R() * 512, py = 18 + R() * 46; x.fillStyle = R() < .5 ? 'rgba(196,192,176,.7)' : 'rgba(40,52,30,.8)'; x.beginPath(); x.arc(px, py, 1 + R() * 2.2, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(64,86,40,.85)'; x.lineWidth = 2; for (let i = 0; i < 140; i++) { const px = R() * 512; x.beginPath(); x.moveTo(px, 64); x.quadraticCurveTo(px + (R() - .5) * 8, 40, px + (R() - .5) * 10, 10 + R() * 30); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; }
function weedBand(S) { if (!S.sections || !S.sect) return null;
  const Y0 = -.1, Y1 = .32, rows = [], P = [], U = [], ix = [];
  const uAt = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (S.sect(z, m)[1] < y) lo = m; else hi = m; } return lo; };
  const zs = S.sections.map(s => s.z).filter(z => Math.abs(z) < (S.L || 17) * .4 && S.sect(z, 1)[1] > Y1 && S.sect(z, 0)[1] < Y0);
  for (const side of [1, -1]) { const base = P.length / 3;
    zs.forEach((z, i) => { for (let k = 0; k <= 3; k++) { const y = Y0 + (Y1 - Y0) * k / 3, u = uAt(z, y), p = S.sect(z, u); P.push(side * (p[0] + .015), y, z); U.push(z * .35, k / 3); } });
    for (let i = 0; i + 1 < zs.length; i++) for (let k = 0; k < 3; k++) { const a = base + i * 4 + k, b = a + 4, c2 = b + 1, d = a + 1; side > 0 ? ix.push(a, b, c2, a, c2, d) : ix.push(a, c2, b, a, d, c2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(ix); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: weedTex(), roughness: 1, transparent: true, alphaTest: .05, depthWrite: true }));
  m.name = 'weed'; m.receiveShadow = true; return m; }

const SWAP = new Map();
const GREY = { silver: 0x8e8c86, faded: 0x6c7884, pewter: 0x8a8678, weedy: 0x3a4436, rope: 0x8a8576, deck: 0x9c968a, spar: 0x6e6a62, glass: 0x1a1c1e };
export function singerDress(S, o = {}) {
  const lit = !!o.lit, swapped = new Set(), seen = new Set();
  const swap = (m, key, make) => { const k = m.uuid + '|' + key + '|' + lit; if (!SWAP.has(k)) SWAP.set(k, make(m.clone())); return SWAP.get(k); };
  const tone = hex => c => { c.color.setHex(hex); if (c.map) { c.map = null; c.needsUpdate = true; } /* the wood map is brown under any tint: the grain stays in the normal map, the colour goes */ if ('metalness' in c) c.metalness = 0; c.roughness = Math.max(c.roughness ?? .8, .78); c.userData = { singer: hex }; return c; };
  const names = new Set(); S.group.traverse(n => n.isMesh && names.add(n.name));
  const BOTTOM = names.has('tallow') ? 'tallow' : names.has('bottom') ? 'bottom' : 'tar'; /* the Aurenne dress names her topsides 'tar' (ships.js's aurCogMats) */
  S.group.traverse(n => { if (!n.isMesh) return; const m = n.material, u = m.userData || {}, nm = n.name; seen.add(nm);
    let make = null;
    if (u.swatch === 'cloth' || nm === 'sail' || nm === 'jib') make = c => { c.map = canvasTex(nm); c.color.setHex(0xffffff); c.alphaTest = .5; c.transparent = false; c.side = THREE.DoubleSide; c.userData = { singer: 'canvas' }; return c; };
    else if (nm === 'lamp') make = c => { c.color.setHex(GREY.glass); c.emissive && c.emissive.setHex(0); c.emissiveIntensity = 0; c.roughness = .25; c.userData = { singer: 'dark lamp' }; return c; };
    else if (nm === 'gilt' || nm === 'cream' || nm === 'paint' || nm === 'iron') make = tone(GREY.pewter);
    else if (u.swatch === 'paint' || nm === 'blue' || nm === 'green') make = tone(GREY.faded);
    else if (nm === BOTTOM) make = tone(GREY.weedy);
    else if (nm === 'hull' || nm === 'oak' || nm === 'tar') make = tone(GREY.silver);
    else if (nm === 'deck') make = tone(GREY.deck);
    else if (nm === 'spar') make = tone(GREY.spar);
    else if (nm === 'rope') make = tone(GREY.rope);
    if (make) { n.material = swap(m, nm, make); swapped.add(nm); }
    if (lit) { n.material = swap(n.material, 'lit', c => { c.emissive = new THREE.Color(.55, .95, .72); c.emissiveIntensity = c.userData.singer === 'canvas' ? .55 : .28;
      c.transparent = true; c.opacity = c.userData.singer === 'canvas' ? .78 : .62; c.depthWrite = true; c.defines = { ...(c.defines || {}), SINGER_LIT: 1 }; return c; }); }
    n.castShadow = !lit; });
  if (S.banner && S.banner.group) { S.group.remove(S.banner.group); S.banner = null; }
  const w = weedBand(S); let weed = null;
  if (w) { if (lit) { w.material.emissive = new THREE.Color(.55, .95, .72); w.material.emissiveIntensity = .2; w.material.opacity = .6; w.material.defines = { SINGER_LIT: 1 }; }
    S.group.add(w); weed = { tris: w.geometry.index.count / 3 }; }
  S.singer = { lit, swapped: [...swapped].sort(), seen: [...seen].sort(), weed }; return S;
}

// ── the fog: three's FogExp2 with a lane, and a defines-gated cut for C ──
export function singerFog(mode, eye, at, o = {}) {
  const v3 = v => `vec3(${v.map(x => (+x).toFixed(3)).join(',')})`, R = o.r ?? 11, K = o.k ?? .25, LIT = o.lit ?? .2;
  THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying float vFogDepth; varying vec3 vFogW;\n#endif';
  THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogDepth = - mvPosition.z; vFogW = (inverse(viewMatrix) * mvPosition).xyz;\n#endif';
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
 uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogW;
 #ifdef FOG_EXP2
  uniform float fogDensity;
 #else
  uniform float fogNear; uniform float fogFar;
 #endif
#endif`;
  const lane = mode === 'lane' ? `{ vec3 A = ${v3(eye)}, B = ${v3(at)}, ab = B - A; float t = clamp(dot(vFogW - A, ab) / dot(ab, ab), 0., 1.);
      float r = length((vFogW - (A + ab * t)).xz); fd *= mix(1., ${K.toFixed(3)}, 1. - smoothstep(${(R * .55).toFixed(2)}, ${R.toFixed(2)}, r)); }` : '';
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
 float fd = vFogDepth;
 ${lane}
 #ifdef SINGER_LIT
  fd *= ${LIT.toFixed(3)};
 #endif
 #ifdef FOG_EXP2
  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fd * fd );
 #else
  float fogFactor = smoothstep( fogNear, fogFar, fd );
 #endif
 gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;
  return { mode, r: R, k: K, lit: LIT };
}
