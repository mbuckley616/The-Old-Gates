// The readings (Session 1629; words-and-the-mouth-build.md, "The readings", the sheet's `guildread`; Michael's 1 A on #695). Each
// Mages' Guild task handed in earns a reading, none once all 24 words are held. At the hall, *Read from the shelves* spends one on a
// word you lack from a shelf your rank opens (Impression need 1–3 at Adept, 6–10 at Evoker, 12 and up at Warlock), at Impression, in
// four clock hours, an Old Blood too; below the word's Impression Intelligence it is refused and the reading kept. The guild's rank is
// the higher of its count (a rank every three tasks) and the Register's beats (3 Adept, 4 Evoker, 6 Warlock).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  for (const k of Object.keys(knownWords)) delete knownWords[k];
  const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || { done: 0, active: null }; const st = gstate().guild_m;
  worldState.register = {}; const site = WORLD.siteAnywhere('dunmore'), _td = taskDone; taskDone = () => true;
  const turn = (n) => { for (let i = 0; i < n; i++) { st.active = null; offer('guild_m', site); turnIn('guild_m'); } };
  const folder = () => spellShopTopics(mageRank()).find(t => t.label === 'Read from the shelves');
  try {
    // a Novice with two tasks: two readings, no shelf
    st.done = 0; turn(2); const f0 = folder();
    out.novice = { done: st.done, rank: rankOf('guild_m'), readings: readingsHeld(), offered: shelfWords(mageRank()).length, topic: !!f0 };
    // an Adept by count: 8 words on the first shelf, less one held
    turn(1); knownWords.caor = 1; out.adept = { rank: rankOf('guild_m'), readings: readingsHeld(), offered: shelfWords(mageRank()).length, labels: folder().follow.length };
    // an Evoker by beats with no tasks done; a Warlock at nine tasks
    const keep = st.done; st.done = 0; worldState.register.beat = 4; out.evoker = { rank: rankOf('guild_m'), idx: mageRank(), offered: shelfWords(mageRank()).length };
    worldState.register.beat = 6; out.beat6 = rankOf('guild_m'); delete worldState.register.beat;
    st.done = 9; out.warlock = { rank: rankOf('guild_m'), offered: shelfWords(mageRank()).length };
    st.done = 6; worldState.register.beat = 3; out.higher = rankOf('guild_m'); delete worldState.register.beat; st.done = keep;
    // a reading: Luas (Impression 6) at Evoker, refused at Intelligence 5 with the reading kept, then read in exactly four hours
    st.done = 6; worldState.register.readings = 2; ATTRS.intelligence = 5;
    const pick = () => folder().follow.find(t => /^Luas,/.test(t.label));
    out.low = { say: pick().fn(), tier: knownWords.luas || 0, readings: readingsHeld() };
    ATTRS.intelligence = 20; const m0 = worldState.gameTimeAbsMinutes; out.read = { say: pick().fn(), tier: knownWords.luas, mins: worldState.gameTimeAbsMinutes - m0, readings: readingsHeld(), gone: !folder().follow.some(t => /^Luas,/.test(t.label)) };
    // an Old Blood reads at Impression too (the stone's skip is for the stone)
    const pp = WORLD.playerPeople; WORLD.playerPeople = () => 'oldblood';
    try { readWord('tonn'); out.oldblood = knownWords.tonn; } finally { WORLD.playerPeople = pp; }
    // a word off your shelves is refused: Tintreach is the Warlock's
    worldState.register.readings = 1; out.offShelf = readWord('tintreach'); out.offKept = readingsHeld();
    // with all 24 held a turn-in earns nothing
    for (const w of WORDS) knownWords[w.id] = knownWords[w.id] || 1; worldState.register.readings = 0; turn(1); out.allHeld = readingsHeld();
  } finally { taskDone = _td; }
  return out; });
console.log(JSON.stringify(r));
check(`a Novice with ${r.novice.done} tasks holds ${r.novice.readings} readings and no shelf (the topic shown: ${r.novice.topic})`, r.novice.done === 2 && r.novice.readings === 2 && r.novice.offered === 0 && !r.novice.topic && r.novice.rank === 'Novice', r.novice);
check(`an Adept by count (${r.adept.rank}, ${r.adept.readings} readings): ${r.adept.offered} words on the first shelf, Caor held`, r.adept.rank === 'Adept' && r.adept.readings === 3 && r.adept.offered === 7 && r.adept.labels === 7, r.adept);
check(`an Evoker by the Register's beat 4 with no tasks (${r.evoker.rank}): ${r.evoker.offered} words; beat 6 is ${r.beat6}`, r.evoker.rank === 'Evoker' && r.evoker.offered === 19 && r.beat6 === 'Warlock', r);
check(`a Warlock at nine tasks: ${r.warlock.offered} words (24 less Caor)`, r.warlock.rank === 'Warlock' && r.warlock.offered === 23, r.warlock);
check(`the rank is the higher of count and beats: 6 tasks and beat 3 is ${r.higher}`, r.higher === 'Evoker', r);
check(`below Intelligence 6 Luas is refused ("${r.low.say}") and the reading kept (${r.low.readings})`, r.low.tier === 0 && r.low.readings === 2 && /Intelligence 6/.test(r.low.say), r.low);
check(`read, it is Luas at Impression in ${r.read.mins} minutes, one reading spent, and off the shelf ("${r.read.say}")`, r.read.tier === 1 && r.read.mins === 240 && r.read.readings === 1 && r.read.gone, r.read);
check(`an Old Blood reads at Impression too (${r.oldblood})`, r.oldblood === 1, r);
check(`a word off your shelves is refused (${r.offShelf}), the reading kept (${r.offKept})`, r.offShelf === 'shelf' && r.offKept === 1, r);
check(`with all 24 words held a turn-in earns no reading (${r.allHeld})`, r.allHeld === 0, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
