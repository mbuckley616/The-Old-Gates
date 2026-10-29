// Magic B's save (Session 1572; magic-build.md, "The save", the sheet's `wordsave` with its `wordmigrate` folded in). `knownWords`
// replaced `knownSpells`; the book holds up to eight made spells {form, word, rider}, `activeSpell` its index, `formsGranted` the forms
// a migrated character already used; `worldState.register` is the character's. 1: an old save (the F13 fixture, `knownSpells`) with
// the seven spells and the nine buffs comes back with the same sixteen words at the same tiers, the book's eight (F's spell first, then the
// six bolts Sent, then the first Worn word in the table's order), Sent and Worn granted. 2: a made spell (Tonn laid with Sioc) and a Register star come back after a
// save and a load, the book and the register in the character row, not the world's.
import fs from 'fs';
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const raw = fs.readFileSync('tests/fixtures/f13/street.json', 'utf8');
const r = await page.evaluate((raw) => {
  const out = {}; const d = JSON.parse(raw);
  const old = { caor: 3, sioc: 2, sideen: 1, cloch_ghear: 1, smol: 2, solas_gheal: 1, leigheas: 2, cleite: 1, lampa: 2, luas: 1, siul_uisce: 1, anail: 3, sciath: 1, suil_oiche: 1, suil_fiodora: 2, eitilt: 1 };
  d.knownSpells = old; d.activeSpellId = 'lampa'; delete d.knownWords; delete d.spellBook;
  _applyLoadData(d);
  out.n = Object.keys(knownWords).length; out.same = Object.keys(old).every(k => knownWords[k] === old[k]);
  out.book = spellBook.map(b => b.form[0] + ':' + b.word); out.active = activeSpell; out.granted = [...formsGranted];
  out.activeId = activeSpellId;
  // a made spell and a star, through the two rows
  knownWords.tonn = 2; spellBook.length = 6; spellBook.push({ form: 'laid', word: 'tonn', rider: 'sioc' }); worldState.register = { stars: { uisce: 'seed:4417' } };
  activeSpellId = 'tonn'; // not in the book unjoined: activeSpell reads -1
  const rows = _buildSaveRows(); out.inChar = { book: !!rows.c.spellBook, words: !!rows.c.knownWords, reg: !!(rows.c.wS && rows.c.wS.register), regW: !!(rows.w.wS && rows.w.wS.register), oldKey: 'knownSpells' in rows.c };
  spellBook.length = 0; for (const k of Object.keys(knownWords)) delete knownWords[k]; delete worldState.register;
  _applyLoadData(ssJoinPayload(JSON.parse(JSON.stringify(rows.c)), JSON.parse(JSON.stringify(rows.w))));
  out.made = spellBook.find(b => b.form === 'laid'); out.reg = worldState.register; out.tonn = knownWords.tonn; out.n2 = spellBook.length;
  // a book entry for a word no longer held, or a dead cell, is dropped on load
  const d2 = JSON.parse(JSON.stringify(rows.c)); d2.spellBook.push({ form: 'laid', word: 'caor', rider: null }, { form: 'sent', word: 'reo', rider: null });
  _applyLoadData(ssJoinPayload(d2, JSON.parse(JSON.stringify(rows.w)))); out.n3 = spellBook.length;
  return out; }, raw);
console.log(JSON.stringify(r));
check(`the old save's sixteen spells are sixteen words at the same tiers (${r.n})`, r.n === 16 && r.same, r);
check(`the book holds eight: ${r.book.join(' ')}`, r.book.length === 8 && r.book[0] === 'w:lampa' && r.book.slice(1, 7).every(b => b.startsWith('s:')) && r.book[7] === 'w:siul_uisce', r);
check(`F's spell is the book's first (${r.activeId}, index ${r.active}); Sent and Worn granted (${r.granted})`, r.activeId === 'lampa' && r.active === 0 && r.granted.join() === 'sent,worn', r);
check(`the book, the words and the register ride the character row (${JSON.stringify(r.inChar)})`, r.inChar.book && r.inChar.words && r.inChar.reg && !r.inChar.regW && !r.inChar.oldKey, r);
check(`Tonn laid with Sioc comes back (${JSON.stringify(r.made)}), Tonn at ${r.tonn}, the star ${JSON.stringify(r.reg)}`,
  r.made && r.made.rider === 'sioc' && r.tonn === 2 && r.reg && r.reg.stars.uisce === 'seed:4417' && r.n2 === 7, r);
check(`a dead cell and an unheld word are dropped on load (${r.n3} of 9)`, r.n3 === 7, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
