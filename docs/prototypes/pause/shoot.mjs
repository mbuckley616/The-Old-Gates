// Photograph every .screen of the pause page at 1280×720. node docs/prototypes/pause/shoot.mjs (after build.py)
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const exe = fs.existsSync('/opt/pw-browsers/chromium') && !fs.existsSync(chromium.executablePath()) ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + path.join(here, 'index.html')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
const ids = await page.evaluate(() => window.SCREENS);
for (const id of ids.filter(i => !i.startsWith('cmp'))) await (await page.$('#' + id)).screenshot({ path: path.join(here, id + '.png') });
await page.evaluate(() => { document.getElementById('ce-a').src = 'a-pause.png'; });
await page.waitForTimeout(500);
await (await page.$('#cmp-esc')).screenshot({ path: path.join(here, 'compare-esc.png') });
// overflow check: nothing on a sheet or leaf may spill past its paper
const spill = await page.evaluate(() => [...document.querySelectorAll('.parch')].flatMap(p => { const b = p.getBoundingClientRect(); const pad = p.classList.contains('leaf') ? 34 : 6;
  return [...p.querySelectorAll('*')].filter(e => !e.closest('.fol,.run') && e.getBoundingClientRect().height > 0 && !e.closest('.scroll') && (e.getBoundingClientRect().bottom > b.bottom - pad || e.getBoundingClientRect().right > b.right - 4)).map(e => [p.closest('.screen').id, e.className?.baseVal ?? e.className ?? e.tagName, Math.round(e.getBoundingClientRect().bottom - b.bottom), Math.round(e.getBoundingClientRect().right - b.right)]); }));
console.log('errors', errs, 'spill', JSON.stringify(spill));
await browser.close();
