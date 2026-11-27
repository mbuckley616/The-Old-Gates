// The schools on cards (concept artist, 27 Nov 2026; backlog L11; OG-128): the Magic page over the Gatelands street in the new look,
// composing one spell, three ways (schools.js): ?level=a|b|c (A the page as built; B the school's card in coloured ink; C OG-128 as
// drawn, the spell shown working), &spell=bridge|caor (Tonn and Sioc laid, the join OG-128 draws; Caor sent, one word at three tiers).
// Serve docs/prototypes/ (the kit's CSS, icons and fonts are read from ../hud and ../ui).
import { Q, STATS } from './common.js';
import { A_CSS, B_CSS, pageA, pageBC, bridgePicture, caorPicture, HAND, RANKS, cost } from './schools.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', SPELL = Q.get('spell') === 'caor' ? 'caor' : 'bridge';
const SEL = SPELL === 'caor' ? { id: 'caor', form: 'sent', rider: null, tiers: true } : { id: 'tonn', form: 'laid', rider: 'sioc' };
const DEFS = window.HUD_DEFS || await fetch('../hud/defs.html').then(r => r.text());
document.body.insertAdjacentHTML('afterbegin', DEFS);
document.head.insertAdjacentHTML('beforeend', `<style>${A_CSS}${B_CSS}</style>`);
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`, BG = window.SHEET_BG || 'pieces-gatelands-street-a.jpg';
document.body.insertAdjacentHTML('beforeend', `<div id="bg" style="background-image:url(${BG})"></div><div id="layer"></div>`);
const layer = document.getElementById('layer'), fit = () => { layer.style.zoom = innerWidth / 1280; }; fit(); addEventListener('resize', fit);
const t0 = performance.now(), pics = {};
if (Q.get('view') === 'seen') { // C's pictures at full size, to judge them in scale: &spell=bridge the bridge, &spell=caor the three tiers in a row
  const big = SPELL === 'bridge' ? [bridgePicture(1920, 1080)] : [0, 1, 2].map(t => caorPicture(t, 640, 360));
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;display:flex;align-items:center;background:#111;z-index:50">${big.map(p => `<img src="${p.url}" style="flex:1;min-width:0;${big.length > 1 ? '' : 'height:100%;'}object-fit:cover">`).join('')}</div>`);
  if (big[0].tris) Object.assign(STATS, { waveTris: big[0].tris, sceneTris: big[0].sceneTris }); }
else if (LEVEL === 'a') layer.innerHTML = pageA(SEL);
else {
  if (LEVEL === 'c') { if (SPELL === 'bridge') pics.seen = bridgePicture(); else [0, 1, 2].forEach(t => { pics['t' + t] = caorPicture(t); }); STATS.pictureMs = Math.round(performance.now() - t0);
    if (pics.seen) Object.assign(STATS, { waveTris: pics.seen.tris, sceneTris: pics.seen.sceneTris }); }
  layer.innerHTML = `<section class="screen menu" style="background:none;margin:0">
  <div class="tabs"><div class="tab">${ico('i-pack')}Inventory</div><div class="tab on">${ico('i-star')}Magic</div><div class="tab">${ico('i-scales')}Attributes</div><div class="tab">${ico('i-quill')}Quests</div><div class="tab">${ico('i-person')}Character</div><div class="tab">${ico('i-map')}Map</div></div>
  <div class="parch sheet"><div class="seal close">✕</div>${pageBC(SEL, LEVEL, pics)}
    <div class="vitals num"><div class="vital"><b style="color:var(--hp)">Health</b><div class="ibar"><i style="width:88%;background:var(--hp)"></i></div><span>142 / 160</span></div>
      <div class="vital"><b style="color:var(--mp)">Mana</b><div class="ibar"><i style="width:100%;background:var(--mp)"></i></div><span>${HAND.mana} / ${HAND.mana}</span></div>
      <div class="vital"><b style="color:var(--st)">Stamina</b><div class="ibar"><i style="width:100%;background:var(--st)"></i></div><span>130 / 130</span></div></div>
  </div></section>`;
}
await document.fonts.ready;
const over = [...layer.querySelectorAll('.col')].map(c => c.scrollHeight - c.clientHeight);
Object.assign(STATS, { level: LEVEL, spell: SPELL, rank: RANKS[HAND.rank], mana: SEL.tiers ? cost('caor', 'sent') : cost(SEL.id, SEL.form, SEL.rider), overflow: over });
window.__done = true;
