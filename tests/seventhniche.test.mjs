// The Seventh Niche (Session 979; the approved draft, quest_drafts.md): the lore book, read like a skill book and granting
// nothing, sold at the Mages' Guild and rolled rarely from a library, never from the skill-book roll; and the priest's
// *Who is the Guest?* at any church once the book is read or the chapel found, in four peoples, naming the capital.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const cap = await page.evaluate(() => { const c = guestChapelHouse(); px = c.x; pz = c.z; return { id: c.id, name: c.name }; });
await g.settle(cap.id);

const r = await page.evaluate((id) => {
  const site = siteAnywhere(id), S = WORLD.settle.get(id), out = {};
  const church = (S.houses.find(h => h.type === 'church') || {}).dlg; out.church = !!church; out.people = church && church.people;
  const ask = () => church.topics.find(t => t.label === 'Who is the Guest?');
  booksRead.delete('seventh_niche'); vstate().chapel = false; out.before = !!ask();
  // the book
  const def = BOOKS.find(b => b.id === 'seventh_niche'); out.pages = def && def.pages.length; out.attr = def && def.attr;
  let rolled = 0; for (let i = 0; i < 2000; i++) if (randomBookItem().bookId === 'seventh_niche') rolled++; out.rolled = rolled;
  out.skills = new Set(Array.from({ length: 400 }, () => randomBookItem().bookId)).size;
  out.lib = LOOT_POOLS.library_chest.some(e => { const it = e.roll(); return it && it.bookId === 'seventh_niche'; });
  out.guild = loreBooksFor({ type: 'guild_m' }).map(i => i.name); out.guildF = loreBooksFor({ type: 'guild_f' }).length; out.cathedral = loreBooksFor({ type: 'church' }).length;
  const it = loreBookItem('seventh_niche'); out.price = it.buyPrice; out.descUnread = itemDesc(it); out.shortUnread = itemStatShort(it);
  const attrs0 = JSON.stringify(ATTRS); BAG.push(it); openBookReader(BAG.length - 1);
  out.title = document.getElementById('book-title').textContent; out.page0 = document.getElementById('book-page').textContent.slice(0, 40);
  closeBookReader && closeBookReader(); out.attrsSame = JSON.stringify(ATTRS) === attrs0; out.read = booksRead.has('seventh_niche');
  out.log = GAME_LOG.slice(-2).map(e => e.text); out.descRead = itemDesc(it); BAG.splice(BAG.indexOf(it), 1);
  // the priest, before the chapel
  const T = ask(); out.ask = T && { folder: T.folder, say: T.response, follow: T.follow.map(f => [f.label, f.response]) };
  out.lines = {}; for (const p of ['aurennais', 'gatelander', 'markman', 'oldblood']) { const t = guestTopics(site, { people: p })[0]; out.lines[p] = { say: t.response, follow: t.follow[0].label, then: t.follow[0].response }; }
  // after the chapel
  vstate().chapel = true; const A = ask(); out.after = A && { folder: !!A.folder, say: A.response };
  out.afterLines = {}; for (const p of ['aurennais', 'gatelander', 'markman', 'oldblood']) out.afterLines[p] = guestTopics(site, { people: p })[0].response;
  booksRead.delete('seventh_niche'); out.chapelOnly = !!ask(); vstate().chapel = false;
  return out; }, cap.id);
console.log(JSON.stringify(r).slice(0, 3000));
check(`the book: ${r.pages} pages, no attribute; never in the skill roll (${r.rolled} of 2000; ${r.skills} skill books seen); in the library pool`, r.pages === 6 && r.attr === null && r.rolled === 0 && r.skills === 6 && r.lib, r);
check(`the Mages' Guild sells it (${r.guild.join(', ')}, ${r.price} gold); the Fighters' Guild and the church do not`, r.guild.join() === 'The Seventh Niche' && r.guildF === 0 && r.cathedral === 0 && r.price === 30, r);
check(`read: *${r.descUnread}* → *${r.descRead}*, short *${r.shortUnread}*; the reader opens on *${r.page0}…*; no attribute, the log *${r.log.slice(-1)[0]}*`, r.descUnread === 'Lore book' && r.descRead === 'Lore book (already read)' && r.shortUnread === 'Lore' && r.title === 'The Seventh Niche' && /^THE SEVENTH NICHE/.test(r.page0) && r.attrsSame && r.read && r.log.includes('Read "The Seventh Niche".'), r);
check(`no priest asks before the book or the chapel; then ${cap.name}'s (${r.people}) answers in a folder naming ${cap.name}`, r.church && !r.before && r.ask && r.ask.folder && r.ask.say === r.lines[r.people].say && r.ask.follow.length === 1 && r.ask.follow[0][1].includes(`at ${cap.name}`), r.ask);
check('the four peoples, the draft\'s words', /^The Guest is a mistake of the old culture, Master/.test(r.lines.aurennais.say) && r.lines.aurennais.then.includes(`under the cathedral at ${cap.name}, closed by the Prior’s order`) && /seven cups on the dresser/.test(r.lines.gatelander.say) && r.lines.gatelander.follow === 'Then who was it for?' && r.lines.markman.say === 'Church says it’s a mistake. Old carvers’ mistake. That’s the word I’m given.' && r.lines.markman.then.includes(`at ${cap.name}, bricked up`) && /^An tAoi\. The guest\./.test(r.lines.oldblood.say) && r.lines.oldblood.then === `The Church says so. The Church bricked its chapel at ${cap.name}. We did not ask them to. We did not ask them not to.`, r.lines);
check('after the chapel: one answer, no folder, and the chapel alone opens the topic', r.after && !r.after.folder && r.after.say === r.afterLines[r.people] && r.afterLines.markman === 'You went. Aye, I can see it. Don’t tell me.' && /^You have been below\./.test(r.afterLines.aurennais) && /Weaver keep you\.$/.test(r.afterLines.gatelander) && /The cold goes, mostly\.$/.test(r.afterLines.oldblood) && r.chapelOnly, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
