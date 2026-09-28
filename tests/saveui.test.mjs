// Saves through the menu, across reloads, on file:// (Session 251): backlog G's *Saves first (Session 137)* and
// *Export/import (Session 139)* asked for a slot, an overwrite, an autosave and Continue, and an export and import, in real
// Chrome on file://. Headless Chromium on file:// with the menu's own buttons, a real download, the browser's file picker
// and full page reloads between them is that, short of a person's hands.
import { boot, check } from './lib/game.mjs'; import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const W = (ms) => page.waitForTimeout(ms);
const clickRow = (i) => page.evaluate((i) => { const rows = [...document.querySelectorAll('#sl-slots .sl-slot')]; rows[i].click(); return rows[i].querySelector('.sl-slot-name').textContent; }, i);
const where = await page.evaluate(() => { playerName = 'Wren'; gold = 321; level = 4; return { x: px, z: pz }; });

// a slot, by the menu
await page.evaluate(() => openSLMenu('save', false)); await W(400);
const first = await clickRow(0); await W(1200);
const s1 = await page.evaluate(() => ({ open: document.getElementById('slmenu').style.display, slot: SS.idx.filter(e => e.kind === 'manual').map(e => e.slot + ':' + e.gold) }));
check('the menu saves to an empty slot and closes', first === '— Empty —' && s1.open === 'none' && s1.slot.includes('0:321'), { first, s1 });

// an overwrite, by the menu: the first click asks, the second writes
await page.evaluate(() => { gold = 654; openSLMenu('save', false); }); await W(400);
const ask = await clickRow(0); await W(600); const still = await page.evaluate(() => SS.idx.find(e => e.kind === 'manual' && e.slot === 0).gold);
await clickRow(0); await W(1200); const now = await page.evaluate(() => SS.idx.find(e => e.kind === 'manual' && e.slot === 0).gold);
check('an overwrite asks once, then writes', ask === 'Click again to overwrite' && still === 321 && now === 654, { ask, still, now });

// an autosave, the way the game makes one
await page.evaluate(() => { gold = 700; SS.lastAuto = 0; saveGame(true); }); await W(1200);
const autos = await page.evaluate(() => SS.idx.filter(e => e.kind === 'auto').map(e => e.gold));
check('an autosave is written', autos.includes(700), autos);

// reload the page: Continue brings back the newest
g.errs.length = 0; await page.reload(); await W(5000);
const title = await page.evaluate(() => ({ cb: !!document.getElementById('cb') && getComputedStyle(document.getElementById('cb')).display !== 'none', saves: SS.idx.length, db: !!SS.db, fallback: !!SS.fallback }));
await page.evaluate(() => document.getElementById('cb').click()); await W(12000); await g.hide();
const cont = await page.evaluate(() => ({ started, gold, name: playerName, level, d: Math.round(Math.hypot(px - 0, pz - 0)), x: px, z: pz }));
check('after a reload the saves are there (not on the localStorage fallback), and Continue is offered', title.cb && title.saves >= 2 && !title.fallback, title);
check('Continue loads the newest save: the autosave, 700 gold, Wren, level 4, where she stood', cont.started && cont.gold === 700 && cont.name === 'Wren' && cont.level === 4 && Math.hypot(cont.x - where.x, cont.z - where.z) < 3, { cont, where });

// the slot, by the Load tab (click to arm, click to load)
await page.evaluate(() => openSLMenu('load', false)); await W(400);
const slotRow = await page.evaluate(() => [...document.querySelectorAll('#sl-slots .sl-slot')].findIndex(d => /654/.test(d.textContent)));
await clickRow(slotRow); await W(300); await clickRow(slotRow); await W(4000); await g.hide();
check('the Load tab loads the slot: 654 gold', (await page.evaluate(() => gold)) === 654, slotRow);

// export by the button: a real file
await page.evaluate(() => openSLMenu('load', false)); await W(400);
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }),
  page.evaluate(() => [...document.querySelectorAll('#sl-slots button')].find(b => /Export/.test(b.textContent)).click())]);
const file = await dl.path(); const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
check('Export writes a file holding the slot and the autosave', doc.format === 'the-old-gates/character' && doc.saves.length >= 2 && dl.suggestedFilename().endsWith('.json'), { name: dl.suggestedFilename(), saves: doc.saves.length });

// delete the character by its button (twice), reload: nothing left
await page.evaluate(() => { const b = [...document.querySelectorAll('#sl-slots button')].find(b => /Delete character/.test(b.textContent)); b.click(); b.click(); }); await W(1500);
await page.reload(); await W(5000);
const gone = await page.evaluate(() => ({ chars: ssChars().length, saves: SS.idx.length, db: !!SS.db }));
check('deleted, the character stays gone after a reload', gone.chars === 0 && gone.saves === 0, gone);

// import through the browser's own picker, from the title's Load Game button (shown even with no saves); reload; Continue
const lgb = await page.evaluate(() => { const b = document.getElementById('lgb'); const shown = getComputedStyle(b).display !== 'none', cb = getComputedStyle(document.getElementById('cb')).display !== 'none'; b.click(); return { shown, cb }; }); await W(1500);
check('with no saves the title still offers Load Game (not Continue)', lgb.shown && !lgb.cb, lgb);
// closing it without loading goes back to the title (Load Game steps into the scene before the menu opens)
await page.evaluate(() => document.getElementById('slmenu-close').click()); await W(5000);
const back0 = await page.evaluate(() => ({ title: getComputedStyle(document.getElementById('ov')).display !== 'none', started: typeof started !== 'undefined' && started, lgb: getComputedStyle(document.getElementById('lgb')).display !== 'none' }));
check('closing the title\'s Load menu without loading returns to the title', back0.title && !back0.started && back0.lgb, back0);
await page.evaluate(() => document.getElementById('lgb').click()); await W(1500);
const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }),
  page.evaluate(() => [...document.querySelectorAll('#sl-slots button')].find(b => /Import/.test(b.textContent)).click())]);
await fc.setFiles(file); await W(2500);
const imp = await page.evaluate(() => ({ chars: ssChars().map(c => c.name + ':' + c.saves.length), rows: document.querySelectorAll('#sl-slots .sl-slot').length }));
check('Import by the picker brings the character back, listed in the menu', imp.chars.length === 1 && /^(Wren|Traveller):3$/.test(imp.chars[0]) && imp.rows >= 2, imp);
await page.reload(); await W(5000);
await page.evaluate(() => document.getElementById('lgb').click()); await W(1500);
const rows = await page.evaluate(() => { return [...document.querySelectorAll('#sl-slots .sl-slot')].map(d => d.textContent.replace(/\s+/g, ' ').slice(0, 40)); });
const i = await page.evaluate(() => [...document.querySelectorAll('#sl-slots .sl-slot')].findIndex(d => /654/.test(d.textContent)));
await clickRow(i); await W(300); await clickRow(i); await W(12000); await g.hide();
const back = await page.evaluate(() => ({ started, gold, name: playerName }));
check('after another reload, the imported slot loads from the title: Wren, 654 gold', back.started && back.gold === 654 && back.name === 'Wren', { back, rows });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
