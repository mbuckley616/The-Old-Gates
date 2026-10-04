// Photograph every .screen of the creator page at 1280×720. node docs/prototypes/creator/shoot.mjs (after build.py)
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const exe = fs.existsSync('/opt/pw-browsers/chromium') && !fs.existsSync(chromium.executablePath()) ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + path.join(here, 'index.html')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
const ids = await page.evaluate(() => window.SCREENS);
const name = { title: 'title', keys: 'keys', sheet: 'sheet', book1: 'book-1', book2: 'book-2', book3: 'book-3', book4: 'book-4', restyle: 'restyle' };
for (const id of ids.filter(i => name[i])) await (await page.$('#' + id)).screenshot({ path: path.join(here, name[id] + '.png') });
await page.evaluate(() => { document.getElementById('ct-new').src = 'title.png'; document.getElementById('cc-new').src = 'sheet.png'; });
await page.waitForTimeout(500);
await (await page.$('#cmp-title')).screenshot({ path: path.join(here, 'compare-title.png') });
await (await page.$('#cmp-creator')).screenshot({ path: path.join(here, 'compare-creator.png') });
// overflow check: nothing on a sheet or leaf may spill past its paper
const spill = await page.evaluate(() => [...document.querySelectorAll('.parch, .leaf')].flatMap(p => { const b = p.getBoundingClientRect(); const pad = p.classList.contains('leaf') ? 34 : 10;
  return [...p.querySelectorAll('*')].filter(e => !e.closest('.fol,.run,.esc,.scrollbar') && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().bottom > b.bottom - pad).map(e => [p.closest('.screen').id, e.className || e.tagName, Math.round(e.getBoundingClientRect().bottom - b.bottom)]); }).filter(x => x[0] !== 'restyle'));
console.log('errors', errs, 'spill', spill);
await browser.close();
