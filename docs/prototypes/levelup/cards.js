// The item card and the herbal card (concept artist, 26 Nov 2026; backlog L, "The interface's missing pieces"; OG-136's panels 3
// and 8: "an item card (Firebrand Blade) with its effects in coloured ink", "a herbal card with known effects and 'unknown, study to
// discover'"). What the bag says about one thing when you rest the pointer on it, three ways:
//   a  as built: showBagTooltip's dark box (66-hub.js), its rows and inks as the game writes them, at the game's 10 px
//   b  a card in coloured ink: a paper slip in the approved kit beside the row, each effect in its own ink, the numbers against
//      what you wear, a herb's four effects in their order with the unknown ones said as unknown and how each is learnt
//   c  OG-136 as drawn: b with a picture at its head: the thing itself, lit in the bronze window of the character sheet's portrait
//      (Michael's C on #1363), and a herb drawn as a field guide's plate inked into the paper with a 10 cm bar
// The words and numbers are the game's own (14-items.js, 30-plants.js, 50-travel.js's HERB_FX and ALCH_FX, 66-hub.js's rows) for a
// level-6 hand with Blade 24 who wears a Bronze Sword and has eaten Firemoss three times and learnt its third effect at the mortar.
// For the builder: one function `itemCard(it)` returns the card's HTML from the item and the player, as showBagTooltip does now,
// into the same `#bag-tooltip` root restyled by `C_CSS`; the inks are `INK`, one per kind of line. C's picture is `cardPicture(it)`:
// one small renderer (or the game's own, into a 2:1 target) drawing the item's own mesh, made once per item and cached by name.
import * as THREE from 'three';
import { sword } from './bind.js';
import { herb } from './herbs.js';

// ── the inks: a line's kind sets its colour, darkened from the game's screen colours so it reads on paper ──
export const INK = {
  better: '#2f6a2a', worse: '#8a2412', same: '#5a4128',
  fire: '#b4441a', frost: '#2e6a9a', shock: '#8a7a10',
  iron: '#4a5058', met: '#2f6a2a', unmet: '#8a2412',
  restoreHealth: '#2f7a2a', fortifyMelee: '#a8441a', resistCold: '#2e5c8a', swiftness: '#4a6a3a',
  unknown: '#8a7050', where: '#5a4128',
};

// ── the two things, from the game's tables ──
// makeItem(3, Sword, fire): TIER_BASE_ATK[3]=13 × [.75,.90] → 10–12; weight 3 (Medium, 21 stamina a swing); Blade 15 to wield;
// of Flames adds a quarter of the blow as fire (WEAPON_ENCHANTS.fire); worn: Bronze Sword, 10 × [.75,.90] → 8–9
export const SWORD = {
  name: 'Iron Sword of Flames', glyph: '⚔️', kind: 'Sword', material: 'Iron', tier: 3, hands: 'one hand', wType: 'slash',
  atk: [10, 12], worn: { name: 'Bronze Sword', glyph: '⚔️', atk: [8, 9] }, fire: [2, 3], weight: 3, stam: 21, req: ['Blade', 15, 24], worth: 156,
  length: .93,
};
// HERB_DEF.firemoss and HERB_FX.firemoss (restoreHealth, fortifyMelee, resistCold, swiftness); eaten 3 of 15, the third learnt brewing
export const MOSS = {
  name: 'Firemoss', glyph: '🌿', key: 'firemoss', isle: 'the Gatelands', rarity: 'Uncommon', qty: 4, weight: .1, worth: 8, eaten: 3, tell: 15,
  desc: 'A smouldering orange moss. Burns faintly to the touch.', where: 'On rock; moor and the wastes.',
  fx: [
    { k: 'restoreHealth', label: 'Restore Health', known: true, how: 'eaten whole: +15 health' },
    { k: 'fortifyMelee', label: 'Fortify Melee', known: false, how: 'eaten 3 of 15 times' },
    { k: 'resistCold', label: 'Resist Cold', known: true, how: 'learnt at the mortar' },
    { k: 'swiftness', label: 'Swiftness', known: false, how: 'study to discover' },
  ],
};

// ── A: the game's tooltip, its markup as showBagTooltip writes it (index.html's #bag-tooltip rules in A_CSS) ──
export const A_CSS = `
#bag-tooltip{position:fixed;z-index:200;background:rgba(8,6,3,.97);border:1px solid rgba(200,168,74,.3);border-radius:6px;padding:8px 10px;font-size:10px;max-width:200px;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.6);font-family:Georgia,serif;line-height:1.3}
#bag-tooltip .bt-name{color:#c8b880;font-size:11px;font-weight:600;margin-bottom:4px}
#bag-tooltip .bt-row{display:flex;justify-content:space-between;gap:12px;margin-bottom:2px;font-size:10px}
#bag-tooltip .bt-label{color:#5a4828}
#bag-tooltip .bt-val{color:#c8b880}
#bag-tooltip .bt-delta{font-size:10px;font-weight:600}
#bag-tooltip .bt-delta.better{color:#44cc66}
#bag-tooltip .bt-sep{border-top:1px solid rgba(255,255,255,.06);margin:4px 0}
#bag-tooltip .bt-cur{color:#4a3820;font-size:9px;margin-top:3px}
#bag-tooltip .bt-hint{color:#3a2c14;font-size:9px;margin-top:4px;font-style:italic}`;
export function tooltipA(kind) {
  if (kind === 'item') { const S = SWORD;
    return `<div class="bt-name">${S.glyph} ${S.name}</div>
      <div class="bt-row" style="color:#A8B0B8;font-size:9px">Tier ${S.tier} · ${S.material}</div>
      <div class="bt-row" style="color:#ff4400;font-size:9px">✦ of Flames</div><div class="bt-sep"></div>
      <div class="bt-row"><span class="bt-label">ATK</span><span class="bt-val">${S.atk[0]}–${S.atk[1]} <span class="bt-delta better">(+2)</span></span></div>
      <div class="bt-row"><span class="bt-label">Type</span><span class="bt-val">Slash</span></div>
      <div class="bt-row" style="color:#6a5838;font-size:9px;font-style:italic;margin-top:-1px">Resisted by bone &amp; stone</div>
      <div class="bt-row"><span class="bt-label">Weight</span><span class="bt-val">Medium · ${S.stam} stamina/swing</span></div>
      <div class="bt-row" style="color:#66aa44;font-size:9px">Requires ${S.req[0]} ${S.req[1]}</div>
      <div class="bt-cur">Equipped: ${S.worn.glyph} ${S.worn.name}</div><div class="bt-hint">Click to equip</div>`; }
  const M = MOSS;
  return `<div class="bt-name">${M.glyph} ${M.name}</div><div class="bt-row"><span class="bt-label">Qty</span><span class="bt-val">${M.qty}</span></div>
    <div class="bt-row" style="color:#5a8a3a">Restores +15 HP</div><div class="bt-sep"></div>
    <div class="bt-row" style="color:#4a3820;font-size:9px">✦ Hidden effect — consume ${M.tell - M.eaten} more to reveal</div>
    <div class="bt-row" style="color:#3a2c14;font-size:9px;font-style:italic">${M.desc}</div><div class="bt-hint">Click to use · Sells to apothecaries</div>`;
}

// ── B and C: the card on the approved kit's paper (kit.css's tokens and #deckle-s) ──
export const C_CSS = `
.icard{position:absolute;z-index:8;width:340px;color:var(--ink);padding:16px 20px 14px;isolation:isolate;pointer-events:none}
.icard.c{width:372px;padding-top:12px}
.icard::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:4px;background:radial-gradient(ellipse at 50% 30%,rgba(255,250,230,.4),transparent 60%),linear-gradient(170deg,var(--paper-hi),var(--paper) 55%,var(--paper-lo));
  filter:url(#deckle-s) drop-shadow(0 10px 16px rgba(0,0,0,.6))}
.icard::after{content:"";position:absolute;inset:6px;border:1px solid rgba(90,65,40,.32);border-radius:2px;pointer-events:none}
.icard .nm{font:25px/1.05 var(--fell);color:var(--rubric)}
.icard .kd{font:13px var(--display);letter-spacing:.07em;color:var(--ink-soft);margin-top:4px}
.icard .gr{height:2px;margin:9px 0 8px;background:linear-gradient(90deg,var(--gilt),rgba(154,112,32,.12));border-radius:1px}
.icard .st{display:grid;grid-template-columns:auto 1fr;gap:3px 14px;font:16px/1.25 var(--body)}
.icard .st b{font:13px/1.6 var(--display);letter-spacing:.06em;color:var(--ink-soft);font-weight:normal}
.icard .st .d{font-size:14px}
.icard .fx{margin-top:9px;font:16px/1.3 var(--body)}
.icard .fx .l{display:flex;gap:8px;align-items:baseline;margin-top:3px}
.icard .fx .l svg.ico{width:15px;height:15px;flex:none;align-self:center}
.icard .fx .n{font:13px var(--display);color:var(--ink-faint);width:20px;flex:none}
.icard .fx .h{font:italic 14px var(--fell);color:var(--ink-faint);margin-left:auto;text-align:right;white-space:nowrap}
.icard .fx .unk{font:italic 16px var(--fell);color:${INK.unknown}}
.icard .lore{font:italic 14.5px/1.3 var(--fell);color:var(--ink-soft);margin-top:9px}
.icard .ft{display:flex;justify-content:space-between;margin-top:10px;padding-top:6px;border-top:1px solid rgba(90,65,40,.3);font:14px var(--body);color:var(--ink-soft)}
.icard .pic{position:relative;height:150px;margin:0 0 12px;overflow:hidden}
.icard .pic img{width:100%;height:100%;display:block}
.icard .pic.win{border-radius:70px 70px 4px 4px / 46px 46px 4px 4px;background:radial-gradient(ellipse 70% 60% at 50% 42%,#4a3826,#1c140c 72%,#0c0805);
  box-shadow:0 0 0 2px var(--bronze-lo),0 0 0 4px var(--bronze),0 0 0 5px #0a0806,0 3px 10px rgba(0,0,0,.5),inset 0 0 26px rgba(0,0,0,.75)}
.icard .pic.plate{background:radial-gradient(ellipse at 50% 45%,#f2e6c4,#e6d3a4 80%);border:1px solid rgba(90,65,40,.45);box-shadow:inset 0 0 0 3px rgba(224,201,148,0),inset 0 0 0 4px rgba(90,65,40,.22)}
.icard .pic .pcap{position:absolute;left:0;right:0;bottom:5px;text-align:center;font:italic 12.5px var(--fell)}
.icard .pic.win .pcap{color:#d8c290;text-shadow:0 1px 2px #000}.icard .pic.plate .pcap{color:var(--ink-soft)}
.icard .pic .bar{position:absolute;left:14px;bottom:9px;height:4px;border:1px solid var(--ink-soft);border-top:none}
.icard .pic .bar i{position:absolute;left:0;top:-15px;font:italic 11px var(--fell);color:var(--ink-soft);white-space:nowrap}`;
const fxIco = { fire: 'i-fire', restoreHealth: 'i-heart', fortifyMelee: 'i-sword', resistCold: 'i-water', swiftness: 'i-wind' };
export function cardBC(kind, level, pic = '') {
  const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`;
  if (kind === 'item') { const S = SWORD, d0 = S.atk[0] - S.worn.atk[0], d1 = S.atk[1] - S.worn.atk[1];
    return `<div class="icard ${level}">${pic}<div class="nm">${S.name}</div><div class="kd">${S.kind} · <span style="color:${INK.iron}">${S.material}, tier ${S.tier}</span> · ${S.hands} · ${S.wType}</div><div class="gr"></div>
      <div class="st num"><b>Attack</b><span>${S.atk[0]}–${S.atk[1]} <span class="d" style="color:${INK.better}">+${d0} to +${d1} on your ${S.worn.name}</span></span>
        <b>Weight</b><span>${S.weight.toFixed(1)}, medium · ${S.stam} stamina a swing</span>
        <b>Needs</b><span style="color:${INK.met}">${S.req[0]} ${S.req[1]} <span class="d" style="color:${INK.same}">· you have ${S.req[2]}</span></span></div>
      <div class="fx"><div class="l" style="color:${INK.fire}">${ico(fxIco.fire)}<span><i>of Flames</i>: a quarter of each blow again as fire, ${S.fire[0]}–${S.fire[1]}</span></div>
        <div class="l" style="color:${INK.same}">${ico('i-sword')}<span>Slash: resisted by bone and stone</span></div></div>
      <div class="ft num"><span>Click to wear</span><span>${ico('i-coin')} ${S.worth}</span></div></div>`; }
  const M = MOSS, R = ['I', 'II', 'III', 'IV'];
  return `<div class="icard ${level}">${pic}<div class="nm">${M.name} <span style="font:16px var(--body);color:var(--ink-soft)">×${M.qty}</span></div><div class="kd">Herb · ${M.isle} · ${M.rarity}</div><div class="gr"></div>
    <div class="st"><b>Where</b><span style="color:${INK.where}">${M.where}</span></div>
    <div class="fx">${M.fx.map((f, i) => f.known
      ? `<div class="l" style="color:${INK[f.k]}"><span class="n">${R[i]}</span>${ico(fxIco[f.k])}<span>${f.label}</span><span class="h">${f.how}</span></div>`
      : `<div class="l"><span class="n">${R[i]}</span><span class="unk">unknown</span><span class="h">${f.how}</span></div>`).join('')}</div>
    <div class="lore">${M.desc}</div><div class="ft num"><span>Click to eat · sells to apothecaries</span><span>${ico('i-coin')} ${M.worth}</span></div></div>`;
}

// ── C's pictures: drawn once per thing into a 2:1 canvas ──
// the canvas is opaque (software GL gave back black for a cleared alpha, and a blend mode inside the card read black too): the window's
// picture is cleared black and the plate's white, and `keyed` turns that ground into alpha (colour-to-alpha), so either lies on its card
function stage(W, H, clear) {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(clear, 1);
  return R;
}
function keyed(R, ground) {
  const src = R.domElement, c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    if (ground === 'white') { const a = Math.max(1 - r, 1 - g, 1 - b); if (a < 1e-3) { d[i + 3] = 0; continue; } d[i] = 255 * (r - (1 - a)) / a; d[i + 1] = 255 * (g - (1 - a)) / a; d[i + 2] = 255 * (b - (1 - a)) / a; d[i + 3] = 255 * a; }
    else { const a = Math.max(r, g, b); if (a < 1e-3) { d[i + 3] = 0; continue; } d[i] = 255 * r / a; d[i + 1] = 255 * g / a; d[i + 2] = 255 * b / a; d[i + 3] = 255 * a; } }
  x.putImageData(im, 0, 0); return c.toDataURL('image/png');
}
// the sword, lit as the portrait's window lights the body: a warm key, a cold rim, the rune's own fire along the edge
export function swordPicture(W = 744, H = 300) {
  const R = stage(W, H, 0x000000), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, W / H, .05, 20);
  scene.add(new THREE.HemisphereLight(0xf4ead8, 0x3a2a18, .7));
  const key = new THREE.DirectionalLight(0xffe2b8, 3.0); key.position.set(-1.5, 2.4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c4ff, 2.2); rim.position.set(2, 1.5, -2.5); scene.add(rim);
  const g = sword({ grip: [.3, .18, .1] }); let tris = g.userData.tris;
  // of Flames: the blade's steel warmed toward its edge, a run of embers along it and their light
  g.traverse(o => { if (o.isMesh && o.material.metalness === .55) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(.5, .14, .03); o.material.emissiveIntensity = .55; } });
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 26; k++) { const y = .12 + r() * .66, side = r() < .5 ? -1 : 1, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(1, .45 + r() * .3, .12), transparent: true, opacity: .5 + r() * .4, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.position.set(side * (.012 + r() * .02), y, (r() - .5) * .01); sp.scale.setScalar(.012 + r() * .03); g.add(sp); }
  const fl = new THREE.PointLight(0xff7a30, .6, .8, 1.5); fl.position.set(0, .4, .08); g.add(fl);
  g.rotation.set(0, .25, -Math.PI / 2 + .24); g.position.set(-.46, -.1, 0); scene.add(g);
  cam.position.set(0, 0, 1.12); cam.lookAt(0, 0, 0);
  R.render(scene, cam); const url = keyed(R, 'black'); R.dispose(); return { url, tris };
}
// the herb as a plate: the plant kit's own mesh in a flat even light on paper (the canvas transparent, the paper under it), from a
// little above, with a 10 cm bar under it
export function herbPicture(key = 'firemoss', W = 744, H = 300) {
  const R = stage(W, H, 0xffffff), scene = new THREE.Scene(), h = herb(key, 'true');
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a7050, 1.6)); const key2 = new THREE.DirectionalLight(0xfff0d8, 1.6); key2.position.set(-1, 2, 1.5); scene.add(key2);
  scene.add(h.group); const bb = new THREE.Box3().setFromObject(h.group), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
  const span = Math.max(sz.x, sz.z) * .9, cam = new THREE.OrthographicCamera(-span, span, span / 2, -span / 2, .01, 10);
  cam.position.set(c.x, c.y + span * .9, c.z + span * 1.1); cam.lookAt(c.x, c.y, c.z); cam.updateMatrixWorld(true);
  R.render(scene, cam); const url = keyed(R, 'white'); R.dispose();
  // the bar's length in the picture: 5 cm against the plate's 2·span metres across W pixels (the view is square-on in x)
  return { url, tris: h.tris, size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)], barPx: .1 / (2 * span) * W };
}
export function pictureHTML(kind, P) {
  if (kind === 'item') return `<div class="pic win"><img src="${P.url}"><div class="pcap">${SWORD.name}, ${SWORD.length.toFixed(2)} m</div></div>`;
  return `<div class="pic plate"><img src="${P.url}"><div class="bar" style="width:${(P.barPx * 332 / 744).toFixed(1)}px"><i>10 cm</i></div><div class="pcap">${MOSS.name}, from the life</div></div>`;
}
