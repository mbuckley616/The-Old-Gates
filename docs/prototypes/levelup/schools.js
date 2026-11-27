// The schools on cards (concept artist, 27 Nov 2026; backlog L11, "The schools on cards"; OG-128): the Magic page, where you compose
// a spell from a word, a form and a second word (magic B, built: WORDS, FORMS, RIDERS in 64-spells.js; renderHubMagic in 66-hub.js),
// three ways:
//   a  as built: renderHubMagic's dark page, its markup and CSS (index.html's .mp-* rules) copied, at the game's own sizes
//   b  the school's card in coloured ink: the approved parchment (the Magic page of docs/prototypes/ui §4), each school in its own ink
//      under its emblem (OG-094's six: a flame, a crescent moon, a mountain, an eye, a sun, a spiral), the school's card at the head
//      of the spell with the guild's line and, at Mastery, the makers' line; each word's sense under its name from Impression; the
//      five forms drawn as signs with the guild's line for the one chosen; the join said as what it does when laid (the bridge)
//   c  OG-128 as drawn: b with the spell shown working, a picture made once in the new look: Tonn and Sioc laid, the wave frozen as
//      a bridge 6.2 × 1.6 m with a 1.79 m figure on it; and Caor at its three tiers, guttering at Impression, the bolt, Living Ember
// The words on the cards are the quest writer's draft *The Schools on Cards* (docs/quest_drafts.md, 20 Nov 2026, unapproved); the
// numbers are the game's own (wordCost, WORD_CELL_SAY, TIER_MAG, IMPRESSION_WILD_CHANCE) for a level-9 Evoker of the guild.
// For the builder: `schoolCard(sc)` and `formSign(f)` are the two pieces new to renderHubMagic; the inks are `SINK`, one per school;
// the senses `SENSE` and the lines `GUILD`, `MAKERS`, `FORM_SAY` are the draft's tables as the page reads them. C's picture is
// `spellPicture(kind)`: one small renderer drawing the laid thing once into a 2:1 canvas, cached by the book line.
import * as THREE from 'three';

// ── the six schools: the game's screen colour (SCHOOL_DEF.col) and the ink it takes on paper ──
export const SCH = {
  tine:  { name: 'Tine',  en: 'Fire',   col: '#ff7733', ink: '#b4441a', skill: 55 },
  uisce: { name: 'Uisce', en: 'Water',  col: '#66bbee', ink: '#2a6894', skill: 40 },
  gaoth: { name: 'Gaoth', en: 'Wind',   col: '#ccddee', ink: '#4e6a84', skill: 30 },
  cloch: { name: 'Cloch', en: 'Stone',  col: '#aa8855', ink: '#7a5628', skill: 12 },
  scath: { name: 'Scáth', en: 'Shadow', col: '#9966cc', ink: '#5e3a86', skill: 8 },
  solas: { name: 'Solas', en: 'Light',  col: '#ffdd88', ink: '#94700c', skill: 26 },
};
export const SINK = Object.fromEntries(Object.entries(SCH).map(([k, v]) => [k, v.ink]));
// the draft's §1
export const GUILD = {
  tine: 'The school of fire: heat, ignition and the burn. First in the academy’s syllabus, and first in its register of accidents.',
  uisce: 'The school of water and its cold: the tide, the frost and the breath held under.',
  cloch: 'The school of stone: the spike, the ward and the root. The slowest school to learn and the hardest to forget.',
  scath: 'The school of shadow: concealment, the blinded eye and the step. Filed by the academy under defence, at its own insistence.',
  solas: 'The school of light: the lamp, the bolt, the cure, and the eye for the old stones.',
  gaoth: 'The school of wind: the gust, the leap and the lifted foot. The youngest of the six in the academy’s books.',
};
export const MAKERS = {
  tine: 'Fire is a thing changing into what it will be. The makers asked it only to change slowly.',
  uisce: 'What the sea lends, it takes back twice a day.', cloch: 'Stone is what stays. The makers built with nothing else.',
  scath: 'A shadow is a shelter first. You stand in it, and it keeps you.',
  solas: 'Light is how the makers saw what they were doing. Most of what it showed them, they did not write down.',
  gaoth: 'Wind is the breath a word is said on. Every school is carried on this one.',
};
// the draft's §3
export const FORM_SAY = {
  sent: 'The word sent out from the hand, to strike what it meets. The first form, and the one every Novice is given.',
  worn: 'The word held on the body, for a time, by the one who said it.',
  touched: 'The word laid on a thing within arm’s reach: a lock, a fire, a pool, a foe. Cheaper and fiercer than Sent, and the caster stands close for it.',
  laid: 'The word set on the ground where you look, to stand there a while. One at a time: a second unmakes the first.',
  held: 'The word kept going while the hand stays open. It costs while it runs, and you walk at half the pace.',
};
// the game's FORMS (64-spells.js): rank, reach, mana
export const FORMS = {
  sent: { name: 'Sent', rank: 0, reach: 30, mana: 1 }, worn: { name: 'Worn', rank: 0, reach: 0, mana: 1 },
  touched: { name: 'Touched', rank: 1, reach: 1.6, mana: .6 }, laid: { name: 'Laid', rank: 2, reach: 12, mana: 1.5 },
  held: { name: 'Held', rank: 3, reach: 4, mana: .5, perSec: true },
};
export const FORM_ORDER = ['sent', 'worn', 'touched', 'laid', 'held'];
export const RANKS = ['Novice', 'Adept', 'Evoker', 'Warlock'];
export const TIERS = ['Impression', 'Comprehension', 'Mastery'];
// the words this hand holds (WORDS' entries, trimmed to what the page reads), at their tiers; the draft's §2 senses and makers' lines
export const WORDS = [
  { id: 'caor', school: 'tine', ir: 'Caor', en: 'Fireball', ma: 'Living Ember', cost: 30, tier: 3, sense: 'a spark, a small burning thing',
    makers: 'Not a fire. The thing that starts one, and goes looking for what will take.',
    forms: { sent: 'a bolt, 20', touched: 'lights a brazier, burns a web; 30', held: 'flame' } },
  { id: 'sioc', school: 'uisce', ir: 'Sioc', en: 'Frost Bolt', ma: 'Still-Winter’s Touch', cost: 20, tier: 2, sense: 'frost, the stillness before freezing',
    forms: { sent: 'a bolt, 12, slows 30% 3 s', touched: 'freezes a pool, a lock’s works', laid: 'a floe 3 m across on water, 30 s', held: 'frost' } },
  { id: 'tonn', school: 'uisce', ir: 'Tonn', en: 'Force Wave', ma: 'The Shore’s Answer', cost: 32, tier: 2, sense: 'a wave',
    forms: { sent: 'a wave 8 m down the line, 14, posture 20', laid: 'a wave 6.2 m long from the point, 2 s' } },
  { id: 'sideen', school: 'gaoth', ir: 'Séideán', en: 'Wind Shear', ma: 'Breath-Between-Words', cost: 22, tier: 2, sense: 'a gust of breath',
    forms: { sent: 'a bolt, 14, knock 1.5 m', laid: 'an updraft 1.5 m wide, 15 s', held: 'a gale' } },
  { id: 'cleite', school: 'gaoth', ir: 'Cleite', en: 'Feather', ma: 'Weightless Step', cost: 16, tier: 1, sense: 'a feather', forms: { worn: 'feather fall, 90 s' } },
  { id: 'cloch_ghear', school: 'cloch', ir: 'Cloch Ghéar', en: 'Stone Spike', ma: 'Earth’s-Teeth', cost: 28, tier: 1, sense: 'a sharp stone',
    forms: { sent: 'a spike, 22', laid: 'a pillar 1.2 m high, 20 s' } },
  { id: 'smol', school: 'scath', ir: 'Smól', en: 'Shade Bolt', ma: 'The Quiet-Sent-Out', cost: 26, tier: 1, sense: 'the last of an ember', forms: { sent: 'a bolt, 16, alerts no one' } },
  { id: 'lampa', school: 'solas', ir: 'Lampa', en: 'Light', ma: 'Lantern of the Mind', cost: 12, tier: 2, sense: 'a lamp', forms: { worn: 'a light, 240 s' } },
  { id: 'leigheas', school: 'solas', ir: 'Leigheas', en: 'Healing Light', ma: 'Hand-of-the-Stream', cost: 40, tier: 1, sense: 'a cure', forms: { worn: 'heals 35', touched: 'heals another' } },
];
export const WBY = Object.fromEntries(WORDS.map(w => [w.id, w]));
// the riders (RIDERS): the verb on a hit, and what the laid join does (the bridge is the one OG-128 draws)
export const RIDERS = { caor: 'burns', sioc: 'slows', sideen: 'pushes', freamh: 'holds', solas_gheal: 'lights', leigheas: 'mends' };
export const LAID_JOIN = { sioc: 'freezes where it stands: a bridge 6.2 × 1.6 m that bears you, 20 s', sideen: 'throws what stands on it', caor: 'stays hot, 3 a second' };
export const HAND = { level: 9, rank: 2, mana: 150, int: 18 };
// wordCost (64-spells.js), no perks or buffs: (word + rider) at their tiers, ×1.25 joined, × the form, × the school (1.4 − 0.8 s)
export function cost(id, form, rider) { const w = WBY[id], tm = [1, 1, .7]; let m = w.cost * tm[w.tier - 1];
  if (rider) m = (m + WBY[rider].cost * tm[WBY[rider].tier - 1]) * 1.25; m *= FORMS[form].mana * (1.4 - .8 * SCH[w.school].skill / 100); return Math.round(m + 1e-9); }
export const TIER_MAG = [.6, 1, 1.3];
export const WILD = .3;

// ── the emblems (OG-094's, implEmblem's six) and the forms' signs, as 24-unit line drawings in the kit's icon stroke ──
const spiral = (() => { let d = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 5.2, r = .6 + i / 60 * 9; d += (i ? 'L' : 'M') + (12 + Math.cos(a) * r).toFixed(2) + ' ' + (12 + Math.sin(a) * r).toFixed(2); } return d; })();
const sunRays = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return `M${(12 + c * 6.6).toFixed(2)} ${(12 + s * 6.6).toFixed(2)}L${(12 + c * 10).toFixed(2)} ${(12 + s * 10).toFixed(2)}`; }).join('');
export const EMBLEM = {
  tine: '<path d="M12 2.5c.6 3.6 5.5 6 5.5 11.3a5.5 5.5 0 0 1-11 0c0-2.8 1.6-4.2 2.4-6 .7 1.3 1.6 2.3 2.3 2.8-.4-3 .1-5.6.8-8.1z"/><path d="M12 20c-1.6 0-2.6-1.2-2.6-2.6 0-1.6 1.5-2.6 2.4-4 .9 1.4 2.8 2.4 2.8 4 0 1.4-1 2.6-2.6 2.6z"/>',
  uisce: '<path d="M15.5 3.2a9 9 0 1 0 5.6 13.6A7.4 7.4 0 0 1 15.5 3.2z"/>',
  cloch: '<path d="M1.8 20.5 9 7.2l3.4 5.6 2.6-3.4 7.2 11.1z"/><path d="M7.3 10.4 9 11.8l1.6-1.4M13.6 11.2l1.4 1 1.3-1"/>',
  scath: '<path d="M1.8 12s3.8-6.6 10.2-6.6S22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12z"/><circle cx="12" cy="12" r="3.3"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  solas: `<circle cx="12" cy="12" r="4.4"/><path d="${sunRays}"/>`,
  gaoth: `<path d="${spiral}"/>`,
};
export const FORM_SIGN = {
  sent: '<circle cx="4.5" cy="12" r="2.2"/><path d="M8 12h12.5M16.5 8l4 4-4 4"/>',
  worn: '<circle cx="12" cy="7" r="2.2"/><path d="M12 9.5v6M9 12.5h6M12 15.5l-2.4 4.5M12 15.5l2.4 4.5"/><circle cx="12" cy="12.5" r="9.6" stroke-dasharray="2.2 2.2"/>',
  touched: '<path d="M2.5 15.5h6.5c1.4 0 2.4-1 2.4-2.3V9.7M5 15.5V11"/><circle cx="17" cy="12" r="3.3"/><path d="M12.6 7.6l1.3 1.3M12.6 16.4l1.3-1.3M11.8 12h1.3"/>',
  laid: '<ellipse cx="12" cy="18.2" rx="9.4" ry="2.9"/><path d="M12 3.5v10M8.6 10.2l3.4 3.4 3.4-3.4"/>',
  held: '<circle cx="3.6" cy="12" r="2"/><path d="M6.5 9.6c2.7-2.6 4.8 2.6 7.5 0s4.8 2.6 7.5 0M6.5 14.4c2.7-2.6 4.8 2.6 7.5 0s4.8 2.6 7.5 0"/>',
};
export const svg = (d, cls = 'em') => `<svg class="${cls}" viewBox="0 0 24 24">${d}</svg>`;

// ── A: renderHubMagic's page as built (index.html's #spell-grid.mp-page rules, the hub's dark ground) ──
export const A_CSS = `
#hubA{position:absolute;left:40px;top:58px;width:1200px;height:600px;background:linear-gradient(#17120c,#0e0b07);border:1px solid rgba(138,106,58,.5);border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.7);padding:12px 20px;box-sizing:border-box;font-family:Georgia,serif;color:#d8ccb0}
#hubA .htabs{display:flex;gap:4px;border-bottom:1px solid rgba(138,106,58,.4);margin-bottom:8px}#hubA .htabs span{padding:5px 14px;font:13px Georgia,serif;color:#8a7a60}#hubA .htabs span.on{color:#e8dcc0;border-bottom:2px solid #c84030}
#spell-active-bar{font-size:12px;color:#b8a888;margin:2px 0 8px}
#spell-grid.mp-page{display:grid;grid-template-columns:230px 1fr 270px;gap:20px;overflow:hidden;font-family:Georgia,serif;color:#d8ccb0;height:520px}
.mp-page>div{overflow-y:auto;min-height:0}
.mp-mid{border-left:1px solid rgba(138,106,58,.3);border-right:1px solid rgba(138,106,58,.3);padding:0 18px}
.mp-h{font:600 11px Georgia,serif;letter-spacing:.14em;text-transform:uppercase;color:#a89878;margin:10px 0 6px}
.mp-meta{font:italic 11px Georgia,serif;color:#8a7a60;letter-spacing:0;text-transform:none;margin-left:6px}
.mp-school{font:600 11px Georgia,serif;letter-spacing:.1em;margin:8px 0 2px;display:flex}.mp-school span{margin-left:auto;color:#8a7a60}
.mp-word{display:grid;grid-template-columns:1fr auto 26px;gap:6px;align-items:baseline;padding:3px 6px;font-size:13px;border-bottom:1px solid rgba(138,106,58,.15);cursor:pointer}
.mp-word .nm{color:#e8dcc0}.mp-word .gl{font:italic 11px Georgia,serif;color:#8a7a60;margin-left:6px}
.mp-word .c{text-align:right;color:#a89878;font-size:11px}
.mp-word.sel{box-shadow:inset 3px 0 #c84030;background:rgba(200,64,48,.1)}.mp-word.sel .nm{color:#f0a080}
.mp-word.two{box-shadow:inset 3px 0 #c8a040;background:rgba(200,160,64,.1)}
.mp-word.unk{cursor:default;color:#7a6a50;font:italic 11px Georgia,serif;grid-template-columns:1fr}
.mp-tier{display:inline-flex;gap:3px}.mp-tier i{width:7px;height:7px;border:1px solid #a89878;transform:rotate(45deg)}
.mp-tier i.f{background:#a89878}.mp-tier i.m{background:#c8a040;border-color:#c8a040}
.mp-title{font:26px Georgia,serif;color:#f0e2c0;margin-top:2px}.mp-say{font-size:14px;line-height:1.4;margin:4px 0 4px;color:#d8ccb0}
.mp-forms{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.mp-form{border:1px solid rgba(168,152,120,.5);border-radius:3px;padding:6px 7px;background:rgba(20,16,10,.4);min-height:92px;display:flex;flex-direction:column;gap:3px}
.mp-form .fh{font:600 12px Georgia,serif;color:#e8dcc0}.mp-form .fd{font-size:11px;line-height:1.3;color:#b8a888;flex:1}.mp-form .fc{font-size:12px;text-align:right;color:#e8dcc0}
.mp-form.on{border-color:#c84030;background:rgba(200,64,48,.12)}.mp-form.on .fh{color:#f0a080}
.mp-form.no{border-style:dashed;opacity:.55}.mp-form.no .fd,.mp-form.lock .fd{font-style:italic;color:#8a7a60}
.mp-form.lock{border-style:dotted;opacity:.6}
.mp-chips{display:flex;flex-wrap:wrap;gap:6px}
.mp-chip{border:1px solid rgba(168,152,120,.6);border-radius:12px;padding:1px 10px 2px;font-size:12px;color:#b8a888}
.mp-chip b{font-weight:600;color:#e8dcc0}.mp-chip.on{border-color:#c8a040;background:rgba(200,160,64,.2)}.mp-chip.off{opacity:.5;border-style:dashed}
.mp-dv{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px solid rgba(138,106,58,.18);margin-top:4px}
.mp-btns{display:flex;gap:10px;align-items:center;margin-top:12px}
.mp-btn{border:1px solid rgba(168,152,120,.6);border-radius:3px;padding:5px 12px;font-size:13px;color:#e8dcc0;background:rgba(20,16,10,.5)}
.mp-btn.hot{border-color:#c84030;background:rgba(200,64,48,.22)}
.mp-bk{display:grid;grid-template-columns:22px 1fr 30px 16px;gap:6px;align-items:center;padding:5px 4px;border-bottom:1px solid rgba(138,106,58,.18);font-size:13px}
.mp-bk .k{width:20px;height:20px;display:grid;place-items:center;border:1px solid #a89878;border-radius:3px;font-size:11px;color:#a89878}
.mp-bk .t{color:#e8dcc0}.mp-bk .s{display:block;font:italic 11px Georgia,serif;color:#8a7a60}.mp-bk .c{text-align:right;color:#a89878}
.mp-bk .x{color:#8a6a50;font-size:11px;text-align:center}
.mp-bk.on{box-shadow:inset 3px 0 #c84030;background:rgba(200,64,48,.1)}.mp-bk.on .k{border-color:#c84030;color:#f0a080}
.mp-bk.empty .t{font-style:italic;color:#7a6a50}`;
// the book this hand has written (spellBook), the readied line first
export const BOOK = [{ word: 'caor', form: 'sent' }, { word: 'tonn', form: 'laid', rider: 'sioc' }, { word: 'sioc', form: 'sent' }, { word: 'lampa', form: 'worn' },
  { word: 'sideen', form: 'laid' }, { word: 'caor', form: 'touched' }];
const ICO = { caor: '🔥', sioc: '❄️', tonn: '〰️', sideen: '🌬️', cleite: '🪶', cloch_ghear: '🪨', smol: '🌑', lampa: '💡', leigheas: '💚' };
const lineName = b => `${WBY[b.word].ir}${b.rider ? ' and ' + WBY[b.rider].ir : ''}, ${FORMS[b.form].name.toLowerCase()}`;
const lineGloss = b => { const w = WBY[b.word], r = b.rider && WBY[b.rider], t = Math.min(w.tier, r ? r.tier : 3), nm = x => t >= 3 ? x.ma : x.en; return t < 2 ? '' : `${nm(w)}${r ? ' and ' + nm(r) : ''}`; };
export function pageA(sel) {
  const { id, form: f, rider } = sel, w = WBY[id], tw = w.tier;
  const pips = t => `<span class="mp-tier">${[1, 2, 3].map(k => `<i class="${k <= t ? (t >= 3 ? 'm' : 'f') : ''}"></i>`).join('')}</span>`;
  let lex = `<div class="mp-h">Words · ${WORDS.length} of 24</div>`;
  for (const sc of Object.keys(SCH)) { const S = SCH[sc], ws = WORDS.filter(x => x.school === sc);
    lex += `<div class="mp-school" style="color:${S.col}">${S.name.toUpperCase()} <span>${S.skill}</span></div>`;
    if (!ws.length) lex += `<div class="mp-word unk">no word yet</div>`;
    for (const x of ws) lex += `<div class="mp-word${x.id === id ? ' sel' : ''}${x.id === rider ? ' two' : ''}"><span class="nm">${x.ir}${x.tier >= 2 ? `<span class="gl">${x.tier >= 3 ? x.ma : x.en}</span>` : ''}</span>${pips(x.tier)}<span class="c">${x.cost}</span></div>`; }
  let say = w.forms[f] || ''; if (rider) say += `; and it ${RIDERS[rider]}`;
  let mid = `<div class="mp-h">The spell</div><div class="mp-title">${lineName({ word: id, form: f, rider })}</div>` + (tw < 2 ? `<div class="mp-meta">the English comes when ${w.ir} does</div>` : '') + `<div class="mp-say">${say.charAt(0).toUpperCase() + say.slice(1)}.</div>`;
  mid += `<div class="mp-h">Form <span class="mp-meta">the guild teaches forms by rank</span></div><div class="mp-forms">`;
  for (const x of FORM_ORDER) { const F = FORMS[x], live = !!w.forms[x], held = F.rank <= HAND.rank, cls = !live ? 'no' : !held ? 'lock' : x === f ? 'on' : '';
    const d = !live ? 'the word won’t take that shape' : !held ? `taught at ${RANKS[F.rank]}` : w.forms[x], c = live && held ? cost(id, x, x === 'worn' ? null : rider) : '';
    mid += `<div class="mp-form ${cls}"><div class="fh">${F.name}</div><div class="fd">${d}</div><div class="fc">${c}${c && F.perSec ? ' a second' : ''}</div></div>`; }
  mid += `</div><div class="mp-h">A second word <span class="mp-meta">adds only its rider · both words at Comprehension</span></div><div class="mp-chips">`;
  for (const r of Object.keys(RIDERS).filter(r => WBY[r] && r !== id)) { const ok = WBY[r].tier >= 2 && tw >= 2 && f !== 'worn'; mid += `<span class="mp-chip${r === rider ? ' on' : ''}${ok ? '' : ' off'}"><b>${WBY[r].ir}</b> ${RIDERS[r]}</span>`; }
  const c = cost(id, f, rider);
  mid += `</div><div class="mp-dv"><span>Mana</span><span>${c}</span></div>` + (FORMS[f].reach ? `<div class="mp-dv"><span>Reach</span><span>${FORMS[f].reach} m</span></div>` : '');
  mid += `<div class="mp-btns"><span class="mp-btn hot">Write it into the book · ${BOOK.length}/8</span><span class="mp-btn">Clear</span><span class="mp-meta">Enter writes it · 1–8 readies a line</span></div>`;
  let bk = `<div class="mp-h">The book · keys 1–8</div>`;
  for (let i = 0; i < 8; i++) { const b = BOOK[i]; if (!b) { bk += `<div class="mp-bk empty"><span class="k">${i + 1}</span><span class="t">empty</span><span></span><span></span></div>`; continue; }
    const g = lineGloss(b); bk += `<div class="mp-bk${i === 0 ? ' on' : ''}"><span class="k">${i + 1}</span><span class="t">${ICO[b.word]} ${lineName(b)}${g ? `<span class="s">${g}</span>` : ''}</span><span class="c">${cost(b.word, b.form, b.rider)}</span><span class="x">✕</span></div>`; }
  bk += `<div class="mp-meta" style="margin-top:12px">F casts the readied line. A made spell costs nothing to unmake; the words stay yours.</div>`;
  return `<div id="hubA"><div class="htabs"><span>Inventory</span><span class="on">Magic</span><span>Attributes</span><span>Quests</span><span>Character</span><span>Map</span></div>
    <div id="spell-active-bar">Readied: <b>${lineName(BOOK[0])}</b> &nbsp;·&nbsp; <b style="color:#c8e88a">F</b> casts it &nbsp;·&nbsp; <b style="color:#c8e88a">1–8</b> readies a line of the book &nbsp;·&nbsp; ${RANKS[HAND.rank]} of the guild</div>
    <div id="spell-grid" class="mp-page"><div class="mp-lex">${lex}</div><div class="mp-mid">${mid}</div><div class="mp-book">${bk}</div></div></div>`;
}

// ── B and C: the parchment page ──
export const B_CSS = `
.sp{display:grid;grid-template-columns:262px 1fr 262px;gap:26px;height:548px}
.sp .col{min-height:0;overflow:hidden}.sp .mid{border-left:1px solid rgba(90,65,40,.3);border-right:1px solid rgba(90,65,40,.3);padding:0 22px}
svg.em{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lx .sch{display:flex;align-items:center;gap:7px;font:13.5px var(--display);letter-spacing:.09em;margin:6px 0 0}.lx .sch svg{font-size:19px}.lx .sch .sk{margin-left:auto;font:14px var(--body);color:var(--ink-faint);letter-spacing:0}
.lx .w{display:grid;grid-template-columns:1fr auto 30px;gap:6px;align-items:center;padding:1px 8px 1px 26px;border-bottom:1px solid rgba(90,65,40,.13)}
.lx .w .n{font:500 16px/1.15 var(--body);color:var(--ink)}.lx .w .s{display:block;font:italic 12.5px var(--fell);color:var(--ink-faint);line-height:1.15}
.lx .w .c{text-align:right;font:14px var(--body);color:var(--ink-soft)}.lx .none{padding:1px 8px 3px 26px;font:italic 13px var(--fell);color:var(--ink-faint)}
.lx .w.sel{background:linear-gradient(90deg,rgba(122,31,16,.13),rgba(122,31,16,.02));box-shadow:inset 3px 0 var(--rubric)}.lx .w.sel .n{color:var(--rubric)}
.lx .w.two{background:linear-gradient(90deg,rgba(156,120,40,.16),rgba(156,120,40,.02));box-shadow:inset 3px 0 var(--gilt)}
.pips{display:inline-flex;gap:4px}.pips i{width:7px;height:7px;border:1px solid var(--ink-soft);transform:rotate(45deg)}.pips i.f{background:var(--ink-soft)}.pips i.m{background:var(--gilt);border-color:var(--gilt)}
.scard{display:grid;grid-template-columns:58px 1fr;gap:3px 14px;padding:8px 12px 8px 10px;margin:0 0 8px;border:1px solid rgba(90,65,40,.3);background:linear-gradient(rgba(255,250,235,.28),rgba(255,250,235,.06));border-radius:2px;position:relative}
.scard .disc{grid-row:1/4;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:34px;border:1.5px solid currentColor;box-shadow:inset 0 0 0 3px rgba(255,250,235,.5),inset 0 0 0 4px currentColor;opacity:.92}
.scard .t{font:21px var(--display);letter-spacing:.1em;line-height:1}.scard .t small{font:15px var(--body);letter-spacing:0;color:var(--ink-soft);margin-left:8px}.scard .t .sk{float:right;font:14px var(--body);color:var(--ink-faint);letter-spacing:0;margin-top:3px}
.scard .g{font:14.5px/1.35 var(--body);color:var(--ink)}.scard .mk{font:italic 14.5px/1.3 var(--fell);color:var(--ink-soft)}.scard .mk.no{color:var(--ink-faint);font-size:12.5px}
.ttl{font:28px var(--display);color:var(--rubric);line-height:1.02}.ttl .ma{display:block;font:italic 17px var(--fell);color:var(--gilt)}
.sense{font:italic 14.5px var(--fell);color:var(--ink-soft);margin:3px 0 0}.does{font:16.5px/1.35 var(--body);color:var(--ink);margin:4px 0 0}.does b{font-weight:500}
.h3{font:12.5px var(--display);letter-spacing:.14em;color:var(--ink-soft);margin:9px 0 4px;display:flex;align-items:baseline;gap:8px}.h3 i{font:italic 12.5px var(--fell);letter-spacing:0;color:var(--ink-faint)}
.fms{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.fm{border:1px solid rgba(90,65,40,.35);padding:6px 6px 5px;text-align:center;min-height:62px;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative}
.fm svg{font-size:26px;color:var(--ink-soft)}.fm .fn{font:13px var(--display);letter-spacing:.08em;color:var(--ink)}.fm .fc{font:13px var(--body);color:var(--ink-soft)}
.fm.on{border-color:var(--rubric);background:rgba(122,31,16,.08);box-shadow:inset 0 0 0 1px var(--rubric)}.fm.on svg,.fm.on .fn{color:var(--rubric)}
.fm.no{opacity:.38;border-style:dashed}.fm.lock{opacity:.55;border-style:dotted}.fm.lock .fc,.fm.no .fc{font:italic 11.5px var(--fell)}
.fsay{font:italic 14px/1.35 var(--fell);color:var(--ink-soft);margin:5px 2px 0;min-height:36px}.fsay b{font:13px var(--display);font-style:normal;letter-spacing:.08em;color:var(--rubric);margin-right:6px}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{border:1px solid rgba(90,65,40,.5);border-radius:13px;padding:1px 11px 2px;font:14.5px var(--body);color:var(--ink-soft);display:inline-flex;align-items:center;gap:5px}
.chip b{font-weight:500;color:var(--ink)}.chip svg{font-size:14px}.chip.on{border-color:var(--gilt);background:rgba(156,120,40,.16);box-shadow:inset 0 0 0 1px var(--gilt)}.chip.off{opacity:.45;border-style:dashed}
.join{font:15px/1.35 var(--body);margin-top:7px;padding-left:10px;border-left:2px solid var(--gilt)}
.dvs{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:1px 14px;margin-top:6px;font:15.5px var(--body)}.dvs b{font:12.5px var(--display);letter-spacing:.1em;color:var(--ink-soft);font-weight:400;padding-top:2px}
.btns{display:flex;gap:10px;align-items:center;margin-top:7px}.btn{border:1px solid var(--rubric);color:var(--rubric);padding:4px 12px;font:13px var(--display);letter-spacing:.1em;background:rgba(122,31,16,.06)}.btn.q{border-color:rgba(90,65,40,.5);color:var(--ink-soft);background:none}
.bk{display:grid;grid-template-columns:24px 1fr 30px;gap:8px;align-items:center;padding:4px 4px;border-bottom:1px solid rgba(90,65,40,.14)}
.bk .k{width:21px;height:21px;display:grid;place-items:center;border:1px solid var(--ink-soft);font:13px var(--body);color:var(--ink-soft)}
.bk .t{font:15.5px var(--body);color:var(--ink);display:flex;gap:6px;align-items:flex-start}.bk .t svg{font-size:16px;margin-top:3px}.bk .t .s{display:block;font:italic 12px var(--fell);color:var(--ink-faint);line-height:1.1}
.bk .c{text-align:right;font:14px var(--body);color:var(--ink-soft)}.bk.on{background:linear-gradient(90deg,rgba(122,31,16,.12),rgba(122,31,16,.02));box-shadow:inset 3px 0 var(--rubric)}.bk.on .k{border-color:var(--rubric);color:var(--rubric)}
.bk.empty .t{font:italic 14px var(--fell);color:var(--ink-faint)}
.seen{position:relative;height:150px;margin:2px 0 8px;border-radius:2px;overflow:hidden;box-shadow:0 0 0 1px rgba(90,65,40,.55),0 0 0 3px rgba(224,201,148,.6),0 0 0 4px rgba(90,65,40,.4),0 2px 8px rgba(0,0,0,.35)}
.seen img{width:100%;height:100%;object-fit:cover;display:block}.seen .pc{position:absolute;left:0;right:0;bottom:0;padding:12px 8px 4px;font:italic 13px var(--fell);color:#efe2c2;text-shadow:0 1px 2px #000;background:linear-gradient(transparent,rgba(0,0,0,.55))}
.tiers{display:grid;gap:5px;margin-top:2px}.tr{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:4px 8px;border:1px solid rgba(90,65,40,.25)}
.tr .pic{width:118px;height:66px;border-radius:2px;overflow:hidden;box-shadow:0 0 0 1px rgba(90,65,40,.55),0 0 0 3px rgba(224,201,148,.5)}.tr .pic img{width:100%;height:100%;object-fit:cover;display:block}
.tr .tn{font:12px var(--display);letter-spacing:.12em;color:var(--ink-soft)}.tr .nm{font:19px/1.15 var(--body);color:var(--ink)}.tr .nm i{font:italic 14px var(--fell);color:var(--ink-soft);margin-left:6px}
.tr .ln{font:13.5px/1.22 var(--body);color:var(--ink-soft)}.tr .ln .fz{color:${'#8a2412'};font-style:italic;font-family:var(--fell)}.tr .cs{font:15px var(--body);color:var(--ink-soft);text-align:right}
.tr.now{border-color:var(--gilt);box-shadow:inset 0 0 0 1px var(--gilt);background:rgba(156,120,40,.07)}
.note{font:italic 13px/1.35 var(--fell);color:var(--ink-faint);margin-top:10px}`;
export const schoolCard = sc => { const S = SCH[sc], best = Math.max(0, ...WORDS.filter(w => w.school === sc).map(w => w.tier));
  return `<div class="scard" style="color:${S.ink}"><div class="disc">${svg(EMBLEM[sc])}</div><div class="t">${S.name.toUpperCase()}<small>${S.en}</small><span class="sk">school ${S.skill}</span></div>
    <div class="g">${best >= 2 ? GUILD[sc] : '<span class="mk no">the guild’s line comes when a word of the school is understood</span>'}</div>
    <div class="mk${best >= 3 ? '' : ' no'}">${best >= 3 ? MAKERS[sc] : 'the makers’ line, at Mastery'}</div></div>`; };
export const formSign = f => svg(FORM_SIGN[f]);
export function pageBC(sel, level, pics = {}) {
  const { id, form: f, rider } = sel, w = WBY[id], S = SCH[w.school];
  const pips = t => `<span class="pips">${[1, 2, 3].map(k => `<i class="${k <= t ? (t >= 3 ? 'm' : 'f') : ''}"></i>`).join('')}</span>`;
  let lex = `<div class="h">Words <span style="font:16px var(--body);color:var(--ink-faint);letter-spacing:0">${WORDS.length} of 24</span></div><div class="rule"></div><div class="lx">`;
  for (const sc of Object.keys(SCH)) { const s = SCH[sc], ws = WORDS.filter(x => x.school === sc);
    lex += `<div class="sch" style="color:${s.ink}">${svg(EMBLEM[sc])}${s.name.toUpperCase()}<span class="sk">${s.skill}</span></div>`;
    for (const x of ws) lex += `<div class="w${x.id === id ? ' sel' : ''}${x.id === rider ? ' two' : ''}"><span><span class="n">${x.ir}</span><span class="s">${x.tier >= 3 ? x.ma : x.sense}</span></span>${pips(x.tier)}<span class="c">${x.cost}</span></div>`; }
  lex += `</div>`;
  // the middle: the school's card, the spell, the forms as signs
  const nm = lineName({ word: id, form: f, rider }), joined = !!rider;
  let mid = schoolCard(w.school);
  mid += `<div class="ttl">${nm}${w.tier >= 3 ? `<span class="ma">${w.ma}</span>` : joined ? `<span class="ma">${w.en} and ${WBY[rider].en}</span>` : w.tier >= 2 ? `<span class="ma">${w.en}</span>` : ''}</div>`;
  mid += `<div class="sense">${w.sense}${joined ? ` · and ${WBY[rider].sense}` : ''}</div>`;
  if (w.tier >= 3) mid += `<div class="sense" style="color:${S.ink}">${w.makers}</div>`;
  if (sel.tiers) mid += tiersHTML(level, pics);
  else mid += `<div class="does">${(w.forms[f] || '').replace(/^./, c => c.toUpperCase())}${joined ? `; and it <b style="color:${SCH[WBY[rider].school].ink}">${f === 'laid' ? LAID_JOIN[rider] : RIDERS[rider]}</b>` : ''}.</div>`;
  if (sel.tiers) mid += `<div class="dvs"><b>FORM</b><span style="display:inline-flex;gap:6px;align-items:center;color:var(--rubric)">${formSign(f)} ${FORMS[f].name}</span><b>REACH</b><span>${FORMS[f].reach} m</span></div>`;
  else mid += `<div class="h3">FORM <i>the guild teaches forms by rank · you are ${RANKS[HAND.rank]}</i></div><div class="fms">`;
  if (!sel.tiers) for (const x of FORM_ORDER) { const F = FORMS[x], live = !!w.forms[x], held = F.rank <= HAND.rank, cls = !live ? 'no' : !held ? 'lock' : x === f ? 'on' : '';
    const c = !live ? 'won’t take it' : !held ? `at ${RANKS[F.rank]}` : cost(id, x, x === 'worn' ? null : rider) + (F.perSec ? '/s' : '');
    mid += `<div class="fm ${cls}">${formSign(x)}<span class="fn">${F.name.toUpperCase()}</span><span class="fc">${c}</span></div>`; }
  if (!sel.tiers) mid += `</div><div class="fsay"><b>${FORMS[f].name.toUpperCase()}</b>${FORM_SAY[f]}</div>`;
  if (!sel.tiers) {
    mid += `<div class="h3">A SECOND WORD <i>adds only its rider · both words at Comprehension</i></div><div class="chips">`;
    for (const r of Object.keys(RIDERS).filter(r => WBY[r] && r !== id)) { const ok = WBY[r].tier >= 2 && w.tier >= 2 && f !== 'worn';
      mid += `<span class="chip${r === rider ? ' on' : ''}${ok ? '' : ' off'}" style="${ok ? `color:${SCH[WBY[r].school].ink}` : ''}">${svg(EMBLEM[WBY[r].school])}<b>${WBY[r].ir}</b> ${f === 'laid' && LAID_JOIN[r] ? LAID_JOIN[r].split(':')[0] : RIDERS[r]}</span>`; }
    mid += `</div>`; }
  const c = cost(id, f, rider);
  mid += `<div class="dvs"><b>MANA</b><span>${c} of your ${HAND.mana}</span>${FORMS[f].reach && !sel.tiers ? `<b>REACH</b><span>${FORMS[f].reach} m</span>` : ''}</div>`;
  if (!sel.tiers) mid += `<div class="btns"><span class="btn">WRITE IT INTO THE BOOK · ${BOOK.length}/8</span><span class="btn q">CLEAR</span><span class="meta" style="font-size:13px">Enter writes it</span></div>`;
  // the right: in C the spell seen, then the book
  let bk = '';
  if (level === 'c' && pics.seen) bk += `<div class="h">Seen</div><div class="rule"></div><div class="seen"><img src="${pics.seen.url}"><div class="pc">${pics.seen.cap}</div></div>`;
  bk += `<div class="h">The Book <span style="font:16px var(--body);color:var(--ink-faint);letter-spacing:0">keys 1–8</span></div><div class="rule"></div>`;
  const rows = level === 'c' && pics.seen ? 6 : 8;
  for (let i = 0; i < rows; i++) { const b = BOOK[i]; if (!b) { bk += `<div class="bk empty"><span class="k">${i + 1}</span><span class="t">empty</span><span></span></div>`; continue; }
    const g = lineGloss(b), on = (sel.tiers ? i === 0 : b.word === id && b.form === f && b.rider === rider);
    bk += `<div class="bk${on ? ' on' : ''}"><span class="k">${i + 1}</span><span class="t" style="color:${SCH[WBY[b.word].school].ink}">${svg(EMBLEM[WBY[b.word].school])}<span style="color:var(--ink)">${lineName(b)}${g ? `<span class="s">${g}</span>` : ''}</span></span><span class="c">${cost(b.word, b.form, b.rider)}</span></div>`; }
  bk += `<div class="note">F casts the readied line. A made spell costs nothing to unmake; the words stay yours.</div>`;
  return `<div class="sp"><div class="col">${lex}</div><div class="col mid">${mid}</div><div class="col">${bk}</div></div>`;
}
// one word at its three tiers (the card's "one spell at three tiers fizzling at Impression"): Caor sent, bolt 20 × TIER_MAG, its cost
export function tiersHTML(level, pics) {
  const w = WBY.caor, sk = SCH.tine.skill, base = 20, cs = [1, 1, .7].map(m => Math.round(w.cost * m * (1.4 - .8 * sk / 100)));
  const rows = [
    { tn: 'IMPRESSION', nm: 'Caor', gl: 'a spark', ln: `a bolt, ${Math.round(base * TIER_MAG[0])}; three casts in ten go wild, and one way is <span class="fz">Caor gutters out — the shape will not hold.</span>` },
    { tn: 'COMPREHENSION', nm: 'Fireball', gl: 'the guild’s English', ln: `a bolt, ${base}; it goes where it is sent` },
    { tn: 'MASTERY', nm: 'Living Ember', gl: 'the true name', ln: `a bolt, ${Math.round(base * TIER_MAG[2])}, at seven tenths of the mana` }];
  return `<div class="h3">ONE WORD, THREE TIERS <i>you hold Caor at Mastery</i></div><div class="tiers">${rows.map((r, i) => `<div class="tr${i === 2 ? ' now' : ''}">${level === 'c' && pics['t' + i] ? `<div class="pic"><img src="${pics['t' + i].url}"></div>` : ''}<div><div class="tn">${r.tn}</div><div class="nm">${r.nm}<i>${r.gl}</i></div><div class="ln">${r.ln}</div></div><div class="cs">${cs[i]}</div></div>`).join('')}</div>`;
}

// ── C's pictures: each drawn once, opaque, into a small canvas, in the slices' light (ACES, a warm key, a cold sky) ──
function stage(W, H) { const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95; R.outputColorSpace = THREE.SRGBColorSpace; R.shadowMap.enabled = true; return R; }
const glowTex = (() => { let t; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (t = new THREE.CanvasTexture(c)); }; })();
const spark = (col, op, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.setScalar(s); return m; };
// the scale figure (bestiary.js's): 1.79 m to the crown, capsules in a grey cloth
export function figure(col = 0x6a625a) { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: col, roughness: .8 }), cap = (r, l, x, y, z, rz = 0) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m); c.position.set(x, y, z); c.rotation.z = rz; c.castShadow = true; g.add(c); };
  cap(.075, .74, .1, .46, 0); cap(.075, .74, -.1, .46, 0); cap(.17, .42, 0, 1.2, 0); cap(.05, .56, .25, 1.12, 0, .12); cap(.05, .56, -.25, 1.12, 0, -.12);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.105, 20, 14), m); h.scale.set(.9, 1.12, 1); h.position.y = 1.68; h.castShadow = true; g.add(h); return g; }
const tris = root => { let n = 0; root.traverse(o => { if (o.isMesh && !o.isSprite) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(n); };
// the frozen wave: RIDERS.sioc.laid.bridge, 6.2 m along your facing and 1.6 m wide, its crest curled over on the far side as the wave
// was when it froze; the walking top flat within 1.6 m, the ice clear-blue at its lip, rimed white on top, the water still round it
export function frozenWave(len = 6.2, wide = 1.6) {
  const g = new THREE.Group(), NX = 64, NZ = 18, pos = [], col = [], idx = [], C = new THREE.Color(), deep = new THREE.Color(0x2f6f8e), lip = new THREE.Color(0x9fd8ee), rime = new THREE.Color(0xe8f4f8);
  // the profile across: x along the span, s round the wave's cross-section from the near water up over the top and down the curled face
  const prof = s => { // s in 0..1 → [y, z] of the section, z across (−0.8 near, +0.8 far), y up from the water
    const pts = [[-1.3, -.12], [-1.0, .22], [-.82, .46], [-.6, .52], [.5, .53], [.68, .66], [.8, 1.0], [.8, 1.38], [.92, 1.62], [1.14, 1.62], [1.3, 1.42], [1.3, 1.2], [1.18, 1.18], [1.08, .9], [1.02, .45], [.96, .05]];
    const f = s * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i; return [pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t) * wide / 1.6]; };
  for (let i = 0; i <= NX; i++) { const u = i / NX, x = (u - .5) * len, end = Math.min(1, Math.min(u, 1 - u) * 7), rise = Math.sin(Math.min(1, Math.min(u, 1 - u) * 4) * Math.PI / 2);
    for (let j = 0; j <= NZ; j++) { const s = j / NZ; let [y, z] = prof(s); const n = Math.sin(x * 3.1 + s * 9) * .025 + Math.sin(x * 7.3 - s * 5) * .012;
      y = (y + n) * (.25 + .75 * rise) - .1 * (1 - end); z *= .55 + .45 * end; pos.push(x, y, z);
      const top = s > .16 && s < .3 ? 1 : 0; C.copy(deep).lerp(lip, Math.min(1, y * 1.6 + .2)); if (top) C.lerp(rime, .55); col.push(C.r, C.g, C.b); } }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = i * (NZ + 1) + j, b = a + NZ + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .18, metalness: 0, side: THREE.DoubleSide, emissive: 0x0c3446, emissiveIntensity: .5, transparent: true, opacity: .93 }));
  m.castShadow = m.receiveShadow = true; g.add(m);
  // rime crystals along the crest and spray frozen off it
  let sd = 5; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647, ice = new THREE.MeshStandardMaterial({ color: 0xd8eef6, roughness: .3, emissive: 0x1a4458, emissiveIntensity: .35 });
  const spike = new THREE.ConeGeometry(.03, .22, 5); for (let k = 0; k < 70; k++) { const x = (r() - .5) * len * .86, sp = new THREE.Mesh(spike, ice); sp.position.set(x, 1.5 + r() * .15, (1.0 + r() * .3) * wide / 1.6); sp.rotation.set(1.6 + r() * .8, 0, r() * .6 - .3); sp.scale.setScalar(.6 + r()); g.add(sp); }
  return g;
}
export function bridgePicture(W = 640, H = 360) {
  const R = stage(W, H), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, W / H, .1, 400);
  scene.background = new THREE.Color(0x8aa0b0); scene.fog = new THREE.Fog(0x8aa0b0, 18, 90);
  scene.add(new THREE.HemisphereLight(0xc8dcec, 0x3a3a30, .9)); const sun = new THREE.DirectionalLight(0xffe4c0, 2.6); sun.position.set(6, 9, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0015; sun.shadow.normalBias = .04; Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
  // a sky: a gradient dome, warm at the horizon
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 v;void main(){float h=clamp(v.y,0.,1.);gl_FragColor=vec4(mix(vec3(.86,.80,.70),vec3(.42,.58,.74),pow(h,.55)),1.);}' })); scene.add(sky);
  // the water: a dark channel 5 m across between two low banks of turf and stone; still where the wave froze
  const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x1c3a48, roughness: .08, metalness: .1 })); water.rotation.x = -Math.PI / 2; water.position.y = -.05; scene.add(water);
  const bank = (z, s) => { const geo = new THREE.BoxGeometry(60, 1.2, 12, 60, 1, 6), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (y > 0) p.setY(i, y + Math.sin(x * .7) * .12 + Math.sin(x * 2.3) * .05); } geo.computeVertexNormals();
    const b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5a6a38, roughness: .95 })); b.position.set(0, -.25, z + s * 6); b.receiveShadow = true; scene.add(b);
    for (let k = 0; k < 14; k++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.25 + (k * 37 % 10) / 25, 0), new THREE.MeshStandardMaterial({ color: 0x6e6a62, roughness: .9 })); st.position.set(-10 + k * 1.5 + (k * 13 % 7) / 7, .05, z + s * (.15 + (k * 7 % 5) / 10)); st.castShadow = true; scene.add(st); } };
  bank(-3.1, -1); bank(3.1, 1);
  // the bridge crosses the channel, so the span runs across it: the wave group turned a quarter
  const wave = frozenWave(); wave.rotation.y = -Math.PI / 2; scene.add(wave);
  const man = figure(); man.position.set(.3, .52, .4); man.rotation.y = .5; scene.add(man);
  const caster = figure(0x4a3e34); caster.position.set(-2.6, .35, 3.6); caster.rotation.y = -2.4; scene.add(caster);
  cam.position.set(6.4, 1.9, 6.6); cam.lookAt(-.4, .7, .3);
  R.render(scene, cam); const url = R.domElement.toDataURL('image/jpeg', .9), n = tris(wave), t = tris(scene); R.dispose();
  return { url, tris: n, sceneTris: t, cap: 'Tonn and Sioc, laid: the wave stopped where it was going. 6.2 × 1.6 m; the figure is 1.79 m.' };
}
// Caor at a tier: the hand's height (1.35 m) beside a figure seen from behind and to the side, dusk in a gate's court
export function caorPicture(tier, W = 396, H = 222) {
  const R = stage(W, H), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, W / H, .1, 100);
  scene.background = new THREE.Color(0x2c2a2c); scene.fog = new THREE.Fog(0x2c2a2c, 5, 16);
  scene.add(new THREE.HemisphereLight(0x8a94a8, 0x2a2018, 1.1)); const k = new THREE.DirectionalLight(0xa0b0d0, 1.0); k.position.set(-3, 5, 2); scene.add(k);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const man = figure(0x3e3832); man.position.set(-1.1, 0, 0); man.rotation.y = Math.PI / 2 + .25; scene.add(man);
  const hand = new THREE.Vector3(-.75, 1.3, .12); let sd = 7 + tier; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const lamp = (c, i, d, p) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.copy(p); scene.add(l); };
  if (tier === 0) { // Impression, gone wild: the shape guttering at the fingers, a few falling sparks and a curl of smoke
    for (let i = 0; i < 16; i++) { const s = spark(new THREE.Color(1, .4 + r() * .3, .1), .45 + r() * .5, .05 + r() * .1); s.position.set(hand.x + .05 + r() * .25, hand.y - r() * .9, hand.z + (r() - .5) * .25); scene.add(s); }
    for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6a625a, transparent: true, opacity: .16, depthWrite: false })); s.position.set(hand.x + .1 + i * .04, hand.y + .1 + i * .09, hand.z); s.scale.setScalar(.15 + i * .05); scene.add(s); }
    const c = spark(0xff7a30, .7, .3); c.position.copy(hand).add(new THREE.Vector3(.12, 0, 0)); scene.add(c); lamp(0xff7030, .5, 3, hand);
  } else if (tier === 1) { // Comprehension: the bolt, a ball 0.3 m across, 2 m out, a straight wake back to the hand
    const at = hand.clone().add(new THREE.Vector3(2.1, -.05, -.3)); const ball = spark(0xffa050, 1, .55); ball.position.copy(at); scene.add(ball); const core = spark(0xfff0c0, 1, .22); core.position.copy(at); scene.add(core);
    for (let i = 0; i < 40; i++) { const t = r(), s = spark(new THREE.Color(1, .35 + r() * .35, .08), .25 + r() * .4, .05 + r() * .12 * (1 - t)); s.position.copy(hand).lerp(at, .25 + t * .7).add(new THREE.Vector3(0, (r() - .5) * .12, (r() - .5) * .12)); scene.add(s); }
    lamp(0xff8a40, 3, 6, at);
  } else { // Mastery, Living Ember: a smaller, whiter coal that has turned in the air toward what will take, its wake a curve
    const P = t => new THREE.Vector3(hand.x + t * 2.6, hand.y + Math.sin(t * Math.PI) * .45 - t * .5, hand.z - Math.sin(t * 2.2) * .9);
    const at = P(1); const ball = spark(0xffd890, 1, .34); ball.position.copy(at); scene.add(ball); const core = spark(0xffffff, 1, .14); core.position.copy(at); scene.add(core);
    for (let i = 0; i < 70; i++) { const t = r(), s = spark(new THREE.Color(1, .5 + r() * .4, .15 + r() * .2), .2 + r() * .5, .02 + r() * .07); s.position.copy(P(.15 + t * .82)).add(new THREE.Vector3((r() - .5) * .1, (r() - .5) * .1, (r() - .5) * .1)); scene.add(s); }
    lamp(0xffc070, 2.6, 6, at);
    // the brazier it goes looking for
    const bz = new THREE.Mesh(new THREE.CylinderGeometry(.28, .18, .3, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, metalness: .6, roughness: .5, side: THREE.DoubleSide })); bz.position.set(at.x + .5, .9, at.z - .3); scene.add(bz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .8, 6), bz.material); leg.position.set(at.x + .5, .4, at.z - .3); scene.add(leg);
  }
  cam.position.set(-1.6, 1.6, 2.4); cam.lookAt(.55, 1.15, -.25);
  R.render(scene, cam); const url = R.domElement.toDataURL('image/jpeg', .9); R.dispose(); return { url };
}
