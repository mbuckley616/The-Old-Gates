// The HUD in the new look (concept artist, 15 Oct 2026; backlog L, "the HUD in the new look"; OG-136, OG-147). The approved
// HUD (DECISION #198, A: the 600 px compass with its marks and label, the vitals plate, the ledger above it, damage numbers at
// the foe's head) laid over the slices' renderer, so its metal and paper can be judged against the new picture, in three frames:
// ?frame=metal (the kit as approved), carved (P10b's ornate frames, OG-147), bare (no plates, a soft shade under each piece).
// ?scene=lane (street.js, the Gatelands lane at noon, a town's HUD) | hall (gate.js ?view=hall, inside a gate, a skeleton
// at 4 m with a blow landed on it). The scene is the slice's own module, unchanged: this file catches its scene, camera
// and composer as they render, then adds the foe and draws the minimap from above the camera.
// For the builder: the HUD is DOM over the canvas on a 1280×720 layer zoomed to the window (×1.5 at 1920×1080); every
// class and size is the approved page's (docs/prototypes/hud/src.html), and a frame is one class on the layer (.f-*),
// all of it in hud.css. The minimap is the scene drawn from straight above, 96 m across, north up.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Q, W, H, STATS } from './common.js';
import { genome, build, pose } from './creatures.js';

const HUD_SCENE = Q.get('scene') === 'hall' ? 'hall' : 'lane', HUD_FRAME = ['metal', 'carved', 'bare'].includes(Q.get('frame')) ? Q.get('frame') : 'metal';
// catch what the slice renders with: its composer, and through it the renderer, the scene and the eye
const HC = {}; { const c0 = EffectComposer.prototype.render; EffectComposer.prototype.render = function (dt) { HC.comp = this; HC.R = this.renderer; const rp = this.passes.find(p => p.scene && p.camera); if (rp) { HC.scene = rp.scene; HC.cam = rp.camera; } return c0.call(this, dt); }; }

// HUD-SCENE (bundle.py cuts here and puts the slice's own code in place of the import)
// gate.js reads the shared query when it loads, which is now
if (HUD_SCENE === 'hall') Q.set('view', 'hall');
await import(HUD_SCENE === 'hall' ? './gate.js' : './street.js');
// HUD-SCENE-END

const until = f => new Promise(res => { const t = setInterval(() => { if (f()) { clearInterval(t); res(); } }, 50); });
await until(() => (window.__done || window.__err) && HC.comp);

// ── the game's data for a level-6 hand (from docs/prototypes/hud/current.json, build s476's run) ──
const V = { hp: [94, 130], mana: [56, 100], st: [95, 115], level: 6, xp: 682, xpNext: 1100 };
const JOBS = ['A letter for Elder Lorcan', 'The road out of Dunmore', 'The reeve’s seal', 'Wolves at Dunmore'];
// marks by bearing (degrees from north) and distance in steps; the lane's are the s476 run's four jobs, the hall's its ring
const MARKS = HUD_SCENE === 'lane'
  ? [{ b: 276, d: 452, i: 'i-letter', job: JOBS[0], what: 'Lorcan' }, { b: 175, d: 305, i: 'i-tent', job: JOBS[1], what: 'the camp' }, { b: 205, d: 634, i: 'i-gem', job: JOBS[2], what: 'the reeve’s seal' }, { b: 3, d: 4, i: 'i-skull', job: JOBS[3], what: 'within sight of the walls' }]
  : [{ b: 2, d: 250, i: 'i-gem', job: 'The ring', what: 'at the nave’s end', place: true }, { b: 172, d: 96, i: 'i-tent', job: 'The camp', what: 'outside the door', place: true }];
const LEDGER = HUD_SCENE === 'lane'
  ? JOBS.map((j, i) => ({ i: 'i-scroll', t: `New quest: <b>${j}</b>`, o: [.55, .7, .85, 1][i] }))
  : [{ i: 'i-map', t: 'Found: <b>an old gate</b>', o: .7 }, { i: 'i-torch', t: 'Your torch has burned to <b>a quarter</b>', o: 1 }];

// the icons and the paper's deckle filters: the approved kit's own symbols (hud/defs.html; inlined in the bundle)
const DEFS = window.HUD_DEFS || await fetch('../hud/defs.html').then(r => r.text());
const ICONS = `<svg width="0" height="0" style="position:absolute"><defs>
  <symbol id="i-skull" viewBox="0 0 24 24"><path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.4 1.1 4 2.8 5v3.2h9.4V15.5c1.7-1 2.8-2.6 2.8-5 0-4-3.1-7-7.5-7z"/><circle cx="9.2" cy="11" r="1.7"/><circle cx="14.8" cy="11" r="1.7"/><path d="M12 13.6l-.9 1.8h1.8zM10 18.7v-2M14 18.7v-2"/></symbol>
  <symbol id="i-tent" viewBox="0 0 24 24"><path d="M3 20L12 5l9 15z"/><path d="M12 5v15M9.5 20l2.5-5 2.5 5M10.5 4l1.5 1 1.5-1"/></symbol>
  <symbol id="i-gem" viewBox="0 0 24 24"><path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-1.5 5L12 20l4.5-11L15 4"/></symbol>
  <symbol id="i-letter" viewBox="0 0 24 24"><path d="M3.5 6.5h17v11h-17z"/><path d="M3.5 6.5L12 13l8.5-6.5"/><circle cx="12" cy="15.6" r="1.6"/></symbol>
  <symbol id="i-mace" viewBox="0 0 24 24"><path d="M5 20l7.5-7.5"/><circle cx="15.5" cy="8.5" r="4"/><path d="M15.5 2.5v2M21.5 8.5h-2M15.5 14.5v-2M11.5 4.5l1.3 1.3M19.5 4.5l-1.3 1.3M19.5 12.5l-1.3-1.3"/></symbol>
  <symbol id="i-scroll" viewBox="0 0 24 24"><path d="M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1z"/><path d="M6 20a2 2 0 0 0 2-2v-2M17 8H9.5M10 11.5h4.5M10 14.5h4.5"/></symbol>
  <linearGradient id="brz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c47a"/><stop offset=".45" stop-color="#a07a38"/><stop offset="1" stop-color="#4a3414"/></linearGradient>
</defs></svg>`;
document.body.insertAdjacentHTML('afterbegin', DEFS + ICONS);
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`;

// ── the scene's own additions: the foe in the hall, then one frame drawn again ──
let foeHead = null;
if (HUD_SCENE === 'hall') {
  const C = build(genome('skeleton', 'hud:hall:skeleton')); C.gait = 'walk'; pose(C, .35);
  C.root.position.set(1.15, 0, 4.2); C.root.rotation.y = .45; HC.scene.add(C.root); STATS.foe = { plan: 'skeleton', tris: C.stats?.tris };
  C.root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(C.root); foeHead = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2);
  STATS.foeHeight = +(b.max.y - b.min.y).toFixed(2);
}
// the minimap: the scene from straight above the eye, 96 m across, north (-z) up; no fog, the roof cut away
function miniMap() {
  const R = HC.R, cam = HC.cam, span = 96, a = R.domElement.width / R.domElement.height, top = HUD_SCENE === 'hall' ? 18 : 400;
  const oc = new THREE.OrthographicCamera(-span / 2 * a, span / 2 * a, span / 2, -span / 2, .1, top + 200); oc.up.set(0, 0, -1);
  oc.position.set(cam.position.x, top, cam.position.z); oc.lookAt(cam.position.x, 0, cam.position.z); oc.updateMatrixWorld(true);
  const fog = HC.scene.fog; HC.scene.fog = null; R.setRenderTarget(null); R.render(HC.scene, oc); HC.scene.fog = fog;
  const cv = document.createElement('canvas'), N = 300, ch = R.domElement.height; cv.width = cv.height = N;
  cv.getContext('2d').drawImage(R.domElement, (R.domElement.width - ch) / 2, 0, ch, ch, 0, 0, N, N); return cv.toDataURL('image/jpeg', .9);
}
const MINI = miniMap();
HC.comp.render(); // the eye's frame again, with the foe and over the minimap's

// ── the layer ──
const wrap = a => ((a % 360) + 540) % 360 - 180, steps = d => d < 20 ? 'here' : d + ' steps';
function band() {
  const BW = 600, SPAN = 180, k = BW / SPAN, yaw = 0, NAMES = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  let h = '<div class="band"><div class="in">';
  for (let a = 0; a < 360; a += 15) { const r = wrap(a - yaw); if (Math.abs(r) > SPAN / 2 - 4) continue; const x = BW / 2 + r * k;
    h += NAMES[a] != null ? `<span class="cd ${a % 90 === 0 ? 'big' : ''}" style="left:${x}px">${NAMES[a]}</span>` : `<span class="tk ${a % 45 ? 'h' : ''}" style="left:${x}px"></span>`; }
  const ms = MARKS.map(m => { const r = wrap(m.b - yaw), edge = Math.abs(r) > SPAN / 2 - 6; return { ...m, r, edge, x: edge ? (r < 0 ? 16 : BW - 16) : BW / 2 + r * k }; }).sort((p, q) => p.x - q.x), groups = [];
  for (const m of ms) { const g = groups[groups.length - 1]; if (g && Math.abs(m.x - g.x) < 30 && g.edge === m.edge) { g.list.push(m); g.x = (g.x * (g.list.length - 1) + m.x) / g.list.length; } else groups.push({ x: m.x, edge: m.edge, list: [m] }); }
  for (const g of groups) { g.list.sort((p, q) => p.d - q.d); const t = g.list[0];
    h += `<div class="mk ${t.place ? '' : 'q'} ${t.d > 500 ? 'far' : ''}" style="left:${g.x}px">${ico(t.i)}${g.list.length > 1 ? `<span class="ct">${g.list.length}</span>` : ''}${g.edge ? `<span class="chev" style="${g.x < BW / 2 ? 'left:-14px' : 'right:-14px'}">${g.x < BW / 2 ? '‹' : '›'}</span>` : ''}</div>`; }
  h += '</div></div>';
  const on = groups.filter(g => !g.edge && Math.abs(g.x - BW / 2) <= 12 * k).flatMap(g => g.list);
  if (on.length) h += `<div class="parch small lbl">${on.map(m => `<div class="r">${ico(m.i)}<b>${m.job}</b><i>${m.what}</i><span class="d num">${steps(m.d)}</span></div>`).join('')}</div>`;
  return h + `<div class="roundel sunr">${ico(HUD_SCENE === 'hall' ? 'i-torch' : 'i-sun')}</div>`;
}
function vitals(v) {
  const pc = (a, b) => Math.max(0, Math.min(100, a / b * 100));
  const bar = (cls, icon, col, cur, max, tail) => `<div class="br"><svg style="color:${col}" class="ico"><use href="#${icon}"/></svg><div class="hbar ${cls}">${tail ? `<i class="tail" style="width:${pc(tail, max)}%"></i>` : ''}<i style="width:${pc(cur, max)}%"></i></div><span class="v num">${cur} / ${max}</span></div>`;
  return `<div class="plate vit"><div class="roundel">${ico('i-mace')}</div><div class="roundel dim">${ico('i-star')}</div><div class="bars">
    ${bar('hp', 'i-heart', 'var(--hp-hi)', v.hp[0], v.hp[1], v.hpTail)}${bar('mp', 'i-star', 'var(--mp-hi)', v.mana[0], v.mana[1])}${bar('st', 'i-bolt', 'var(--st-hi)', v.st[0], v.st[1])}
    <div class="hudtxt num lv"><span>Level ${V.level}</span><span>${V.xp} / ${V.xpNext}</span></div><div class="xpbar"><i style="width:${pc(V.xp, V.xpNext)}%"></i></div></div></div>`;
}
const ledger = L => `<div class="ledger">${L.map(l => `<div class="ln" style="opacity:${l.o}">${ico(l.i)}<span>${l.t}</span></div>`).join('')}</div>`;
const mini = () => `<div class="mini" style="background-image:url(${MINI})"><span class="me"></span></div><div class="miniring"><b>N</b></div><div class="xh"></div>`;
// the carved frame's castings: scrolls at the plate's corners, finials and a crest on the compass, a knotwork ring round the map
function ornaments() {
  const S = 'stroke="url(#brz)" fill="none" stroke-linecap="round"', D = 'stroke="#0a0806" fill="none" stroke-linecap="round"';
  const scroll = `<path d="M3 34 V16 Q3 3 16 3 H34" ${D} stroke-width="6"/><path d="M3 34 V16 Q3 3 16 3 H34" ${S} stroke-width="3.5"/><path d="M10 24 Q10 10 24 10 M17 17 a4.5 4.5 0 1 1 4.5 -4.5" ${D} stroke-width="4.5"/><path d="M10 24 Q10 10 24 10 M17 17 a4.5 4.5 0 1 1 4.5 -4.5" ${S} stroke-width="2.4"/><circle cx="6" cy="6" r="3.2" fill="url(#brz)" stroke="#0a0806"/>`;
  const corner = (x, y, rot) => `<svg class="orn" width="40" height="40" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)">${scroll}</svg>`;
  const vx = 18, vy = 720 - 20 - 100, vw = 306, vh = 100;
  let h = corner(vx - 7, vy - 7, 0) + corner(vx + vw - 33, vy - 7, 90) + corner(vx + vw - 33, vy + vh - 33, 180) + corner(vx - 7, vy + vh - 33, 270);
  // the compass's finials (left, mirrored right) and its crest
  const fin = `<path d="M38 8 Q14 8 10 23 Q6 38 22 40 Q34 41 30 31 Q27 24 20 28" ${D} stroke-width="6"/><path d="M38 8 Q14 8 10 23 Q6 38 22 40 Q34 41 30 31 Q27 24 20 28" ${S} stroke-width="3.4"/><path d="M38 38 Q24 38 22 46 Q20 54 30 54" ${D} stroke-width="5"/><path d="M38 38 Q24 38 22 46 Q20 54 30 54" ${S} stroke-width="2.6"/><circle cx="20" cy="28" r="2.6" fill="url(#brz)"/>`;
  const by = 720 - 24 - 46 - 6;
  h += `<svg class="orn" width="44" height="60" style="left:${340 - 40}px;top:${by}px">${fin}</svg><svg class="orn" width="44" height="60" style="left:${940 - 4}px;top:${by}px;transform:scaleX(-1)">${fin}</svg>`;
  h += `<svg class="orn" width="60" height="30" style="left:${640 - 30}px;top:${720 - 24 - 46 - 22}px"><path d="M30 28 L20 14 Q30 2 40 14 Z" fill="url(#brz)" stroke="#0a0806" stroke-width="1.5"/><path d="M20 14 Q8 4 4 14 Q10 20 22 17 M40 14 Q52 4 56 14 Q50 20 38 17" ${D} stroke-width="4.5"/><path d="M20 14 Q8 4 4 14 Q10 20 22 17 M40 14 Q52 4 56 14 Q50 20 38 17" ${S} stroke-width="2.4"/><circle cx="30" cy="12" r="3" fill="#0a0806"/><circle cx="30" cy="12" r="1.8" fill="#e8c47a"/></svg>`;
  // the map's ring: two bronze rims and an interlace between them, eight studs
  const cx = 1280 - 30 - 75, cy = 30 + 75, R0 = 80, R1 = 92, P = [0, 1].map(s => { let d = ''; for (let i = 0; i <= 360; i++) { const t = i / 360 * Math.PI * 2, r = (R0 + R1) / 2 + (s ? -1 : 1) * 4.2 * Math.sin(t * 16); d += (i ? 'L' : 'M') + (100 + r * Math.sin(t)).toFixed(1) + ' ' + (100 - r * Math.cos(t)).toFixed(1); } return d; });
  h += `<svg class="orn" width="200" height="200" style="left:${cx - 100}px;top:${cy - 100}px"><circle cx="100" cy="100" r="${(R0 + R1) / 2}" stroke="#15110b" stroke-width="${R1 - R0 + 2}" fill="none"/>
    ${P.map(d => `<path d="${d}" ${D} stroke-width="4"/><path d="${d}" ${S} stroke-width="2"/>`).join('')}
    <circle cx="100" cy="100" r="${R0}" ${D} stroke-width="4"/><circle cx="100" cy="100" r="${R0}" ${S} stroke-width="2.4"/><circle cx="100" cy="100" r="${R1}" ${D} stroke-width="5"/><circle cx="100" cy="100" r="${R1}" ${S} stroke-width="3.2"/>
    ${Array.from({ length: 8 }, (_, i) => { const t = (i + .5) / 8 * Math.PI * 2; return `<circle cx="${(100 + R1 * Math.sin(t)).toFixed(1)}" cy="${(100 - R1 * Math.cos(t)).toFixed(1)}" r="3.6" fill="url(#brz)" stroke="#0a0806" stroke-width="1.2"/>`; }).join('')}</svg>`;
  return h;
}
let html = mini() + band() + ornaments();
if (HUD_SCENE === 'lane') html += vitals(V) + ledger(LEDGER);
else {
  html += vitals({ ...V, hp: [81, 130], st: [62, 115], hpTail: 95 }) + ledger(LEDGER);
  const p = foeHead.clone().project(HC.cam), fx = (p.x + 1) / 2 * 1280, fy = (1 - p.y) / 2 * 720, maxHp = 60;
  // the s476 run's blow: an Iron Mace of Flames on a Skeleton, 30 (blunt on bone, ×1.4) and the rune's +5 fire beside it
  html += `<div class="dn weak" style="left:${fx}px;top:${fy - 6}px">30<span class="sm">weak</span></div><div class="dn fire" style="left:${fx + 52}px;top:${fy - 44}px">+5 ${ico('i-fire')}</div>`;
  html += `<div class="foe"><div class="nm">Skeleton</div><div class="hbar hp"><i class="tail" style="width:100%"></i><i style="width:${(maxHp - 35) / maxHp * 100}%"></i></div></div>`;
  STATS.foeScreen = [Math.round(fx), Math.round(fy)];
}
const layer = document.createElement('div'); layer.id = 'hud'; layer.className = 'f-' + HUD_FRAME; layer.innerHTML = html; document.body.appendChild(layer);
// zoom, not a transform: the slips' deckle filter ghosts when a scaled layer is rastered
const fit = () => { layer.style.zoom = innerWidth / 1280; }; fit(); addEventListener('resize', fit);
// the shots switch frames without building the scene again
window.hudFrame = f => { layer.className = 'f-' + f; };
STATS.hud = { scene: HUD_SCENE, frame: HUD_FRAME, scale: +(innerWidth / 1280).toFixed(3), marks: MARKS.length };
// the shots wait for this, not the scene's __done
await document.fonts.ready; window.__hud = true;
