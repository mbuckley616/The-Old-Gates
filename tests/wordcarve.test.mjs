// Magic B's carvings (Session 1586; magic-build.md, "Where the words are", the sheet's `wordcarve`). Every sigil door and every fort
// of the three islands carries one carving, its word drawn by its seed from its own school and its place's tier; each island holds
// all 24 words; the table reads no level and nothing that has loaded, so it is the same at level 1 and 30 and after a reload. Then a
// gate whose carving is one of the eight new words (none in the old SPELLS table) is entered: the carving hangs on its last floor,
// and a touch teaches the word a tier a touch and marks the door read.
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
await g.close();
