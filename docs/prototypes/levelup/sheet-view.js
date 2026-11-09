// The character sheet's portrait (the concept artist, 9 Nov 2026; backlog L, "The character sheet on parchment"; OG-134): the approved
// Inventory page (docs/prototypes/ui/index.html §3, the parchment of 27 Sep) with your own body between the worn slots, three ways.
// ?mode=a|b|c (A the slots alone, as approved; B the body inked into the paper; C the body lit in a bronze window), &kit=traveller|mail|plate,
// &yaw=<radians>. Drag the figure to turn it. Serve docs/prototypes/ (the kit's CSS, icons and fonts are read from ../hud and ../ui).
import { Q, STATS } from './common.js';
import { loadPack } from './people.js';
import { portrait, SHEET_KITS, MODE_OF } from './sheet.js';

const MODE = MODE_OF[Q.get('mode')] || Q.get('mode') || 'ink', KIT = SHEET_KITS[Q.get('kit')] ? Q.get('kit') : 'mail', K = SHEET_KITS[KIT];
const DEFS = window.HUD_DEFS || await fetch('../hud/defs.html').then(r => r.text());
document.body.insertAdjacentHTML('afterbegin', DEFS);
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`;
const STATURE = '1.76', BG = window.SHEET_BG || 'pieces-gatelands-street-a.jpg';
const slot = (k, label, icon) => { const w = K.worn[k]; return `<div class="slot${w ? ' full' : ''}"${w && w[0] === K.sel[0] ? ' style="box-shadow:inset 0 0 0 3px rgba(224,201,148,.8),inset 0 0 0 4px var(--rubric)"' : ''} title="${w ? w[0] : ''}">${ico(w ? w[1] : icon)}${label}</div>`; };
const gap = '<div class="gap"></div>';
const doll = `<div class="doll">${gap}${slot('head', 'HEAD', 'i-helm')}${gap}${gap}${slot('amulet', 'AMULET', 'i-amulet')}${gap}${slot('offhand', 'OFF-HAND', 'i-shield')}${slot('chest', 'CHEST', 'i-tunic')}${slot('weapon', 'WEAPON', 'i-sword')}${slot('ring', 'RING', 'i-ring')}${slot('hands', 'HANDS', 'i-glove')}${slot('ammo', 'AMMO', 'i-arrows')}${gap}${slot('legs', 'LEGS', 'i-legs')}${gap}${gap}${slot('feet', 'FEET', 'i-boot')}${gap}</div>`;
const worn2 = `<div class="worn2"><div class="col">${slot('head', 'HEAD', 'i-helm')}${slot('chest', 'CHEST', 'i-tunic')}${slot('hands', 'HANDS', 'i-glove')}${slot('legs', 'LEGS', 'i-legs')}${slot('feet', 'FEET', 'i-boot')}</div>
  <div class="fig ${MODE}"><canvas id="pc"></canvas><div class="cap2">The Traveller · ${STATURE} m</div></div>
  <div class="col">${slot('amulet', 'AMULET', 'i-amulet')}${slot('weapon', 'WEAPON', 'i-sword')}${slot('offhand', 'OFF-HAND', 'i-shield')}${slot('ring', 'RING', 'i-ring')}${slot('ammo', 'AMMO', 'i-arrows')}</div></div>`;
const BAG = [['i-dagger', 'Bronze Dagger', 'Attack 6–7 · pierce', '1.5', '6'], ['i-helm', 'Bronze Helmet', 'Armour +2', '3.0', '6'], ['i-potion', 'Health Potion<span class="qty">×2</span>', '+25 health', '1.0', '7'],
  ['i-key', 'Lockpick<span class="qty">×2</span>', '—', '0.1', '4'], ['i-potion', 'Mana Draught', '+40 mana', '0.5', '15'], ['i-torch', 'Torch', 'Light', '4.0', '2'], ['i-sword', 'Wooden Sword', 'Attack 6–7 · slash', '3.0', '2']];
const wide = MODE !== 'none';
document.body.insertAdjacentHTML('beforeend', `<div id="bg" style="background-image:url(${BG})"></div><div id="layer"><section class="screen menu" style="background:none;margin:0">
  <div class="tabs"><div class="tab on">${ico('i-pack')}Inventory</div><div class="tab">${ico('i-star')}Magic</div><div class="tab">${ico('i-scales')}Attributes</div><div class="tab">${ico('i-quill')}Quests</div><div class="tab">${ico('i-person')}Character</div><div class="tab">${ico('i-map')}Map</div></div>
  <div class="parch sheet"><div class="seal close">✕</div>
    <div style="display:grid;grid-template-columns:${wide ? '388px' : '270px'} 1fr;gap:${wide ? 28 : 34}px;height:520px">
      <div><div class="h">Worn</div><div class="rule"></div>${wide ? worn2 : doll}
        <div class="selinfo"><div style="font:19px var(--body);color:var(--rubric)">${K.sel[0]}</div><div class="meta">${K.sel[1]}</div><div class="num" style="font-size:15px;margin-top:4px">${K.sel[2]}</div></div></div>
      <div><div style="display:flex;justify-content:space-between;align-items:baseline"><div class="h">The Bag</div><div class="num" style="font:500 21px var(--body);color:var(--ink)"><svg class="ico" style="color:var(--gilt)"><use href="#i-coin"/></svg> 142 gold</div></div>
        <div class="rule"></div>
        <div style="display:flex;align-items:center;gap:12px;margin:0 10px 10px;font-size:15px"><span class="h2">Weight</span><div class="ibar" style="flex:1"><i style="width:34%;background:var(--ink-soft)"></i><span style="position:absolute;left:80%;top:-2px;bottom:-2px;width:1px;background:var(--rubric)"></span></div><span class="num">22.1 / 65</span></div>
        <div class="subtabs"><span class="on">All</span><span>Weapons</span><span>Armour</span><span>Consumables</span><span>Misc</span></div>
        <div class="cols lh"><span></span><span>NAME ▾</span><span>STAT</span><span class="r">WT</span><span class="r">VALUE</span></div>
        ${BAG.map((b, i) => `<div class="cols row${i === 2 ? '' : ''}">${ico(b[0])}<span class="n">${b[1]}</span><span class="num">${b[2]}</span><span class="r num">${b[3]}</span><span class="r num">${b[4]}</span></div>`).join('')}
        <div class="meta" style="margin:10px 10px 0;font-size:13px">Click to use or wear · hold X and click to destroy${wide ? ' · drag the figure to turn it' : ''}</div></div></div>
    <div class="vitals num"><div class="vital"><b style="color:var(--hp)">Health</b><div class="ibar"><i style="width:72%;background:var(--hp)"></i></div><span>94 / 130</span></div>
      <div class="vital"><b style="color:var(--mp)">Mana</b><div class="ibar"><i style="width:100%;background:var(--mp)"></i></div><span>100 / 100</span></div>
      <div class="vital"><b style="color:var(--st)">Stamina</b><div class="ibar"><i style="width:100%;background:var(--st)"></i></div><span>115 / 115</span></div></div>
  </div></section></div>`);
const layer = document.getElementById('layer'), fit = () => { layer.style.zoom = innerWidth / 1280; }; fit(); addEventListener('resize', fit);
Object.assign(STATS, { mode: MODE, kit: KIT, scale: +(innerWidth / 1280).toFixed(3) });
if (!wide) { window.__done = true; } else {
  const cv = document.getElementById('pc'), box = cv.parentElement.getBoundingClientRect(), z = innerWidth / 1280, ss = MODE === 'ink' ? 1.5 : 1.25;
  cv.width = Math.round(box.width * ss); cv.height = Math.round(box.height * ss);
  try { await loadPack('mh/'); const t0 = performance.now(), yaw0 = Q.has('yaw') ? +Q.get('yaw') : K.yaw, P = portrait(cv, { kit: KIT, mode: MODE, yaw: yaw0, dbg: +(Q.get('dbg') || 0), post: Q.has('post') });
    Object.assign(STATS, { bodyTris: P.bodyTris, bodyMeshes: P.bodyMeshes, passes: P.passes, tris: P.tris, calls: P.calls, height: P.height, miss: P.miss, swordTris: P.swordTris, canvas: [cv.width, cv.height], css: [Math.round(box.width / z), Math.round(box.height / z)], ms: Math.round(performance.now() - t0) });
    let yaw = yaw0, drag = null; cv.addEventListener('pointerdown', e => { drag = e.clientX; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (drag == null) return; yaw += (e.clientX - drag) * .012; drag = e.clientX; P.draw(yaw); }); cv.addEventListener('pointerup', () => { drag = null; });
    window.sheetYaw = y => P.draw(y);
  } catch (e) { STATS.err = String(e && e.stack || e); console.error(e); }
  window.__done = true; }
