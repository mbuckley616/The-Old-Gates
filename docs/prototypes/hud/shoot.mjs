// Photograph every .screen of the HUD page at 1280×720. node docs/prototypes/hud/shoot.mjs (after build.py)
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const exe = fs.existsSync('/opt/pw-browsers/chromium') && !fs.existsSync(chromium.executablePath()) ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + path.join(here, 'index.html')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
const ids = await page.evaluate(() => window.SCREENS);
for (const id of ids.filter(i => !i.startsWith('compare'))) await (await page.$('#' + id)).screenshot({ path: path.join(here, id + '.png') });
await page.evaluate(() => { document.getElementById('cmp-a').innerHTML = '<img src="a-town.png">';
  const b = document.getElementById('cmp-band'); b.style.background = 'url(a-town.png) -330px -545px no-repeat'; });
await page.waitForTimeout(500);
await (await page.$('#compare-hud')).screenshot({ path: path.join(here, 'compare-hud.png') });
// overflow and overlap checks: nothing past its paper; no two compass marks or damage numbers on top of each other
const check = await page.evaluate(() => {
  const spill = [...document.querySelectorAll('.parch')].flatMap(p => { const b = p.getBoundingClientRect();
    return [...p.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0 && (e.getBoundingClientRect().bottom > b.bottom + 1 || e.getBoundingClientRect().right > b.right + 1)).map(e => [p.closest('.screen').id, e.className?.baseVal ?? e.className, Math.round(e.getBoundingClientRect().bottom - b.bottom), Math.round(e.getBoundingClientRect().right - b.right)]); });
  const hit = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  const overlap = []; for (const s of document.querySelectorAll('.screen')) for (const sel of ['.mk', '.dn']) { const L = [...s.querySelectorAll(sel)].map(e => e.getBoundingClientRect());
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (hit(L[i], L[j])) overlap.push([s.id, sel, i, j]); }
  const band = document.querySelector('#a-town .band').getBoundingClientRect();
  return { spill, overlap, band: [band.width, band.height], marks: [...document.querySelectorAll('#a-town .mk')].map(m => m.textContent.trim() || '·') };
});
console.log('errors', errs, JSON.stringify(check));
await browser.close();
