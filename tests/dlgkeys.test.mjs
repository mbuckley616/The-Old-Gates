// Dialogue number keys (Session 392). Every choice is drawn with its number, and a talk can list ten (a harbourmaster:
// a name, the cargo board, the passages, the folders, Go on). Only keys 1–4 answered; now 1–9, and 0 for the tenth.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const open = () => page.evaluate(() => { const topics = []; for (let i = 1; i <= 9; i++) topics.push({ label: 'Topic ' + i, response: 'Answer ' + i + '.' });
  openDialog({ name: 'Tester', role: '', ico: '?', greeting: ['Hello.'], topics }); G.focus();
  return [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()); });
const read = () => page.evaluate(() => ({ open: dlgOpen, text: document.getElementById('dlg-text').textContent, n: document.querySelectorAll('#dlg-choices > *').length }));

const rows = await open();
console.log(JSON.stringify(rows));
const keyOf = i => i === 9 ? '0' : String(i + 1);
check('ten choices are listed, numbered 1 to 10', rows.length === 10 && /^10\./.test(rows[9]), rows);
const picked = [];
for (const t of [1, 4, 5, 7, 8, 9]) {
  const i = rows.findIndex(r => new RegExp('Topic ' + t + '$').test(r));
  if (picked.length) { await page.evaluate(() => closeDialog()); await open(); }
  await g.frames(1); await page.keyboard.press(keyOf(i)); await g.frames(1);
  const r = await read(); picked.push({ key: keyOf(i), topic: t, text: r.text, ok: r.text === 'Answer ' + t + '.' });
}
console.log(JSON.stringify(picked));
check('keys 2, 5 and 6 pick the choices drawn with them (Topics 1, 4, 5)', picked.slice(0, 3).every(p => p.ok), picked);
check('keys 8 and 9 pick Topics 7 and 8 (they did nothing before)', picked[3].ok && picked[4].ok && picked[3].key === '8' && picked[4].key === '9', picked);
check('key 0 picks the tenth (Topic 9)', picked[5].ok && picked[5].key === '0', picked);
// a key past the list does nothing: in the answer there are only the closing choices
await page.evaluate(() => closeDialog()); await open(); await g.frames(1);
await page.keyboard.press('1'); await g.frames(1);
const a1 = await read();
await page.keyboard.press('9'); await g.frames(1);
const a9 = await read();
check('a key past the end of a short list does nothing', a1.n < 9 && a9.open && a9.text === a1.text && a9.n === a1.n, { a1, a9 });
await page.evaluate(() => closeDialog());
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
