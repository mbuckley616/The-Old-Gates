// Whoever an active main quest sends you to talk to is findable at any hour (Session 236). The quest-giver rule at the
// top of `scheduleFor` kept a quest's *giver* at their door day and night; the person a quest sends you to was left on
// their own schedule. Aldwyn (Q3, Q7) keeps a shop, so from 21 to 7 he was hidden while the compass pointed at him.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('ironhaven');
const look = (hour, state) => page.evaluate(([hour, state]) => { QS['q3_the_merchant_knows'].state = state; forceTime(hour);
  for (let i = 0; i < 900; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('ironhaven'); const n = S.npcs.find(n => n.def.name === 'Aldwyn');
  return { hour, state, found: !!n, out: !!(n && n.g.visible && !n._retreated), sched: n && n.sched && n.sched.type }; }, [hour, state]);
const rows = [];
for (const [h, st] of [[12, 'locked'], [23, 'locked'], [3, 'locked'], [23, 'active'], [3, 'active'], [12, 'active']]) { const r = await look(h, st); rows.push(r); console.log(JSON.stringify(r)); }
const at = (h, st) => rows.find(r => r.hour === h && r.state === st);
check('Aldwyn keeps his own hours when no quest wants him (in his shop at noon, gone at 23h and 3h)', at(12, 'locked').found && !at(12, 'locked').out && !at(23, 'locked').out && !at(3, 'locked').out, rows);
check('with The Merchant Knows active he is at his door at 23h, 3h and noon', at(23, 'active').out && at(3, 'active').out && at(12, 'active').out, rows);
// talk to him at 23h, through the real E key and the dialogue's own choices
await page.evaluate(() => { QS['q3_the_merchant_knows'].state = 'active'; forceTime(23); for (let i = 0; i < 900; i++) WORLD.tick(1 / 60, performance.now());
  const n = WORLD.settle.get('ironhaven').npcs.find(n => n.def.name === 'Aldwyn'); window._n = n; n._scared = 0;
  px = n.g.position.x; pz = n.g.position.z + 1.2; jumpY = n.g.position.y; yaw = 0; pitch = 0; });
await g.frames(2); await page.evaluate(() => { px = _n.g.position.x; pz = _n.g.position.z + 1.2; jumpY = _n.g.position.y; });
await page.keyboard.press('e'); await g.frames(2);
const pickChoice = (re) => page.evaluate((src) => { const re = new RegExp(src); const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => re.test(x.textContent)); if (b) b.click(); return { clicked: !!b, choices: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) }; }, re);
const c1 = await pickChoice('Edna'); await g.frames(2);
const c2 = await pickChoice('failing'); await g.frames(3);
const done = await page.evaluate(() => ({ name: document.getElementById('dlg-name').textContent, state: qState('q3_the_merchant_knows'), open: dlgOpen }));
console.log(JSON.stringify({ c1, c2, done }));
check('at 23h E finds Aldwyn and his dialogue completes The Merchant Knows', done.name === 'Aldwyn' && c1.clicked && c2.clicked && (done.state === 'complete' || done.state === 'reward'), { c1, c2, done });
// the giver side: Ironhaven's givers hand over their quests in the open world
const offers = async (name, qid, hour) => {
  await page.keyboard.press('Escape'); await g.frames(1);
  const who = await page.evaluate(([name, qid, hour]) => { try { closeDialog(); } catch (e) {} QS[qid].state = 'available'; forceTime(hour); for (let i = 0; i < 900; i++) WORLD.tick(1 / 60, performance.now());
    const n = WORLD.settle.get('ironhaven').npcs.find(n => n.def.name === name); if (!n) return null; window._n = n; n._scared = 0;
    px = n.g.position.x; pz = n.g.position.z + 1.2; jumpY = n.g.position.y; yaw = 0; pitch = 0; return { title: getQuest(qid).title, out: n.g.visible && !n._retreated }; }, [name, qid, hour]);
  if (!who) return { name, found: false };
  await g.frames(2); await page.evaluate(() => { px = _n.g.position.x; pz = _n.g.position.z + 1.2; jumpY = _n.g.position.y; });
  await page.keyboard.press('e'); await g.frames(2);
  const r = await page.evaluate(([name, title]) => ({ talking: document.getElementById('dlg-name').textContent, open: dlgOpen, offered: [...document.querySelectorAll('#dlg-choices > *')].some(x => x.textContent.includes('\ud83d\udcdc ' + title)) }), [name, who.title]);
  await page.evaluate(([qid]) => { QS[qid].state = 'locked'; try { closeDialog(); } catch (e) {} }, [qid]);
  return { name, qid, hour, ...who, ...r }; };
const q4 = await offers('Aldwyn', 'q4_crypt_of_embers', 12), q5 = await offers('Captain Brynn', 'q5_caldric_commission', 12);
console.log(JSON.stringify({ q4, q5 }));
check('in the world\u2019s Ironhaven, Aldwyn offers The Crypt of Embers and Captain Brynn offers his commission', q4.offered && q4.talking === 'Aldwyn' && q5.offered && q5.talking === 'Captain Brynn', { q4, q5 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
