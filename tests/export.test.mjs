// Export a character to a file, delete them, import the file back; a second import lands as a new character.
import { boot, check } from './lib/game.mjs'; import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// Session 476 — both writes are waited for, not given a fixed pause: on a slow runner the autosave landed after the
// delete below and brought the deleted character back, so the second import made three characters, not two.
await page.evaluate(async () => { playerName = 'Traveller'; gold = 412; level = 6; await saveToSlot(0); });
const autoAt = await page.evaluate(() => { const t = Date.now(); SS.lastAuto = 0; saveGame(true); return t; });
await page.waitForFunction((t) => SS.idx.some(e => e.kind === 'auto' && e.ts >= t), autoAt, { timeout: 20000 });
await page.evaluate(() => openSLMenu('load', false)); await page.waitForTimeout(600);
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }),
  page.evaluate(() => { [...document.querySelectorAll('#sl-slots button')].find(b => /Export/.test(b.textContent)).click(); })]);
const file = await dl.path(); const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
check('export file has the format and saves', doc.format === 'the-old-gates/character' && doc.saves.length >= 2, { saves: doc.saves.length });
await page.evaluate(() => ssDeleteChar(ssChars()[0].id));
const imp = (txt) => page.evaluate(async (t) => { const r = await ssImportFile(new File([t], 'c.json')); return r ? r.length : null; }, txt);
check('import restores the saves', (await imp(fs.readFileSync(file, 'utf8'))) >= 2);
const back = await page.evaluate(async () => { const c = ssChars()[0]; const m = c.saves.find(s => s.kind === 'manual') || c.saves[0]; const d = await ssLoad(m.key); return d && d.level; });
check('imported save loads', back === 6, back);
await imp(fs.readFileSync(file, 'utf8'));
check('second import is a second character', (await page.evaluate(() => ssChars().length)) === 2, await page.evaluate(() => ssChars().map(c => c.id + ':' + c.saves.length)));
check('junk is refused', (await imp('not json')) === null);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
