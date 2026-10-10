// Session 658: a write the save store refuses once is tried once more, on a fresh connection, before the player is told the save
// failed. Main's tests/saveui failed on CI three times on 8 Oct (the first menu save refused, the slot empty, the menu open; the next
// save went through), which is what a player would meet as *Save failed* and a second click. Refused twice, it fails as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.waitForFunction(() => SS.idx.some(e => e.kind === 'auto') || SS.lastErr, null, { timeout: 60000, polling: 250 }).catch(() => {});
// the store refuses the next N writes of a key with `manual` in it
const refuse = (n) => page.evaluate((n) => { window._refused = 0; if (!window._ssPut0) window._ssPut0 = ssPut;
  ssPut = function (k, s, r) { if (/manual/.test(k) && _refused < n) { _refused++; return Promise.reject(new Error('refused by the test')); } return _ssPut0(k, s, r); }; }, n);
const save = (slot, gold) => page.evaluate(([slot, g0]) => { gold = g0; SS.retried = null; return saveToSlot(slot).then(m => ({ ok: !!m, gold: m && m.gold,
  row: (SS.idx.find(e => e.kind === 'manual' && e.slot === slot) || {}).gold, retried: SS.retried && SS.retried.why, lastErr: SS.lastErr && SS.lastErr.why, refused: _refused })); }, [slot, gold]);

await refuse(1); const once = await save(0, 321);
check('refused once, the save is tried again and lands: slot 1 holds 321', once.ok && once.row === 321 && once.refused === 1 && !once.lastErr, once);
check('the first refusal is kept in SS.retried, in the store\'s words', once.retried === 'refused by the test', once.retried);
const back = await page.evaluate(() => ssLoad(SS.idx.find(e => e.kind === 'manual' && e.slot === 0).key).then(d => d && d.gold));
check('the retried save reads back whole (both rows): 321 gold', back === 321, back);

await refuse(2); const twice = await save(1, 400);
const menu = await page.evaluate(() => { openSLMenu('save', false); const t = document.getElementById('sl-slots').textContent; closeSLMenu(); return /Last save failed/.test(t) && /refused by the test/.test(t); });
check('refused twice, it fails as before: no slot 2, the reason named in the menu', !twice.ok && twice.row === undefined && twice.refused === 2 && twice.lastErr === 'refused by the test' && menu, { twice, menu });

await refuse(0); const plain = await save(2, 500);
check('a store that answers writes once, with nothing retried', plain.ok && plain.row === 500 && !plain.retried && plain.refused === 0, plain);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
