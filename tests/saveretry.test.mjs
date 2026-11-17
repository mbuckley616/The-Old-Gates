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
// S2004 — the menu has said "The last save failed (…): why" since S1965 (the save register on the parchment); the check reads that.
const menu = await page.evaluate(() => { openSLMenu('save', false); const t = document.getElementById('sl-slots').textContent; closeSLMenu(); return /The last save failed/.test(t) && /refused by the test/.test(t); });
check('refused twice, it fails as before: no slot 2, the reason named in the menu', !twice.ok && twice.row === undefined && twice.refused === 2 && twice.lastErr === 'refused by the test' && menu, { twice, menu });

await refuse(0); const plain = await save(2, 500);
check('a store that answers writes once, with nothing retried', plain.ok && plain.row === 500 && !plain.retried && plain.refused === 0, plain);
// S2351 — the store's wall counts the time the page was free, not the clock (QA's S2350: one 8–11 s frame on SwiftShader failed a save).
// the frame starts in a microtask queued after ssPut's own: the write is open and its wall set, and its answer waits behind the frame
const stall = await page.evaluate(() => { const p = ssPut('stall:test', 'x').then(() => 'ok', e => e.message);
  return Promise.resolve().then(() => {}).then(() => { const t = performance.now(); while (performance.now() - t < 11000); return p; }); });
check('a write behind an 11 s frame lands: the frame is not counted as the store\'s silence', stall === 'ok', stall);
// the world's frames are idled for it (the loop hands the frame to an open INSPECTOR): each one holds SwiftShader seconds and counts 0.5 s
const dead = await page.evaluate(() => { const db0 = SS.db, t0 = performance.now(), I = INSPECTOR, o0 = I.open, f0 = I.frame;
  I.open = true; I.frame = () => {}; SS.db = { transaction: () => ({ objectStore: () => ({ put() {} }) }) };
  const p = ssPut('dead:test', 'x').then(() => 'ok', e => e.message); SS.db = db0;
  return p.then(m => { I.open = o0; I.frame = f0; return { m, s: Math.round((performance.now() - t0) / 100) / 10 }; }); });
check('a store that never answers is still named, after 10 s free: "the save store did not answer"', dead.m === 'the save store did not answer' && dead.s >= 9.5 && dead.s < 30, dead);
await page.evaluate(() => ssDel('stall:test'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
