// Notification cards in the new look (concept artist, 25 Nov 2026; backlog L, "The interface's missing pieces"; OG-136's
// panel 7, "Feedback & Notifications"). The game's five moments (a level, a quest's step, a place found, a skill rising,
// a word learned) are today five ledger slips among the rest (Session 2578: gold paid, a door locked, a torch burning low).
// This page lays them over hud.js's scene (the approved HUD, #198 A, in its metal frame, which is the game's) three ways:
// ?level=a  the ledger alone: each moment a slip like any other line, as built
//        b  a card for the moment: a paper slip 400 × 74 at the top centre, a wax seal in the kind's colour, the kind in
//           small capitals, the name and one line; held 4 s, one at a time, the rest queued; the ledger keeps the small lines
//        c  OG-136 as drawn: a larger card (452 × 132) with a picture: the place itself (the scene drawn from above and
//           behind you), the level's wreath, the quest's mark on its map, the skill's ring filling, the word's sigil lit
// &kind=level|quest|place|skill|word (the moment shown; default place in the lane, skill in the hall), &scene=lane|hall,
// &play=1 runs the five in turn as the game would queue them.
// For the builder: plain DOM over the canvas like the ledger (`#ledger` in index.html), one root `#note-card` at the top
// centre, filled by one function from the five call sites that now call showMsg (12-character.js's level and skill,
// 20-quests.js's step, 83-world-generator.js's discovery, 64-spells.js's word). All sizes are in the HUD's 1280 × 720 layer.
import * as THREE from 'three';
import { Q, STATS } from './common.js';

// NOTIFY-HUD (bundle.py cuts here: in the bundle this file runs after hud.js's own code, in its block)
await import('./hud.js');
// NOTIFY-HUD-END

const N_LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b';
const N_SCENE = Q.get('scene') === 'hall' ? 'hall' : 'lane';
const nico = (id, cls = '') => `<svg class="ico ${cls}"><use href="#${id}"/></svg>`;
// the five, in the game's own words where the game has them (showMsg's lines), and the run's numbers (build s476, level 6)
const N_KINDS = {
  level: { k: 'Level', seal: '#b8862a', ico: 'i-star', title: 'Level 7', line: 'Health and stamina +10 · Might, Fortitude and Resolve rise', ledger: 'Level 7: <b>attributes upgraded</b>' },
  quest: { k: 'Quest', seal: '#8a2412', ico: 'i-scroll', title: 'Wolves at Dunmore', line: 'Three of five wolves slain · the pack’s den is north', ledger: 'Wolves at Dunmore: <b>3 / 5</b> wolves' },
  place: { k: 'Found', seal: '#3f6a34', ico: 'i-map', title: 'Dunmore', line: 'a market town of the Gatelands · +50 XP', ledger: 'Discovered: <b>Dunmore</b> · +50 XP' },
  skill: { k: 'Skill', seal: '#2e4c7c', ico: N_SCENE === 'hall' ? 'i-club' : 'i-sword', title: N_SCENE === 'hall' ? 'Blunt rises to 18' : 'Blade rises to 24', line: N_SCENE === 'hall' ? 'Might’s skill · struck with the mace' : 'Might’s skill · struck with the sword', ledger: N_SCENE === 'hall' ? '<b>Blunt</b> rises to 18' : '<b>Blade</b> rises to 24', fill: N_SCENE === 'hall' ? .12 : .08 },
  word: { k: 'Word', seal: '#b4441a', ico: 'i-fire', title: 'Caor, held', line: 'the word of Tine, from its stone · Fireball', ledger: '<b>Caor</b>, held · the word of Tine' },
};
const N_ORDER = ['level', 'quest', 'place', 'skill', 'word'];
const N_KIND = N_KINDS[Q.get('kind')] ? Q.get('kind') : (N_SCENE === 'hall' ? 'skill' : 'place');

// ── C's pictures ──
// the place: the scene drawn through its own post from 9 m up and 16 m behind the eye, looking 30 m ahead, cropped 3:2
function nPlacePicture() {
  const HC = window.HUD_HC, cam = HC.cam, rp = HC.comp.passes.find(p => p.scene && p.camera); if (!rp) return '';
  const d = new THREE.Vector3(); cam.getWorldDirection(d); d.y = 0; d.normalize();
  const c2 = cam.clone(); c2.position.copy(cam.position).addScaledVector(d, -16).add(new THREE.Vector3(0, 9, 0));
  c2.lookAt(cam.position.clone().addScaledVector(d, 30).setY(cam.position.y - 1)); c2.fov = 50; c2.updateProjectionMatrix(); c2.updateMatrixWorld(true);
  const keep = rp.camera; rp.camera = c2; HC.comp.render(); rp.camera = keep;
  const src = HC.R.domElement, W0 = src.width, H0 = src.height, cw = Math.round(H0 * 1.5), cv = document.createElement('canvas'); cv.width = 432; cv.height = 288;
  cv.getContext('2d').drawImage(src, (W0 - cw) / 2, 0, cw, H0, 0, 0, 432, 288); const url = cv.toDataURL('image/jpeg', .9);
  HC.comp.render(); return url;
}
const N_PLACE = N_SCENE === 'lane' ? nPlacePicture() : '';
function nLaurel() {
  let h = '';
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const t = -2.35 + i * .2, r = 40, x = 72 + s * r * Math.sin(t + Math.PI), y = 56 - r * Math.cos(t + Math.PI), a = (s * (t * 57.3 + 180)) + s * 35;
    h += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7.5" ry="3.2" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#6a7a34" stroke="#2e3412" stroke-width=".8"/>`;
  }
  return `<svg viewBox="0 0 144 112" class="pic"><path d="M40 92 Q72 112 104 92" stroke="#7a1f10" stroke-width="3" fill="none"/>${h}<text x="72" y="70" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="40" fill="#7a1f10">VII</text></svg>`;
}
function nQuestPic() {
  const mini = window.HUD_MINI;
  return `<div class="pic map" style="background-image:url(${mini})"><span class="pin">${nico('i-skull')}</span><span class="pin far">${nico('i-tent')}</span></div>`;
}
function nSkillRing(f, ico) {
  const r = 38, L = 2 * Math.PI * r;
  return `<svg viewBox="0 0 144 112" class="pic"><circle cx="72" cy="56" r="${r}" fill="none" stroke="#5a4128" stroke-opacity=".25" stroke-width="7"/>
    <circle cx="72" cy="56" r="${r}" fill="none" stroke="#2e4c7c" stroke-width="7" stroke-dasharray="${(L * f).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 72 56)" stroke-linecap="round"/>
    <use href="#${ico}" x="50" y="34" width="44" height="44" stroke-width="1.5" style="color:#2e1c0c" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function nWordSigil() {
  return `<svg viewBox="0 0 144 112" class="pic sig"><defs><radialGradient id="nglow"><stop offset="0" stop-color="#ffb060" stop-opacity=".9"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient></defs>
    <circle cx="72" cy="56" r="50" fill="url(#nglow)"/><use href="#i-enso" x="26" y="10" width="92" height="92" stroke-width="1.3" style="color:#e8a050" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><use href="#i-fire" x="50" y="34" width="44" height="44" stroke-width="1.6" style="color:#ffd890" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const nPic = k => k === 'place' ? `<div class="pic photo" style="background-image:url(${N_PLACE})"></div>` : k === 'level' ? nLaurel() : k === 'quest' ? nQuestPic()
  : k === 'skill' ? nSkillRing(N_KINDS.skill.fill + .5, N_KINDS.skill.ico) : nWordSigil();

// ── the card ──
const N_CSS = `
#note-card{position:absolute;left:640px;top:30px;transform:translateX(-50%);z-index:7;pointer-events:none}
#note-card .nc{position:relative;isolation:isolate;display:flex;gap:14px;align-items:center;color:var(--ink);padding:11px 26px 12px 14px;width:400px;box-sizing:border-box}
#note-card .nc::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:4px;background:linear-gradient(170deg,var(--paper-hi),var(--paper) 55%,var(--paper-lo));filter:url(#deckle-s) drop-shadow(0 6px 10px rgba(0,0,0,.55))}
#note-card .nc::after{content:"";position:absolute;left:78px;right:26px;bottom:8px;height:2px;background:linear-gradient(90deg,var(--gilt),rgba(154,112,32,.15));border-radius:1px}
#note-card .wax{flex:none;width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:24px;color:#f6e2b8;
  background:radial-gradient(circle at 38% 34%,rgba(255,255,255,.35),transparent 38%),radial-gradient(circle,var(--s) 58%,color-mix(in srgb,var(--s) 60%,#000) 100%);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--s) 80%,#000),0 0 0 4px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.5);filter:drop-shadow(0 1px 0 rgba(255,240,200,.25))}
#note-card .wax svg{filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
#note-card .tx{min-width:0}
#note-card .kd{font:13px/1 var(--display);letter-spacing:.16em;color:var(--ink-soft);text-transform:uppercase}
#note-card .tt{font:24px/1.15 var(--display);color:var(--rubric);margin-top:3px;white-space:nowrap}
#note-card .ln2{font:italic 15px/1.25 var(--fell);color:var(--ink-soft);margin-top:2px}
/* C: OG-136's card, a picture beside the words */
#note-card .nc.big{width:452px;padding:12px 22px 14px 12px;gap:16px;align-items:stretch}
#note-card .nc.big::after{left:172px;right:22px}
#note-card .nc.big .tx{display:flex;flex-direction:column;justify-content:center;padding-bottom:6px}
#note-card .nc.big .tt{font-size:27px;white-space:normal}
#note-card .nc.big .kd{display:flex;align-items:center;gap:7px}
#note-card .nc.big .kd svg{font-size:15px;color:var(--s)}
#note-card .pic{flex:none;width:144px;height:108px;border-radius:2px;box-shadow:0 0 0 1px #5a4128,0 0 0 4px rgba(224,201,148,.9),0 0 0 5px #7a5a30,inset 0 0 14px rgba(60,30,8,.35)}
#note-card .pic.photo{background-size:cover;background-position:center;filter:sepia(.32) saturate(.9) contrast(1.04)}
#note-card .pic.map{position:relative;background-size:170%;background-position:center;filter:sepia(.6) saturate(.75)}
#note-card .pic.map .pin{position:absolute;left:58px;top:24px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:17px;color:var(--rubric);background:radial-gradient(circle at 50% 38%,#f2e4bc,#d4b97e 75%);box-shadow:0 0 0 2px var(--rubric),0 0 0 3px #0a0806}
#note-card .pic.map .pin.far{left:26px;top:66px;transform:scale(.8);opacity:.85}
#note-card svg.pic{background:rgba(201,171,110,.35)}
#note-card .pic.sig{background:#2a1a10}
.nlvl-a #note-card{display:none}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${N_CSS}</style>`);
const N_ROOT = document.createElement('div'); N_ROOT.id = 'note-card'; document.getElementById('hud').appendChild(N_ROOT);
function nCard(kind, level) {
  const d = N_KINDS[kind];
  if (level === 'c') return `<div class="nc big" style="--s:${d.seal}">${nPic(kind)}<div class="tx"><div class="kd">${nico(d.ico)}${d.k}</div><div class="tt">${d.title}</div><div class="ln2">${d.line}</div></div></div>`;
  return `<div class="nc" style="--s:${d.seal}"><div class="wax">${nico(d.ico)}</div><div class="tx"><div class="kd">${d.k}</div><div class="tt">${d.title}</div><div class="ln2">${d.line}</div></div></div>`;
}
// A: the five moments as ledger slips, newest at the foot, over the scene's own older lines
const N_LEDGER0 = document.querySelector('#hud .ledger')?.innerHTML || '';
function nLedger(level, kind) {
  const L = document.querySelector('#hud .ledger'); if (!L) return;
  if (level !== 'a') { L.innerHTML = N_LEDGER0; return; }
  // the ledger holds four: the moment shown last, the three before it in the order the game would send them
  const i = N_ORDER.indexOf(kind), four = [1, 2, 3, 4].map(j => N_ORDER[(i + j) % 5]).slice(-4);
  L.innerHTML = four.map((k, j) => `<div class="ln" style="opacity:${[.55, .7, .85, 1][j]}">${nico(N_KINDS[k].ico)}<span>${N_KINDS[k].ledger}</span></div>`).join('');
}
window.notifyShow = (kind = N_KIND, level = N_LEVEL) => {
  document.body.classList.remove('nlvl-a', 'nlvl-b', 'nlvl-c'); document.body.classList.add('nlvl-' + level);
  N_ROOT.innerHTML = level === 'a' ? '' : nCard(kind, level); nLedger(level, kind);
  const r = N_ROOT.firstElementChild?.getBoundingClientRect(); STATS.card = { kind, level, w: r ? Math.round(r.width / (innerWidth / 1280)) : 0, h: r ? Math.round(r.height / (innerWidth / 1280)) : 0 };
};
window.notifyShow();
// &play=1: the five in turn, 4 s each (C 5 s), with a 0.35 s fade, as the game's queue would show them
if (Q.get('play')) {
  N_ROOT.style.transition = 'opacity .35s'; let i = N_ORDER.indexOf(N_KIND);
  const next = () => { N_ROOT.style.opacity = 0; setTimeout(() => { i = (i + 1) % 5; window.notifyShow(N_ORDER[i]); N_ROOT.style.opacity = 1; setTimeout(next, N_LEVEL === 'c' ? 5000 : 4000); }, 350); };
  setTimeout(next, 4000);
}
STATS.notify = { level: N_LEVEL, scene: N_SCENE, kind: N_KIND };
window.__notify = true;
