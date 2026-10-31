// Magic B's carvings (Session 1586; magic-build.md, "Where the words are", the sheet's `wordcarve`). Every sigil door and every fort
// of the three islands carries one carving, its word drawn by its seed from its own school and its place's tier; each island holds
// all 24 words; the table reads no level and nothing that has loaded, so it is the same at level 1 and 30 and after a reload. Then a
// gate whose carving is one of the eight new words (none in the old SPELLS table) is entered: the carving hangs on its last floor,
// and a touch teaches the word a tier a touch and marks the door read.
// Session 1631: Súil's search from the carvings by place, kept for the cast.
// Session 1630: the carvings by place (carvingsNear, nearestCarvingOf), the hermits' *Do you know the old words?*, the rubbing's label.
import { boot, check } from './lib/game.mjs';
const table = () => { const T = carvingTable(), out = { isles: {}, sig: [] };
  for (const n in T.isles) { const I = T.isles[n];
    out.isles[n] = { doors: I.doors.length, moved: I.doors.filter(D => D.moved).length, missing: WORDS.filter(w => !I.count[w.id]).map(w => w.id),
      wrongSchool: I.doors.filter(D => WORD_BY[D.word].school !== D.school).length, outOfPool: I.doors.filter(D => !D.moved && !D.pool.includes(D.word)).length }; }
  out.sig = Object.keys(T.bySeed).sort().map(s => s + ':' + T.bySeed[s].word).join(',');
  return out; };
let g = await boot(); let { page } = g;
await g.intoWorld();
const a = await page.evaluate(`(${table})()`);
const lv30 = await page.evaluate(`(()=>{ _carvings = null; level = 30; return (${table})().sig; })()`);
for (const n in a.isles) {
  const I = a.isles[n];
  check(`${n}: ${I.doors} doors carved, each a word of its school (${I.wrongSchool} not), drawn from its tier's pool (${I.outOfPool} not)`, I.doors > 40 && !I.wrongSchool && !I.outOfPool, I);
  check(`${n}: every one of the 24 words is carved there (${I.moved} doors moved to fill it; missing: ${I.missing.join(' ') || 'none'})`, !I.missing.length, I);
}
check('the same words at level 30', lv30 === a.sig, { n: a.sig.length });
// the gate: on the Gatelands, a carving of a word the old table lacks
const gate = await page.evaluate(() => { const T = carvingTable(); const I = T.isles.gatelands;
  const D = I.doors.find(D => !SPELLS.some(s => s.id === D.word) && WORLD.doorAnywhere(D.seed)); return D ? { seed: D.seed, word: D.word } : null; });
check(`a Gatelands gate carries a new word (${gate && gate.word}, seed ${gate && gate.seed})`, !!gate, gate);
await page.evaluate((s) => { window._prevDScene = typeof dScene !== 'undefined' ? dScene : null; WORLD.devUnlockAll(); _reenterPlace({ kind: 'dungeon', seed: s, floor: 1 }); }, gate.seed);
await page.waitForFunction((s) => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && dScene !== window._prevDScene && currentPortal && currentPortal.seed === s, gate.seed, { timeout: 120000, polling: 200 });
await g.hide();
const t = await page.evaluate(() => { const S = SIGILS[0]; const out = { n: SIGILS.length, word: S && S.spellId, floor: S && S.floor, floors: typeof dMap2 !== 'undefined' && dMap2 ? 2 : 1, mesh: !!(S && S.mesh && S.mesh.parent) };
  if (!S) return out; ATTRS.intelligence = 100; touchSigil(S); out.tier = knownWords[S.spellId] || 0; touchSigil(S); out.tier2 = knownWords[S.spellId] || 0; out.read = (worldState.sigilsRead || {})[currentPortal.seed];
  out.active = activeSpellId; return out; });
check(`the gate's carving is its word (${t.word}), on its last floor (${t.floor} of ${t.floors}), drawn in the room`, t.n === 1 && t.word === gate.word && t.floor === t.floors && t.mesh, t);
check(`a touch at Intelligence 100 teaches it at Impression (${t.tier}), a second deepens it (${t.tier2}); the door is read (${t.read}); F is not handed a word it cannot cast (${t.active})`, t.tier === 1 && t.tier2 === 2 && t.read === gate.word && t.active === null, t);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
// a fresh page: the same words
g = await boot(); page = g.page;
await g.intoWorld();
const b = await page.evaluate(`(${table})().sig`);
check('the same words after a reload', b === a.sig, { a: a.sig.length, b: b.length });
// S1630 (words-and-the-mouth-build.md): the carvings by place, read from the table, not the loaded cells; a hermit names one word you
// lack carved within 2,600 m of the camp, by the camp's id, marks its gate and repeats it; with none near it says so and spends nothing;
// a rubbing's label names its gate and its word
const h = await page.evaluate(() => { const out = {};
  for (const k of Object.keys(knownWords)) delete knownWords[k]; worldState.register = {}; worldState.rubbings = {};
  const P = carvingTable().places, far = P.find(({ e }) => Math.hypot(e.x - px, e.z - pz) > 4000) || P[P.length - 1];
  const camp = { id: 'test_camp', x: far.e.x + 120, z: far.e.z }, word = far.D.word;
  const n = nearestCarvingOf(word, camp.x, camp.z); out.nearest = n && { word: n.word, d: Math.round(n.d), fromYou: Math.round(Math.hypot(far.e.x - px, far.e.z - pz)) };
  out.inReach = carvingsNear(camp.x, camp.z, 2600).every(c => c.d <= 2600);
  const ask = () => hermitWordsTopics(camp)[0].fn();
  out.say1 = ask(); out.w1 = worldState.register.hermits.test_camp; const g1 = nearestCarvingOf(out.w1, camp.x, camp.z);
  out.marked = !!(g1 && worldState.rubbings[g1.seed]); out.within = g1 && Math.round(g1.d);
  out.say2 = ask(); out.w2 = worldState.register.hermits.test_camp;
  worldState.register.hermits = {}; worldState.rubbings = {}; ask(); out.w3 = worldState.register.hermits.test_camp;
  for (const w of WORDS) knownWords[w.id] = 1; const other = { id: 'test_camp2', x: camp.x, z: camp.z };
  out.none = hermitWordsTopics(other)[0].fn(); out.noneSaved = !!worldState.register.hermits.test_camp2;
  for (const k of Object.keys(knownWords)) delete knownWords[k];
  gold = 1000; const rt = rubbingTopics({ x: px, z: pz }); if (rt.length) { rt[0].fn(); const it = BAG[BAG.length - 1]; const cw = WORD_BY[gateCarving(it.seed)]; out.rub = { name: it.name, word: cw ? cw.nameIr : null, seed: it.seed }; BAG.pop(); }
  /* and a carved door's: the guild's nearest door stood in by a carved one of the table */
  const _nd = nearestSigilDoorFrom; nearestSigilDoorFrom = () => ({ x: far.e.x, z: far.e.z, name: 'The Test Gate', seed: far.D.seed });
  try { rubbingTopics({ x: px, z: pz })[0].fn(); out.rub2 = { name: BAG[BAG.length - 1].name, word: WORD_BY[far.D.word].nameIr }; BAG.pop(); } finally { nearestSigilDoorFrom = _nd; }
  return out; });
console.log(JSON.stringify(h));
check(`the nearest carving of ${h.nearest && h.nearest.word} to a camp 120 m from its gate is ${h.nearest && h.nearest.d} m off, ${h.nearest && h.nearest.fromYou} m from you`, h.nearest && h.nearest.d <= 121 && h.nearest.fromYou > 4000 && h.inReach, h.nearest);
check(`a hermit names ${h.w1}, a word you lack, its gate ${h.within} m from the camp and marked on the map ("${h.say1}")`, h.w1 && h.within <= 2600 && h.marked && /Your map has it now/.test(h.say1), h);
check(`asked again it repeats ${h.w2} ("${h.say2}"); asked afresh, the camp's id draws ${h.w3} again`, h.w2 === h.w1 && h.w3 === h.w1 && !/Your map/.test(h.say2), h);
check(`holding every word, a hermit knows none ("${h.none}") and nothing is spent`, /None you lack/.test(h.none) && !h.noneSaved, h);
check(`a rubbing names its gate and its word, or the gate alone where none is carved ("${h.rub && h.rub.name}")`, h.rub && (h.rub.word ? h.rub.name.endsWith(' — ' + h.rub.word) : !/ — /.test(h.rub.name)) && /^Rubbing: /.test(h.rub.name), h.rub);
check(`a carved gate's rubbing reads "${h.rub2 && h.rub2.name}"`, h.rub2 && h.rub2.name === 'Rubbing: The Test Gate — ' + h.rub2.word, h.rub2);
// S1631 — Súil's search: the nearest unread carving within 2,600 m, from the carvings by place; kept for the cast
const su = await page.evaluate(() => { worldState.sigilsRead = {}; const out = {};
  SPELL_FX.seamsight = performance.now() + 60000; const d = nearestSigilDoor(); if (!d) return { none: true };
  out.d = Math.round(Math.hypot(d.x - px, d.z - pz)); out.carved = !!gateCarving(d.seed); out.first = d.seed === carvingsNear(px, pz, 2600)[0].seed;
  worldState.sigilsRead[d.seed] = gateCarving(d.seed); out.kept = nearestSigilDoor().seed === d.seed;
  SPELL_FX.seamsight = performance.now() + 60001; const d2 = nearestSigilDoor(); out.next = d2 && d2.seed !== d.seed && !worldState.sigilsRead[d2.seed];
  SPELL_FX.seamsight = 0; worldState.sigilsRead = {}; return out; });
console.log(JSON.stringify(su));
check(`Súil points at the nearest carving, ${su.d} m off and carved (${su.carved}); read during the cast it is kept (${su.kept}); the next cast points at the next unread (${su.next})`, !su.none && su.d <= 2600 && su.carved && su.first && su.kept && su.next, su);
check('no page errors on the fresh page', g.errs.length === 0, g.errs);
await g.close();
