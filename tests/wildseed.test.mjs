// Session 685: the caster's own rolls (backlog K, the co-op rules). An Impression's wild chance, its pattern and a scatter's
// swing were Math.random; they now draw from casterRand, keyed by where you cast, the game minute and the count of casts in it.
// Two machines are stood in for by two runs of twenty casts from the same place and minute with Math.random pinned at .001 and
// .999: they must come out alike. Another minute, or another place, rolls its own. On the old code .001 made every cast wild.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const run = (o) => page.evaluate((o) => {
  const sp = SPELLS.find(s => s.id === o.spell); const ks = knownSpells, as = activeSpellId, sm = showMsg, mr = Math.random,
    m0 = worldState.gameTimeAbsMinutes, x0 = px, z0 = pz, out = [];
  knownSpells = { [sp.id]: 1 }; activeSpellId = sp.id; worldState.gameTimeAbsMinutes = o.min; px += o.dx || 0;
  if (o.reset) _castMin = null; Math.random = () => o.pin;
  let said = ''; showMsg = (t) => { said += ' ' + t; };
  try { for (let i = 0; i < o.n; i++) { castT = 0; spCd = 0; mana = effMaxMana(); said = ''; castSpell();
      out.push(/fizzles/.test(said) ? 'F' : /wavers/.test(said) ? 'S' : /bites back/.test(said) ? 'B' : /stings/.test(said) ? 'R' : '.'); } }
  finally { Math.random = mr; showMsg = sm; knownSpells = ks; activeSpellId = as; worldState.gameTimeAbsMinutes = m0; px = x0; pz = z0; castT = 0; }
  return out.join(''); }, o);

const spell = await page.evaluate(() => (SPELLS.find(s => s.wild && s.wild.includes('scatter') && s.wild.includes('backlash')) || SPELLS.find(s => s.wild)).id);
const M = 5000;
const A = await run({ spell, min: M, n: 20, pin: .001, reset: true });
const B = await run({ spell, min: M, n: 20, pin: .999, reset: true });
const C = await run({ spell, min: M + 1, n: 20, pin: .001, reset: true });
const D = await run({ spell, min: M, n: 20, pin: .5, reset: true, dx: 200 });
console.log(spell, { A, B, C, D });
check(`twenty casts of ${spell} at one place and minute come out alike with Math.random at .001 and .999 (${A} | ${B})`, A === B && A.length === 20, { A, B });
check(`another minute (${C}) and another chunk (${D}) roll their own`, C !== A && D !== A, { A, C, D });
check(`both kinds of cast happen: wild (${A.replace(/\./g, '').length}) and clean (${(A.match(/\./g) || []).length})`, /\./.test(A) && /[FSB]/.test(A), A);

// 2. a continued count: ten and ten in one minute are the twenty
const E1 = await run({ spell, min: M, n: 10, pin: .3, reset: true }), E2 = await run({ spell, min: M, n: 10, pin: .7 });
check(`ten casts then ten more in the same minute are the same twenty (${E1}${E2})`, E1 + E2 === A, { E1, E2, A });

// 4. the rate holds: over 400 casts in 40 minutes about 40% go wild, the patterns spread over the spell's list
const R = await page.evaluate((spell) => { const sp = SPELLS.find(s => s.id === spell); const ks = knownSpells, as = activeSpellId, sm = showMsg, m0 = worldState.gameTimeAbsMinutes; const c = {};
  knownSpells = { [sp.id]: 1 }; activeSpellId = sp.id; let said = ''; showMsg = (t) => { said += ' ' + t; };
  try { for (let m = 0; m < 40; m++) { worldState.gameTimeAbsMinutes = 9000 + m; for (let i = 0; i < 10; i++) { castT = 0; spCd = 0; mana = effMaxMana(); said = ''; castSpell();
        const k = /fizzles/.test(said) ? 'fizzle' : /wavers/.test(said) ? 'scatter' : /bites back/.test(said) ? 'backlash' : 'clean'; c[k] = (c[k] || 0) + 1; } } }
  finally { showMsg = sm; knownSpells = ks; activeSpellId = as; worldState.gameTimeAbsMinutes = m0; castT = 0; }
  return { c, wild: sp.wild }; }, spell);
const wild = 400 - (R.c.clean || 0);
console.log('rate', JSON.stringify(R));
check(`400 casts: ${wild} wild (${(wild / 4).toFixed(1)}%, IMPRESSION_WILD_CHANCE .40), each of ${R.wild.join('/')} drawn`, wild > 130 && wild < 190 && R.wild.every(k => (R.c[k] || 0) > 15), R);

// 3. a load starts the count afresh: casts after a load roll as they did after the save
const L = await page.evaluate(() => { _castMin = 'x'; _castN = 7; _applyLoadData(JSON.parse(ssStringify(_buildSavePayload()))); return _castMin; });
check(`a load clears the caster's count (_castMin ${JSON.stringify(L)})`, L === null, L);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
