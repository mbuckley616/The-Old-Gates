// The item card and the herbal card (concept artist, 26 Nov 2026; backlog L, "The interface's missing pieces"; OG-136): the approved
// Inventory page (docs/prototypes/ui/index.html §3, the parchment of 27 Sep, as the character sheet's page lays it) over the Gatelands
// street in the new look, the pointer resting on one row of the bag, and what the bag says about it, three ways (cards.js):
// ?level=a|b|c (A the game's tooltip as built; B a card in coloured ink; C OG-136 as drawn, with a picture), &kind=item|herb.
// Serve docs/prototypes/ (the kit's CSS, icons and fonts are read from ../hud and ../ui).
import { Q, STATS } from './common.js';
import { A_CSS, C_CSS, tooltipA, cardBC, swordPicture, herbPicture, pictureHTML, SWORD, MOSS } from './cards.js';

const LEVEL = ['a', 'b', 'c'].includes(Q.get('level')) ? Q.get('level') : 'b', KIND = Q.get('kind') === 'herb' ? 'herb' : 'item';
const DEFS = window.HUD_DEFS || await fetch('../hud/defs.html').then(r => r.text());
document.body.insertAdjacentHTML('afterbegin', DEFS);
document.head.insertAdjacentHTML('beforeend', `<style>${A_CSS}${C_CSS}</style>`);
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`, BG = window.SHEET_BG || 'pieces-gatelands-street-a.jpg';
// the worn: a level-6 traveller in a tunic and boots with a Bronze Sword
const WORN = { chest: ['Traveller’s Tunic', 'i-tunic'], weapon: [SWORD.worn.name, 'i-sword'], feet: ['Walking Boots', 'i-boot'], legs: ['Wool Trousers', 'i-legs'] };
const slot = (k, label, icon) => { const w = WORN[k]; return `<div class="slot${w ? ' full' : ''}">${ico(w ? w[1] : icon)}${label}</div>`; }, gap = '<div class="gap"></div>';
const doll = `<div class="doll">${gap}${slot('head', 'HEAD', 'i-helm')}${gap}${gap}${slot('amulet', 'AMULET', 'i-amulet')}${gap}${slot('offhand', 'OFF-HAND', 'i-shield')}${slot('chest', 'CHEST', 'i-tunic')}${slot('weapon', 'WEAPON', 'i-sword')}${slot('ring', 'RING', 'i-ring')}${slot('hands', 'HANDS', 'i-glove')}${slot('ammo', 'AMMO', 'i-arrows')}${gap}${slot('legs', 'LEGS', 'i-legs')}${gap}${gap}${slot('feet', 'FEET', 'i-boot')}${gap}</div>`;
const BAG = [['i-dagger', 'Bronze Dagger', 'Attack 6–7 · pierce', '1.5', '6'], ['i-helm', 'Bronze Helmet', 'Armour +2', '3.0', '6'], ['i-wind', `${MOSS.name}<span class="qty">×${MOSS.qty}</span>`, '+15 health', '0.1', `${MOSS.worth}`],
  ['i-potion', 'Health Potion<span class="qty">×2</span>', '+25 health', '1.0', '7'], ['i-sword', SWORD.name, `Attack ${SWORD.atk[0]}–${SWORD.atk[1]} · slash`, SWORD.weight.toFixed(1), `${SWORD.worth}`],
  ['i-key', 'Lockpick<span class="qty">×2</span>', '—', '0.1', '4'], ['i-torch', 'Torch', 'Light', '4.0', '2']];
const HOT = KIND === 'item' ? 4 : 2;
document.body.insertAdjacentHTML('beforeend', `<div id="bg" style="background-image:url(${BG})"></div><div id="layer"><section class="screen menu" style="background:none;margin:0">
  <div class="tabs"><div class="tab on">${ico('i-pack')}Inventory</div><div class="tab">${ico('i-star')}Magic</div><div class="tab">${ico('i-scales')}Attributes</div><div class="tab">${ico('i-quill')}Quests</div><div class="tab">${ico('i-person')}Character</div><div class="tab">${ico('i-map')}Map</div></div>
  <div class="parch sheet"><div class="seal close">✕</div>
    <div style="display:grid;grid-template-columns:270px 1fr;gap:34px;height:520px">
      <div><div class="h">Worn</div><div class="rule"></div>${doll}
        <div class="selinfo"><div style="font:19px var(--body);color:var(--rubric)">${SWORD.worn.name}</div><div class="meta">Weapon · attack ${SWORD.worn.atk[0]}–${SWORD.worn.atk[1]} · one hand</div><div class="num" style="font-size:15px;margin-top:4px">All worn: attack ${SWORD.worn.atk[0]}–${SWORD.worn.atk[1]} · armour 3 · weight 7.5</div></div></div>
      <div><div style="display:flex;justify-content:space-between;align-items:baseline"><div class="h">The Bag</div><div class="num" style="font:500 21px var(--body);color:var(--ink)"><svg class="ico" style="color:var(--gilt)"><use href="#i-coin"/></svg> 142 gold</div></div>
        <div class="rule"></div>
        <div style="display:flex;align-items:center;gap:12px;margin:0 10px 10px;font-size:15px"><span class="h2">Weight</span><div class="ibar" style="flex:1"><i style="width:38%;background:var(--ink-soft)"></i><span style="position:absolute;left:80%;top:-2px;bottom:-2px;width:1px;background:var(--rubric)"></span></div><span class="num">24.6 / 65</span></div>
        <div class="subtabs"><span class="on">All</span><span>Weapons</span><span>Armour</span><span>Consumables</span><span>Misc</span></div>
        <div class="cols lh"><span></span><span>NAME ▾</span><span>STAT</span><span class="r">WT</span><span class="r">VALUE</span></div>
        ${BAG.map((b, i) => `<div class="cols row${i === HOT ? ' hot' : ''}" id="row${i}">${ico(b[0])}<span class="n">${b[1]}</span><span class="num">${b[2]}</span><span class="r num">${b[3]}</span><span class="r num">${b[4]}</span></div>`).join('')}
        <div class="meta" style="margin:10px 10px 0;font-size:13px">Click to use or wear · hold X and click to destroy</div></div></div>
    <div class="vitals num"><div class="vital"><b style="color:var(--hp)">Health</b><div class="ibar"><i style="width:72%;background:var(--hp)"></i></div><span>94 / 130</span></div>
      <div class="vital"><b style="color:var(--mp)">Mana</b><div class="ibar"><i style="width:100%;background:var(--mp)"></i></div><span>100 / 100</span></div>
      <div class="vital"><b style="color:var(--st)">Stamina</b><div class="ibar"><i style="width:100%;background:var(--st)"></i></div><span>115 / 115</span></div></div>
  </div></section></div><div id="pointer"></div>`);
const layer = document.getElementById('layer'), Z = innerWidth / 1280, fit = () => { layer.style.zoom = innerWidth / 1280; }; fit(); addEventListener('resize', fit);
await document.fonts.ready;
// the pointer rests on the row's name, 150 px into it (layer px); the card goes right of it, as the game's tooltip does (+14, −10)
const rr = document.getElementById('row' + HOT).getBoundingClientRect(), px = (rr.left / Z + 180), py = (rr.top / Z + rr.height / 2);
const ptr = document.getElementById('pointer'); ptr.style.left = px * Z + 'px'; ptr.style.top = py * Z + 'px';
let card = null; const t0 = performance.now();
if (LEVEL === 'a') {
  // A at the game's own size: the tooltip is position:fixed in real pixels, so it is not zoomed with the layer
  document.body.insertAdjacentHTML('beforeend', `<div id="bag-tooltip">${tooltipA(KIND)}</div>`); card = document.getElementById('bag-tooltip');
  card.style.left = px * Z + 14 + 'px'; card.style.top = py * Z - 10 + 'px';
} else {
  let pic = '';
  if (LEVEL === 'c') { const P = KIND === 'item' ? swordPicture() : herbPicture(MOSS.key); pic = pictureHTML(KIND, P); STATS.picture = { tris: P.tris, size: P.size, ms: Math.round(performance.now() - t0) }; }
  layer.insertAdjacentHTML('beforeend', cardBC(KIND, LEVEL, pic)); card = layer.lastElementChild;
  const h = card.offsetHeight; let y = py - 22; if (y + h > 708) y = 708 - h; card.style.left = px + 20 + 'px'; card.style.top = Math.max(10, y) + 'px';
}
const cb = card.getBoundingClientRect();
Object.assign(STATS, { level: LEVEL, kind: KIND, scale: +Z.toFixed(3), card: [Math.round(cb.left), Math.round(cb.top), Math.round(cb.width), Math.round(cb.height)] });
window.__done = true;
