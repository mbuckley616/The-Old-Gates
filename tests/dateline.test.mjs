// The date line where the clock is read (Session 489, DECISION #132's shared shape: "one function writes it everywhere"):
// the wait menu and each save slot now say the game's date as the sleep panel does (`gameDateLine`), so the quest writer's
// names, when they come, land in one place. A slot saved before this build has no date and shows none.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(async () => {
  worldState.gameTimeAbsMinutes = 1440 * 11 + 460; worldState.gameTimeMinutes = 460; ZE.forEach(e => { if (e && !e.dead) e.locked = true; });
  openWaitMenu(); const wm = document.getElementById('wait-modal'); const wait = { shown: wm.style.display, sub: document.getElementById('wait-sub').textContent }; closeWaitMenu();
  await saveToSlot(0); const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0);
  openSLMenu('save'); const slot = [...document.querySelectorAll('#sl-slots .sl-slot')].find(d => d.dataset.key === m.key); const slotText = slot ? slot.innerText : '';
  // an index entry from before this build carries no date
  const old = Object.assign({}, m); delete old.at; delete old.tod; const i = SS.idx.indexOf(m); SS.idx[i] = old; renderSLSlots();
  const slot2 = [...document.querySelectorAll('#sl-slots .sl-slot')].find(d => d.dataset.key === m.key); const oldText = slot2 ? slot2.innerText : ''; SS.idx[i] = m;
  try { closeSLMenu(); } catch (e) { document.getElementById('sl-overlay') && (document.getElementById('sl-overlay').style.display = 'none'); }
  return { wait, at: m.at, tod: m.tod, slotText, oldText, now: gameDateLine() }; });
console.log(JSON.stringify(r));
check('the wait menu opens on the date: Day 12 · 7:40 am', r.wait.shown === 'flex' && r.wait.sub === 'Day 12 · 7:40 am · Choose how long to wait', r.wait);
check('a slot keeps the game\'s date when it was saved', r.at === 1440 * 11 + 460 && r.tod === 460, { at: r.at, tod: r.tod });
check('and the slot list shows it', /Day 12 · 7:40 am · \d+🪙/.test(r.slotText), r.slotText);
check('a slot saved before this build shows no date and nothing else changes', r.oldText && !/Day 12/.test(r.oldText) && /\d+🪙/.test(r.oldText), r.oldText);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
