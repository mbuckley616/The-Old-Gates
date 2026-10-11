// Session 586: *It's done.* only when there is something to hand in (Michael, 5 Oct 2026: "We also leave a lot of things like
// 'I'm turning in work' open when there is nothing to actually turn in"). The lord's *It's done.* is offered only while a job of
// his own is finished and not yet paid; the guild head's only while the guild's task is finished. Taken and handed in through
// the dialogue in Dunmore; the work itself is marked done by hand.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const DONE = /^It.s done\.$/;
const labelsOf = () => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, ''));
const lord = (re) => page.evaluate(([src, lsrc]) => { try { if (dlgOpen) closeDialog(); } catch (e) {}
  const S = WORLD.settle.get('dunmore'); openDialog(S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg);
  const labels = (new Function('return ' + lsrc))()();
  const b = src ? [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))) : null; if (b) b.click();
  const said = (document.getElementById('dlg-text') || {}).textContent || ''; try { if (dlgOpen) closeDialog(); } catch (e) {} return { labels, clicked: !!b, said, gold }; },
  [re ? re.source : null, labelsOf.toString()]);

await page.evaluate(() => { worldState.gameTimeAbsMinutes = 30000; forceTime(10); });
const a = await lord();
console.log(' no job:', JSON.stringify(a.labels));
check('with no job from the lord, *It\'s done.* is not offered (*I\'m looking for work.* is)', !a.labels.some(l => DONE.test(l)) && a.labels.some(l => /^I.m looking for work\.$/.test(l)), a.labels);

const t = await lord(/^I.m looking for work\.$/);
const q = await page.evaluate(() => { const q = (worldState.quests || []).filter(q => !q.turnedIn && !q.faction).slice(-1)[0]; return q && { id: q.id, title: q.title }; });
const b = await lord();
console.log(' job taken:', JSON.stringify(q), JSON.stringify(b.labels));
check(`a job taken and not done (${q && q.title}): still not offered`, t.clicked && q && !b.labels.some(l => DONE.test(l)), { t, q, labels: b.labels });

await page.evaluate((id) => { const q = WORLD.quests.find(x => x.id === id); qComplete(q); }, q.id);
const c = await lord(DONE);
console.log(' done and handed in:', JSON.stringify(c));
check('the job done: offered, and clicked it pays', c.clicked && /gold/.test(c.said) && c.gold > a.gold, c);
const d = await lord();
check('paid: not offered again', !d.labels.some(l => DONE.test(l)), d.labels);

// the guild head, in Dunmore's Fighters' or Mages' Guild
const gh = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => (x.type === 'guild_f' || x.type === 'guild_m') && x.keeper && x.dlg); if (!h) return null;
  const st = WORLD.guild.state()[h.type]; const has = () => h.dlg.topics.some(t => t.label === "It's done.");
  st.active = null; const none = has();
  st.active = { kind: 'relic', got: false, gold: 80, short: 'a test' }; const open = has();
  st.active.got = true; const ready = has(); const g0 = gold; const s = h.dlg.topics.find(t => t.label === "It's done.").fn(); const paid = gold - g0;
  const after = has(); return { type: h.type, none, open, ready, paid, s, after, any: h.dlg.topics.some(t => t.label === 'Any work?') }; });
console.log(' guild:', JSON.stringify(gh));
check('the guild head: not offered with no task, nor with one under way', gh && gh.any && !gh.none && !gh.open, gh);
check('offered with the task done; it pays, and is gone once paid', gh && gh.ready && gh.paid === 80 && !gh.after, gh);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
