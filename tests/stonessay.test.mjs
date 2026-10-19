// What the Stones Say (Session 1092; the approved draft, quest_drafts.md): three lore books on the sigils, granting nothing.
// The Mages' Guild head answers *What does the Guild teach of the sigils?* in their people's voice and sells the academy's
// primer, On the Seals, for 40 gold; the Fighters' Guild head hands over the Board's sheet, Warm Stones — for New Hands, once;
// the hedge-schoolmaster's glossary, The Words on the Stones, is a rare library roll. None is in the skill-book roll.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const keepG = gold, bag0 = BAG.length;
  const towns = allSites().filter(t => t.kind === 'town' || t.kind === 'city'); const home = towns[0]; out.home = home && home.name; out.hp = peopleOfSite(home);
  const head = (gk) => guildDef(gk, home, null, {}); const topic = (gk, l) => head(gk).topics.find(t => t.label === l);
  // the books
  out.defs = ['on_the_seals', 'words_on_stones', 'warm_stones'].map(id => { const d = BOOKS.find(b => b.id === id); return d && { id, name: d.name, ico: d.ico, attr: d.attr, pages: d.pages.length, p0: d.pages[0].slice(0, 30), sheet: !!d.sheet }; });
  const seen = new Set(); for (let i = 0; i < 3000; i++) seen.add(randomBookItem().bookId); out.skillRoll = [...seen];
  out.lib = LOOT_POOLS.library_chest.some(e => { const it = e.roll(); return it && it.bookId === 'words_on_stones'; });
  out.counter = loreBooksFor({ type: 'guild_m' }).map(i => i.bookId);
  // the Mages' Guild: the topic, wired, and the buy
  const T = topic('guild_m', 'What does the Guild teach of the sigils?'); out.mT = T && { folder: T.folder, say: T.response, follow: T.follow.map(f => f.label) };
  out.fTnone = !topic('guild_m', 'Anything I should know about the warm stones?') && !topic('guild_f', 'What does the Guild teach of the sigils?');
  gold = 10; out.short = T.follow[0].fn(); out.shortBag = BAG.length - bag0; out.shortGold = gold;
  gold = 100; out.buy = T.follow[0].fn(); out.paid = 100 - gold; const it = BAG[BAG.length - 1]; out.bought = it && it.bookId;
  out.descUnread = itemDesc(it); out.shortDesc = itemStatShort(it);
  const attrs0 = JSON.stringify(ATTRS); openBookReader(BAG.length - 1); out.title = document.getElementById('book-title').textContent;
  out.page0 = document.getElementById('book-page').textContent.slice(0, 30); closeBookReader && closeBookReader();
  out.attrsSame = JSON.stringify(ATTRS) === attrs0; out.read = booksRead.has('on_the_seals'); out.descRead = itemDesc(it); out.log = GAME_LOG.slice(-1)[0].text;
  BAG.splice(BAG.indexOf(it), 1);
  // the four Mages' heads
  out.mLines = {}; for (const p of ['aurennais', 'gatelander', 'markman', 'oldblood']) { const t = sigilLoreTopic('guild_m', p)[0]; gold = 0; const s = t.follow[0].fn(); gold = 100; const b = t.follow[0].fn(); BAG.pop(); out.mLines[p] = { teach: t.response, short: s, buy: b }; }
  out.fallback = sigilLoreTopic('guild_m', 'nobody')[0].response === out.mLines.markman.teach;
  // the Fighters' Guild: the sheet, once
  booksRead.delete('warm_stones'); const F = topic('guild_f', 'Anything I should know about the warm stones?'); out.fT = !!F;
  const b1 = BAG.length; out.give = F.fn(); out.given = BAG.length - b1; const sh = BAG[BAG.length - 1]; out.sheetId = sh && sh.bookId; out.sheetDesc = itemDesc(sh); out.sheetShort = itemStatShort(sh);
  out.again = F.fn(); out.givenAgain = BAG.length - b1;
  BAG.splice(BAG.indexOf(sh), 1); booksRead.add('warm_stones'); out.readAgain = F.fn(); out.givenRead = BAG.length - b1; out.sheetRead = itemDesc(sh); booksRead.delete('warm_stones');
  out.fLines = {}; for (const p of ['aurennais', 'gatelander', 'markman', 'oldblood']) { const t = sigilLoreTopic('guild_f', p)[0]; const a = t.fn(); const b = t.fn(); BAG.pop(); out.fLines[p] = { give: a, had: b }; }
  out.none = sigilLoreTopic('church', 'markman').length;
  gold = keepG; return out; });
console.log(JSON.stringify(r).slice(0, 3500));
const [seals, words, sheet] = r.defs;
check(`three lore books: ${r.defs.map(d => d && `${d.name} (${d.pages} pages)`).join(', ')}; none grants an attribute, the sheet is one leaf`, seals && words && sheet && seals.pages === 6 && words.pages === 5 && sheet.pages === 3 && r.defs.every(d => d.attr === null) && sheet.sheet && !seals.sheet && seals.ico === '📘' && words.ico === '📗' && sheet.ico === '📄' && sheet.name === 'Warm Stones — for New Hands' && /^ON THE SEALS/.test(seals.p0) && /^THE WORDS ON THE STONES/.test(words.p0) && /^WARM STONES — FOR NEW HANDS/.test(sheet.p0), r.defs);
check(`none in the skill-book roll (${r.skillRoll.length} seen); the glossary in the library pool; not on the guild's counter`, r.skillRoll.length === 6 && !r.skillRoll.some(id => ['on_the_seals', 'words_on_stones', 'warm_stones'].includes(id)) && r.lib && !r.counter.includes('words_on_stones') && !r.counter.includes('on_the_seals'), r);
check(`${r.home} (${r.hp}): the Mages' Guild head asks in a folder, and only the Mages' head`, r.mT && r.mT.folder && r.mT.say === r.mLines[r.hp].teach && r.mT.follow.join() === 'Is it written down? (Buy On the Seals, 40 gold)' && r.fTnone, r.mT);
check(`short of gold: *${r.short}*, nothing taken; with it: *${r.buy}*, ${r.paid} gold, On the Seals in the bag`, r.short === r.mLines[r.hp].short && r.shortBag === 0 && r.shortGold === 10 && r.buy === r.mLines[r.hp].buy && r.paid === 40 && r.bought === 'on_the_seals', r);
check(`read: *${r.descUnread}* → *${r.descRead}*, short *${r.shortDesc}*; the reader opens *${r.page0}…*; no attribute; the log *${r.log}*`, r.descUnread === 'Lore book' && r.descRead === 'Lore book (already read)' && r.shortDesc === 'Lore' && r.title === 'On the Seals' && /^ON THE SEALS/.test(r.page0) && r.attrsSame && r.read && r.log === 'Read "On the Seals".', r);
const M = r.mLines;
check('the four Mages\' heads, the draft\'s words', /^Impression and Comprehension, Master/.test(M.aurennais.teach) && M.aurennais.short === 'The copy is forty gold, Master. The library does not lend.' && /drawing of the sea\.$/.test(M.gatelander.teach) && /the use of half\.$/.test(M.gatelander.buy) && M.markman.teach === 'Two of the three. The third’s the stone’s. Can’t sell you that.' && M.markman.short === 'Forty. Come back with it.' && M.oldblood.teach === 'Two degrees. The third is the stone’s. Léamh, my mother called it. Reading. She did not do it.' && M.oldblood.buy === 'Forty gold. The words are in it. The meaning is not.' && r.fallback, M);
check(`the Fighters' head gives the sheet once (*${r.give}*), then *${r.again}*, and again once it is read; *${r.sheetDesc}* → *${r.sheetRead}*`, (r.fT && r.given === 1 && r.sheetId === 'warm_stones' && r.give === r.fLines[r.hp].give && r.again === r.fLines[r.hp].had && r.givenAgain === 1 && r.readAgain === r.fLines[r.hp].had && r.givenRead === 0 && r.sheetDesc === 'Lore' && r.sheetRead === 'Lore (already read)' && r.sheetShort === 'Lore'), r);
const F = r.fLines;
check('the four Fighters\' heads, the draft\'s words', F.markman.give === 'Aye. Here. Every new hand gets the sheet. Read it twice.' && F.markman.had === 'You’ve got the sheet. Read it again.' && /^There’s a sheet for that/.test(F.gatelander.give) && /read it a third time\.$/.test(F.gatelander.had) && /^The Board issues a sheet to each new member, Master\./.test(F.aurennais.give) && F.aurennais.had === 'You have been issued the sheet, Master. The Board issues one.' && F.oldblood.give === 'There is a sheet. Take it. Do what it says about reading.' && F.oldblood.had === 'You have it.' && r.none === 0, F);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
